export declare const BUNDLE_ID = "4370f31787be05fc8687303c0ca0ca7052378d45de72e08d9562ab9783f855fc";
export declare const SKILL_MANIFEST: readonly [{
    readonly id: "pi-research-overview";
    readonly name: "pi-research-overview";
    readonly description: "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
    readonly digest: "6c0774405234125ebe6380eb9a5162c4a39aebf3fde272a98ff3864ea03b4ce1";
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
    readonly digest: "434e8ef80ff38899bc9fc00e1d065cd2860e3b415dce9828f871ada63576e708";
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
    readonly description: "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.";
    readonly roles: readonly ["coordinator", "designer", "analyst", "reviewer"];
    readonly path: "skills/piresearch/pi-research-experiment-tree/SKILL.md";
    readonly digest: "9da51b89dee04b7862cb9f2a52ea73ea1194f659a9a1088e033bdf618bd568a0";
    readonly resources: readonly [];
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
    readonly digest: "4b7f5b525d6cb00353909b672eae3674f4d83523965f3d946ca0c13e3c0e85cf";
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
    readonly digest: "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d";
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
    readonly description: "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/SSH reference.";
    readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
    readonly path: "skills/piresearch/pi-research-compute/SKILL.md";
    readonly digest: "c62ec4a09db90b2d05033539652715d39d71cc57ff1e69e28f848251ca30a70e";
    readonly resources: readonly [{
        readonly path: "references/local.md";
        readonly digest: "5a33728ecd0f7ee91e360749c4ae03d85bb0526f6027ad032fcc45b61b25cb33";
    }, {
        readonly path: "references/ssh.md";
        readonly digest: "ef026f3710e61d28e32bf01a5800332dd242c71f661d3b6fd4118f97cddcda83";
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
    readonly description: "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
    readonly digest: "246f0f316890b0a20e9d1fd11395c8508235490b22b47350198c9fb05ccd3b57";
    readonly resources: readonly [];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-evidence/SKILL.md";
        readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
    };
}, {
    readonly id: "pi-research-reports";
    readonly name: "pi-research-reports";
    readonly description: "Use before writing or organizing durable reports, comparisons, figures, exported data, or end-of-work research handoffs.";
    readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
    readonly digest: "174b4dbaf9d177d11ba45c513563c3832f587284ea83555dda609096ba6b318a";
    readonly resources: readonly [];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-reports/SKILL.md";
        readonly blob: "313d3ca61372e5f2e101cac6e78828393d03ad87";
    };
}, {
    readonly id: "pi-research-figures";
    readonly name: "pi-research-figures";
    readonly description: "用于论文级 matplotlib/TikZ 图：学习曲线、尺度律、基准与消融、Pareto、矩阵及方法图；保留尺寸、区间、矢量导出与自动审查。按图的问题读取一个参考。";
    readonly roles: readonly ["coordinator", "analyst", "writer", "reviewer"];
    readonly path: "skills/piresearch/pi-research-figures/SKILL.md";
    readonly digest: "e7bc0704c5254c8451153f1a8fbaf8c60ec1927df8e808b43cff404b897f8f6e";
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
        readonly digest: "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917";
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
        readonly digest: "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2";
    }, {
        readonly path: "examples/software-demo-data.py";
        readonly digest: "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3";
    }, {
        readonly path: "PROVENANCE.md";
        readonly digest: "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe";
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
    readonly description: "创建真实LaTeX论文、预印本或章节草稿；模板、公式、图、引用、引擎和固定文稿构建，按当前角色与用户审批执行。普通报告使用reports。";
    readonly roles: readonly ["coordinator", "writer", "reviewer"];
    readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
    readonly digest: "683f75255ae9eb282631a221f0ff4f1000c4c69a2be603a1d5b3c81774091c98";
    readonly resources: readonly [{
        readonly path: "assets/starter-main.tex";
        readonly digest: "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974";
    }, {
        readonly path: "assets/starter-refs.bib";
        readonly digest: "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9";
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
    readonly description: "Use when preparing or importing a reusable research skill, inspecting fixed skill versions/resources, or adapting a LaTeX template.";
    readonly roles: readonly ["coordinator"];
    readonly path: "skills/piresearch/pi-research-customize/SKILL.md";
    readonly digest: "8f145970a35028f76b72842dd130d4206a323593656129b0e83b3915f43e7f0d";
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
    readonly digest: "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546";
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
    readonly description: "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。";
    readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
    readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
    readonly digest: "c8b442130033810709d1b553e9f704fefe453a94da935e9c3ef917d0c1f63a50";
    readonly resources: readonly [];
    readonly source: {
        readonly repository: "alphaXiv/OpenResearch";
        readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
        readonly path: "agent-skills/orx-lit-review/SKILL.md";
        readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
    };
}];
