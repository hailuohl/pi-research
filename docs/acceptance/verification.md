# Pi Research v0.2.1 验证记录

交付日期：2026-09-27。实际容器日志时钟为2026-09-26，原始运行记录未改写。当前为本地Alpha修复版，非完整科研自动化或生产安全认证。

| 项目 | 结果 | 证据 |
|---|---|---|
| 提供的v0.2.0基线 | 122通过 / 0失败 | baseline.log |
| 严格前后端类型检查 | 通过 | final-typecheck.log |
| 新版构建与完整测试 | 171通过 / 0失败 / 0跳过 | final-suite.log |
| 独立解压、无node_modules，运行预构建测试 | 171通过 / 0失败 / 0跳过 | portable-suite.log |
| 打包代码的页面、脚本与鉴权API | HTTP检查通过，不是浏览器渲染 | portable-http.json |
| 独立demo-campaign | 4个真实Run均succeeded/complete，2轮、3决定；aiUsed=false | campaign-demo.json、campaign-report.md |
| 固定文件交接到实际Run | 测试真实执行了经整合的新config；Run批准与整合批准分离 | tests/unit/audit-handoff.test.mjs |
| v0.2.0→v0.2.1同路径接管 | 4个旧Run记录和旧报告字节不变，没有重跑旧Run | upgrade-020-021.json |
| 原始两份设计 | 字节SHA-256与输入一致 | provenance.json |

新增49项回归、边界、正向控制、HTTP和组件用例。组件测试仅检查React元素结构；上下文与恢复测试使用明确标注的测试Worker，不冒充真实Pi。

## 失败与修复过程

每组新测试先运行缺少修复的版本，记录失败，再实施修复并重跑完整套件。`*-red.log`保留缺陷证据，其中部分正向控制在修复前已通过，不能将49项全部说成49个独立bug。

最终人工自审增加了规范路径检查和复制后摘要校验。第一次字节故障注入也影响预检，因此不足以证明复制阶段；收窄到readStableFile后，临时去掉新摘要防线，测试失败，再恢复防线测试通过。证据：copy-digest-red-proof.log、copy-digest-green-proof.log。

部分结果从output_submitted改为blocked后，一个既有回归先因错误码优先级失败；修复后保留原测试。结果评议变严格后，两个原Repair测试先被新门槛阻止，已显式加入用户no-answer评议再继续验证原修复额度，不删除或跳过原场景。

## 验证限制

- **Pi/供应商：未调用。** Node22.16.0低于固定Pi0.87.1要求22.19.0，SDK/模型凭据未配置。测试工具与IPC成功不等于真实模型接入通过。
- **浏览器：阻塞。** Browser插件未提供，因此尝试现有Playwright Chromium。首个本机页面导航返回 `net::ERR_BLOCKED_BY_ADMINISTRATOR`。未绕过策略，未取得截图、桌面交互、手机布局或无障碍验收结果。HTTP通过不能替代这项。
- **依赖重装：阻塞。** 在独立目录执行固定锁文件npm ci，registry.npmjs.org的DNS失败EAI_AGAIN。实际构建使用TypeScript5.8.3和可用Node类型25.1.0；锁声明24.0.4。干净安装和完全锁定依赖构建不能标成通过。
- **执行环境：** Linux x86_64、Node22.16.0。Docker、Windows/WSL、SSH/Slurm等未真实验收。宿主真实运行仅限固定受信数值示例；没有DFT、SCI复现、开发沙箱或真实多Agent科研评测。
- **审查方式：** 实现者单独自审，无独立审查者，无第三方认证。外部OpenResearch仅固定提交的静态技能/源码对照，未运行其完整产品。

## 复验命令

```bash
node --test --test-concurrency=1 tests/unit/*.test.mjs tests/integration/*.test.mjs
node dist/apps/cli/index.js doctor --json
node dist/apps/cli/index.js demo-campaign --data ./qa-data --json
```

有可安装开发依赖的环境再执行 `npm ci && npm run typecheck && npm test`。首条使用预构建dist；真实模型与Docker应按live-pi-checklist和独立后端用例验收。

部分测试使用Linux的/proc作局部I/O故障注入；本次没有宣称相同故障注入脚本在Windows也通过。
