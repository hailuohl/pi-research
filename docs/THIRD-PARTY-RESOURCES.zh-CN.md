# 研舟π 开源及第三方资源使用清单

基线：当前工作副本，提交 `f458634`，包版本 `0.3.2-experimental`。撰写日期：2026-10-27。

本清单按"是否随产物分发、如何获得许可"分类列出本项目使用的全部开源及第三方资源，与 [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md)（分发用声明）互补：该文件面向随包发布的许可声明，本清单面向工程盘点，覆盖开发工具链与按需构建的隔离镜像。版本与哈希以 [package-lock.json](../package-lock.json)、[source-manifest.json](../third_party/openresearch/source-manifest.json)、`requirements.lock` 与 `debian-packages.lock.json` 为准。

## 0. 项目自身

| 项 | 值 |
|---|---|
| 名称 | 研舟π / `pi-research`（private） |
| 许可 | MIT，全文见 [LICENSE](../LICENSE) |
| 声明 | 第三方软件保留其自身许可，见 [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md) |

## 1. 随发行产物分发的第三方组件

打进 `dist/`、随包交付给最终运行环境的组件仅此一组：

| 组件 | 版本 | 许可证 | 版权方 | 用途与位置 |
|---|---|---|---|---|
| React | 19.3.0 | MIT | Meta Platforms, Inc. and affiliates | 工作台前端，esbuild 打包进 `dist/web/assets/main.js` |
| ReactDOM | 19.3.0 | MIT | Meta Platforms, Inc. and affiliates | 同上 |
| scheduler（React 锁定传递依赖） | 0.28.0 | MIT | Meta Platforms, Inc. and affiliates | 随 React bundle 一并打包 |

- React/ReactDOM MIT 全文随包提供：`dist/web/LICENSE.react.txt`；运行时无 CDN、无外部字体依赖。
- 历史参考基线 `apps/web/public/vendor/`（React 16.0.0 / ReactDOM 16.0.1，Facebook, Inc.，MIT；bundle 内含 Modernizr 3.0.0pre 标识）**不进入 dist**，仅作字节固定的对照输入保留。

## 2. package.json 直接声明的 npm 依赖

### 2.1 运行时依赖（dependencies）

| 包 | 版本 | 许可证（已从本机安装元数据核实） | 用途 | 随 dist 分发？ |
|---|---|---|---|---|
| react / react-dom | 19.3.0 | MIT | 前端 UI（见第 1 节） | 是（打包进 main.js） |
| pinyin-pro | 3.29.4 | MIT | 中文项目名转拼音 slug，用于 GitHub 源码同步仓库名（`packages/workspace/github-upload.ts`） | 否（服务端 require） |
| marked | 18.0.11 | MIT | Markdown 渲染库；**当前源码树未检索到直接引用**，属保留声明，如清理需单独批次 | 否 |

### 2.2 开发依赖（devDependencies，不随 dist 分发）

| 包 | 版本 | 许可证（已核实） | 用途 |
|---|---|---|---|
| @earendil-works/pi-ai | 1.2.0 | MIT | Pi 模型运行时 SDK |
| @earendil-works/pi-coding-agent | 1.2.0 | MIT | Pi Agent/会话/技能 SDK |
| typescript | 5.8.3 | Apache-2.0 | 类型检查与构建 |
| esbuild | 0.28.2 | MIT | 前端与工具打包 |
| @types/node | 24.0.4 | MIT | Node 类型声明 |
| @types/react / @types/react-dom | 19.3.0 | MIT | React 类型声明（仅开发） |

`overrides` 另行锁定五个 Pi 子包 `@earendil-works/pi-agent-core`、`pi-codemode`、`pi-mcp`、`pi-telemetry`、`pi-tui` 至 1.2.0（均 MIT，已核实）。

## 3. Pi SDK 及传递依赖（153 项锁定包）

`npm run setup:pi` 依据根目录已提交的 `package-lock.json`（lockfileVersion 3，共 153 个包条目）执行 `npm ci`，固定 SDK 与构建工具一并安装；`.pi-runtime/` 仅作兼容回退。Pi 包不随 dist 分发，安装后保留各包自带的上游声明。

