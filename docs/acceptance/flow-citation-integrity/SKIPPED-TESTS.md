# 25 项跳过测试的范围核对

2026-10-18（Asia/Shanghai），代码基线 `f8896fd249f41c8f33e38266e46c7257e9304860`。**未发现这 25 项给已交付的科学核验与引用完整性留下新的必要验收缺口；本次补跑产品测试 0 项。** 这是适用范围结论，不把跳过改记为通过。原科学全量 2100 通过 / 1 失败 / 25 跳过（后续定向修复已记录），引用全量 2121 通过 / 0 失败 / 25 跳过，均保持原状态。

两份原始日志的 25 个名称完全相同。19 项由 `PI_LATEX_LIVE`、2 项分别由 `PI_TEST_FORMAL_DOCKER` / `PI_TEST_DOCKER_MODES` 控制，只有值为 `1` 才启用；日志可确认当时条件未满足，不能据此断言 Docker 未安装或不可用。另 4 项明确排除 Windows，其中 SSH 两项用具体原因替代了 `# SKIP` 文本，已计入。

## 逐项清单

下表所有项目均保持“原跳过、本次未补跑”。原日志行号、原报告原因、条件及文件摘要见 [skip-audit.json](skip-audit.json)。编译器 19 项在同一循环声明（第 32 行），表中行号定位各夹具。

