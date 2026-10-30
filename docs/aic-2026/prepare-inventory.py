"""Build a source-linked resource inventory without inspecting user secrets or data."""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def supplement(name, version, category, source, license_, use, obligations, boundary, status, evidence):
    return dict(name=name, version=version, type=category, source=source, license=license_, use=use,
                obligations=obligations, originalBoundary=boundary, compliance=status,
                evidence=[dict(file=f, line=n) for f, n in evidence])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit", type=Path, required=True)
    args = parser.parse_args()
    audit = read(args.audit)
    pkg = read(ROOT / "package.json")
    lock = read(ROOT / "package-lock.json")
    deb = read(ROOT / "scripts/document-build/debian-packages.lock.json")
    direct = {**pkg["dependencies"], **pkg["devDependencies"]}
    # A local-only historical paper is not used to prepare this report and is not a current resource.
    resources = [x for x in audit["resources"] if x["type"] != "historical-research-document"]
    service_uses = {
        "Crossref": "默认启用的关键词/DOI元数据检索与读取；不将元数据当作已取得论文全文或再分发许可。",
        "alphaXiv + arXiv PDF route": "按项目开关启用关键词/语义检索、供方文本及显式arXiv版本的原PDF获取；PDF解析另行批准，默认关闭。",
        "OpenAlex": "按需论文检索、元数据及摘要读取；显式原PDF入口与密钥/可获取记录有关。当前默认关闭，实际原件可用性单独验证。",
        "bioRxiv": "按需借OpenAlex检索并读取bioRxiv元数据/摘要，获取显式版本的原PDF；默认关闭，网络与原件可用性按记录单列。",
        "PubMed + PMC E-Utilities": "按需ESearch/EFetch摘要及PMC开放获取全文/表格文本；遵守授权范围与逐篇许可，当前默认关闭。"
    }
    # Keep report wording accurate: this report cites Group II results, not a fresh 44-point calculation.
    for r in resources:
        if r["name"] in service_uses:
            r["use"] = service_uses[r["name"]]
        if r["name"].startswith("Anscombe"):
            r["use"] = "本报告引用第2组11点的既有评估及软件验收截图；不重算44点、不转载原论文图页或全文。R数据副本另保留历史来源。"
        if r["name"] == "marked":
            r["compliance"] = "待补齐：安装包有完整LICENSE，但当前网页分发未显式保留Marked及Markdown完整告知。"
        if r["name"] == "Literature source logos":
            r["compliance"] = "部分核验：已保留OpenResearch来源与许可；原站logo版权/商标使用范围未单独核验，不作为团队原创素材。"
        if r["name"] == "Python Docker base":
            r["source"] = "https://hub.docker.com/_/python"
    resources.extend([
        supplement("Node.js及其内置SQLite", "24.18.0", "runtime-tool", "https://github.com/nodejs/node/blob/v24.18.0/LICENSE", "Node.js MIT；内含组件各自许可，SQLite为public domain",
                   "本项目TS/JS服务、Worker、CLI及node:sqlite运行底座；当前验证实际版本24.18.0。", "如随包分发Node二进制，保留其完整LICENSE及嵌入第三方告知。", "运行时和数据库引擎非原创；业务实体、事件、回执与迁移逻辑由本项目实现。", "固定版本与当前执行版本已核对；未逐项审计Node内含组件。", [(".node-version", 1), ("packages/storage/store.ts", 3)]),
        supplement("npm CLI及Registry", "声明npm@11.17.0；本次实际11.16.0", "development-tool", "https://github.com/npm/cli/blob/v11.16.0/LICENSE", "npm CLI Artistic-2.0；Registry适用服务条款；各包分别许可",
                   "按package-lock.json安装开发及Pi依赖；本次清洁构建使用实际11.16.0。", "CLI再分发保留其许可和内含告知；下载的包分别履行许可，Registry访问遵守条款。", "包管理工具非原创；锁定安装及构建核验流程由项目脚本实现。", "记录声明/实际版本差异，不冒称严格匹配；锁定安装结果见verification.json。", [("package.json", 10), ("scripts/setup-pi.mjs", 1)]),
        supplement("Git", "本次2.54.0.windows.1；产品不固定系统Git", "optional-host-tool", "https://github.com/git/git/blob/v2.54.0/COPYING", "GPL-2.0；二进制组件另有告知",
                   "受管源码仓库、worktree、差异、历史和本次代码交付；调用用户已有Git。", "工具作为外部进程调用；如另行分发Git二进制，按其GPL及组件许可提供对应内容。", "Git不是本项目实现；源码绑定、批准整合与回执适配为本项目。", "本次版本已读；不随本批材料复制Git安装包。", [("packages/workspace/git-command.ts", 1)]),
        supplement("Docker Engine与Docker Desktop", "用户配置目标；本次PATH未找到docker", "optional-host-tool", "https://docs.docker.com/subscription-billing/desktop-license/", "Engine主要Apache-2.0及组件许可；Desktop适用Docker订阅协议",
                   "按需运行开发测试、正式Run、PDF解析和文稿编译；历史设备记录另述。", "区分Engine与Desktop，按实际目标核对版本、组件及订阅授权；不将整套Desktop标为开源MIT。", "容器引擎非原创；冻结清单、隔离调用、监管与归档由项目实现。", "当前代码有适配；本轮没有Docker可用性或订阅状态实测，不冒称就绪。", [("packages/runners/docker.ts", 1), ("scripts/pdf-parser/Dockerfile", 1)]),
        supplement("OpenSSH及SSH/SCP工具", "本次OpenSSH_for_Windows_8.1p1、LibreSSL 3.0.2；远端不固定", "optional-host-tool", "https://github.com/openssh/openssh-portable/blob/master/LICENCE", "BSD/ISC等宽松许可与组件告知",
                   "用户配置SSH目标和严格主机密钥校验；远端通过固定helper调用Linux Docker。", "保留实际OpenSSH/LibreSSL组件告知；远端程序、账号和数据需合法授权。", "SSH协议和客户端非原创；目标预检、固定运行与恢复协议由项目实现。", "本地版本只读核对；外部授权服务器未在本轮执行。", [("packages/runners/ssh.ts", 1), ("scripts/ssh-runner.py", 1)]),
        supplement("GitHub与GitHub CLI", "gh本次2.97.0；GitHub为在线服务", "optional-host-service", "https://github.com/cli/cli/blob/v2.97.0/LICENSE ; https://docs.github.com/en/site-policy/github-terms/github-terms-of-service", "gh MIT及其组件许可；GitHub服务条款",
                   "项目可选私密仓库配置和已提交代码同步；本次由主代理交付文档，不把该推送当成产品发布功能live验收。", "遵守账号、内容与访问条款；保留CLI许可；保证提交内容有权提供且评审期间可访问。", "托管及CLI非原创；仓库状态、受限同步和回执恢复适配由项目实现。", "CLI核实仓库private；评审账号访问尚未验证，产品远端写入仍不能由本次人工推送代替验收。", [("packages/workspace/github-command.ts", 1), ("packages/connectors/catalog.ts", 12)]),
        supplement("NVIDIA驱动与CUDA Driver接口", "按用户目标；本轮不读取驱动版本", "optional-device-runtime", "https://docs.nvidia.com/cuda/eula/index.html", "NVIDIA适用的专有软件许可与驱动条款；不标开源",
                   "可选NVIDIA UUID预留、容器可见性及可信本地GPU运行；向量加法历史验收调用Driver接口。", "按目标驱动和实际分发组件核对授权；本项目不分发驱动、CUDA SDK或模型权重。", "驱动与GPU非原创；固定设备声明、并发预留、预检和监管接线为项目实现。", "已有指定硬件历史证据；本次未核验驱动就绪、训练框架或任意外部目标。", [("packages/runners/gpu.ts", 1), ("scripts/nvidia-vector-add.py", 1)]),
        supplement("项目开发中的AI辅助工具与模型", "Codex、ZCode（工具版本未细分）；GPT-6、GLM-5.3、DeepSeek系列（子型号未细分）", "development-ai-tools", "团队项目开发使用说明（2026-10-30补充）", "适用各工具和模型服务条款；不包含模型权重再分发授权",
                   "项目开发过程中适当使用Codex、ZCode，以及GPT-6、GLM-5.3和DeepSeek系列模型，辅助方案讨论、代码编写、问题定位和测试改进。", "遵守相应工具和模型服务条款；对采用的生成内容进行审核、修改与验证，并核查引用来源与权利。", "辅助工具与模型为第三方资源；项目需求、架构设计、功能整合及结果验收由团队负责。", "使用情况依据团队说明记录；开发辅助用途与应用运行时模型配置、历史实验模型分别列示。", [])
    ])

    rows = []
    for path, info in lock["packages"].items():
        if not path:
            continue
        name = path.rsplit("node_modules/", 1)[1]
        install_path = ROOT / path
        metadata = read(install_path / "package.json") if (install_path / "package.json").is_file() else {}
        license_files = sorted(p.name for p in install_path.glob("*") if p.is_file() and p.name.lower().startswith(("license", "licence", "notice", "copying"))) if install_path.is_dir() else []
        kind = "直接运行" if name in pkg["dependencies"] else "直接开发" if name in pkg["devDependencies"] else "传递依赖"
        if name in ("@earendil-works/pi-ai", "@earendil-works/pi-coding-agent"):
            kind = "声明开发/运行调用"
        rows.append(dict(path=path, name=name, version=info["version"], license=info.get("license", "未标注"),
                         kind=kind, dev=info.get("dev", False), optional=info.get("optional", False),
                         os=info.get("os", []), cpu=info.get("cpu", []), source=info.get("resolved", ""), integrity=info.get("integrity", ""),
                         installed=bool(metadata), installedVersion=metadata.get("version"), licenseFiles=license_files,
                         use="上游锁定依赖；存在或安装不证明所有代码路径执行/服务启用",
                         originalBoundary="上游组件未作本项目原创声明",
                         obligations="按下方许可证义务索引及包内完整LICENSE/NOTICE履行；锁字段非完整二进制告知审计",
                         compliance="已核对锁元数据" + ("及安装版本" if metadata else "；本机未安装/目标可选")))
    rows.sort(key=lambda x: (x["name"].casefold(), x["path"]))
    deb_rows = []
    for item in deb["packages"]:
        deb_rows.append({**item, "type": "可选文稿编译器锁定组件", "license": "逐包组合许可待核验；见对应/usr/share/doc/<package>/copyright",
                         "use": "编译器配置的root包或必需传递依赖；不代表当前主机已安装",
                         "originalBoundary": "上游未修改组件", "obligations": "按实际版权文件保留告知并履行适用源码/再分发义务",
                         "compliance": "版本/URL/大小/SHA-256已锁定；逐包许可与源码渠道待核验"})
    inventory = dict(formatVersion=1, date="2026-10-30", baselineCommit=audit["baselineCommit"], packageVersion=pkg["version"],
                     note="现用资源主表与按需/报告数据分开；完整锁清单包含平台条件候选，不等于当前使用清单。已停用库不列现用。",
                     resources=resources, npmLocked=rows, optionalCompilerLocked=deb_rows,
                     summary={"resourceEntries": len(resources), "npmDirect": len(direct), "npmLockedPaths": len(rows),
                              "npmInstalledPaths": sum(x["installed"] for x in rows), "npmLicenseMetadata": dict(Counter(x["license"] for x in rows)),
                              "compilerLockedPackages": len(deb_rows)},
                     sourceFiles={p: sha(ROOT/p) for p in ["package.json", "package-lock.json", "scripts/pdf-parser/requirements.lock", "scripts/document-build/debian-packages.lock.json", "packages/skills/manifest.ts"]},
                     findings=audit["findings"], officialChecks=audit["officialChecks"])
    (OUT / "resource-inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(inventory["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