| 组 | 代表包（版本） | 许可证（代表包已核实） | 说明 |
|---|---|---|---|
| Pi SDK 本体 | `@earendil-works/pi-ai`、`pi-coding-agent`、`pi-agent-core`、`pi-codemode`、`pi-mcp`、`pi-telemetry`、`pi-tui`（均 1.2.0） | MIT | Agent 执行内核；适配层在 `packages/pi-adapter` |
| 供应商 SDK（Pi 依赖） | `openai` 7.19.0、`@anthropic-ai/sdk` 0.129.0、`@google/genai` 2.21.0、`@aws-sdk/client-bedrock-runtime` 3.1127.0 及 `@aws-sdk/*`、`@smithy/*` 系列 | openai/`@google/genai`/AWS：Apache-2.0；`@anthropic-ai/sdk`：MIT | 供 Pi 调用各模型供应商；本项目实测使用智谱（经 SDK 供应商机制） |
| Google 认证链 | `google-auth-library` 10.9.1、`gaxios`、`gcp-metadata`、`node-fetch` 3.3.2 等 | 以各包声明为准 | `@google/genai` 的传递依赖 |
| esbuild 平台二进制 | `@esbuild/<platform>` 0.28.2（25 个平台包） | MIT | 构建期下载对应平台二进制 |
| Pi 内嵌工具依赖 | `chalk` 6.0.0、`grok-mermaid` 0.2.3、`highlight.js` 10.7.3、`minimatch` 10.2.6、`semver` 7.8.5、`yaml` 2.9.0、`undici` 8.10.2、`ws` 8.22.0、`protobufjs` 7.6.6、`diff` 8.0.4、`jiti` 2.7.0、`quickjs-wasi` 3.6.2、`@silvia-odwyer/photon-node` 0.3.4、`proper-lockfile`、`hosted-git-info`、`signal-exit`、`lru-cache`、`typebox` 1.3.27 等 | undici/ws：MIT（已核实）；其余以各包声明为准 | Pi coding-agent 的嵌套依赖 |

> 逐包版本、解析 URL 与完整性哈希以 `package-lock.json` 为准；本表不逐项复制。

## 4. 源码级适配的开源项目

| 项目 | 上游 | 许可证 | 适配内容与位置 |
|---|---|---|---|
| OpenResearch | `alphaXiv/OpenResearch`，commit `3037f727e80e0ab20c61a87c613a50dde009a835`，2026 | MIT（全文 `third_party/openresearch/LICENSE`） | ① 13 个技能模块（12 主题＋总览）适配为 `skills/piresearch/pi-research-*`；② 2 份计算参考（local/ssh）与 6 份图表参考、2 份图表资产（`orx_figstyle.py`→`pi_figstyle.py`、`orx-tikz-preamble.tex`→`pi-tikz-preamble.tex`）；③ `packages/connectors` 从 Rust `src/client.rs`（blob `f2c3e9db…`）移植文献协议为 TypeScript，另加独立校验、取消、设置与有界请求。逐文件 blob/sha256 清单见 `third_party/openresearch/source-manifest.json`。不含 ORX 应用运行时、托管账号或遥测 |
| PaperQA | `Future-House/paperqa`，commit `57e89f7223b0960d5ee5ea048c69e3c47e088572`，2024 | Apache-2.0（`third-party/paperqa/LICENSE`，附修改声明） | 仅 `VectorStore.max_marginal_relevance_search` 的选择段（原 `llms.py` 133–157 行）窄适配为 `packages/text-evidence/mmr.ts`（稀疏归一化局部向量、显式参数校验、有界候选、确定性平局处理）。不打包 NumPy、向量库、Agent、embedding 或任何 LDP 代码；不含其科学基准结论。声明见 `third-party/paperqa/NOTICE.md` |
| React（历史基线） | facebook/react 16.0.0 / 16.0.1 | MIT | 仅作字节固定参考输入，见第 1 节 |

## 5. 按需构建的隔离镜像内固定组件（不提交仓库）

以下组件只在用户显式执行 setup 脚本时按固定哈希下载构建，wheel/镜像不入库：

### 5.1 PDF 解析镜像（`scripts/pdf-parser`，profile `pdfium-text-form-images-v3`）

| 组件 | 版本 | 许可证 | 说明 |
|---|---|---|---|
| pypdfium2 | 5.13.0 | BSD-3-Clause / Apache-2.0（含捆绑 PDFium 及其构建许可，随 wheel 的 LICENSES/BUILD_LICENSES 保留在镜像内） | PDF 文本提取（`get_text_bounded` 全 Unicode）、有界页图渲染；构建时校验 PDFium 无 V8/XFA 特性 |
| Pillow | 11.3.0 | MIT-CMU | PNG 页图与图像区域处理 |
| Python 基础镜像 | digest 固定 | 上游声明保留 | 与文稿编译镜像共用同一 digest |

wheel URL 与 SHA-256 固定于 `scripts/pdf-parser/requirements.lock`；构建断网，产物 digest 记录在 `.validation/parser-builds/latest.json`。

### 5.2 文稿编译镜像（`scripts/document-build`，profile `latex-document-v1`）

