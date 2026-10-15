#!/usr/bin/env python3
"""Trusted Linux SSH endpoint. Install root-owned at /usr/local/lib/pi-research/ssh-runner-gpu.py.

Only JSON on stdin/stdout; workload bytes never become a host shell command.
The service account owns a private root and accesses a local Linux Docker engine.
"""
import base64
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import selectors
import stat
import subprocess
import sys
import time

SCRIPT = Path(__file__).resolve()
ENV = {"PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", "HOME": "/nonexistent", "DOCKER_HOST": "unix:///var/run/docker.sock"}
JOB_LABEL = "pi-research.ssh-handle"
MANIFEST_LABEL = "pi-research.manifest"


def require(condition, code):
    if not condition:
        raise ValueError(code)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def stable(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def atomic(path, value):
    temporary = path.with_suffix(".tmp")
    with open(temporary, "w", encoding="utf-8") as stream:
        json.dump(value, stream, separators=(",", ":"))
        stream.flush()
        os.fsync(stream.fileno())
    os.chmod(temporary, 0o600)
    os.replace(temporary, path)
    fd = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def docker(args, timeout=20):
    p = subprocess.run(["docker", *args], env=ENV, stdin=subprocess.DEVNULL, capture_output=True, timeout=timeout)
    require(p.returncode == 0, "DOCKER_OPERATION_FAILED")
    return p.stdout


def identity():
    info = json.loads(docker(["info", "--format", "{{json .}}"])); require(info.get("OSType") == "linux", "LINUX_DOCKER_REQUIRED")
    return {"engineId": info["ID"], "protocolDigest": sha(SCRIPT.read_bytes())}


def root_path(value):
    require(isinstance(value, str) and re.fullmatch(r"/[A-Za-z0-9_./-]+", value) and len(value.split("/")) > 2 and all(p and p not in (".", "..") for p in value.split("/")[1:]), "ROOT_INVALID")
    root = Path(value)
    require(root.exists() and root.is_dir() and not root.is_symlink(), "ROOT_NOT_CONFIGURED")
    for p in [root, *root.parents]:
        require(not p.is_symlink(), "ROOT_LINK_DENIED")
    require(root.stat().st_uid == os.getuid() and root.stat().st_mode & 0o077 == 0, "ROOT_MUST_BE_PRIVATE")
    return root


def relative_path(value):
    require(isinstance(value, str) and 0 < len(value) <= 1000 and not re.search(r"[\\\x00-\x1f:]", value), "PATH_INVALID")
    require(all(p and p not in (".", "..") and not p.endswith((".", " ")) for p in value.split("/")), "PATH_INVALID")
    return value


@contextlib.contextmanager
def locked(job):
    job.mkdir(mode=0o700, exist_ok=True)
    require(not job.is_symlink() and job.stat().st_uid == os.getuid() and job.stat().st_mode & 0o077 == 0, "JOB_ROOT_INVALID")
    with open(job / "lock", "a") as stream:
        fcntl.flock(stream, fcntl.LOCK_EX)
        yield


def record(job):
    path = job / "record.json"
    return json.loads(path.read_text()) if path.exists() else None


def inspect(r):
    p = subprocess.run(["docker", "inspect", "--type", "container", r.get("containerId") or r["handle"]], env=ENV, stdin=subprocess.DEVNULL, capture_output=True, timeout=20)
    if p.returncode:
        require(b"No such" in p.stderr, "DOCKER_INSPECT_FAILED")
        return None
    c = json.loads(p.stdout)[0]
    require(c["Config"]["Labels"].get(JOB_LABEL) == r["handle"] and c["Config"]["Labels"].get(MANIFEST_LABEL) == r["manifestDigest"] and (not r.get("containerId") or c["Id"] == r["containerId"]), "CONTAINER_IDENTITY_MISMATCH")
    gpu = r.get("contract", {}).get("gpu")
    if gpu:
        ids = [v for request in c.get("HostConfig", {}).get("DeviceRequests", []) for v in (request.get("DeviceIDs") or [])]
        require(sorted(ids) == sorted(gpu["deviceIds"]), "GPU_DEVICE_MISMATCH")
    return c


def assert_start_policy(r, container):
    gpu = r["contract"].get("gpu")
    env = container.get("Config", {}).get("Env") or []
    for key, value in [("NVIDIA_VISIBLE_DEVICES", ",".join(gpu["deviceIds"]) if gpu else "void"), ("CUDA_VISIBLE_DEVICES", ",".join(gpu["deviceIds"]) if gpu else "-1")]:
        require([item for item in env if item.startswith(key + "=")] == [key + "=" + value], "GPU_START_POLICY_MISMATCH")
    if not gpu:
        require(not container.get("HostConfig", {}).get("DeviceRequests"), "GPU_START_POLICY_MISMATCH")


def stop(r):
    if r.get("engineId"):
        require(identity() == {"engineId": r["engineId"], "protocolDigest": r["protocolDigest"]}, "TARGET_IDENTITY_CHANGED")
    c = inspect(r)
    if c and c["State"]["Status"] == "created":
        retire_created(r, c)
        return None
    if c and c["State"]["Running"]:
        docker(["stop", "--time", "2", c["Id"]])
    return inspect(r)


def retire_created(r, c):
    # Remove the checked immutable ID: a delayed start RPC cannot later run this container.
    require(identity() == {"engineId": r["engineId"], "protocolDigest": r["protocolDigest"]}, "TARGET_IDENTITY_CHANGED")
    owned = inspect(r)
    require(owned and owned["Id"] == c["Id"], "CONTAINER_IDENTITY_MISMATCH")
    docker(["rm", "--force", owned["Id"]])
    require(inspect(r) is None, "CONTAINER_RETIREMENT_UNCONFIRMED")


def validate_start(q):
    c = q.get("contract"); require(isinstance(c, dict), "CONTRACT_INVALID")
    require(set(c) <= {"runner", "sshTargetId", "image", "command", "environment", "datasetVersion", "evaluationProtocolVersion", "metrics", "expectedArtifacts", "timeoutSeconds", "cpus", "memoryMb", "pids", "workMb", "logBytes", "outputBytes", "networkPolicy", "gpu"}, "CONTRACT_INVALID")
    require(c.get("runner") == "ssh" and c.get("environment") == {} and c.get("networkPolicy") == "none", "CONTRACT_INVALID")
    require(re.fullmatch(r"[a-zA-Z0-9./:_-]+@sha256:[a-f0-9]{64}", c.get("image", "")), "IMAGE_DIGEST_REQUIRED")
    require(isinstance(c.get("command"), list) and 1 <= len(c["command"]) <= 30 and all(isinstance(a, str) and len(a) <= 1000 and "\0" not in a for a in c["command"]) and c["command"][0], "COMMAND_INVALID")
    for key, low, high in [("cpus", 1, 64), ("memoryMb", 64, 65536), ("pids", 16, 512), ("workMb", 16, 1024), ("timeoutSeconds", 1, 86400), ("logBytes", 1, 16777216), ("outputBytes", 1, 134217728)]:
        require(type(c.get(key)) is int and low <= c[key] <= high, "RESOURCE_INVALID")
    gpu = c.get("gpu")
    if gpu is not None:
        require(isinstance(gpu, dict) and set(gpu) == {"vendor", "deviceIds"} and gpu["vendor"] == "nvidia", "GPU_INVALID")
        ids = gpu["deviceIds"]
        require(isinstance(ids, list) and 1 <= len(ids) <= 16 and all(isinstance(v,str) and re.fullmatch(r"GPU-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}",v) for v in ids) and len(set(ids)) == len(ids), "GPU_INVALID")
    expected = c.get("expectedArtifacts")
    require(isinstance(expected, list) and 1 <= len(expected) <= 30 and "metrics.json" in expected and len(set(expected)) == len(expected), "ARTIFACTS_INVALID")
    for name in expected:
        relative_path(name); require(name not in ("stdout.log", "stderr.log", "execution.json"), "ARTIFACTS_INVALID")
    files = q.get("sourceFiles"); payload = q.get("files")
    require(isinstance(files, list) and 1 <= len(files) <= 5000 and isinstance(payload, list) and len(files) == len(payload), "SOURCE_INVALID")
    require(sha(stable(files)) == q.get("sourceDigest"), "SOURCE_DIGEST_MISMATCH")
    names = set(); total = 0; decoded = []
    for meta, encoded in zip(files, payload):
        require(isinstance(meta, dict) and set(meta) <= {"path", "size", "digest", "mode"}, "SOURCE_INVALID")
        name = relative_path(meta["path"]); require(name not in names, "SOURCE_DUPLICATE"); names.add(name)
        require(meta.get("mode", "100644") in ("100644", "100755"), "SOURCE_MODE_INVALID")
        data = base64.b64decode(encoded, validate=True); total += len(data)
        require(len(data) == meta["size"] and sha(data) == meta["digest"] and total <= 67108864, "SOURCE_BYTES_MISMATCH")
        decoded.append((meta, data))
    return decoded


def output_size(path):
    total = 0; count = 0
    for base, dirs, files in os.walk(path, followlinks=False):
        for name in dirs + files:
            info = (Path(base) / name).lstat(); count += 1
            require(not stat.S_ISLNK(info.st_mode) and (stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)) and count <= 5000, "OUTPUT_INVALID")
            if stat.S_ISREG(info.st_mode):
                total += info.st_size
    return total


