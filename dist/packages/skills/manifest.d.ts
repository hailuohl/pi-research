export declare const BUNDLE_ID = "102e4006ccf2cf55439402e59771014af258268d3ed4416ca53c1e9a74d8bdfa";
export declare const SKILL_MANIFEST: readonly [{
    readonly id: "pi-research-overview";
    readonly name: "pi-research-overview";
    readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
    readonly digest: "de77f83ce10aa39844572518b273f1bac1ebea447a063630eb2bb0b683a124cc";
    readonly resources: readonly [];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "SKILL.md";
        readonly blob: "904b26802cf62d7ba84fa99f3c2c804026cd9e46";
    };
}, {
    readonly id: "pi-research-create";
    readonly name: "pi-research-create";
    readonly description: "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.";
    readonly roles: readonly ["coordinator", "designer"];
    readonly path: "skills/piresearch/pi-research-create/SKILL.md";
    readonly digest: "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f";
    readonly resources: readonly [];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-create/SKILL.md";
        readonly blob: "6d502f794f82a124cdd93723e2676d8cf0f8861b";
    };
}, {
    readonly id: "pi-research-experiment-tree";
    readonly name: "pi-research-experiment-tree";
    readonly description: "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。";
    readonly roles: readonly ["coordinator", "designer", "analyst", "reviewer"];
    readonly path: "skills/piresearch/pi-research-experiment-tree/SKILL.md";
    readonly digest: "384286676f9d0bf9735e90cd1a626b542830941de6eb81c05bf404f92d8abb58";
    readonly resources: readonly [{
        readonly path: "references/experimental-design.md";
        readonly digest: "f1e7a22064392cdca2e0542f3bc41761269ec4f84431202c9fadf15fd1e411ea";
    }, {
        readonly path: "references/statistical-power.md";
        readonly digest: "d6a104044ae5801bfe04fcc47f6cae4a30c3ee55346aa552deaccbf4a75c5d2b";
    }, {
        readonly path: "references/hypothesis-generation.md";
        readonly digest: "b522415de2ed40d9e9d47a6596760818a6a24e82cc937f954945a8a5dc89cfa8";
    }];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
        readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
    };
}, {
    readonly id: "pi-research-git";
    readonly name: "pi-research-git";
    readonly description: "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.";
    readonly roles: readonly ["coordinator", "implementer", "reviewer", "designer"];
    readonly path: "skills/piresearch/pi-research-git/SKILL.md";
    readonly digest: "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07";
    readonly resources: readonly [];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-git/SKILL.md";
        readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
    };
}, {
    readonly id: "pi-research-agent-delegation";
    readonly name: "pi-research-agent-delegation";
    readonly description: "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.";
    readonly roles: readonly ["coordinator"];
    readonly path: "skills/piresearch/pi-research-agent-delegation/SKILL.md";
    readonly digest: "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759";
    readonly resources: readonly [];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-agent-delegation/SKILL.md";
        readonly blob: "2cb9938569dca476c99c108df491835eadc19b65";
    };
}, {
    readonly id: "pi-research-compute";
    readonly name: "pi-research-compute";
    readonly description: "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.";
    readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
    readonly path: "skills/piresearch/pi-research-compute/SKILL.md";
    readonly digest: "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491";
    readonly resources: readonly [{
        readonly path: "references/local.md";
        readonly digest: "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121";
    }, {
        readonly path: "references/docker.md";
        readonly digest: "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6";
    }, {
        readonly path: "references/ssh.md";
        readonly digest: "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6";
    }];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-compute/SKILL.md";
        readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
    };
}, {
    readonly id: "pi-research-evidence";
    readonly name: "pi-research-evidence";
    readonly description: "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
    readonly digest: "a775882f5bc3f76f9ff5b03e4d2271616c87bfddad2fc08e50137f2df866a9a2";
    readonly resources: readonly [{
        readonly path: "references/exploratory-data-analysis.md";
        readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
    }, {
        readonly path: "references/statistical-analysis.md";
        readonly digest: "f5c10c4f52c32a3d08ade671bbaaba2ac9fedd9d452516129809024227a5de5a";
    }, {
        readonly path: "references/uncertainty-and-units.md";
        readonly digest: "04fc291850cabe3f73aae2f0e8d3554fd3b6cffe79989e4224961d061e025a8d";
    }, {
        readonly path: "references/scientific-critical-thinking.md";
        readonly digest: "5964657e879eb6a9a10be78a820a9f5fa5e20e3e501d5776367a24ffa18363a9";
    }];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-evidence/SKILL.md";
        readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
    };
}, {
    readonly id: "pi-research-reports";
    readonly name: "pi-research-reports";
    readonly description: "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
    readonly digest: "2aebbef9046afe6c18f67c08b0bd554879527720764a5534de7c26bc8c07aacb";
    readonly resources: readonly [{
        readonly path: "references/fixed-report.md";
        readonly digest: "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc";
    }];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-reports/SKILL.md";
        readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
    };
}, {
    readonly id: "pi-research-figures";
    readonly name: "pi-research-figures";
    readonly description: "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。";
    readonly roles: readonly ["coordinator", "analyst", "writer", "reviewer"];
    readonly path: "skills/piresearch/pi-research-figures/SKILL.md";
    readonly digest: "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89";
    readonly resources: readonly [{
        readonly path: "references/curves.md";
        readonly digest: "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df";
    }, {
        readonly path: "references/scaling.md";
        readonly digest: "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9";
    }, {
        readonly path: "references/comparison.md";
        readonly digest: "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7";
    }, {
        readonly path: "references/pareto.md";
        readonly digest: "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a";
    }, {
        readonly path: "references/matrix.md";
        readonly digest: "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823";
    }, {
        readonly path: "references/diagram.md";
        readonly digest: "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18";
    }, {
        readonly path: "assets/pi_figstyle.py";
        readonly digest: "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f";
    }, {
        readonly path: "assets/pi-tikz-preamble.tex";
        readonly digest: "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e";
    }, {
        readonly path: "examples/README.md";
        readonly digest: "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71";
    }, {
        readonly path: "examples/loss_curve.py";
        readonly digest: "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af";
    }, {
        readonly path: "examples/scaling.py";
        readonly digest: "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d";
    }, {
        readonly path: "examples/benchmarks.py";
        readonly digest: "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3";
    }, {
        readonly path: "examples/ablation.py";
        readonly digest: "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4";
    }, {
        readonly path: "examples/pareto.py";
        readonly digest: "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d";
    }, {
        readonly path: "examples/sweep.py";
        readonly digest: "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e";
    }, {
        readonly path: "examples/confusion.py";
        readonly digest: "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae";
    }, {
        readonly path: "examples/method.tex";
        readonly digest: "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d";
    }, {
        readonly path: "examples/software-demo-data.py";
        readonly digest: "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3";
    }, {
        readonly path: "PROVENANCE.md";
        readonly digest: "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1";
    }, {
        readonly path: "LICENSE";
        readonly digest: "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7";
    }];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-figures/SKILL.md";
        readonly blob: "611c11b12c395789d3aa0d2c015cf4ce0594a345";
    };
}, {
    readonly id: "pi-research-paper";
    readonly name: "pi-research-paper";
    readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。";
    readonly roles: readonly ["coordinator", "writer", "reviewer"];
    readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
    readonly digest: "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733";
    readonly resources: readonly [{
        readonly path: "assets/starter-main.tex";
        readonly digest: "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974";
    }, {
        readonly path: "assets/starter-refs.bib";
        readonly digest: "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9";
    }, {
        readonly path: "references/build-and-review.md";
        readonly digest: "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192";
    }, {
        readonly path: "references/scientific-review.md";
        readonly digest: "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c";
    }];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-paper/SKILL.md";
        readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
    };
}, {
    readonly id: "pi-research-customize";
    readonly name: "pi-research-customize";
    readonly description: "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。";
    readonly roles: readonly ["coordinator"];
    readonly path: "skills/piresearch/pi-research-customize/SKILL.md";
    readonly digest: "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b";
    readonly resources: readonly [];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-customize/SKILL.md";
        readonly blob: "51d608098dc24df19518bea4f6fc71963a26c2b4";
    };
}, {
    readonly id: "pi-research-feedback";
    readonly name: "pi-research-feedback";
    readonly description: "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-feedback/SKILL.md";
    readonly digest: "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80";
    readonly resources: readonly [];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-feedback/SKILL.md";
        readonly blob: "82a729e681bb9fe361589aa953d92769b698196f";
    };
}, {
    readonly id: "pi-research-lit-review";
    readonly name: "pi-research-lit-review";
    readonly description: "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。";
    readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
    readonly digest: "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff";
    readonly resources: readonly [{
        readonly path: "references/document-reading.md";
        readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
    }, {
        readonly path: "references/discovery-permissions.md";
        readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
    }, {
        readonly path: "references/systematic-review.md";
        readonly digest: "056ebe41093feb81cb9b222b70f09eb852b176d6b5b3be54f46ee73ac1a2f3f6";
    }];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-lit-review/SKILL.md";
        readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
    };
}];
