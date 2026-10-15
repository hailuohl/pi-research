# 权限下拉列表

2026-10-06，基线 `d0076f8d7e4aebbf255ba90ba329fa19df939957`。本批只调整正式权限入口形式，后端与授权协议不变。

## 验收条件与结果

1. 四项名称、图标、短说明纵向排列；一次只能选择一档。前三项未实施，禁用并显示“待接入”；当前受控工具不伪装为其中一档。完全访问勾选仅由服务端 enabled 驱动。
2. 点击完全访问先关闭菜单、聚焦原触发按钮，再进入既有必选确认；取消不授权，范围与撤销沿原 Modal/API。固定确认动作，外部状态更新不将启用翻为撤销；目标已改变时不写新的请求。
3. Arrow/Home/End 跳过禁用项，Escape/Tab、点击外部关闭；确认取消后焦点回到入口，点击输入区关闭不抢焦点。1440/1024/390 浮层均在视口内。
4. 原侧栏、聊天、检查区、输入区、左右控件和说明行尺寸保持；1440/1024 与前批矩形完全相同。手机消息不同，不比较内容导致的绝对纵向位置。全程只使用合成数据测试真实启用/撤销，未改真实会话权限。

参考 [ZCode 权限入口与模式说明](https://zcode.z.ai/en/docs/safety-confirm)、[shadcn 下拉单选菜单](https://ui.shadcn.com/docs/components/base/dropdown-menu)，沿用现有组件与原生 Popover，没有新增依赖或迁移 UI 框架。

## 检查

- 4项新增组件检查通过：未实施项禁用、原确认/focus、外部状态变化不反转动作、确切 API ack 字段。
- 全量1067：1044通过，23环境跳过，0失败。原日志留 `.validation/permission-menu-2026-10-06/full-tests.log`。
- 干净安装、构建与类型检查通过，516分发文件一致。最后仅修局部静态CSS：其余515文件与干净manifest一致，CSS源码与分发字节相同。
- 独立Sol high复核（已请求，运行时未回显）：发现窄屏继承 display:none 会隐藏状态标注，已局部恢复 tag/footer/入口文字；修后仅复查受影响CSS与1024/390截图，无剩余阻断。另用隔离断言确认倒序/卸载后的请求不会覆盖当前状态，未重复全量验证。
- 4794实际提供的 main.js、host-access.css 与当前分发哈希相同；真实页面已核对四项展开，未重启服务、模型或研究作业。

截图为合成验收，精简机器证据见 `browser.json`、`evidence.json`。未提交运行数据库、凭据、原生对话及原始大日志。

五个原在途文件哈希不变且不提交：apps/web/public/styles.css、dist/web/styles.css、OPENRESEARCH-COMPARISON.md、capability-matrix.json、project-design.txt。分支 `implementation/pr01-reproducible-baseline`，私密目标 `hailuohl/pi-research`；提交SHA和远端核对在最终消息记录。
