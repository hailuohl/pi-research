---
name: pi-research-customize
description: "Use when preparing or importing a reusable research skill, inspecting fixed skill versions/resources, or adapting a LaTeX template."
---

# 受管技能、用户上传与模板

内置适配技能默认始终开启、来源/资源哈希受管。research_skill_list/read按当前角色和固定bundle读取；可读技能不是新增工具权限。用户明确上传的技能是另一条已实现路径，不再说“无通用上传替换器”。

## 准备可复用方法

用户要求保存方法时先准备实际SKILL.md和必要支持文件。frontmatter保留name和description，正文写触发、输入/输出、方法/示例、失败/停止条件、权限及许可证来源；只保存必要资源，不提前搭空目录。上游以frontmatter name命名，本项目以上传input.packageId命名，description/roles/requirements也来自结构化输入，服务不保证解析frontmatter替你命名或检查方法内容。

packageId须以小写字母起头，后续小写字母/数字/连字符，不能与当前或历史内置技能ID碰撞；上游“orx-前缀保留/禁止连续连字符”的规则不是当前验证器，不冒称它被强制。自定义宜用清楚短名如local-method，内置跨技能引用仍完整pi-research-*。

## 导入、原子上传开启与同名更新

以下skill_package_*及配置/会话选择操作均user-only。Agent可准备内容和建议输入，不能自己上传/审核/启用。

| 当前用户入口 | 对应上游方法与差异 |
|---|---|
| skill_package_import | 文件数组或ZIP登记不可变修订，返回revision；只导入，不自动开启 |
| skill_package_upload | 文件数组或ZIP上传并原子开启，返回revision+configuration；授权加载，不表示内容审核或执行授权 |
| skill_package_enable | 已导入修订按expectedVersion显式开启，同名替换未来配置，历史修订仍保留 |
| skill_package_list/inspect/read | 配置、修订、审阅/撤销状态和固定资源回读 |
| skill_bundle_configure/session_select/preflight | 用户选择固定bundle/会话技能，检查缺工具/后端/产物；缺条件不能声称即刻生效 |

同名替换只更换未来配置中的packageId对应revision，不删旧文件/历史绑定，不回写正在运行会话已固定的bundle。同名不同字节必须新修订，不能覆盖原CAS blob。输出记录真实packageId、revision.id、contentDigest和configuration.version/bundleId；本项目没有上游replaced布尔值，是否替换来自更新前后同packageId修订列表，不能造字段。

上传输入各必填字段packageId、revisionTag、description、roles、license、requirements，再二选一files或zipBase64；不是传一个磁盘路径就读取。下面是合法最小结构演示，SKILL.md的Base64编码实际文字为“# Method”，没有科学内容，实际使用应编码完整方法：

```json
{"input":{"packageId":"local-method","revisionTag":"v1","description":"用户提供的研究方法","roles":["coordinator"],"license":null,"requirements":{"tools":[],"backends":[],"artifactIds":[]},"files":[{"path":"SKILL.md","contentBase64":"IyBNZXRob2Q="}]}}
```

ZIP例子保留同样头字段，删除files改用zipBase64:"<实际ZIP规范Base64>"；ZIP内SKILL.md位于根，支持references/方法.md等必要文本，不添加额外顶层包装目录。不把路径或示例Base64当已上传成功。

## 静态资源与边界

当前已实现校验：1–64文件、每文件128 KiB、展开包2 MiB、非空根SKILL.md、规范相对路径、大小写冲突/遍历/保留名拒绝、有效UTF-8文本。assets/下.png可作经过格式/大小验证的静态图；Agent技能文本读取不返回PNG，用户skill_package_read可读静态PNG。其他二进制模板ZIP不可冒充文本上传。ZIP受限stored/deflate，不接收加密/多卷/ZIP64；服务还会验证CRC和一致性，失败保留具体错误、修正输入，不以别的路径避开。

不导入.pi、.git、.codex、AGENTS、hooks/extensions等配置路径。上传授权仅加载固定文本/静态资产；即便存在approved记录，也不是内容安全/科学有效性审核。方法里的脚本、安装命令、联网、工具清单、图生成要求都不会自动执行或扩权；requirements列需求，不授予权限。

资源按需research_skill_read({input:{skillId:"<本角色可读的真实技能ID>",resource:"references/method.md"}})加载，不把目录所有文件初始塞入上下文。无法读、摘要不符、资源未登记、角色不符时停止并报错误，不回退加载用户磁盘任意文件。

## 版本、更新与恢复

用户显式开启/选择固定修订；运行时记录bundleId和skillIds，后续turn仍沿当前会话固定版本，不承诺上传后正在运行模型立即重载。user harness原生技能仍其自身管理，项目导入目录不会自动发现/加载技能。research_skill_read读取本会话绑定包，不能静默换当前发行。

enable/configure/delete用真实expectedVersion防配置陈旧；VERSION_CONFLICT先读取最新配置再决定。撤销/删除阻止未来加载，历史文件、旧报告和绑定按原版本保留，不能复活新授权。旧发行文件缺失或摘要不同报错，不回退新版本。默认内置技能仍必需，disabledBuiltinIds不能关掉它们。没有改主会话全局模型/思考配置的步骤。

## LaTeX模板：已有复用与未完成差异

上游templates add接受单.tex或含.cls/.sty的ZIP，并跨项目同名替换。当前**全局模板库注册/跨项目模板上传未实现**，不要声称把.tex保存在工作区就完成模板注册。用户授权模板可作为真实文本源复用；publication_templates给固定基础模板，manuscript_create冻结具体文稿/资产，publication_prepare等构建入口按pi-research-paper既有流程，源/编译/审查/成果各有边界。

不创建不存在的模板API、不为了注册调用host_execute或外部Overleaf。保留用户模板与原设计，写新版本说明差异；模板保存不是成功编译，真正PDF以成功完整publication结果为准。用户技能是项目内持久修订，区别于上游活跃数据目录跨项目全局技能。以上方法只适配当前能力，未完成部分只作为差异。

## 来源与适配声明

基于 alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 的 `agent-skills/orx-customize/SKILL.md`（blob `51d608098dc24df19518bea4f6fc71963a26c2b4`），MIT，Copyright (c) 2026 alphaXiv。Pi Research 改写了命令、存储、权限、返回状态和不可用能力；并非上游逐字文本或原版运行认证。技能不会授予权限。
