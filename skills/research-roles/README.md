# 角色指令与受管科研技能

角色身份和基础权限说明仍来自 `packages/pi-adapter/options.ts`；科研方法来自 `skills/openresearch/` 的受管发布包。宿主初始注入总览与角色目录，模型通过 `research_skill_read` 按需读取。

不扫描项目或用户工作目录的 SKILL/AGENTS/.pi，也不执行扩展。技能被读取不改变角色权限。原始角色文档如下，属于历史说明：

# 角色指令的实际来源

当前版本的审核过角色指令位于 `packages/pi-adapter/options.ts` 的 `systemInstruction` 和角色映射中，由宿主显式传入 Pi ResourceLoader。运行时不扫描或执行本目录，也不扫描导入项目的技能、扩展、AGENTS.md。

本目录不是已实现的技能市场或热加载系统。后续将角色技能外置时，需要版本化、校验、明确批准和相应回归测试，不能直接开放任意项目目录发现。