def read_safe(root, name, limit):
    relative_path(name); p = root
    for part in name.split("/"):
        p = p / part; require(not p.is_symlink(), "ARTIFACT_LINK_DENIED")
    fd = os.open(p, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        before = os.fstat(fd); require(stat.S_ISREG(before.st_mode) and before.st_size <= limit, "ARTIFACT_INVALID")
        with os.fdopen(fd, "rb", closefd=False) as stream:
            data = stream.read(limit + 1)
        after = os.fstat(fd); require(len(data) == before.st_size and (before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns) == (after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns), "ARTIFACT_CHANGED")
        return data
    finally:
        os.close(fd)


def logs(job):
    return {name: base64.b64encode(read_safe(job, name + ".log", 16777216) if (job / (name + ".log")).exists() else b"").decode() for name in ("stdout", "stderr")}


def observe(job, r):
    if r["state"] not in ("succeeded", "failed", "cancelled"):
        c = inspect(r)
        if c and c["State"]["Status"] in ("exited", "dead"):
            # Only the worker seals logs/results. A missing worker leaves the reservation unknown.
            r = {**r, "state": "unknown", "containerId": c["Id"]}
        elif not c and r.get("startRequested"):
            r = {**r, "state": "unknown"}
    return {k: r[k] for k in ("handle", "manifestDigest", "state", "containerId", "imageId", "exitCode", "error", "logTruncated", "outputExceeded") if k in r}


def worker(job):
    process = None
    try:
        with locked(job):
            r = record(job)
            if r["state"] == "cancelled" or r.get("startRequested"):
                return
            require(identity() == {"engineId": r["engineId"], "protocolDigest": r["protocolDigest"]}, "TARGET_IDENTITY_CHANGED")
            c = r["contract"]
            r["imageId"] = docker(["image", "inspect", "--format", "{{.Id}}", c["image"]]).decode().strip()
            bootstrap = 'cp -R /source/. /work/ && for path in /work/* /work/.[!.]* /work/..?*; do if [ -e "$path" ]; then chmod -R u+rwX "$path" || exit; fi; done && exec "$@"'
            args = ["create", "--pull", "never", "--name", r["handle"], "--label", JOB_LABEL + "=" + r["handle"], "--label", MANIFEST_LABEL + "=" + r["manifestDigest"], "--network", "none", "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--user", "65534:65534", "--pids-limit", str(c["pids"]), "--cpus", str(c["cpus"]), "--memory", str(c["memoryMb"]) + "m", "--memory-swap", str(c["memoryMb"]) + "m", "--restart", "no", "--log-driver", "none", "--tmpfs", "/work:rw,nosuid,nodev,size=" + str(c["workMb"]) + "m,mode=1777", "--tmpfs", "/tmp:rw,nosuid,nodev,noexec,size=16m", "--mount", "type=bind,src=" + str(job / "source") + ",dst=/source,readonly", "--mount", "type=bind,src=" + str(job / "output") + ",dst=/output", "--workdir", "/work", "--env", "HOME=/tmp", "--env", "OUTPUT_DIR=/output", "--entrypoint", "/bin/sh", c["image"], "-c", bootstrap, "pi-research", *c["command"]]
            if c.get("gpu"):
                ids = c["gpu"]["deviceIds"]
                gpu_arg = "device=" + ",".join(ids)
                args[1:1] = ["--gpus", gpu_arg if len(ids) == 1 else '"' + gpu_arg + '"', "--env", "NVIDIA_DRIVER_CAPABILITIES=compute,utility", "--env", "NVIDIA_VISIBLE_DEVICES=" + ",".join(ids), "--env", "CUDA_VISIBLE_DEVICES=" + ",".join(ids)]
                check = "test \"$(nvidia-smi --query-gpu=uuid --format=csv,noheader | LC_ALL=C sort)\" = \"$(printf '%s\\n' " + " ".join("'" + v + "'" for v in ids) + " | LC_ALL=C sort)\" || { echo GPU_DEVICE_VISIBILITY_MISMATCH >&2; exit 78; }; "
                args[args.index("-c")+1] = check + bootstrap
            else:
                args[1:1] = ["--env", "NVIDIA_VISIBLE_DEVICES=void", "--env", "CUDA_VISIBLE_DEVICES=-1"]
            existing = inspect(r)
            require(existing is None, "ONE_CREATE_ONLY")
            r["containerId"] = docker(args).decode().strip(); require(re.fullmatch(r"[a-f0-9]{64}", r["containerId"]), "CONTAINER_INVALID")
            created = inspect(r)
            require(created is not None and created["State"]["Status"] == "created", "CONTAINER_START_STATE_INVALID")
            assert_start_policy(r, created)
            require(identity() == {"engineId": r["engineId"], "protocolDigest": r["protocolDigest"]}, "TARGET_IDENTITY_CHANGED")
            # The durable marker precedes start. Recovery never replays docker start.
            r.update(startRequested=True, state="running", started=time.time()); atomic(job / "record.json", r)
            process = subprocess.Popen(["docker", "start", "--attach", r["containerId"]], env=ENV, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        selector = selectors.DefaultSelector(); selector.register(process.stdout, selectors.EVENT_READ, "stdout"); selector.register(process.stderr, selectors.EVENT_READ, "stderr")
        total = 0; stopping = False
        while True:
            for key, _ in selector.select(0.2):
                data = os.read(key.fileobj.fileno(), 65536)
                if not data:
                    selector.unregister(key.fileobj); continue
                remaining = max(0, c["logBytes"] - total); total += len(data)
                if remaining:
                    with open(job / (key.data + ".log"), "ab") as out:
                        out.write(data[:remaining])
            with locked(job):
                r = record(job)
                if r["state"] in ("succeeded", "failed", "cancelled"):
                    break
                try:
                    exceeded = output_size(job / "output") > c["outputBytes"]
                except (ValueError, OSError):
                    exceeded = True
                reason = "CANCELLED" if r.get("cancelRequested") else "TIMEOUT" if time.time() - r["started"] >= c["timeoutSeconds"] else "LOG_LIMIT" if total > c["logBytes"] else "OUTPUT_LIMIT" if exceeded else None
                current = inspect(r)
                require(current is not None, "CONTAINER_MISSING")
                if current["State"]["Status"] == "created" and (reason or process.poll() is not None and not selector.get_map()):
                    retire_created(r, current)
                    r.update(state="cancelled" if r.get("cancelRequested") else "failed", error=reason or "REMOTE_START_FAILED", exitCode=current["State"]["ExitCode"], logTruncated=total > c["logBytes"], outputExceeded=exceeded)
                    atomic(job / "record.json", r)
                    break
                if reason and not stopping:
                    r.update(error=reason, logTruncated=total > c["logBytes"], outputExceeded=exceeded); atomic(job / "record.json", r); stop(r); stopping = True
                current = inspect(r)
                require(current is not None, "CONTAINER_MISSING")
                if current["State"]["Status"] in ("exited", "dead") and process.poll() is not None and not selector.get_map():
                    r["exitCode"] = current["State"]["ExitCode"]
                    r["state"] = "cancelled" if r.get("cancelRequested") else "succeeded" if r["exitCode"] == 0 and not r.get("error") else "failed"
                    atomic(job / "record.json", r); break
    except Exception:
        with locked(job):
            r = record(job)
            try:
                c = stop(r)
                r.update(state="failed" if not c or not c["State"]["Running"] else "unknown", error="REMOTE_SUPERVISOR_FAILED", exitCode=c["State"]["ExitCode"] if c else None)
            except Exception:
                r.update(state="unknown", error="REMOTE_STATE_UNKNOWN")
            atomic(job / "record.json", r)
    finally:
        if process:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill(); process.wait(timeout=5)
            for stream in (process.stdout, process.stderr):
                stream.close()


def request(q):
    require(isinstance(q, dict) and set(q) <= {"protocol", "root", "op", "handle", "manifestDigest", "engineId", "protocolDigest", "contract", "sourceFiles", "sourceDigest", "files", "image"}, "REQUEST_INVALID")
    require(q.get("protocol") == 1, "PROTOCOL_INVALID"); root = root_path(q.get("root")); info = identity()
    if q.get("op") == "probe":
        return info
    if q.get("op") == "gpu-probe":
        image = q.get("image", "")
        require(isinstance(image,str) and re.fullmatch(r"[a-zA-Z0-9./:_-]+@sha256:[a-f0-9]{64}",image),"IMAGE_DIGEST_REQUIRED")
        inventory = docker(["run","--rm","--pull","never","--network","none","--read-only","--cap-drop","ALL","--security-opt","no-new-privileges","--gpus","all","--env","NVIDIA_DRIVER_CAPABILITIES=compute,utility","--entrypoint","nvidia-smi",image,"--query-gpu=uuid,name,memory.total","--format=csv,noheader,nounits"], timeout=30).decode()
        require(identity() == info,"TARGET_IDENTITY_CHANGED")
        return {**info,"inventory":inventory}
    require(q.get("engineId") == info["engineId"], "TARGET_IDENTITY_CHANGED")
    op = q.get("op")
    current_protocol = q.get("protocolDigest") == info["protocolDigest"]
    require(current_protocol or op in ("status", "result"), "TARGET_IDENTITY_CHANGED")
    handle = q.get("handle"); require(isinstance(handle, str) and re.fullmatch(r"pi-ssh-[a-f0-9-]{36}", handle), "HANDLE_INVALID")
    require(re.fullmatch(r"[a-f0-9]{64}", q.get("manifestDigest", "")), "MANIFEST_INVALID")
    job = root / handle
    with locked(job):
        require(identity() == info, "TARGET_IDENTITY_CHANGED")
        r = record(job)
        if not current_protocol:
            protocol_digest = q.get("protocolDigest")
            require(
                isinstance(r, dict)
                and r.get("state") in ("succeeded", "failed", "cancelled")
                and r.get("handle") == handle
                and r.get("manifestDigest") == q["manifestDigest"]
                and r.get("engineId") == q["engineId"]
                and r.get("protocolDigest") == protocol_digest
                and isinstance(protocol_digest, str)
                and re.fullmatch(r"[a-f0-9]{64}", protocol_digest),
                "TARGET_IDENTITY_CHANGED",
            )
        elif r:
            require(r["manifestDigest"] == q["manifestDigest"], "HANDLE_IDENTITY_MISMATCH")
        if op == "start" and not r:
            decoded = validate_start(q)
            for name in ("source", "output"):
                (job / name).mkdir(mode=0o755 if name == "source" else 0o777); os.chmod(job / name, 0o755 if name == "source" else 0o777)
            for meta, data in decoded:
                parts = meta["path"].split("/")
                path = job / "source"
                for part in parts[:-1]:
                    path = path / part
                    path.mkdir(mode=0o755, exist_ok=True)
                    require(not path.is_symlink() and path.is_dir(), "SOURCE_PATH_INVALID")
                    os.chmod(path, 0o755)
                path = path / parts[-1]
                path.write_bytes(data)
                path.chmod(0o555 if meta.get("mode") == "100755" else 0o444)
            for name in ("stdout", "stderr"):
                (job / (name + ".log")).touch(mode=0o600)
            r = {"handle": handle, "manifestDigest": q["manifestDigest"], "engineId": q["engineId"], "protocolDigest": q["protocolDigest"], "contract": q["contract"], "state": "submitting", "startRequested": False}; atomic(job / "record.json", r)
            subprocess.Popen([sys.executable, str(SCRIPT), "--worker", str(job)], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=ENV, start_new_session=True, close_fds=True)
        elif op == "cancel":
            if not r:
                r = {"handle": handle, "manifestDigest": q["manifestDigest"], "state": "cancelled", "exitCode": None}
            r["cancelRequested"] = True; atomic(job / "record.json", r)
            c = stop(r)
            if not c or c["State"]["Status"] == "created":
                r.update(state="cancelled", exitCode=None); atomic(job / "record.json", r)
        elif op not in ("start", "status", "result"):
            raise ValueError("OP_INVALID")
        if not r:
            return {"handle": handle, "manifestDigest": q["manifestDigest"], "state": "missing"}
        answer = {**observe(job, r), "logs": logs(job)}
        if op == "result":
            require(r["state"] in ("succeeded", "failed", "cancelled"), "RESULT_NOT_TERMINAL")
            files = []; total = 0; errors = []
            for name in r.get("contract", {}).get("expectedArtifacts", []):
                try:
                    data = read_safe(job / "output", name, 1048576 if name == "metrics.json" else 33554432); total += len(data); require(total <= r["contract"]["outputBytes"], "OUTPUT_LIMIT")
                    files.append({"path": name, "size": len(data), "digest": sha(data), "data": base64.b64encode(data).decode()})
                except (OSError, ValueError):
                    errors.append(name)
            answer.update(files=files, missing=errors)
        return answer


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--worker":
        worker(Path(sys.argv[2]))
    else:
        try:
            raw = sys.stdin.buffer.read(95 * 1024 * 1024 + 1); require(len(raw) <= 95 * 1024 * 1024, "REQUEST_LIMIT")
            result = {"protocol": 1, "ok": True, **request(json.loads(raw))}
        except Exception as error:
            result = {"protocol": 1, "ok": False, "error": str(error) if isinstance(error, ValueError) else "REMOTE_OPERATION_FAILED"}
        print(json.dumps(result, separators=(",", ":")))
