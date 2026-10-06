export declare const BUILTIN_RELEASES: readonly [{
    readonly bundleId: "6683733f868b846a6bed3434bba1ff2bdceed99aece0538ac75fe1c70bbd89f2";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/openresearch/pi-research-overview/SKILL.md";
        readonly digest: "5a511f85b11b45d083747eb0d64b0e4396469aafdf0e70a56ed9589467f38806";
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
        readonly description: "Use when a project is new, empty, imported, or needs a baseline or reproduction scope.";
        readonly roles: readonly ["coordinator", "designer"];
        readonly path: "skills/openresearch/pi-research-create/SKILL.md";
        readonly digest: "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a";
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
        readonly description: "Use when interpreting completed runs, planning a round, repairing, promoting, or stopping.";
        readonly roles: readonly ["coordinator", "designer", "analyst", "reviewer"];
        readonly path: "skills/openresearch/pi-research-experiment-tree/SKILL.md";
        readonly digest: "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6";
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
        readonly description: "Use when editing code, comparing a child, preparing a handoff, or avoiding shared-workspace conflicts.";
        readonly roles: readonly ["coordinator", "implementer", "reviewer", "designer"];
        readonly path: "skills/openresearch/pi-research-git/SKILL.md";
        readonly digest: "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91";
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
        readonly description: "Use when proposing a team, splitting independent work, reviewing helper output, or handling a stalled team.";
        readonly roles: readonly ["coordinator"];
        readonly path: "skills/openresearch/pi-research-agent-delegation/SKILL.md";
        readonly digest: "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56";
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
        readonly description: "Use before preparing, launching, cancelling, sizing, or reconciling an experiment run.";
        readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
        readonly path: "skills/openresearch/pi-research-compute/SKILL.md";
        readonly digest: "1e14da9bd14ea16cd36d38c57df9c454c1949de2a9b7586968fab2a79e23ccf3";
        readonly resources: readonly [{
            readonly path: "references/local.md";
            readonly digest: "6a216654ed6069e8959c2fd3a5b5cbaf2bb04e76c12efdde41cfed078a5c78b7";
        }, {
            readonly path: "references/ssh.md";
            readonly digest: "5b8a497ab023fac473b660b5cbf85961afb7d5de231aba955a11e1d65dfd2c62";
        }, {
            readonly path: "references/slurm.md";
            readonly digest: "b3fd81092d8c18d4d1b9687c1e13e5fea71ee2b45166e7a51464731ac520bea2";
        }, {
            readonly path: "references/k8s.md";
            readonly digest: "a321bac4fa039a0cde698e73201773da275098ee99610db7538a51b9462de097";
        }, {
            readonly path: "references/ray.md";
            readonly digest: "404a3fcfdbe8a66c75d2169df2e006fc27071ade03dc9abd2b6c236bf0fc72a1";
        }, {
            readonly path: "references/hf.md";
            readonly digest: "04dc0a6f797134afe4e8db41d554c2688dcac61d872731fa923a9ff4596d5854";
        }, {
            readonly path: "references/modal.md";
            readonly digest: "841ab793672ec85a07fa5b5b566cb31485f2709a7c60a82e0bdcc7944d233dd7";
        }, {
            readonly path: "references/tinker.md";
            readonly digest: "b747a1c81807e97135a3a579ea53d1b3ecc7fff0fa02ed39ff22e4eb5f3b10a8";
        }, {
            readonly path: "references/openresearch.md";
            readonly digest: "81bcc82858ae56bb5d064529ae90aca99a7fb0ff27c058fe640a615a9453d728";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        };
    }, {
        readonly id: "pi-research-instances";
        readonly name: "pi-research-instances";
        readonly description: "Use when a user asks for a persistent machine, provisioning, or an interactive remote workspace.";
        readonly roles: readonly ["coordinator", "designer"];
        readonly path: "skills/openresearch/pi-research-instances/SKILL.md";
        readonly digest: "a3482be12289897c9d5a0c07c8bb6269ecaee3cd84d6a87ddb51c1cf9203e162";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        };
    }, {
        readonly id: "pi-research-evidence";
        readonly name: "pi-research-evidence";
        readonly description: "Use when reading logs, validating numerical claims, quoting papers, or checking stale evidence.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/openresearch/pi-research-evidence/SKILL.md";
        readonly digest: "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3";
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
        readonly description: "Use when producing a report, comparison, durable research note, or end-of-round handoff.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/openresearch/pi-research-reports/SKILL.md";
        readonly digest: "722fb5b708289ccd369e789831ba816d5a957dd053e409e3fa2b018f03407936";
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
        readonly description: "Use when preparing a scientific plot, multi-panel figure, diagram, or figure audit.";
        readonly roles: readonly ["coordinator", "analyst", "writer", "reviewer"];
        readonly path: "skills/openresearch/pi-research-figures/SKILL.md";
        readonly digest: "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01";
        readonly resources: readonly [{
            readonly path: "references/curves.md";
            readonly digest: "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc";
        }, {
            readonly path: "references/scaling.md";
            readonly digest: "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba";
        }, {
            readonly path: "references/comparison.md";
            readonly digest: "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd";
        }, {
            readonly path: "references/pareto.md";
            readonly digest: "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6";
        }, {
            readonly path: "references/matrix.md";
            readonly digest: "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a";
        }, {
            readonly path: "references/diagram.md";
            readonly digest: "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734";
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
        readonly description: "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs.";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/openresearch/pi-research-paper/SKILL.md";
        readonly digest: "de7dea0bda7027b4c315e25bc3697fb2e5b228174434ae11a2158661b6828022";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        };
    }, {
        readonly id: "pi-research-customize";
        readonly name: "pi-research-customize";
        readonly description: "Use when reviewing a skill bundle, adding a research method, or selecting reusable templates.";
        readonly roles: readonly ["coordinator"];
        readonly path: "skills/openresearch/pi-research-customize/SKILL.md";
        readonly digest: "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6";
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
        readonly description: "Use when recording a product bug, limitation, unexpected behavior, or requested capability.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/openresearch/pi-research-feedback/SKILL.md";
        readonly digest: "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5";
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
        readonly description: "Use when searching literature, reading selected papers, or grounding scientific comparisons.";
        readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
        readonly path: "skills/openresearch/pi-research-lit-review/SKILL.md";
        readonly digest: "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "602fd69718ffe349b4ba2ce2531e8b3e427a27f826622da91f7ed070d7f5d367";
}, {
    readonly bundleId: "2a5141eda3efbe5934669fbc86fe95ad72e311c97303615d0d92dcfa78aa60cd";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/openresearch/pi-research-overview/SKILL.md";
        readonly digest: "5a511f85b11b45d083747eb0d64b0e4396469aafdf0e70a56ed9589467f38806";
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
        readonly description: "Use when a project is new, empty, imported, or needs a baseline or reproduction scope.";
        readonly roles: readonly ["coordinator", "designer"];
        readonly path: "skills/openresearch/pi-research-create/SKILL.md";
        readonly digest: "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a";
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
        readonly description: "Use when interpreting completed runs, planning a round, repairing, promoting, or stopping.";
        readonly roles: readonly ["coordinator", "designer", "analyst", "reviewer"];
        readonly path: "skills/openresearch/pi-research-experiment-tree/SKILL.md";
        readonly digest: "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6";
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
        readonly description: "Use when editing code, comparing a child, preparing a handoff, or avoiding shared-workspace conflicts.";
        readonly roles: readonly ["coordinator", "implementer", "reviewer", "designer"];
        readonly path: "skills/openresearch/pi-research-git/SKILL.md";
        readonly digest: "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91";
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
        readonly description: "Use when proposing a team, splitting independent work, reviewing helper output, or handling a stalled team.";
        readonly roles: readonly ["coordinator"];
        readonly path: "skills/openresearch/pi-research-agent-delegation/SKILL.md";
        readonly digest: "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56";
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
        readonly description: "Use before preparing, launching, cancelling, sizing, or reconciling an experiment run.";
        readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
        readonly path: "skills/openresearch/pi-research-compute/SKILL.md";
        readonly digest: "1e14da9bd14ea16cd36d38c57df9c454c1949de2a9b7586968fab2a79e23ccf3";
        readonly resources: readonly [{
            readonly path: "references/local.md";
            readonly digest: "6a216654ed6069e8959c2fd3a5b5cbaf2bb04e76c12efdde41cfed078a5c78b7";
        }, {
            readonly path: "references/ssh.md";
            readonly digest: "5b8a497ab023fac473b660b5cbf85961afb7d5de231aba955a11e1d65dfd2c62";
        }, {
            readonly path: "references/slurm.md";
            readonly digest: "b3fd81092d8c18d4d1b9687c1e13e5fea71ee2b45166e7a51464731ac520bea2";
        }, {
            readonly path: "references/k8s.md";
            readonly digest: "a321bac4fa039a0cde698e73201773da275098ee99610db7538a51b9462de097";
        }, {
            readonly path: "references/ray.md";
            readonly digest: "404a3fcfdbe8a66c75d2169df2e006fc27071ade03dc9abd2b6c236bf0fc72a1";
        }, {
            readonly path: "references/hf.md";
            readonly digest: "04dc0a6f797134afe4e8db41d554c2688dcac61d872731fa923a9ff4596d5854";
        }, {
            readonly path: "references/modal.md";
            readonly digest: "841ab793672ec85a07fa5b5b566cb31485f2709a7c60a82e0bdcc7944d233dd7";
        }, {
            readonly path: "references/tinker.md";
            readonly digest: "b747a1c81807e97135a3a579ea53d1b3ecc7fff0fa02ed39ff22e4eb5f3b10a8";
        }, {
            readonly path: "references/openresearch.md";
            readonly digest: "81bcc82858ae56bb5d064529ae90aca99a7fb0ff27c058fe640a615a9453d728";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        };
    }, {
        readonly id: "pi-research-instances";
        readonly name: "pi-research-instances";
        readonly description: "Use when a user asks for a persistent machine, provisioning, or an interactive remote workspace.";
        readonly roles: readonly ["coordinator", "designer"];
        readonly path: "skills/openresearch/pi-research-instances/SKILL.md";
        readonly digest: "a3482be12289897c9d5a0c07c8bb6269ecaee3cd84d6a87ddb51c1cf9203e162";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        };
    }, {
        readonly id: "pi-research-evidence";
        readonly name: "pi-research-evidence";
        readonly description: "Use when reading logs, validating numerical claims, quoting papers, or checking stale evidence.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/openresearch/pi-research-evidence/SKILL.md";
        readonly digest: "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3";
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
        readonly description: "Use when producing a report, comparison, durable research note, or end-of-round handoff.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/openresearch/pi-research-reports/SKILL.md";
        readonly digest: "34e81e4131c0d357b0ffdbc8e08200b2d0c204552b986aba633ef0e760cbbced";
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
        readonly description: "Use when preparing a scientific plot, multi-panel figure, diagram, or figure audit.";
        readonly roles: readonly ["coordinator", "analyst", "writer", "reviewer"];
        readonly path: "skills/openresearch/pi-research-figures/SKILL.md";
        readonly digest: "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01";
        readonly resources: readonly [{
            readonly path: "references/curves.md";
            readonly digest: "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc";
        }, {
            readonly path: "references/scaling.md";
            readonly digest: "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba";
        }, {
            readonly path: "references/comparison.md";
            readonly digest: "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd";
        }, {
            readonly path: "references/pareto.md";
            readonly digest: "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6";
        }, {
            readonly path: "references/matrix.md";
            readonly digest: "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a";
        }, {
            readonly path: "references/diagram.md";
            readonly digest: "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734";
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
        readonly description: "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs.";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/openresearch/pi-research-paper/SKILL.md";
        readonly digest: "b891b00397bb77733b91c7f168192a6bce576b3240c4f47f1f89e06f390ad1b4";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        };
    }, {
        readonly id: "pi-research-customize";
        readonly name: "pi-research-customize";
        readonly description: "Use when reviewing a skill bundle, adding a research method, or selecting reusable templates.";
        readonly roles: readonly ["coordinator"];
        readonly path: "skills/openresearch/pi-research-customize/SKILL.md";
        readonly digest: "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6";
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
        readonly description: "Use when recording a product bug, limitation, unexpected behavior, or requested capability.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/openresearch/pi-research-feedback/SKILL.md";
        readonly digest: "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5";
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
        readonly description: "Use when searching literature, reading selected papers, or grounding scientific comparisons.";
        readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
        readonly path: "skills/openresearch/pi-research-lit-review/SKILL.md";
        readonly digest: "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "2a5141eda3efbe5934669fbc86fe95ad72e311c97303615d0d92dcfa78aa60cd";
}, {
    readonly bundleId: "344a44dcf73a8bcb2b2cdf5acf637f756c1763ef05c5ba464bc8285fa45a188b";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "5a511f85b11b45d083747eb0d64b0e4396469aafdf0e70a56ed9589467f38806";
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
        readonly description: "Use when a project is new, empty, imported, or needs a baseline or reproduction scope.";
        readonly roles: readonly ["coordinator", "designer"];
        readonly path: "skills/piresearch/pi-research-create/SKILL.md";
        readonly digest: "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a";
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
        readonly description: "Use when interpreting completed runs, planning a round, repairing, promoting, or stopping.";
        readonly roles: readonly ["coordinator", "designer", "analyst", "reviewer"];
        readonly path: "skills/piresearch/pi-research-experiment-tree/SKILL.md";
        readonly digest: "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6";
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
        readonly description: "Use when editing code, comparing a child, preparing a handoff, or avoiding shared-workspace conflicts.";
        readonly roles: readonly ["coordinator", "implementer", "reviewer", "designer"];
        readonly path: "skills/piresearch/pi-research-git/SKILL.md";
        readonly digest: "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91";
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
        readonly description: "Use when proposing a team, splitting independent work, reviewing helper output, or handling a stalled team.";
        readonly roles: readonly ["coordinator"];
        readonly path: "skills/piresearch/pi-research-agent-delegation/SKILL.md";
        readonly digest: "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56";
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
        readonly description: "Use before preparing, launching, cancelling, sizing, or reconciling an experiment run.";
        readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
        readonly path: "skills/piresearch/pi-research-compute/SKILL.md";
        readonly digest: "1e14da9bd14ea16cd36d38c57df9c454c1949de2a9b7586968fab2a79e23ccf3";
        readonly resources: readonly [{
            readonly path: "references/local.md";
            readonly digest: "6a216654ed6069e8959c2fd3a5b5cbaf2bb04e76c12efdde41cfed078a5c78b7";
        }, {
            readonly path: "references/ssh.md";
            readonly digest: "5b8a497ab023fac473b660b5cbf85961afb7d5de231aba955a11e1d65dfd2c62";
        }, {
            readonly path: "references/slurm.md";
            readonly digest: "b3fd81092d8c18d4d1b9687c1e13e5fea71ee2b45166e7a51464731ac520bea2";
        }, {
            readonly path: "references/k8s.md";
            readonly digest: "a321bac4fa039a0cde698e73201773da275098ee99610db7538a51b9462de097";
        }, {
            readonly path: "references/ray.md";
            readonly digest: "404a3fcfdbe8a66c75d2169df2e006fc27071ade03dc9abd2b6c236bf0fc72a1";
        }, {
            readonly path: "references/hf.md";
            readonly digest: "04dc0a6f797134afe4e8db41d554c2688dcac61d872731fa923a9ff4596d5854";
        }, {
            readonly path: "references/modal.md";
            readonly digest: "841ab793672ec85a07fa5b5b566cb31485f2709a7c60a82e0bdcc7944d233dd7";
        }, {
            readonly path: "references/tinker.md";
            readonly digest: "b747a1c81807e97135a3a579ea53d1b3ecc7fff0fa02ed39ff22e4eb5f3b10a8";
        }, {
            readonly path: "references/openresearch.md";
            readonly digest: "81bcc82858ae56bb5d064529ae90aca99a7fb0ff27c058fe640a615a9453d728";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        };
    }, {
        readonly id: "pi-research-instances";
        readonly name: "pi-research-instances";
        readonly description: "Use when a user asks for a persistent machine, provisioning, or an interactive remote workspace.";
        readonly roles: readonly ["coordinator", "designer"];
        readonly path: "skills/piresearch/pi-research-instances/SKILL.md";
        readonly digest: "a3482be12289897c9d5a0c07c8bb6269ecaee3cd84d6a87ddb51c1cf9203e162";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        };
    }, {
        readonly id: "pi-research-evidence";
        readonly name: "pi-research-evidence";
        readonly description: "Use when reading logs, validating numerical claims, quoting papers, or checking stale evidence.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3";
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
        readonly description: "Use when producing a report, comparison, durable research note, or end-of-round handoff.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "34e81e4131c0d357b0ffdbc8e08200b2d0c204552b986aba633ef0e760cbbced";
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
        readonly description: "Use when preparing a scientific plot, multi-panel figure, diagram, or figure audit.";
        readonly roles: readonly ["coordinator", "analyst", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-figures/SKILL.md";
        readonly digest: "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01";
        readonly resources: readonly [{
            readonly path: "references/curves.md";
            readonly digest: "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc";
        }, {
            readonly path: "references/scaling.md";
            readonly digest: "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba";
        }, {
            readonly path: "references/comparison.md";
            readonly digest: "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd";
        }, {
            readonly path: "references/pareto.md";
            readonly digest: "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6";
        }, {
            readonly path: "references/matrix.md";
            readonly digest: "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a";
        }, {
            readonly path: "references/diagram.md";
            readonly digest: "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734";
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
        readonly description: "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs.";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "b891b00397bb77733b91c7f168192a6bce576b3240c4f47f1f89e06f390ad1b4";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        };
    }, {
        readonly id: "pi-research-customize";
        readonly name: "pi-research-customize";
        readonly description: "Use when reviewing a skill bundle, adding a research method, or selecting reusable templates.";
        readonly roles: readonly ["coordinator"];
        readonly path: "skills/piresearch/pi-research-customize/SKILL.md";
        readonly digest: "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6";
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
        readonly description: "Use when recording a product bug, limitation, unexpected behavior, or requested capability.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-feedback/SKILL.md";
        readonly digest: "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5";
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
        readonly description: "Use when searching literature, reading selected papers, or grounding scientific comparisons.";
        readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
        readonly digest: "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "344a44dcf73a8bcb2b2cdf5acf637f756c1763ef05c5ba464bc8285fa45a188b";
}, {
    readonly bundleId: "547f5f0d9dc3a27db86a26d9747c8b102b73ccc5fb1073b80fba07c2f0fb2feb";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "5a511f85b11b45d083747eb0d64b0e4396469aafdf0e70a56ed9589467f38806";
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
        readonly description: "Use when a project is new, empty, imported, or needs a baseline or reproduction scope.";
        readonly roles: readonly ["coordinator", "designer"];
        readonly path: "skills/piresearch/pi-research-create/SKILL.md";
        readonly digest: "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a";
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
        readonly description: "Use when interpreting completed runs, planning a round, repairing, promoting, or stopping.";
        readonly roles: readonly ["coordinator", "designer", "analyst", "reviewer"];
        readonly path: "skills/piresearch/pi-research-experiment-tree/SKILL.md";
        readonly digest: "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6";
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
        readonly description: "Use when editing code, comparing a child, preparing a handoff, or avoiding shared-workspace conflicts.";
        readonly roles: readonly ["coordinator", "implementer", "reviewer", "designer"];
        readonly path: "skills/piresearch/pi-research-git/SKILL.md";
        readonly digest: "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91";
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
        readonly description: "Use when proposing a team, splitting independent work, reviewing helper output, or handling a stalled team.";
        readonly roles: readonly ["coordinator"];
        readonly path: "skills/piresearch/pi-research-agent-delegation/SKILL.md";
        readonly digest: "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56";
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
        readonly description: "Use before preparing, launching, cancelling, sizing, or reconciling an experiment run.";
        readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
        readonly path: "skills/piresearch/pi-research-compute/SKILL.md";
        readonly digest: "7f49408c562c43864ff8382971fab467344b2a095e413a93a045966bdae39a1d";
        readonly resources: readonly [{
            readonly path: "references/local.md";
            readonly digest: "b7bf1a0d303d53a73239d597a5415c302c77889d204e8cc35f75ea74a43a5298";
        }, {
            readonly path: "references/ssh.md";
            readonly digest: "466fb9db080bfbea1ad67044985d0405c4d8bde132a34c993eb6b55e704e6066";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-compute/SKILL.md";
            readonly blob: "60566d92cd5e86f1d6684d731444af512531ea0c";
        };
    }, {
        readonly id: "pi-research-instances";
        readonly name: "pi-research-instances";
        readonly description: "Use when a user asks for a persistent machine, provisioning, or an interactive remote workspace.";
        readonly roles: readonly ["coordinator", "designer"];
        readonly path: "skills/piresearch/pi-research-instances/SKILL.md";
        readonly digest: "b70d2802a9be595a72c505c3b4631487c4f5b9e7312f7c60ab9f4a11f90498cd";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-instances/SKILL.md";
            readonly blob: "80bf26dc1634a4809fae9ee3d0c5598951258026";
        };
    }, {
        readonly id: "pi-research-evidence";
        readonly name: "pi-research-evidence";
        readonly description: "Use when reading logs, validating numerical claims, quoting papers, or checking stale evidence.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3";
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
        readonly description: "Use when producing a report, comparison, durable research note, or end-of-round handoff.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "34e81e4131c0d357b0ffdbc8e08200b2d0c204552b986aba633ef0e760cbbced";
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
        readonly description: "Use when preparing a scientific plot, multi-panel figure, diagram, or figure audit.";
        readonly roles: readonly ["coordinator", "analyst", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-figures/SKILL.md";
        readonly digest: "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01";
        readonly resources: readonly [{
            readonly path: "references/curves.md";
            readonly digest: "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc";
        }, {
            readonly path: "references/scaling.md";
            readonly digest: "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba";
        }, {
            readonly path: "references/comparison.md";
            readonly digest: "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd";
        }, {
            readonly path: "references/pareto.md";
            readonly digest: "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6";
        }, {
            readonly path: "references/matrix.md";
            readonly digest: "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a";
        }, {
            readonly path: "references/diagram.md";
            readonly digest: "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734";
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
        readonly description: "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs.";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "b891b00397bb77733b91c7f168192a6bce576b3240c4f47f1f89e06f390ad1b4";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-paper/SKILL.md";
            readonly blob: "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa";
        };
    }, {
        readonly id: "pi-research-customize";
        readonly name: "pi-research-customize";
        readonly description: "Use when reviewing a skill bundle, adding a research method, or selecting reusable templates.";
        readonly roles: readonly ["coordinator"];
        readonly path: "skills/piresearch/pi-research-customize/SKILL.md";
        readonly digest: "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6";
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
        readonly description: "Use when recording a product bug, limitation, unexpected behavior, or requested capability.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-feedback/SKILL.md";
        readonly digest: "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5";
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
        readonly description: "Use when searching literature, reading selected papers, or grounding scientific comparisons.";
        readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
        readonly digest: "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "547f5f0d9dc3a27db86a26d9747c8b102b73ccc5fb1073b80fba07c2f0fb2feb";
}];
