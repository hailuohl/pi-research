# 技能与文献连接器

内置技能按本项目的角色、工具、证据和批准边界提供工作指导。当前职责与功能限制见[当前技能说明](CURRENT-SKILLS.zh-CN.md)，运行入口见[后端清单](../BACKEND-READINESS.zh-CN.md)。技能文字不新增工具、执行权限或已验证能力。

技能加载路径为 ResearchApp.skills → SkillService.bootstrap(role) → AgentHost → Worker IPC → Pi session options。启动提示提供总览和角色目录，正文及资源由 research_skill_read 按需读取。

当前源目录为 skills/piresearch。维护者审查修改后，使用 node scripts/rebuild-skill-manifest.mjs 生成新发行，再构建和验证。普通构建与运行不会接受未经维护者发布的新摘要。旧会话继续使用固定包，历史资源和摘要保持原样。

文献连接器支持 alphaXiv、OpenAlex、bioRxiv、PubMed 和 Crossref。检索来源开关、内容层级、标准ID、取消、请求限额、凭据保护和部分失败处理沿用实际接口。元数据、摘要和提取原文分别标记；取得文本不等于完整阅读每一页或验证科学结论。

图形模板和论文资源保留现有方法与示例。读取资源不执行代码；实际计算、归档、文稿构建和页面读取遵循各自批准与证据流程。
