# 固定原文解析页的视觉范围

唯一流程：用户从已成功完整的固定解析结果带入当前主会话，Agent 得到固定文档/解析对与页数元数据，申请目的模型与明确页范围的批准，然后逐页读取已有 PNG。布局继续暂缓，只复用必要文档入口与动作卡。

1. 用户明确选择 documentVersionId/parseResultId；消息附件固定保存该对、结果摘要和页数，重试/重开/branch 保留绑定。Agent 的附件读取仅返回空正文及元数据，不默认读取原文或像素，不自动选择 latest。跨项目、失效/篡改/失败解析不能带入。
2. 初次 document_page_image_read 为闭合 doc/parse/page/firstPage/lastPage 参数，必须准确批准范围、当前会话/目的模型及历史重发；复用为互斥的 doc/parse/page/authorizationActionId 参数且禁止范围字段，只接受同会话有效 completed 视觉动作的范围内页。readOnly/Task/wakeup/跨会话/项目/越页/任意文件URL拒绝。textCorpusGrant 不赋视觉权限，不要求为图像附加文本授权。
3. 复用现有解析、CAS 与 assertCurrent；parse approval、DiscoveryGrant 实际撤销/来源绑定、原件和页资产变化阻止新发送。provider 关闭/获取 grant 过期沿既有本地资料语义阻止新获取，不自动抹掉已保存资料的明确视觉批准；未知来源许可仍标未知，不捏造 acquisition approval。
4. 初次与复用均登记原始 callId/inputDigest，禁止同键换输入绕过；缓存命中仍重验范围/来源/页。每个模型 HTTP acquire 含历史与排队重试再次验证全部图授权，4 MiB/1600px/合计16 MiB及目录/model/epoch边界沿用，撤权/篡改后零新外发，raw history 保留。
5. 旧 publication 图片工具/引用/历史保持兼容。明确来源与已看页范围，真实 Pi/Worker/Host 传输原文 PNG 的离线供应商接线与实际外部视觉推理分别记录；没有 OCR、下载、重新渲染或任意裁剪。新增一个文档按钮及附件状态文案，不新增授权面板或布局。

基线 `eff3a2997eb9ad6165cffb08713651bc80f3d4ed`。复杂权限/历史实施 Astra/high，独立关键复核 Astra/xhigh；配置已请求但运行时未回显时明确记录。