Debian trixie / security 快照冻结于 `20260918T000000Z`，共 **257 个包**（约 346.6 MB 下载、936 MB 安装），逐包版本/大小/URL/SHA-256 固定于 `scripts/document-build/debian-packages.lock.json`：

| 组件族 | 许可证要点 | 用途 |
|---|---|---|
| TeX Live（pdflatex / xelatex / lualatex） | 各自上游许可（LPPL 等），Debian copyright 文件保留在镜像 `/usr/share/doc/*/copyright` | 三引擎文稿编译 |
| BibTeX / Biber | 同上 | 参考文献处理（bibtex/biber/auto/none） |
| Poppler | GPL 系（随 Debian 包声明） | PDF 页图与校验工具 |
| Latin Modern 字体 | GUST 字体许可 | 西文衬线模板字体 |
| Noto CJK 字体 | SIL OFL 1.1 | 中文排版（XeLaTeX 已实测；LuaLaTeX 大字体在 768 MiB 预算下如实失败） |

安装使用 `--network none` + `apt-get --no-download`；运行任务不再联网装包。二进制与镜像不提交。

## 6. 外部服务与在线接口（需网络/凭据，按需启用）

| 服务 | 用途 | 接入方式与状态 |
|---|---|---|
| 智谱等模型供应商 | 真实模型调用 | 经 Pi SDK 供应商机制；`PI_PROVIDER`/`PI_MODEL`/`PI_API_KEY` 本地配置。实测记录见各 acceptance 目录；无 SDK 时不返回模拟回答 |
| Crossref | 文献元数据（DOI/关键词） | `packages/connectors`；**默认开启**，保留原默认 |
| PubMed / PMC（NCBI） | 摘要与 OA 原文 | 默认关；可选 `NCBI_API_KEY`、`NCBI_EMAIL`；摘要/续页/PMC 原文已有验收 |
| OpenAlex | 元数据/摘要 | 默认关；可选 `OPENALEX_API_KEY`；原件获取曾因缺凭据受限 |
| alphaXiv | 关键词/语义候选与提取文本 | 默认关 |
| bioRxiv | 候选/摘要/原 PDF | 默认关；原 PDF 曾遇 429 限流，待验 |

凭据仅控制服务使用，不转发给 Pi Worker；已配置密钥不等于来源已启用。文献密钥只存本机（`.env` 或环境页私密配置）。

## 7. 平台与工具链（用户环境自备，不分发）

| 工具 | 版本/要求 | 用途 |
|---|---|---|
| Node.js | ≥22.19.0（开发固定 24.18.0，`.nvmrc`/`.node-version`） | 运行时 |
| npm | 11.17.0（`packageManager`） | 依赖安装（`npm ci`） |
| Docker | Linux/amd64 上下文 | PDF 解析、文稿编译与正式 Run 沙箱 |
| Git | 常规版本 | 项目工作区、实验历史与源码同步 |
| 原生 `tar` | 系统自带 | 报告/成果包 `tar.gz` 导出（导出要求原生 tar） |
| Windows PowerShell | — | `start.ps1`、`local-windows-runner.ps1` |

## 8. 许可合规要点

1. **随包声明**：`dist/web/LICENSE.react.txt`（React/ReactDOM MIT）是唯一随运行产物分发的第三方许可全文；THIRD_PARTY_NOTICES.md 同步说明来源与边界。
2. **不随包分发的依赖**：npm 开发依赖、Pi SDK 及其传递依赖不进入 dist；安装后保留各包上游声明，其完整清单以根目录 `package-lock.json` 为准。
3. **源码适配**：OpenResearch（MIT）与 PaperQA（Apache-2.0）的许可/声明文件保留在 `third_party/openresearch/`、`third-party/paperqa/`，逐文件来源以 blob/sha256 记录，适配范围明确窄于上游项目，不宣称上游背书或行为对等。
4. **镜像内组件**：pypdfium2（含 PDFium 构建许可）、Pillow、Debian 257 包的许可声明按 setup 脚本保留在镜像内（`/usr/share/doc/*/copyright` 等），哈希锁定可复现。
5. **科研成果中的第三方内容**：下载的文献保留其自身许可，获取记录不授予再分发权利；成果包导出时保留文献原 PDF、引用页、解析与许可记录，**许可未知不会被改写为已获再分发许可**；来源失效后阻止新导出，历史字节保留。
6. **测试素材**：验收用 PDF/文稿素材为自绘字形与位图或标注为软件测试材料，不使用第三方论文页面冒充。
7. **排除项**：不包含 ORX 运行时、密钥、`.env`、认证文件、运行数据库、原生会话 JSONL 与大份原始日志。