| # | 原始测试名 | 源码位置 | 原跳过原因 | 实际覆盖 |
|---|---|---|---|---|
| 1 | POSIX backup preserves distinct case-sensitive sibling paths | [data-backup.test.mjs:181](../../../tests/integration/data-backup.test.mjs#L181) | Windows 平台排除 | 大小写敏感文件系统的备份/恢复 |
| 2 | optional formal Docker supervisor: success, integrity limits, cancellation, timeout and created recovery | [formal-docker.test.mjs:32](../../../tests/unit/formal-docker.test.mjs#L32) | PI_TEST_FORMAL_DOCKER ≠ 1 | 底层 Docker 监管、输出限额、取消/超时/创建态恢复 |
| 3 | isolated compiler: pdflatex | [latex-runtime-live.test.mjs:12](../../../tests/unit/latex-runtime-live.test.mjs#L12) | PI_LATEX_LIVE ≠ 1 | pdfLaTeX 基本排版 |
| 4 | isolated compiler: xelatex | [latex-runtime-live.test.mjs:13](../../../tests/unit/latex-runtime-live.test.mjs#L13) | PI_LATEX_LIVE ≠ 1 | XeLaTeX 基本排版 |
| 5 | isolated compiler: lualatex | [latex-runtime-live.test.mjs:14](../../../tests/unit/latex-runtime-live.test.mjs#L14) | PI_LATEX_LIVE ≠ 1 | LuaLaTeX 基本排版 |
| 6 | isolated compiler: chinese | [latex-runtime-live.test.mjs:15](../../../tests/unit/latex-runtime-live.test.mjs#L15) | PI_LATEX_LIVE ≠ 1 | XeLaTeX 中文字体 |
| 7 | isolated compiler: lua-chinese-budget | [latex-runtime-live.test.mjs:16](../../../tests/unit/latex-runtime-live.test.mjs#L16) | PI_LATEX_LIVE ≠ 1 | LuaLaTeX 中文字体与既有内存限额 |
| 8 | isolated compiler: bibtex | [latex-runtime-live.test.mjs:17](../../../tests/unit/latex-runtime-live.test.mjs#L17) | PI_LATEX_LIVE ≠ 1 | BibTeX 后端实际排版 |
| 9 | isolated compiler: biber | [latex-runtime-live.test.mjs:18](../../../tests/unit/latex-runtime-live.test.mjs#L18) | PI_LATEX_LIVE ≠ 1 | Biber 后端实际排版 |
| 10 | isolated compiler: missing-image | [latex-runtime-live.test.mjs:19](../../../tests/unit/latex-runtime-live.test.mjs#L19) | PI_LATEX_LIVE ≠ 1 | 缺失图像编译诊断 |
| 11 | isolated compiler: missing-package | [latex-runtime-live.test.mjs:20](../../../tests/unit/latex-runtime-live.test.mjs#L20) | PI_LATEX_LIVE ≠ 1 | 缺失宏包编译诊断 |
| 12 | isolated compiler: undefined-reference | [latex-runtime-live.test.mjs:21](../../../tests/unit/latex-runtime-live.test.mjs#L21) | PI_LATEX_LIVE ≠ 1 | \ref 标签未定义导致非收敛（非 citation key） |
| 13 | isolated compiler: shell-blocked | [latex-runtime-live.test.mjs:22](../../../tests/unit/latex-runtime-live.test.mjs#L22) | PI_LATEX_LIVE ≠ 1 | 编译器 shell escape 隔离 |
| 14 | isolated compiler: lua-blocked | [latex-runtime-live.test.mjs:23](../../../tests/unit/latex-runtime-live.test.mjs#L23) | PI_LATEX_LIVE ≠ 1 | Lua 原生能力隔离 |
| 15 | isolated compiler: forged-result | [latex-runtime-live.test.mjs:24](../../../tests/unit/latex-runtime-live.test.mjs#L24) | PI_LATEX_LIVE ≠ 1 | TeX 不能伪造宿主编译结果 |
| 16 | isolated compiler: lua-forged-host-result | [latex-runtime-live.test.mjs:25](../../../tests/unit/latex-runtime-live.test.mjs#L25) | PI_LATEX_LIVE ≠ 1 | Lua 不能伪造宿主结果 |
| 17 | isolated compiler: pdf-before-error | [latex-runtime-live.test.mjs:26](../../../tests/unit/latex-runtime-live.test.mjs#L26) | PI_LATEX_LIVE ≠ 1 | 产生 PDF 后报错仍失败 |
| 18 | isolated compiler: absolute-write-blocked | [latex-runtime-live.test.mjs:27](../../../tests/unit/latex-runtime-live.test.mjs#L27) | PI_LATEX_LIVE ≠ 1 | 阻止绝对路径写入 |
| 19 | isolated compiler: biber-remote-blocked | [latex-runtime-live.test.mjs:28](../../../tests/unit/latex-runtime-live.test.mjs#L28) | PI_LATEX_LIVE ≠ 1 | 阻止 Biber 远程书目读取 |
| 20 | isolated compiler: biber-nonutf8-control | [latex-runtime-live.test.mjs:29](../../../tests/unit/latex-runtime-live.test.mjs#L29) | PI_LATEX_LIVE ≠ 1 | 拒绝 Biber 非 UTF-8 控制文件 |
| 21 | isolated compiler: timeout | [latex-runtime-live.test.mjs:30](../../../tests/unit/latex-runtime-live.test.mjs#L30) | PI_LATEX_LIVE ≠ 1 | 编译超时 |
| 22 | optional real Docker preserves ordinary and executable source modes | [sandbox-runtime.test.mjs:56](../../../tests/unit/sandbox-runtime.test.mjs#L56) | PI_TEST_DOCKER_MODES ≠ 1 | 容器内保留普通与可执行文件模式 |
| 23 | POSIX source modes reflect actual exec bits and writes retain exact normal permission bits | [source-modes.test.mjs:67](../../../tests/unit/source-modes.test.mjs#L67) | Windows 平台排除 | POSIX 可执行位与写入保留权限 |
| 24 | privileged creation uses no-follow directory fds, never replaces files, and never repairs existing permissions | [ssh-onboarding-bootstrap.test.mjs:60](../../../tests/unit/ssh-onboarding-bootstrap.test.mjs#L60) | Windows 平台排除 | SSH 安装器的 POSIX dir_fd/属主/权限规则 |
| 25 | SSH start keeps nested source directories traversable under umask 077 | [ssh-protocol.test.mjs:115](../../../tests/unit/ssh-protocol.test.mjs#L115) | Windows 平台排除 | SSH 启动时 umask 077 下嵌套目录可遍历 |

## 对验收的影响

- **19 项编译测试不覆盖新增引用检查入口。** `citationCheck → checkCitations → Artifact` 读取固定字节并保存报告，不进入编译提交/容器。BibTeX 与 Biber 两例测排版后端；`undefined-reference` 用的是 `\ref{missing}`，测交叉标签非收敛，并非未定义 citation key。完整编译器执行、隔离与排版不是本批承诺。
- **2 项真实 Docker 测试属于底层执行器覆盖。** formal supervisor 夹具使用自己的 `controls.finalize`，不走本批变更的 `RunService.finalize / collectRunArtifacts`；因此即使启用也不能替代方法合同/归档验收。实际改动已在原全量的方法合同、封闭输出、正式归档/重开测试和原正式 Run 证据中覆盖。模式保留例只测容器内 0644/0755，与本批方法和引用规则无新交点。
- **4 项 POSIX 测试保留为平台覆盖缺口。** 备份大小写、执行位、SSH dir_fd 与 umask 规则均未改，当前验收也没有新增 Linux 兼容性承诺。不会通过伪装 process.platform 或修改 skip 条件把它们变成通过。

从适配前评估提交 `5aeabd2ef1da31ef133e9f6324d82d5236ea9eca` 到当前，7 份跳过测试文件及所列编译、Docker、备份、文件模式和 SSH 实现字节/提交对象未变。科学批次确实修改了运行服务与归档逻辑，因此另行核对其直接测试与调用链，没有仅以“底层没改”代替判断。

## 本次实际检查与补跑决定

主代理执行只读日志、摘要与源码一致性核对：两份原日志各恰好 25 项；207 个引用交付代码/生成文件与已验收清单一致；7 份科学测试文件未变，其中 105 个静态具名测试在原引用全量日志中均为实际通过。此数字仅是回查到的测试条目数，不是新增执行次数，也不与重叠套件相加。

修后引用专项 44/44、独立反例 24/24、干净构建 709 个产物一致以及真实 Pi 保存/重开证据继续适用，原日志摘要已重核。科学方法的原生 disputed、修订报告独立采纳及辅助流程限制照原记录保留。**未发现需补跑的直接缺口，故没有重新启用这 25 项，也没有重复全量、构建、模型或服务。** 若后续改动编译器、执行器或增加 Linux 支持承诺，再以相应明确范围验证，不扩成本批。

独立判断与记录复核请求 `gpt-6.1-sol / high`，接口未回显实际配置；不得称运行时已核验。本批仅增加本说明和机器清单，五个原有在途文件字节保持，其他候选及前端布局继续暂缓。

未验证的仍是上述 25 项真实执行/平台分支；本结论不扩展为全部编译器或跨平台功能已通过。
