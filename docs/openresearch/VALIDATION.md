# 本次验证记录 · 0.3.1-experimental

交付日期 2026-09-27，Linux x86_64 / Node22.16.0 / TypeScript5.8.3。来源基线为 0.3.0-experimental。

## 已实际执行

原输入在独立工作副本通过 221/221 项测试。新增50项，最终严格前后端类型检查、构建和完整套件 271/271 通过，0失败0跳过。最终独立 ZIP 解压验收记录放在外部证据包 portable-enhanced-suite.log；只有实际通过后才交付。

测试包括来源开关与请求中途撤销、项目归档/任务租约、异步请求预算、同请求幂等、全部/部分失败、正文大小/类型/流取消、XML实体、凭据反射、作用域、技能目录/摘要/角色、Worker启动提示、HTTP鉴权、CLI与组件结构。

模型/来源响应测试使用明确 fixture；Worker IPC 测试使用测试 Worker。测试证明工具和控制服务合同，不证明真实模型遵循技能，更不是50个独立安全漏洞被修复。

## 本次实际受阻

真实 Node 适配器对五个来源发起 keyless 检索，均未取得成功响应，记录为 CONNECTOR_UNAVAILABLE；独立 DNS 探测报告解析失败。它们已实现且契约测试通过，但 real-provider integration 尚未验收。不要用浏览工具能阅读上游代码来替代程序本身的网络验证。

Browser 插件不可用，使用已提供 Playwright＋/usr/bin/chromium；首个回环页面导航返回 net::ERR_BLOCKED_BY_ADMINISTRATOR。未改管理策略、未绕过限制、没有成功截图；桌面/移动/无障碍/完整交互尚未验收。组件测试捕获 React 元素树，不是浏览器。

独立目录运行 npm ci --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=5000，出现 registry.npmjs.org EAI_AGAIN。实际构建使用本地 tsc5.8.3 和可用 @types/node25.1.0，锁文件要求24.0.4，未冒充干净锁依赖构建通过。预构建程序另行无 node_modules 测试。

固定 Pi0.87.1 没有安装或真实调用；当前 Node22.16.0低于该 SDK 的22.19.0要求。Docker、Windows/WSL、远程服务、PDF/图表提取、材料模型及SCI复现没有运行。无外部模型或云计算费用评测。

## 审查与保留

本次为作者单独自审，没有独立审查者或第三方安全认证。新增模块未引入额外运行时npm依赖。原输入ZIP、原始设计文件、增强版 text-evidence 的源文件保持不变；新技能/连接器两版字节一致。

## 复验

```bash
npm run test:core
node dist/apps/cli/index.js doctor --json
node dist/apps/cli/index.js skills
```

可安装开发依赖环境再执行 npm ci && npm run typecheck && npm test。真实模型要先配置模型和固定SDK；联网来源要用户明确启用，不要在CI默认调用付费模型或真实云计算。

旧 docs/acceptance 下以往版本的日志仅为历史，本次以本文件和同次外部证据包为准。
