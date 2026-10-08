#!/usr/bin/env python3
"""Fixed SSH setup/inspection entry point; never executes supplied workload code."""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import uuid

HELPER = Path('/usr/local/lib/pi-research/ssh-runner-gpu.py')
ENV = {'PATH': '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', 'HOME': '/nonexistent', 'DOCKER_HOST': 'unix:///var/run/docker.sock'}


def require(ok, code):
    if not ok:
        raise ValueError(code)


def regular(path):
    s = path.lstat()
    return stat.S_ISREG(s.st_mode) and s.st_uid == 0 and not s.st_mode & 0o022


def supervisor(expected):
    for path in reversed([HELPER.parent, *HELPER.parent.parents]):
        try:
            s = path.lstat()
        except FileNotFoundError:
            return 'missing'
        if not stat.S_ISDIR(s.st_mode) or s.st_uid != 0 or s.st_mode & 0o022:
            return 'unsafe'
    try:
        if not regular(HELPER):
            return 'unsafe'
        return 'ready' if hashlib.sha256(HELPER.read_bytes()).hexdigest() == expected else 'mismatch'
    except FileNotFoundError:
        return 'missing'
    except OSError:
        return 'unsafe'


def workspace(root, uid):
    for path in reversed([root, *root.parents]):
        try:
            s = path.lstat()
        except FileNotFoundError:
            return 'missing'
        except OSError:
            return 'invalid'
        if not stat.S_ISDIR(s.st_mode):
            return 'invalid'
    s = root.stat()
    return 'ready' if s.st_uid == uid and s.st_mode & 0o077 == 0 else 'invalid'


def inspect(q, uid):
    state = {'protocol': 1, 'supervisor': supervisor(q['digest']), 'workspace': workspace(Path(q['root']), uid), 'docker': 'unknown'}
    if state['supervisor'] != 'ready':
        state['errorCode'] = {'missing': 'SSH_SUPERVISOR_MISSING', 'mismatch': 'SSH_PROTOCOL_MISMATCH', 'unsafe': 'SSH_SUPERVISOR_UNSAFE'}[state['supervisor']]
    elif state['workspace'] != 'ready':
        state['errorCode'] = 'SSH_WORKSPACE_MISSING' if state['workspace'] == 'missing' else 'SSH_WORKSPACE_INVALID'
    if not shutil.which('docker', path=ENV['PATH']):
        state['docker'] = 'missing'
    else:
        try:
            p = subprocess.run(['docker', 'info', '--format', '{{json .}}'], env=ENV, stdin=subprocess.DEVNULL, capture_output=True, timeout=15)
            info = json.loads(p.stdout) if p.returncode == 0 else {}
            state['docker'] = 'unsupported' if info and info.get('OSType') != 'linux' else 'ready' if re.fullmatch(r'[A-Za-z0-9._:-]{1,200}', info.get('ID', '')) else 'unavailable'
            if state['docker'] == 'ready':
                state['engineId'] = info['ID']
                if type(info.get('NCPU')) is int and info['NCPU'] > 0:
                    state['cpus'] = info['NCPU']
                if type(info.get('MemTotal')) is int and info['MemTotal'] >= 1048576:
                    state['memoryMb'] = info['MemTotal'] // 1048576
        except (OSError, ValueError, subprocess.TimeoutExpired):
            state['docker'] = 'unavailable'
    if state['docker'] != 'ready':
        state.setdefault('errorCode', {'missing': 'SSH_DOCKER_MISSING', 'unavailable': 'SSH_DOCKER_UNAVAILABLE', 'unsupported': 'SSH_DOCKER_UNSUPPORTED'}[state['docker']])
    if state['supervisor'] == 'ready':
        state['protocolDigest'] = q['digest']
    return state


def directory(path, uid, gid, private=False):
    """Walk with directory descriptors: never follow a replacement link during privileged creation."""
    fd = os.open('/', os.O_RDONLY | os.O_DIRECTORY)
    try:
        for part in path.parts[1:]:
            parent = os.fstat(fd)
            require(parent.st_uid in (0, uid) and not parent.st_mode & 0o022, 'SSH_WORKSPACE_INVALID' if private else 'SSH_SUPERVISOR_UNSAFE')
            created = False
            try:
                os.mkdir(part, 0o700 if private else 0o755, dir_fd=fd)
                created = True
            except FileExistsError:
                pass
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = child
            if created:
                os.fchown(fd, uid, gid)
                os.fchmod(fd, 0o700 if private else 0o755)
        s = os.fstat(fd)
        require(s.st_uid == uid and not s.st_mode & (0o077 if private else 0o022), 'SSH_WORKSPACE_INVALID' if private else 'SSH_SUPERVISOR_UNSAFE')
        return fd
    except BaseException:
        os.close(fd)
        raise


