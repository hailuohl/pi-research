import { spawn } from 'node:child_process';
import { DomainError, ensure } from '../domain/errors.js';
export const SSH_COMMAND = 'python3 /usr/local/lib/pi-research/ssh-runner.py';
// Windows OpenSSH exits 255 before parsing arguments if ProgramData is absent.
export function sshEnvironment() { return Object.fromEntries(['PATH', 'SystemRoot', 'WINDIR', 'HOME', 'USERPROFILE', 'ProgramData'].filter(k => process.env[k]).map(k => [k, process.env[k]])); }
export function sshArgs(t) { return ['-F', 'none', '-T', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'IdentityAgent=none', '-o', 'StrictHostKeyChecking=yes', '-o', 'GlobalKnownHostsFile=none', '-o', `UserKnownHostsFile="${t.knownHostsFile.replaceAll('\\', '/').replaceAll('"', '\\"')}"`, '-o', 'UpdateHostKeys=no', '-o', 'ForwardAgent=no', '-o', 'ClearAllForwardings=yes', '-o', 'PermitLocalCommand=no', '-o', 'ConnectTimeout=10', '-o', 'ServerAliveInterval=5', '-o', 'ServerAliveCountMax=2', '-i', t.identityFile, '-p', String(t.port), '-l', t.user, '--', t.host, t.gpuProtocol ? 'python3 /usr/local/lib/pi-research/ssh-runner-gpu.py' : SSH_COMMAND]; }
/** One bounded JSON request. Transport ambiguity never means the remote operation failed. */
export async function sshRequest(t, request, limit = 200 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
        const child = spawn('ssh', sshArgs(t), { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: sshEnvironment() });
        const chunks = [];
        let bytes = 0, failed = false;
        const fail = () => { if (failed)
            return; failed = true; child.kill(); reject(new DomainError('SSH_STATE_UNKNOWN', 'SSH 观察中断；须按原 handle 对账', 409)); };
        const timer = setTimeout(fail, 60000);
        child.stdout.on('data', (b) => { bytes += b.length; if (bytes > limit)
            fail();
        else
            chunks.push(b); });
        child.stderr.on('data', () => { });
        child.stdin.on('error', () => { });
        child.on('error', fail);
        child.on('close', code => { clearTimeout(timer); if (failed)
            return; if (code !== 0) {
            fail();
            return;
        } try {
            const r = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            ensure(r && r.protocol === 1 && typeof r.ok === 'boolean', 'SSH_PROTOCOL_INVALID', '远端响应协议无效');
            if (!r.ok)
                throw new DomainError('SSH_REMOTE_REJECTED', typeof r.error === 'string' ? r.error.slice(0, 100) : '远端拒绝请求', 409);
            resolve(r);
        }
        catch (e) {
            reject(e);
        } });
        child.stdin.end(JSON.stringify({ protocol: 1, root: t.remoteRoot, ...request }));
    });
}
//# sourceMappingURL=ssh.js.map