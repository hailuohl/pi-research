export declare const BUNDLE_ID = "b149e69295f55d092fc7357b2d1134eefdd57bf7e78624ab6a2bc3bf62f17dd9";
export declare const SKILL_MANIFEST: readonly [{
    readonly id: "pi-research-overview";
    readonly name: "pi-research-overview";
    readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
    readonly digest: "c258c8cdfe4cfc1e981cc427526d04e43ac6ae5913281b31a7faf02ac474bd01";
    readonly resources: readonly [];
}, {
    readonly id: "pi-research-create";
    readonly name: "pi-research-create";
    readonly description: "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.";
    readonly roles: readonly ["coordinator", "designer"];
    readonly path: "skills/piresearch/pi-research-create/SKILL.md";
    readonly digest: "ca8056612541253b2412c2e76dc7badff5c3edfe618f99476ba6ca02a13a9e1a";
    readonly resources: readonly [];
}, {
    readonly id: "pi-research-experiment-tree";
    readonly name: "pi-research-experiment-tree";
    readonly description: "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。";
    readonly roles: readonly ["coordinator", "designer", "analyst", "reviewer"];
    readonly path: "skills/piresearch/pi-research-experiment-tree/SKILL.md";
    readonly digest: "c464da679b1a9d713d14edca412569b32a805eaf317386a28ec0309e75751fcc";
    readonly resources: readonly [{
        readonly path: "references/experimental-design.md";
        readonly digest: "a0aecd732223d685039031147821b11074b0306cbd960a4e2ac83dc6cd1cbb72";
        readonly methodRequirements: readonly ["quantitative-decision"];
    }, {
        readonly path: "references/statistical-power.md";
        readonly digest: "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e";
    }, {
        readonly path: "references/hypothesis-generation.md";
        readonly digest: "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400";
    }];
    readonly prerequisites: readonly [{
        readonly skillId: "pi-research-evidence";
        readonly resource: "references/scientific-critical-thinking.md";
    }];
}, {
    readonly id: "pi-research-git";
    readonly name: "pi-research-git";
    readonly description: "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.";
    readonly roles: readonly ["coordinator", "implementer", "reviewer", "designer"];
    readonly path: "skills/piresearch/pi-research-git/SKILL.md";
    readonly digest: "79ca9601b33bd84495ec0a435246da0c413433f37f18c67bc07808543576415c";
    readonly resources: readonly [];
}, {
    readonly id: "pi-research-code-debugging";
    readonly name: "pi-research-code-debugging";
    readonly description: "Use when debugging research code, failed development checks, incorrect metrics or artifacts, or adding a regression test before a code fix; reviewers inspect fixed evidence read-only.";
    readonly roles: readonly ["coordinator", "implementer", "reviewer"];
    readonly path: "skills/piresearch/pi-research-code-debugging/SKILL.md";
    readonly digest: "0eb7d284d57863041df3c8be2a8fdf3ee22013cf6144fe187f708ae06994d68f";
    readonly resources: readonly [];
    readonly source: {
        readonly repository: "hailuohl/pi-research";
        readonly commit: "c087e1b64ad0c8e205d5178602fadfe46b06aab4";
        readonly path: "skills/piresearch/pi-research-git/SKILL.md";
        readonly blob: "88551aa3d83bb3a828599b4fd6bf43e7ccfb366c";
    };
}, {
    readonly id: "pi-research-agent-delegation";
    readonly name: "pi-research-agent-delegation";
    readonly description: "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.";
    readonly roles: readonly ["coordinator"];
    readonly path: "skills/piresearch/pi-research-agent-delegation/SKILL.md";
    readonly digest: "2e918ee51312baa17fc672df786896752d2acc169c3768738228742bfab87a12";
    readonly resources: readonly [];
}, {
    readonly id: "pi-research-compute";
    readonly name: "pi-research-compute";
    readonly description: "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.";
    readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
    readonly path: "skills/piresearch/pi-research-compute/SKILL.md";
    readonly digest: "3b817fe1b15da215e8bb3d442ecec2d9bf94da14c830c0cb9728e5b1b27e5b4b";
    readonly resources: readonly [{
        readonly path: "references/local.md";
        readonly digest: "13b382f9587d6a19c395306d4d27852b6d3cf64444bed4c040a56736547decb0";
    }, {
        readonly path: "references/docker.md";
        readonly digest: "15add7a0df0319f2e6b691f37320b805998e534713b4744d3766932fedf62a63";
    }, {
        readonly path: "references/ssh.md";
        readonly digest: "dfbe05feee83b863e22ceebd20e43ba67cd91432cb774ef206ff83bff8e3ef5f";
    }];
}, {
    readonly id: "pi-research-evidence";
    readonly name: "pi-research-evidence";
    readonly description: "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
    readonly digest: "e227f7a5d272fe4143e6e9c97e198adbfae31862037c7d648e69c88d37d442e0";
    readonly resources: readonly [{
        readonly path: "references/exploratory-data-analysis.md";
        readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
    }, {
        readonly path: "references/statistical-analysis.md";
        readonly digest: "cd8480e795a4b1c0d3fd711ccc93546eb8c2d2afd4382d6fc58fc78e8c988a85";
        readonly methodRequirements: readonly ["quantitative-decision"];
    }, {
        readonly path: "references/paired-polynomial-comparison.md";
        readonly digest: "1eba414b008acfcbbed5f696e2d057370cafe298c341d06f8610b6a594104b16";
        readonly methodRequirements: readonly ["structured-paired-protocol", "closed-paired-evidence"];
    }, {
        readonly path: "references/uncertainty-and-units.md";
        readonly digest: "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4";
    }, {
        readonly path: "references/scientific-critical-thinking.md";
        readonly digest: "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c";
    }, {
        readonly path: "references/regression-libraries.md";
        readonly digest: "ccf33cd49371b209bb5d6f20a79ad1a4bd4b2c6f2fdd3ac4ab5af6a3c7a62935";
    }];
}, {
    readonly id: "pi-research-reports";
    readonly name: "pi-research-reports";
    readonly description: "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
    readonly digest: "cb2a2d3600d6b946dd67138bff9905db054ec194708318aff64319ff46cbf490";
    readonly resources: readonly [{
        readonly path: "references/fixed-report.md";
        readonly digest: "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc";
    }];
    readonly prerequisites: readonly [{
        readonly skillId: "pi-research-evidence";
        readonly resource: "references/exploratory-data-analysis.md";
    }, {
        readonly skillId: "pi-research-evidence";
        readonly resource: "references/scientific-critical-thinking.md";
    }];
}, {
    readonly id: "pi-research-figures";
    readonly name: "pi-research-figures";
    readonly description: "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。";
    readonly roles: readonly ["coordinator", "analyst", "writer", "reviewer"];
    readonly path: "skills/piresearch/pi-research-figures/SKILL.md";
    readonly digest: "863212e49d5582b036f069fa650ce030b58f35bbe9631761507dce1d2898051d";
    readonly resources: readonly [{
        readonly path: "references/curves.md";
        readonly digest: "86091d2aa550cc126bc11e683d6503a3c1c7ec0b0475255bffe133a36122a149";
    }, {
        readonly path: "references/scaling.md";
        readonly digest: "25dd8eaabae924321303aff9fc12e5cbce71ba8aec46920a0e120c8e9a9dede5";
    }, {
        readonly path: "references/comparison.md";
        readonly digest: "dc229f00b306740913c2a04c226f27c7e12652a88e4703b383bf717aa064fc72";
    }, {
        readonly path: "references/pareto.md";
        readonly digest: "eb862fa373979ac40592a8bd06ad4f477d040abc8fb51577a9b07042649c16e6";
    }, {
        readonly path: "references/matrix.md";
        readonly digest: "2d9561a3923a37677b166f58ff5a781484135a2fd92b21c06dfda0dec954e54c";
    }, {
        readonly path: "references/diagram.md";
        readonly digest: "d1ed17f82fefd65393327e14dbbe1a14f56e8c60451f4682b26227aff50843fd";
    }, {
        readonly path: "assets/pi_figstyle.py";
        readonly digest: "bd62647c00efa071f83aa37ffd6a1719ffb72edc213ceb20eb1157ae51275138";
    }, {
        readonly path: "assets/pi-tikz-preamble.tex";
        readonly digest: "cadecada94210943f8843b87d29ac6e5756bccc0d9c6d1c81e128d9f88226d6b";
    }, {
        readonly path: "examples/README.md";
        readonly digest: "7ed06479ccaeeec323d45f0994785479a28326f1a1a36dbfe57ffe8efb956efb";
    }, {
        readonly path: "examples/loss_curve.py";
        readonly digest: "888a8843fc1636bcf825453f29da8624329770b7c09db8056bd0f3822832a1a3";
    }, {
        readonly path: "examples/scaling.py";
        readonly digest: "8eb7de9d961d0c7b04e4c718cb585e19278134219ce9a8fc67751f9fdad80a7e";
    }, {
        readonly path: "examples/benchmarks.py";
        readonly digest: "779b6491f3cdf2d551f9c53501d8b82feb14fc34e7b09cabd5d3513265cd81ce";
    }, {
        readonly path: "examples/ablation.py";
        readonly digest: "8fb8131f140a9bc04303781c5bf705077eab37c6daed7efa24ff0c7e431a092b";
    }, {
        readonly path: "examples/pareto.py";
        readonly digest: "c2841565348b1296d3d658cf57bceffd6965228a128e7c37f67fe93296d4c285";
    }, {
        readonly path: "examples/sweep.py";
        readonly digest: "a21d0a886b35f2059d427b382f71bfb569446870cb87f4e6b11b6107c830683c";
    }, {
        readonly path: "examples/confusion.py";
        readonly digest: "12fee947de688870ed612e7277291539dec9492be91908735a18bbbc912b9dd3";
    }, {
        readonly path: "examples/method.tex";
        readonly digest: "c4c89f130e7640845823f69e417e46a5cc8187d40ed824c89b030161e78af5ed";
    }, {
        readonly path: "examples/software-demo-data.py";
        readonly digest: "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3";
    }];
}, {
    readonly id: "pi-research-paper";
    readonly name: "pi-research-paper";
    readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；也可仅检查固定TeX/Bib的引用结构和获准元数据，不改稿。沿用模板和配套资产，构建并交付真实结果；普通研究报告使用reports。";
    readonly roles: readonly ["coordinator", "writer", "reviewer"];
    readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
    readonly digest: "6e8142c3ac6243a8215221e20e6fef404f3257e21af63e9d23a8d895e44a7e2d";
    readonly resources: readonly [{
        readonly path: "assets/starter-main.tex";
        readonly digest: "5cca37473fb76d93cc713ab8d8f7e3f283a0a0459c140715bfe5a7fa2715af20";
    }, {
        readonly path: "assets/starter-refs.bib";
        readonly digest: "78f946423d9710e5af5552b30b311f7aab18dffd321174d080448295de8b1072";
    }, {
        readonly path: "references/build-and-review.md";
        readonly digest: "1ef9b840e68b1583679cce0ea7f130d184d3d4ed3460a946f117b92101ed54d0";
    }, {
        readonly path: "references/scientific-review.md";
        readonly digest: "cf2847967ae4c7ac0c61c6866188cd4257b61648ce9441307d166fa2554d14eb";
    }, {
        readonly path: "references/citation-integrity.md";
        readonly digest: "62707a85afba326207b612597f57e9883df2002e47f092aba71a668edc690e25";
    }];
}, {
    readonly id: "pi-research-customize";
    readonly name: "pi-research-customize";
    readonly description: "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。";
    readonly roles: readonly ["coordinator"];
    readonly path: "skills/piresearch/pi-research-customize/SKILL.md";
    readonly digest: "cf0f4e72ba095976375208003c805b1d9316e37eb7cc5e35920c64b457cb15df";
    readonly resources: readonly [];
}, {
    readonly id: "pi-research-feedback";
    readonly name: "pi-research-feedback";
    readonly description: "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-feedback/SKILL.md";
    readonly digest: "924b2f16e8096e99e50eb23cfd4d709b130aa0ecc054bcc673b309f4cd59d1d3";
    readonly resources: readonly [];
}, {
    readonly id: "pi-research-lit-review";
    readonly name: "pi-research-lit-review";
    readonly description: "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。";
    readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
    readonly digest: "b3315ed7fb2924e07bf6092fc6e9b30d178434ae20fb5f7fba950fd404a0c4c0";
    readonly resources: readonly [{
        readonly path: "references/document-reading.md";
        readonly digest: "12b6702e35956ff104cdb4de4ff10ed86dc9255f4f7b959dbbed1bc4bdf05025";
    }, {
        readonly path: "references/discovery-permissions.md";
        readonly digest: "cfc88ab5d3f28c876ab5e04ecb9bda138df57444726f04122fea7ca0057646cb";
    }, {
        readonly path: "references/systematic-review.md";
        readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
        readonly methodRequirements: readonly ["literature-identity"];
    }];
}];
