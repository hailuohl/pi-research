# 四档权限设计交付

本批是设计交付：四档语义、后台授权方案和浅色离线交互原型。正式前端与运行权限没有修改；既有布局没有被改动。

## 交付内容

- `DESIGN.zh-CN.md`：模式矩阵、入口与设置/审批流程、effect 分类、可信身份、来源和 grant 求交、策略 epoch、旧会话迁移、恢复与完全访问前置条件。
- `../ui-redesign-2026-10-03/permission-modes.html`：原型，现有静态预览服务可访问 `/permission-modes.html`。
- `menu-desktop.png`、`menu-mobile.png`、`settings-desktop.png`、`settings-mobile.png`：原型示例截图，无真实对话或研究数据。
- `evidence.json`：实际原型观察和断言结果。

## 验证

通过：浏览器验证只读阻止变更、权限切换使旧审批失效、自动编辑仍要求确认命令、完全访问禁用/关闭不升权、默认值不改变当前会话、允许/拒绝示例、差异展开、键盘单选、Escape 返回焦点、外部点击关闭。1440 桌面、1024 窄屏和 390 手机观察完成，菜单和手机对话框位于视口内；桌面/手机设置截图已检查。浏览器 warning/error 日志为空。

通过：Node `vm.Script` 语法解析、无网络或存储 API 的静态检查、CSP 禁止连接和表单提交。原型不调用生产 API、不保存默认值到浏览器存储。

工具观察限制：一次 radio `setChecked` 因 change 后立即关闭菜单而观察超时；实际 DOM 确认选择成功，后续使用 click、状态读取和独立断言完成验收。1024 初次测量包含打开动画的中间位置，最终采用动画结束后的 `viewport-1024-settled` 记录。

未运行：生产权限、实际认证/宿主隔离/撤权、旧数据迁移与恢复反例，均尚未实施。本批不跑全量生产回归/构建，也不把静态壳体观察称为正式前端尺寸回归。

## 独立复核

独立 Astra 会话完成只读关键设计复核，未发现阻断本批设计与离线原型交付的问题。复核独立核对现状 HTTP/Actor、Registry 异步与 replay、任务成果副作用，并读取原型证据；未重复浏览器验证。两项非阻断建议见下方实施待办。结论不代表生产权限已实现或通过。冻结快照：

- Git 基线：`86dcf3c90e135391c28f1301c29a09f09006cfbf`。
- `DESIGN.zh-CN.md` SHA256：`086DCE1B44DA456BF108001891B50EF810E681F3E0A408854D98C93D9A6EABDC`。
- 原型 SHA256：`8DD3EE8A3BB09EBF2EE406CFED23B26B9E5818DC11FB98BFC55DDC2AB6D9225D`。

模型与档位均通过原生 spawn 明确请求：架构 `gpt-6-astra high`，官方界面资料 `gpt-6.1-sol high`，独立复核 `gpt-6-astra xhigh`。接口接受请求但运行时未回显，不宣称已核验实际模型/档位。架构和复核来自不同会话；均只读。

实施待办（非阻断本轮设计）：正式审批卡展示目标版本/摘要；统一授权的细节区分受管 effect 与 full 已启动任意 shell 的粗粒度执行授权，不能声称能拦截 shell 内每个 syscall。

## 范围与交付

只提交上述设计文件、精简证据及合成截图。原五个在途文件 SHA256 与本批开始时完全一致，不纳入提交：正式 `styles.css`、`dist/web/styles.css`、`OPENRESEARCH-COMPARISON.md`、`capability-matrix.json`、`project-design.txt`。未启停真实服务、Pi 模型或研究作业。

分支：`implementation/pr01-reproducible-baseline`。目标仓库：`hailuohl/pi-research`，2026-10-05 再次核对为 private；沿用 origin，不强推。提交 SHA 与远端核对结果在本批最终交付消息记录。
