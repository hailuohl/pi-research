# 静态 PNG 技能资源：本批结果

新增可用能力：现有受控技能接口已实际导入一份合成图 ZIP，保存 `SKILL.md` 和 `assets/figure.png` 的固定摘要；浏览器完成审阅、批准、显式启用、PNG 回看、一次下载点击、撤销及刷新。服务端重开后读取的 PNG 与原件 2,021 字节完全一致，撤销阻断新会话启动，历史修订和审阅决定仍可读取。

剩余工作：当前浏览器控制不支持原生文件输入，本次 ZIP 由同一隔离服务的 `skill_package_import` 接口提交，不能称工作台文件选择器已验；下载按钮已点击且无错误，但操作系统下载目录落盘未确认。diagram 等执行能力仍须按具体产物另验。静态资源审阅不批准脚本或计算。

边界：非规范 PNG 导入被 `SKILL_IMAGE_INVALID` 拒绝；Agent 文本技能读取 PNG 返回 `SKILL_RESOURCE_BINARY`，已撤销 Bundle 的新启动返回 `SKILL_REVOKED`。旧 58 条业务记录逐条摘要不变，新增 HTTP、模型与计算调用均为 0。

验证：本批无产品源码改动，复用此前已完成的干净构建和全量回归，不重复跑无关检查；原字节、历史与拒绝路径在隔离副本直接核对。机器摘要见 [evidence.json](evidence.json)，原 ZIP 和日志留在本地 `.validation/skill-static-png/`。