def install_root(q):
    require(os.geteuid() == 0, 'SSH_SETUP_PERMISSION_REQUIRED')
    uid, gid = int(os.environ.get('SUDO_UID', '0')), int(os.environ.get('SUDO_GID', '0'))
    require(supervisor(q['digest']) in ('ready', 'missing'), 'SSH_SUPERVISOR_UNSAFE')
    require(workspace(Path(q['root']), uid) != 'invalid', 'SSH_WORKSPACE_INVALID')
    helper = base64.b64decode(q['helper'], validate=True)
    require(len(helper) <= 512 * 1024 and hashlib.sha256(helper).hexdigest() == q['digest'], 'SSH_PROTOCOL_MISMATCH')
    if supervisor(q['digest']) == 'missing':
        fd = directory(HELPER.parent, 0, 0)
        temporary = '.install-' + uuid.uuid4().hex
        try:
            output = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=fd)
            with os.fdopen(output, 'wb') as stream:
                stream.write(helper)
                stream.flush()
                os.fchmod(stream.fileno(), 0o644)
                os.fsync(stream.fileno())
            try:
                os.link(temporary, HELPER.name, src_dir_fd=fd, dst_dir_fd=fd, follow_symlinks=False)
            except FileExistsError:
                pass
            os.fsync(fd)
        finally:
            try:
                os.unlink(temporary, dir_fd=fd)
            finally:
                os.close(fd)
        require(supervisor(q['digest']) == 'ready', 'SSH_PROTOCOL_MISMATCH')
    if workspace(Path(q['root']), uid) == 'missing':
        fd = directory(Path(q['root']), uid, gid, True)
        os.fsync(fd)
        os.close(fd)
    require(workspace(Path(q['root']), uid) == 'ready', 'SSH_WORKSPACE_INVALID')


def request(q):
    require(sys.platform == 'linux', 'SSH_LINUX_REQUIRED')
    require(isinstance(q, dict) and set(q) <= {'action', 'root', 'digest', 'helper', 'bootstrap'}, 'SSH_PROTOCOL_MISMATCH')
    require(q.get('action') in ('inspect', 'install', 'install-root'), 'SSH_PROTOCOL_MISMATCH')
    require(isinstance(q.get('digest'), str) and re.fullmatch(r'[a-f0-9]{64}', q['digest']), 'SSH_PROTOCOL_MISMATCH')
    root = q.get('root')
    require(isinstance(root, str) and re.fullmatch(r'/[A-Za-z0-9_./-]+', root) and len(root.split('/')) > 2 and all(p and p not in ('.', '..') for p in root.split('/')[1:]), 'SSH_WORKSPACE_INVALID')
    if q['action'] == 'install-root':
        install_root(q)
        return {'installed': True}
    state = inspect(q, os.getuid())
    if q['action'] == 'inspect' or state['supervisor'] in ('mismatch', 'unsafe') or state['workspace'] == 'invalid' or state['supervisor'] == state['workspace'] == 'ready':
        return state
    if os.geteuid() == 0:
        install_root(q)
    else:
        code = 'import base64;exec(base64.b64decode(' + repr(q['bootstrap']) + '))'
        try:
            p = subprocess.run(['sudo', '-n', '--', '/usr/bin/python3', '-c', code], input=json.dumps({**q, 'action': 'install-root'}).encode(), env={**ENV, **{k: os.environ[k] for k in ('TERM',) if k in os.environ}}, capture_output=True, timeout=20)
            result = json.loads(p.stdout) if p.returncode == 0 else {}
        except subprocess.TimeoutExpired:
            return {**state, 'errorCode': 'SSH_SETUP_UNKNOWN'}
        except (OSError, ValueError):
            result = {}
        if result.get('installed') is not True:
            return {**state, 'errorCode': result.get('errorCode') if result.get('errorCode') in ('SSH_WORKSPACE_INVALID', 'SSH_SUPERVISOR_UNSAFE', 'SSH_PROTOCOL_MISMATCH') else 'SSH_SETUP_PERMISSION_REQUIRED'}
    return inspect(q, os.getuid())


if __name__ == '__main__':
    try:
        raw = sys.stdin.buffer.read(1024 * 1024 + 1)
        require(len(raw) <= 1024 * 1024, 'SSH_PROTOCOL_MISMATCH')
        result = request(json.loads(raw))
    except Exception as error:
        safe = {'SSH_LINUX_REQUIRED', 'SSH_SETUP_PERMISSION_REQUIRED', 'SSH_WORKSPACE_INVALID', 'SSH_SUPERVISOR_UNSAFE', 'SSH_PROTOCOL_MISMATCH'}
        result = {'protocol': 1, 'supervisor': 'unknown', 'docker': 'unknown', 'workspace': 'unknown', 'errorCode': str(error) if isinstance(error, ValueError) and str(error) in safe else 'SSH_SETUP_PERMISSION_REQUIRED'}
    print(json.dumps(result, separators=(',', ':')))
