# 验收结果

完成固定原文解析结果→当前主会话元数据→明确页范围批准→逐页图片的流程。“带入当前会话”复用已成功完整的固定结果，附件保留 documentVersionId/parseResultId/resultDigest/pageCount，Agent 读取空正文与元数据，不自动选 latest。重试/重开/branch 保持固定对，branch 不继承视觉许可或 native 图历史。

`document_page_image_read` 的首次范围与后续授权 ID 复用是互斥闭合参数；原始 callId/inputDigest 防止初次、复用和 pending 请求换参数。所有模式准确批准、readOnly/Task/wakeup/跨会话/项目拒绝；缓存及每次模型 HTTP acquire 重新检查范围、固定来源/解析批准/实际取得授权、原件与页 CAS、模型/catalog/epoch。原 publication 图片引用兼容。

文本授权不赋视觉，视觉也不扩大文本检索；provider 关闭/取得授权过期沿既有本地资料规则阻新获取，实际来源撤销仍阻历史页新发送。未知许可保持未知。没有 OCR、下载、重渲染或任意裁剪；4 MiB/1600px/会话16 MiB与历史保留沿用第三批。

lit-review/evidence/paper/overview 已适配真实范围流程和证据边界。新发行 `50e285cf2ea51e8dfa1543894bfce13e14969ff3924f9dfd0ed6599377bb6664`，原 12 份发行不变。

- 集中回归 1236 项：1213 通过、0 失败、23 跳过（可选 Docker/编译器、Windows 不适用的 POSIX 检查）。
- 实施聚焦 53/53；主代理聚焦 47 中 46 通过，唯一旧 owner-only 工具分类测试随后局部修正重跑 1/1。新工具仍保留三端无效输入一致拒绝，六种非协调者用有效示例严格拒绝。最终完整回归已覆盖全部当前测试。
- 独立 Astra/xhigh 7/7、冻结 136 文件摘要一致，无阻断。实施 Astra/high；配置已请求，运行时未回显。
- 真实 Pi/Worker/Host 的 localhost 脚本化供应商收到两张不同的合成固定页，第二页复用准确范围授权；合法 native 重开通过，实际 HTTP 排队时撤解析批准零新外发、旧文件前缀保留。非实际视觉理解/新 PDF 解析。
- 浏览器实际点固定结果“带入”，进入选定会话并看到“固定解析 · 视觉读取须另批”，截图及精简浏览器证据同目录。最初无模型的测试会话明确提示配置错误；配置本地脚本化模型后入口成功，没有使用外部凭据。
- 最终隔离安装、构建、类型检查通过，557 个 dist 产物完全一致；关键路径加入三平台 CI，远端结果另行确认。
- 提交 `1970628` 的[远端 CI](https://github.com/hailuohl/pi-research/actions/runs/37641711122) 中 Windows/Linux 通过，macOS 的新图片/范围检查也通过，但旧 HTTP/CLI 测试以符号链接临时目录初始化，被存储保护拒绝。局部规范化测试临时父目录为真实路径，不改变产品 noLinks 或权限断言；单文件 1/1 与 Sol/medium 独立复核通过，实际 macOS CI 再验。
- 原有五个在途文件未修改或提交；已知 parity 基线旧目录文档缺口仍按第一批记录保留。

原始机器日志保留 `.validation/agent-document-image/`、`.validation/document-visual-design/` 与原干净构建目录；本目录只保存必要证据，不提交运行数据库或原生对话。
