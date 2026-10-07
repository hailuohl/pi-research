# 验收结果

完成交互主协调者读取自己会话固定成功文稿页的真实 Pi 图片输入。`publication_page_image_read` 接受准确结果 ID 与页号，校验成功/完整/当前来源、清单和 CAS；只读取既有 PNG，不重新渲染或取得原文。

准确页进入当前目的模型及历史重发均需显式批准；readOnly 拒绝，legacy/fullAccess/autoEdit 不绕过。动作卡说明目的模型、固定页和后续可能重发，布局不变。每个实际模型 context 的每张图都有固定引用和字节核对，每次 HTTP acquire（含排队重试）重验 action/session/model/catalog/epoch/source/page/CAS；撤权停止新发送，raw native history 保留。

单页 4 MiB / 1600px，会话图片累计 16 MiB，重复图块也计量。目录必须声明 image、使用受管 HTTP，SDK 自动缩放关闭，不自动切模型或删除旧图。图片授权失效的旧含图会话整体阻断，已发内容不能撤回。普通无图请求的旧目录/HTTP行为保持。

paper/figures/reports/overview 补齐固定页批准、真实视觉检查和范围记录；布局观察不冒充科学审查或原文 PDF 视觉权限。新发行 `49efbc47bbccc6d19c12d60d77b9721219865dfce73a1f50552ac87bae296ca8`，原 11 份发行保留。

- 集中回归 1225 项：1202 通过、0 失败、23 跳过；跳过为可选 Docker/编译器与 Windows 不适用的 POSIX 检查。
- 主仓聚焦 48/48，原完整权限集成另验 16/16；独立 Astra/xhigh 6/6、冻结 112 文件哈希一致，无阻断。实施 Astra/high；配置已请求，运行时未回显。
- 实际固定 Pi、生产 Worker/Host、localhost 脚本化端点接收到准确 PNG data URL；native 保存图片和引用，合法重开重复发相同字节。真实 HTTP 排队后撤权为 0 外发，目录失效/无图兼容分别验证。脚本化回答不算视觉推理。
- 最终干净安装、构建、类型检查通过，557 个 dist 产物完全一致；关键路径加入三平台 CI，远端结果另行确认。
- 隔离实施初始 Git 用例因 Windows 深临时目录 lock 路径过长失败；只改测试进程 TEMP 后恢复，未改产品 Git、断言或超时。主仓正常目录完整权限集再次通过。
- 未执行真实外部视觉模型推理、此批新的 Docker 编译/硬件实测；已有编译产物归档路径按代码与既有检查复核，当前视觉输送使用明确合成固定页。
- 原有五个在途文件未编辑/提交；已知 parity 旧目录文档缺口仍按此前记录保留。

机器证据见 `evidence.json`，原日志留在 `.validation/agent-publication-image/` 及原隔离/干净构建目录。
