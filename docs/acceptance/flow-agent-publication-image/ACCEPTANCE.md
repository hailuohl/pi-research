# 固定文稿页的 Agent 视觉读取

本批只实现交互主协调者将自己会话的固定成功文稿页发送给目的模型，取得真实图片输入并核对布局；不扩展文献 PDF 视觉范围。

1. 固定 publicationResultId/pageNumber 经准确批准后返回既有 CAS PNG；来源 current、成功且完整，尺寸 1..1600，单页 <=4 MiB。无重新渲染、OCR、下载、路径/URL/base64/artifactId 入口；Task/wakeup、跨会话/项目、越界和失败构建拒绝。
2. 所有可执行权限模式均须显式批准固定页进入当前会话及后续可能重发给该模型；readOnly 仍拒绝。复用现有动作卡和撤权 epoch，不放宽其他动作批准规则。卡显示目的 provider/model、固定页及重发范围，布局不改。
3. 实际 SDK catalog 必须声明 image；text-only/未知、managedHttp:false、model/provider/api 改变及 catalog digest 漂移拒绝，不自动换模型或降级。关闭 SDK 自动缩放，保留固定 PNG 字节。
4. 每次模型 HTTP acquire（包括排队重试/重开）重验实际 context 每张图的规范数据、固定引用、action、session、模型/catalog、epoch、来源/页/CAS。总图 <=16 MiB；无绑定、损坏、撤权或来源失效时新的外发请求为0。acquire 授予发送资格是 fence，不声称撤回已发出的请求。
5. native history 中图片及引用固定保存，合法重开可用；授权失效的旧含图会话整体阻断，保留 raw history。不能隐式删图/改图/重授权，重新授权从新的会话开始。视觉观察只证明页面布局观察，不证明科学结论。

明确简化：catalog 全文件摘要与 pinned SDK 身份一起纳入授权指纹；任何 catalog 变化均需新的批准，先满足目的地正确性，暂不做按单模型条目差异的优化。只登记摘要，不保存或输出凭据内容。
