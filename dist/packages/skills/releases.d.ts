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
}, {
    readonly bundleId: "ea9fd8e00f0fc2a5aca8c900f14ea2e97a0b613a6baa5a86111064646b364c5a";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "a616fa56550323e89283517ac75337bc4c79cdd6e8434d096162d4d6b99f595b";
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
    readonly manifestDigest: "ea9fd8e00f0fc2a5aca8c900f14ea2e97a0b613a6baa5a86111064646b364c5a";
}, {
    readonly bundleId: "5593bebb6fff813b6024746fee602370931e1da9961121c9feebaf244fea2326";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "171c8c52a3f6c6030186a7012b458deae1b32cabad5e7be21fa1c7119360de8b";
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
        readonly digest: "0512c87bb2dea06aaee360aae8a27fd09c0fa899823ebf212d7b708d801a5860";
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
        readonly digest: "c85db475aee1b461f91d86ac598bbe3a270b485c5f4194de84907d4846d5de94";
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
    readonly manifestDigest: "5593bebb6fff813b6024746fee602370931e1da9961121c9feebaf244fea2326";
}, {
    readonly bundleId: "4370f31787be05fc8687303c0ca0ca7052378d45de72e08d9562ab9783f855fc";
    readonly skills: readonly [{
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
    readonly manifestDigest: "4370f31787be05fc8687303c0ca0ca7052378d45de72e08d9562ab9783f855fc";
}, {
    readonly bundleId: "ce58da58ca468628efe224f196f4fa9b756095484847de5f253e78f2fe0bbc3a";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "69b11f26e0ff1120bc9868b60d3da2feeced0ad68d33da1a1d4c4045353f6c70";
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
        readonly digest: "a24dac45022b2de3a376cbedb4bac0c43410344c5072e218a5b9e1a1da639742";
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
        readonly digest: "faf3f7254996a0dda1ab063c3fad9f0f4ad2d1b3e96357707fd879d919d14783";
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
    readonly manifestDigest: "ce58da58ca468628efe224f196f4fa9b756095484847de5f253e78f2fe0bbc3a";
}, {
    readonly bundleId: "14e1170adc7bf3ab02a4b37a44172082d5853732fc1df1bd0aac9fbde70479cb";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "7acc3e3fc42e09575add132a0b4d85ae626e3ea8fabd68988129ab410e964151";
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
        readonly digest: "472161f2c32eea89141294333d6398a40b08879c8b68d728078f417d315d8286";
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
        readonly digest: "9699b2e29f9ae7748b202889d08ff6ace49d69b0c9cf9587d430e3f4b3e7b05a";
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
        readonly digest: "faf3f7254996a0dda1ab063c3fad9f0f4ad2d1b3e96357707fd879d919d14783";
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
        readonly digest: "b0ce03bd9dedea3fd3fb2cdc55ad8edab8043c153bcd58e9dc0a3bcc7b4fd680";
        readonly resources: readonly [{
            readonly path: "references/local.md";
            readonly digest: "d345d7977a3c9393b554cb7210ec8ea88d5859393c800ad16bc635bd21f0cafb";
        }, {
            readonly path: "references/ssh.md";
            readonly digest: "b9b52c318cea1a61849601f2f0eb373c176f4787bb22ce5d2d5298a4aeb56764";
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
        readonly digest: "ff0703e9013deecedf2088715af99f9fa481783d09d425c52e173f1039866e09";
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
    readonly manifestDigest: "14e1170adc7bf3ab02a4b37a44172082d5853732fc1df1bd0aac9fbde70479cb";
}, {
    readonly bundleId: "8f766452c9ab9af8b19245b323cfad8bfb5f04fd5e0ba08c321946073e96ef52";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "b62948f162bb359282b24925818a5b5661460934043a56c1f5fda860b7f3094b";
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
        readonly digest: "472161f2c32eea89141294333d6398a40b08879c8b68d728078f417d315d8286";
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
        readonly digest: "9699b2e29f9ae7748b202889d08ff6ace49d69b0c9cf9587d430e3f4b3e7b05a";
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
        readonly digest: "faf3f7254996a0dda1ab063c3fad9f0f4ad2d1b3e96357707fd879d919d14783";
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
        readonly description: "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.";
        readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
        readonly path: "skills/piresearch/pi-research-compute/SKILL.md";
        readonly digest: "83876eb1ab092dc06348f71f403fe0736a466dffbb701eb27c2677f236a024a0";
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
        readonly description: "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "ff0703e9013deecedf2088715af99f9fa481783d09d425c52e173f1039866e09";
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
    readonly manifestDigest: "8f766452c9ab9af8b19245b323cfad8bfb5f04fd5e0ba08c321946073e96ef52";
}, {
    readonly bundleId: "deacf6d3accce4602e8c28974a85dbebf56dd021e4d48672a2ddf0b0b6ce5715";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "e761291278715604063c5ebf3f3ea2211c02094a3a3b6b658247e540cbf992bb";
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
        readonly digest: "472161f2c32eea89141294333d6398a40b08879c8b68d728078f417d315d8286";
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
        readonly digest: "9699b2e29f9ae7748b202889d08ff6ace49d69b0c9cf9587d430e3f4b3e7b05a";
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
        readonly digest: "8293f65371e9cbadf5c08b11f75b20f3bd7cc1ac89101fa79d2d1b910454514a";
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
        readonly description: "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.";
        readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
        readonly path: "skills/piresearch/pi-research-compute/SKILL.md";
        readonly digest: "83876eb1ab092dc06348f71f403fe0736a466dffbb701eb27c2677f236a024a0";
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
        readonly description: "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "ff0703e9013deecedf2088715af99f9fa481783d09d425c52e173f1039866e09";
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
    readonly manifestDigest: "deacf6d3accce4602e8c28974a85dbebf56dd021e4d48672a2ddf0b0b6ce5715";
}, {
    readonly bundleId: "49efbc47bbccc6d19c12d60d77b9721219865dfce73a1f50552ac87bae296ca8";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "6bc4ce36371d4d0a8137e0630c5865a89bdb9c80c9eaaa0f7ed15956166ef7f5";
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
        readonly digest: "472161f2c32eea89141294333d6398a40b08879c8b68d728078f417d315d8286";
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
        readonly digest: "9699b2e29f9ae7748b202889d08ff6ace49d69b0c9cf9587d430e3f4b3e7b05a";
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
        readonly digest: "8293f65371e9cbadf5c08b11f75b20f3bd7cc1ac89101fa79d2d1b910454514a";
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
        readonly description: "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.";
        readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
        readonly path: "skills/piresearch/pi-research-compute/SKILL.md";
        readonly digest: "83876eb1ab092dc06348f71f403fe0736a466dffbb701eb27c2677f236a024a0";
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
        readonly description: "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "ff0703e9013deecedf2088715af99f9fa481783d09d425c52e173f1039866e09";
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
        readonly digest: "780305096db188625ef38e5c5dfd291b87da4b19529602a881395eacee3f458f";
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
        readonly digest: "ac06e5dec2d774140ad74bb44eac2cdcd6c443dec2183bfca7002d38a8bcd6cf";
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
        readonly digest: "c001003a1f00d1092036dd7dd7c8e8f8383a083a03c67a9796519a3fed1b2558";
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
    readonly manifestDigest: "49efbc47bbccc6d19c12d60d77b9721219865dfce73a1f50552ac87bae296ca8";
}, {
    readonly bundleId: "50e285cf2ea51e8dfa1543894bfce13e14969ff3924f9dfd0ed6599377bb6664";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "281e10f71e0910c100c197721f5c04856a9aa02a2062a7a9f3bae507be54d7a4";
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
        readonly digest: "472161f2c32eea89141294333d6398a40b08879c8b68d728078f417d315d8286";
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
        readonly digest: "9699b2e29f9ae7748b202889d08ff6ace49d69b0c9cf9587d430e3f4b3e7b05a";
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
        readonly digest: "8293f65371e9cbadf5c08b11f75b20f3bd7cc1ac89101fa79d2d1b910454514a";
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
        readonly description: "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.";
        readonly roles: readonly ["coordinator", "designer", "implementer", "analyst", "reviewer"];
        readonly path: "skills/piresearch/pi-research-compute/SKILL.md";
        readonly digest: "83876eb1ab092dc06348f71f403fe0736a466dffbb701eb27c2677f236a024a0";
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
        readonly description: "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "cf2d86e86496177c7bb25d6ffbbe8757eff5be8bf8cc62fbf10b401593144bf2";
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
        readonly digest: "780305096db188625ef38e5c5dfd291b87da4b19529602a881395eacee3f458f";
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
        readonly digest: "ac06e5dec2d774140ad74bb44eac2cdcd6c443dec2183bfca7002d38a8bcd6cf";
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
        readonly digest: "f2c5a1ea072459d744546362cf4876e8d9d9f947540340d21137310f65fa1355";
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
        readonly digest: "5186f5aa17c2986014900aaf9783b4097dfe8c9d8de37aec8db0b15d1f54803b";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "50e285cf2ea51e8dfa1543894bfce13e14969ff3924f9dfd0ed6599377bb6664";
}, {
    readonly bundleId: "cffee2e2842e5cb4c849f99f81f855043ef49237f531ba681f29e99f46ece406";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50";
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
        readonly digest: "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07";
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
        readonly digest: "5dce809cbfd343c334c44f3a7f60c89af110257b5d2bdafb2a474b7bd3941526";
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
        readonly description: "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "60cbce9cf923348e0adc58213067b33ec2443033e3878f321bc3dfc694682ec1";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "c434396140dd6b5ca2b08992c8e4dd8378fdad13dab2b1544778c20200b37ff7";
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
        readonly digest: "fccd118364bb0dad4ab83b0ebdd3d11513c9374c8ce990c6de31f111e1f0dded";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "2879ddda256e1d9e599c7463852ecca6dddfc668c74d2797185b797f69d87cc4";
        readonly resources: readonly [{
            readonly path: "assets/starter-main.tex";
            readonly digest: "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974";
        }, {
            readonly path: "assets/starter-refs.bib";
            readonly digest: "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9";
        }, {
            readonly path: "references/build-and-review.md";
            readonly digest: "6ce6fd9d700b039cb0801fc6928b63b732e29634a397189f30fc8cdf108c54c2";
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
        readonly digest: "1ade7cc681e0cce6a56fb2c594010eda2107a6bf8de2556bc58382ef25ed1832";
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
        readonly digest: "4eea38878fa93e91f050601e4e889355558c9b6947e5ce65db7505a69a912814";
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
        readonly digest: "4070d5e0ffe1e437e80aa993a488b614c44fd191e0f3dfdabf586b8b35084b65";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "4a62eae072f09ba2aa48d95baf5f1388ebc334130c49c159be7c9518551cfc6f";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "cffee2e2842e5cb4c849f99f81f855043ef49237f531ba681f29e99f46ece406";
}, {
    readonly bundleId: "7491426e81c2bd54888da1bd03fa517c8c001a981d4356e92024f50259ef863b";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50";
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
        readonly digest: "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07";
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
        readonly digest: "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b";
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
        readonly description: "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "409b304acf143a33b0e6139abdb3d0079b8b2a553dadaf300af85ccf934c18e7";
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
        readonly digest: "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "012b7aecfd73e0400b99e088b0153018077d0142b0886642068a745409fa4a23";
        readonly resources: readonly [{
            readonly path: "assets/starter-main.tex";
            readonly digest: "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974";
        }, {
            readonly path: "assets/starter-refs.bib";
            readonly digest: "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9";
        }, {
            readonly path: "references/build-and-review.md";
            readonly digest: "0f86a87c8a61b8aaba8413146c991098062c04ec9e52d99fbd4b8c0e53dbc636";
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
        readonly description: "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。";
        readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
        readonly digest: "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "7491426e81c2bd54888da1bd03fa517c8c001a981d4356e92024f50259ef863b";
}, {
    readonly bundleId: "2c41de1dd7daeef40043ec76e4a5eeaa6819b575987d3c884c476b434424d5f7";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50";
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
        readonly digest: "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07";
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
        readonly digest: "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b";
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
        readonly description: "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "2b6dc0328698eb2786b3442d1d6e20e92c0c7ed04065b22e73dfe7d957bd64f9";
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
        readonly digest: "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "7854b3113fe080f5e422d601428c968dddc6efcf4f8344ea8a565118e4e51759";
        readonly resources: readonly [{
            readonly path: "assets/starter-main.tex";
            readonly digest: "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974";
        }, {
            readonly path: "assets/starter-refs.bib";
            readonly digest: "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9";
        }, {
            readonly path: "references/build-and-review.md";
            readonly digest: "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192";
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
        readonly description: "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。";
        readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
        readonly digest: "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "2c41de1dd7daeef40043ec76e4a5eeaa6819b575987d3c884c476b434424d5f7";
}, {
    readonly bundleId: "13b287f05de2899138026917bdecd79f967bb9813cda2bf9ac745fb2fc307509";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50";
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
        readonly digest: "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07";
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
        readonly digest: "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b";
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
        readonly description: "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "2b6dc0328698eb2786b3442d1d6e20e92c0c7ed04065b22e73dfe7d957bd64f9";
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
        readonly digest: "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "fe4edcda3b213e8ea097ef1706a638c7173f069ff02e9248b00dfe51c6122c7f";
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
            readonly digest: "4d395133357e113b6c46c295a52a276a935ce0d4a2aff47ed6bcfc37ce429544";
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
        readonly description: "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。";
        readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
        readonly digest: "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "13b287f05de2899138026917bdecd79f967bb9813cda2bf9ac745fb2fc307509";
}, {
    readonly bundleId: "5f4e3bf3539b3a197bd5a2d71e43d1f8152fc2884afcaaf9a316c5b3f6ac7ac2";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50";
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
        readonly digest: "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07";
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
        readonly digest: "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b";
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
        readonly description: "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "2b6dc0328698eb2786b3442d1d6e20e92c0c7ed04065b22e73dfe7d957bd64f9";
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
        readonly digest: "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "fe4edcda3b213e8ea097ef1706a638c7173f069ff02e9248b00dfe51c6122c7f";
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
            readonly digest: "6bb7ed4d485c581d9a1eab01b925e5ae5d3d4066d6a678551e0592a1b221092f";
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
        readonly description: "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。";
        readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
        readonly digest: "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "5f4e3bf3539b3a197bd5a2d71e43d1f8152fc2884afcaaf9a316c5b3f6ac7ac2";
}, {
    readonly bundleId: "4e1944bb74918d76764c87cd63cdb746122c7ab0c0cf73d87dd829a7365070b0";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50";
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
        readonly digest: "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07";
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
        readonly digest: "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b";
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
        readonly description: "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "2b6dc0328698eb2786b3442d1d6e20e92c0c7ed04065b22e73dfe7d957bd64f9";
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
        readonly digest: "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b";
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
        readonly digest: "7854b3113fe080f5e422d601428c968dddc6efcf4f8344ea8a565118e4e51759";
        readonly resources: readonly [{
            readonly path: "assets/starter-main.tex";
            readonly digest: "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974";
        }, {
            readonly path: "assets/starter-refs.bib";
            readonly digest: "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9";
        }, {
            readonly path: "references/build-and-review.md";
            readonly digest: "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192";
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
        readonly description: "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。";
        readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
        readonly digest: "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "4e1944bb74918d76764c87cd63cdb746122c7ab0c0cf73d87dd829a7365070b0";
}, {
    readonly bundleId: "5f147a56da6ba9ad7e665a7dfb5bcbe08ab9818a2c1645c6c5be325f0703df04";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50";
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
        readonly digest: "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07";
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
        readonly digest: "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b";
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
        readonly description: "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-evidence/SKILL.md";
        readonly digest: "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "2b6dc0328698eb2786b3442d1d6e20e92c0c7ed04065b22e73dfe7d957bd64f9";
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
        readonly digest: "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b";
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
        readonly digest: "fe4edcda3b213e8ea097ef1706a638c7173f069ff02e9248b00dfe51c6122c7f";
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
            readonly digest: "6bb7ed4d485c581d9a1eab01b925e5ae5d3d4066d6a678551e0592a1b221092f";
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
        readonly description: "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。";
        readonly roles: readonly ["coordinator", "literature", "designer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-lit-review/SKILL.md";
        readonly digest: "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "5f147a56da6ba9ad7e665a7dfb5bcbe08ab9818a2c1645c6c5be325f0703df04";
}, {
    readonly bundleId: "1a4077f0830b90bb503e98fc1968a0171caa8136bbb35645487206c484b384e7";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50";
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
    readonly manifestDigest: "1a4077f0830b90bb503e98fc1968a0171caa8136bbb35645487206c484b384e7";
}, {
    readonly bundleId: "102e4006ccf2cf55439402e59771014af258268d3ed4416ca53c1e9a74d8bdfa";
    readonly skills: readonly [{
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
    readonly manifestDigest: "102e4006ccf2cf55439402e59771014af258268d3ed4416ca53c1e9a74d8bdfa";
}, {
    readonly bundleId: "ee525c7337715b07f1382494158f6eeaa3984e48b251d2c313478a179043b009";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "6404a908a6acc2817fdc5c8d6d89dc46752a70039cdde1f66158a007088cf7f6";
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
            readonly digest: "bdc8109f57f670c4030ba30fc42546ab312e01f1008a2e7642b23fedac40e6d8";
        }, {
            readonly path: "references/statistical-power.md";
            readonly digest: "65e021eff940babd846d42f5cc82c62f0bc8c1fba06f3aac1660a62ad9fc8ca4";
        }, {
            readonly path: "references/hypothesis-generation.md";
            readonly digest: "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400";
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
            readonly digest: "be7a5c25bc561ea0872b13fa0c57aedc9de61df0166367efd5acd2db963f71d6";
        }, {
            readonly path: "references/uncertainty-and-units.md";
            readonly digest: "22231a0885d936564f494bd0ed255577ed6a44b088dda6f513f1b9c77d49539f";
        }, {
            readonly path: "references/scientific-critical-thinking.md";
            readonly digest: "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c";
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
        readonly digest: "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47";
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
            readonly digest: "858d0ad853ece3593850ecd7976c704e94ca0034e15236e15287ab9686e3ad62";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "ee525c7337715b07f1382494158f6eeaa3984e48b251d2c313478a179043b009";
}, {
    readonly bundleId: "65b19e243a1b0571def4f1c664a47d1e723626e8242944c89c057d01f899b620";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "39575e3973d6849826cd939749ad7ea06b6520d5bf7cb27b0f7130f7cd99a2e1";
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
            readonly digest: "bdc8109f57f670c4030ba30fc42546ab312e01f1008a2e7642b23fedac40e6d8";
        }, {
            readonly path: "references/statistical-power.md";
            readonly digest: "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e";
        }, {
            readonly path: "references/hypothesis-generation.md";
            readonly digest: "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400";
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
        readonly digest: "5b8062350f3886c0b3b77858a05cb21e2548d5fa0697c4a6068a9ea71bb7a686";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "21e17af76ce4dafa290ec0d9cf9001def138fc626b761b6a0fb8c256e606a236";
        }, {
            readonly path: "references/uncertainty-and-units.md";
            readonly digest: "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4";
        }, {
            readonly path: "references/scientific-critical-thinking.md";
            readonly digest: "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c";
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
        readonly digest: "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47";
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
            readonly digest: "999f4d46f7f1544f7a9c34faabd7efe32e627c320ce9c4a4da0e4f493a547235";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "65b19e243a1b0571def4f1c664a47d1e723626e8242944c89c057d01f899b620";
}, {
    readonly bundleId: "40fedddf46a128cf3e845f25710bb98d1ddb68154949ca1c55341cebecdc02bb";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "25fde392a4d01edb7592dfec299cd9e22e7485e82e9bda8f26491b3802973019";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
        readonly resources: readonly [{
            readonly path: "references/experimental-design.md";
            readonly digest: "bdc8109f57f670c4030ba30fc42546ab312e01f1008a2e7642b23fedac40e6d8";
        }, {
            readonly path: "references/statistical-power.md";
            readonly digest: "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e";
        }, {
            readonly path: "references/hypothesis-generation.md";
            readonly digest: "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "e1b026bc0c13def7f9b56a7deccf6a9979a61408cb075f7da9c079be5a06b38c";
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
        readonly digest: "4063f3eadbcfdac17271c69dc5d2400c39fdc191457b4ac3c7cc94f9b53171ac";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "21e17af76ce4dafa290ec0d9cf9001def138fc626b761b6a0fb8c256e606a236";
        }, {
            readonly path: "references/uncertainty-and-units.md";
            readonly digest: "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4";
        }, {
            readonly path: "references/scientific-critical-thinking.md";
            readonly digest: "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c";
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
        readonly digest: "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47";
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
            readonly digest: "999f4d46f7f1544f7a9c34faabd7efe32e627c320ce9c4a4da0e4f493a547235";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "40fedddf46a128cf3e845f25710bb98d1ddb68154949ca1c55341cebecdc02bb";
}, {
    readonly bundleId: "eaedaaa0df1a48559bdc26b5020a94b4c98877db6973c29dc6c4e6000b8c0d95";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "e9af70cce6ed4a7e342bc29ad633667f2838d7ca7f1bc679e4ba1f669db91830";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
        readonly resources: readonly [{
            readonly path: "references/experimental-design.md";
            readonly digest: "bdc8109f57f670c4030ba30fc42546ab312e01f1008a2e7642b23fedac40e6d8";
        }, {
            readonly path: "references/statistical-power.md";
            readonly digest: "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e";
        }, {
            readonly path: "references/hypothesis-generation.md";
            readonly digest: "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "26c5e1874c5b156cc908a98aab082bf87f9b629b08b5639bf356c23728f22e85";
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
        readonly digest: "e2b5d6073074d47b07b5810d37f36de380681c3d4617e554f5534d7386552f12";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "21e17af76ce4dafa290ec0d9cf9001def138fc626b761b6a0fb8c256e606a236";
        }, {
            readonly path: "references/uncertainty-and-units.md";
            readonly digest: "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4";
        }, {
            readonly path: "references/scientific-critical-thinking.md";
            readonly digest: "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c";
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
        readonly digest: "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47";
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
            readonly digest: "999f4d46f7f1544f7a9c34faabd7efe32e627c320ce9c4a4da0e4f493a547235";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "eaedaaa0df1a48559bdc26b5020a94b4c98877db6973c29dc6c4e6000b8c0d95";
}, {
    readonly bundleId: "c3c9adcca6b4ece0df4ad5ca3adaf634a115b3b4e0b5998e386d4e2d8b343434";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "7701b568d5f020a1a8d41fb2db9c632e57c8bcf60bf2cd4853ba8c9b21cdf725";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
        readonly resources: readonly [{
            readonly path: "references/experimental-design.md";
            readonly digest: "f0850e3293d4662e22422f4083d89bd916579b1610fac93361d1c92a7824978f";
            readonly methodRequirements: readonly ["quantitative-decision"];
        }, {
            readonly path: "references/statistical-power.md";
            readonly digest: "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e";
        }, {
            readonly path: "references/hypothesis-generation.md";
            readonly digest: "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "9eaade7ee68ce731fc9f25480b0cd1420b9f686fd4f4607501d94cbbde90a6e0";
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
        readonly digest: "e2b5d6073074d47b07b5810d37f36de380681c3d4617e554f5534d7386552f12";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "7cee56917511130eba6b53068dbb51d512253c0f34b2dc84d55f8f78b5c25f18";
            readonly methodRequirements: readonly ["quantitative-decision"];
        }, {
            readonly path: "references/uncertainty-and-units.md";
            readonly digest: "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4";
        }, {
            readonly path: "references/scientific-critical-thinking.md";
            readonly digest: "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c";
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
        readonly digest: "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47";
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
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "c3c9adcca6b4ece0df4ad5ca3adaf634a115b3b4e0b5998e386d4e2d8b343434";
}, {
    readonly bundleId: "bd2c000f20c49ee33caccb0d83dac71e212634d8fd42809bf53ed11b2e724441";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "03dab155c69e0f23820c57a3a259539a23d527a7cf123fed3e8b17ff9fb6d5ac";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
        readonly resources: readonly [{
            readonly path: "references/experimental-design.md";
            readonly digest: "84909fa0fe965dff444150f0d7aaf4ba0aadf87701e47908e406f1b57878250f";
            readonly methodRequirements: readonly ["quantitative-decision"];
        }, {
            readonly path: "references/statistical-power.md";
            readonly digest: "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e";
        }, {
            readonly path: "references/hypothesis-generation.md";
            readonly digest: "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "25b19e440143182210cdf302a5f6a9e751d8a3269edc4e3f2b3974a3a82b5fe4";
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
        readonly digest: "e2b5d6073074d47b07b5810d37f36de380681c3d4617e554f5534d7386552f12";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "60e639ea43b601a037eaf6900ee8276c8a3c78bdc0d4b9dca4b3e7a556f56059";
            readonly methodRequirements: readonly ["quantitative-decision"];
        }, {
            readonly path: "references/uncertainty-and-units.md";
            readonly digest: "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4";
        }, {
            readonly path: "references/scientific-critical-thinking.md";
            readonly digest: "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c";
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
        readonly digest: "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47";
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
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "bd2c000f20c49ee33caccb0d83dac71e212634d8fd42809bf53ed11b2e724441";
}, {
    readonly bundleId: "6d6bd5b661a6fb02d0e3941878ff5a57b5540ce033915f79e8e15684a6a8e931";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "67076823af6202b545bfbdfe18044b81e9f9ce87212e6a26c206a9d219d727ea";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
        readonly resources: readonly [{
            readonly path: "references/experimental-design.md";
            readonly digest: "3fb47a4a4f8aefb2c987cd4611e308c29380eaa4a8a48d6865f535e3dd0838b3";
            readonly methodRequirements: readonly ["quantitative-decision"];
        }, {
            readonly path: "references/statistical-power.md";
            readonly digest: "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e";
        }, {
            readonly path: "references/hypothesis-generation.md";
            readonly digest: "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "6c518112c28c069deb46ac7b35da1a7a1a9aaa729197d2e65f024f22ec890988";
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
        readonly digest: "e2b5d6073074d47b07b5810d37f36de380681c3d4617e554f5534d7386552f12";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "f823c235a71db649fdcedac1880b0b8b2e6cbd629efac55d030701dfd6288128";
            readonly methodRequirements: readonly ["quantitative-decision"];
        }, {
            readonly path: "references/paired-polynomial-comparison.md";
            readonly digest: "d563c6b2ba105d1b94700803f57ee636d0a972a69d175cb7080ee6377596c207";
            readonly methodRequirements: readonly ["structured-paired-protocol"];
        }, {
            readonly path: "references/uncertainty-and-units.md";
            readonly digest: "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4";
        }, {
            readonly path: "references/scientific-critical-thinking.md";
            readonly digest: "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c";
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
        readonly digest: "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47";
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
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "6d6bd5b661a6fb02d0e3941878ff5a57b5540ce033915f79e8e15684a6a8e931";
}, {
    readonly bundleId: "cc80014242e5cd4e3489d0cf9e6dbf2a5361b18c8fd347e20ca3f889ba7e9214";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "67076823af6202b545bfbdfe18044b81e9f9ce87212e6a26c206a9d219d727ea";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
        readonly resources: readonly [{
            readonly path: "references/experimental-design.md";
            readonly digest: "3fb47a4a4f8aefb2c987cd4611e308c29380eaa4a8a48d6865f535e3dd0838b3";
            readonly methodRequirements: readonly ["quantitative-decision"];
        }, {
            readonly path: "references/statistical-power.md";
            readonly digest: "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e";
        }, {
            readonly path: "references/hypothesis-generation.md";
            readonly digest: "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400";
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "6c518112c28c069deb46ac7b35da1a7a1a9aaa729197d2e65f024f22ec890988";
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
        readonly digest: "e2b5d6073074d47b07b5810d37f36de380681c3d4617e554f5534d7386552f12";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "f823c235a71db649fdcedac1880b0b8b2e6cbd629efac55d030701dfd6288128";
            readonly methodRequirements: readonly ["quantitative-decision"];
        }, {
            readonly path: "references/paired-polynomial-comparison.md";
            readonly digest: "e2d0df40251d23396a051a694fcd7f74edc0f73af419f4a4fdb8944877c32815";
            readonly methodRequirements: readonly ["structured-paired-protocol"];
        }, {
            readonly path: "references/uncertainty-and-units.md";
            readonly digest: "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4";
        }, {
            readonly path: "references/scientific-critical-thinking.md";
            readonly digest: "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c";
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
        readonly digest: "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47";
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
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "cc80014242e5cd4e3489d0cf9e6dbf2a5361b18c8fd347e20ca3f889ba7e9214";
}, {
    readonly bundleId: "bd3c61039758b0b9e6707605fd8a7753de4e8e8b6c4bd6fc469597c48d29aa9f";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "1bae37997d13b740a1020bd95ef88138411e6899f124441c5a81eb8066e09abf";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "db281259c4b6fc5a0ed461b469b950e11500c62180630372fba911d97acda784";
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
        readonly digest: "360adc5b6ee62d08cecc290c17660df48ecaffc28addb2d814d61994434f2f0c";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "4b94c40e5b2fd76e8d2e9f7c56752ab9128c842787418f7937cdf47127fc44d7";
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
        readonly digest: "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47";
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
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "bd3c61039758b0b9e6707605fd8a7753de4e8e8b6c4bd6fc469597c48d29aa9f";
}, {
    readonly bundleId: "4f49f6cde539fd582c1c8d2caa8bca4f937457ea68c14ccbb79a3219ff2c5091";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "1bae37997d13b740a1020bd95ef88138411e6899f124441c5a81eb8066e09abf";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "db281259c4b6fc5a0ed461b469b950e11500c62180630372fba911d97acda784";
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
        readonly digest: "360adc5b6ee62d08cecc290c17660df48ecaffc28addb2d814d61994434f2f0c";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "4b94c40e5b2fd76e8d2e9f7c56752ab9128c842787418f7937cdf47127fc44d7";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "4820d58829830192e36d2b2cbeff10e2ab7f45c82d0656af7b32813ce4a9d165";
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
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "4f49f6cde539fd582c1c8d2caa8bca4f937457ea68c14ccbb79a3219ff2c5091";
}, {
    readonly bundleId: "af8dea8c0cd322ce67ae8657602e8de6cb700411da0e60dbb9f93ad618bdd86e";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "1bae37997d13b740a1020bd95ef88138411e6899f124441c5a81eb8066e09abf";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "db281259c4b6fc5a0ed461b469b950e11500c62180630372fba911d97acda784";
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
        readonly digest: "360adc5b6ee62d08cecc290c17660df48ecaffc28addb2d814d61994434f2f0c";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "4b94c40e5b2fd76e8d2e9f7c56752ab9128c842787418f7937cdf47127fc44d7";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "4820d58829830192e36d2b2cbeff10e2ab7f45c82d0656af7b32813ce4a9d165";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；也可仅检查固定TeX/Bib的引用结构和获准元数据，不改稿。沿用模板和配套资产，构建并交付真实结果；普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "19589d61891a1c268ebb148e3a38f4deb97f50df441cd6fb1223706c954a55d1";
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
        }, {
            readonly path: "references/citation-integrity.md";
            readonly digest: "0d11ae58365d1b5231ed4d28ab035e72fee6166bb6a8e87a2f0725d0f12ee638";
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
        readonly digest: "63e94a8dbede6583277a7a1f70311bead357a7e1e38e1cbc371b9fe33863486f";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }, {
            readonly path: "references/systematic-review.md";
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "af8dea8c0cd322ce67ae8657602e8de6cb700411da0e60dbb9f93ad618bdd86e";
}, {
    readonly bundleId: "5c2537836e6f59a3981dac5368513018bdf6a08621f8a8c67e58dde5ae4c473d";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "1bae37997d13b740a1020bd95ef88138411e6899f124441c5a81eb8066e09abf";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "db281259c4b6fc5a0ed461b469b950e11500c62180630372fba911d97acda784";
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
        readonly digest: "360adc5b6ee62d08cecc290c17660df48ecaffc28addb2d814d61994434f2f0c";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "4b94c40e5b2fd76e8d2e9f7c56752ab9128c842787418f7937cdf47127fc44d7";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "4820d58829830192e36d2b2cbeff10e2ab7f45c82d0656af7b32813ce4a9d165";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；也可仅检查固定TeX/Bib的引用结构和获准元数据，不改稿。沿用模板和配套资产，构建并交付真实结果；普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "19589d61891a1c268ebb148e3a38f4deb97f50df441cd6fb1223706c954a55d1";
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
        }, {
            readonly path: "references/citation-integrity.md";
            readonly digest: "d5a6b3f119929495250a325abb0cb736875c882b2700cf4fea1cfba99c2b8d24";
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
        readonly digest: "63e94a8dbede6583277a7a1f70311bead357a7e1e38e1cbc371b9fe33863486f";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }, {
            readonly path: "references/systematic-review.md";
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "5c2537836e6f59a3981dac5368513018bdf6a08621f8a8c67e58dde5ae4c473d";
}, {
    readonly bundleId: "45d125ff07c7f1b2b856a624aa140edf887432cc0e84cf181375676df8b65bf2";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "1bae37997d13b740a1020bd95ef88138411e6899f124441c5a81eb8066e09abf";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "db281259c4b6fc5a0ed461b469b950e11500c62180630372fba911d97acda784";
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
        readonly digest: "360adc5b6ee62d08cecc290c17660df48ecaffc28addb2d814d61994434f2f0c";
        readonly resources: readonly [{
            readonly path: "references/exploratory-data-analysis.md";
            readonly digest: "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7";
        }, {
            readonly path: "references/statistical-analysis.md";
            readonly digest: "4b94c40e5b2fd76e8d2e9f7c56752ab9128c842787418f7937cdf47127fc44d7";
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
        readonly description: "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "4820d58829830192e36d2b2cbeff10e2ab7f45c82d0656af7b32813ce4a9d165";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；也可仅检查固定TeX/Bib的引用结构和获准元数据，不改稿。沿用模板和配套资产，构建并交付真实结果；普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "19589d61891a1c268ebb148e3a38f4deb97f50df441cd6fb1223706c954a55d1";
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
        }, {
            readonly path: "references/citation-integrity.md";
            readonly digest: "62707a85afba326207b612597f57e9883df2002e47f092aba71a668edc690e25";
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
        readonly digest: "63e94a8dbede6583277a7a1f70311bead357a7e1e38e1cbc371b9fe33863486f";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }, {
            readonly path: "references/systematic-review.md";
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "45d125ff07c7f1b2b856a624aa140edf887432cc0e84cf181375676df8b65bf2";
}, {
    readonly bundleId: "6a24cca1c370257471bff9896d31f5e78d5ef313c29d7172e32d1055189b9be9";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "1bae37997d13b740a1020bd95ef88138411e6899f124441c5a81eb8066e09abf";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "db281259c4b6fc5a0ed461b469b950e11500c62180630372fba911d97acda784";
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
        readonly digest: "303798c91235023ca71abe34d6a2a6f44bdfb0f58445a287a1f5c900b748dd1f";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        };
    }, {
        readonly id: "pi-research-reports";
        readonly name: "pi-research-reports";
        readonly description: "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "4820d58829830192e36d2b2cbeff10e2ab7f45c82d0656af7b32813ce4a9d165";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；也可仅检查固定TeX/Bib的引用结构和获准元数据，不改稿。沿用模板和配套资产，构建并交付真实结果；普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "19589d61891a1c268ebb148e3a38f4deb97f50df441cd6fb1223706c954a55d1";
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
        }, {
            readonly path: "references/citation-integrity.md";
            readonly digest: "62707a85afba326207b612597f57e9883df2002e47f092aba71a668edc690e25";
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
        readonly digest: "63e94a8dbede6583277a7a1f70311bead357a7e1e38e1cbc371b9fe33863486f";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }, {
            readonly path: "references/systematic-review.md";
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "6a24cca1c370257471bff9896d31f5e78d5ef313c29d7172e32d1055189b9be9";
}, {
    readonly bundleId: "2596e69858f668445f440cd902b3afa94a53673a8a3a379a2329556dfe5f1aa0";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "9b350567ccc900dc1e5b9ff37d9e23329bc95085a9d4b6db88bf37d6eb433957";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "a717080170cb7067bbe8361745b582c98e9091bbf3cc5d560242a06abeebf613";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        };
    }, {
        readonly id: "pi-research-code-debugging";
        readonly name: "pi-research-code-debugging";
        readonly description: "Use when debugging research code, failed development checks, incorrect metrics or artifacts, or adding a regression test before a code fix; reviewers inspect fixed evidence read-only.";
        readonly roles: readonly ["coordinator", "implementer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-code-debugging/SKILL.md";
        readonly digest: "ff17641ba49936d5b70f51fc6ad2c22fd3566fdcd4e17cd5f7c54b897967efa5";
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
        readonly digest: "303798c91235023ca71abe34d6a2a6f44bdfb0f58445a287a1f5c900b748dd1f";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        };
    }, {
        readonly id: "pi-research-reports";
        readonly name: "pi-research-reports";
        readonly description: "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "4820d58829830192e36d2b2cbeff10e2ab7f45c82d0656af7b32813ce4a9d165";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；也可仅检查固定TeX/Bib的引用结构和获准元数据，不改稿。沿用模板和配套资产，构建并交付真实结果；普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "19589d61891a1c268ebb148e3a38f4deb97f50df441cd6fb1223706c954a55d1";
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
        }, {
            readonly path: "references/citation-integrity.md";
            readonly digest: "62707a85afba326207b612597f57e9883df2002e47f092aba71a668edc690e25";
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
        readonly digest: "63e94a8dbede6583277a7a1f70311bead357a7e1e38e1cbc371b9fe33863486f";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }, {
            readonly path: "references/systematic-review.md";
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "2596e69858f668445f440cd902b3afa94a53673a8a3a379a2329556dfe5f1aa0";
}, {
    readonly bundleId: "76710206b59393c7c65d3754d6a7016481b87ce9a528c896b85e66d8b35312da";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "9b350567ccc900dc1e5b9ff37d9e23329bc95085a9d4b6db88bf37d6eb433957";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "a717080170cb7067bbe8361745b582c98e9091bbf3cc5d560242a06abeebf613";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        };
    }, {
        readonly id: "pi-research-code-debugging";
        readonly name: "pi-research-code-debugging";
        readonly description: "Use when debugging research code, failed development checks, incorrect metrics or artifacts, or adding a regression test before a code fix; reviewers inspect fixed evidence read-only.";
        readonly roles: readonly ["coordinator", "implementer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-code-debugging/SKILL.md";
        readonly digest: "03d5ccf4162e1ff94b9244b62c0c8dec38994ac3ba224b6248038dca22fe2ccf";
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
        readonly digest: "303798c91235023ca71abe34d6a2a6f44bdfb0f58445a287a1f5c900b748dd1f";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        };
    }, {
        readonly id: "pi-research-reports";
        readonly name: "pi-research-reports";
        readonly description: "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "4820d58829830192e36d2b2cbeff10e2ab7f45c82d0656af7b32813ce4a9d165";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；也可仅检查固定TeX/Bib的引用结构和获准元数据，不改稿。沿用模板和配套资产，构建并交付真实结果；普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "19589d61891a1c268ebb148e3a38f4deb97f50df441cd6fb1223706c954a55d1";
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
        }, {
            readonly path: "references/citation-integrity.md";
            readonly digest: "62707a85afba326207b612597f57e9883df2002e47f092aba71a668edc690e25";
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
        readonly digest: "63e94a8dbede6583277a7a1f70311bead357a7e1e38e1cbc371b9fe33863486f";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193";
        }, {
            readonly path: "references/systematic-review.md";
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "76710206b59393c7c65d3754d6a7016481b87ce9a528c896b85e66d8b35312da";
}, {
    readonly bundleId: "cf2f0270a626a97a8070804373685ecfd246b556b62d44defbf53e2471f38f90";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "9b350567ccc900dc1e5b9ff37d9e23329bc95085a9d4b6db88bf37d6eb433957";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "a717080170cb7067bbe8361745b582c98e9091bbf3cc5d560242a06abeebf613";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        };
    }, {
        readonly id: "pi-research-code-debugging";
        readonly name: "pi-research-code-debugging";
        readonly description: "Use when debugging research code, failed development checks, incorrect metrics or artifacts, or adding a regression test before a code fix; reviewers inspect fixed evidence read-only.";
        readonly roles: readonly ["coordinator", "implementer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-code-debugging/SKILL.md";
        readonly digest: "03d5ccf4162e1ff94b9244b62c0c8dec38994ac3ba224b6248038dca22fe2ccf";
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
        readonly digest: "57665572f3405ee7436089865cc34b158e86fc22aa73dc131704ae655c872432";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        };
    }, {
        readonly id: "pi-research-reports";
        readonly name: "pi-research-reports";
        readonly description: "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "4820d58829830192e36d2b2cbeff10e2ab7f45c82d0656af7b32813ce4a9d165";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；也可仅检查固定TeX/Bib的引用结构和获准元数据，不改稿。沿用模板和配套资产，构建并交付真实结果；普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "19589d61891a1c268ebb148e3a38f4deb97f50df441cd6fb1223706c954a55d1";
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
        }, {
            readonly path: "references/citation-integrity.md";
            readonly digest: "62707a85afba326207b612597f57e9883df2002e47f092aba71a668edc690e25";
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
        readonly digest: "a847808cdcdb9bec1488858a8a9b1b2e270fa7e4db740b4af5604a9f1b5f575b";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "cfc88ab5d3f28c876ab5e04ecb9bda138df57444726f04122fea7ca0057646cb";
        }, {
            readonly path: "references/systematic-review.md";
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "cf2f0270a626a97a8070804373685ecfd246b556b62d44defbf53e2471f38f90";
}, {
    readonly bundleId: "cf8638daffd84643b72fd4bfaa298c8daf5eb0d2d36640985916cc57cae463da";
    readonly skills: readonly [{
        readonly id: "pi-research-overview";
        readonly name: "pi-research-overview";
        readonly description: "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-overview/SKILL.md";
        readonly digest: "9b350567ccc900dc1e5b9ff37d9e23329bc95085a9d4b6db88bf37d6eb433957";
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
        readonly digest: "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-experiment-tree/SKILL.md";
            readonly blob: "e888fc9d179ddfae87c4a0732224cf354a9c5430";
        };
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
        readonly digest: "a717080170cb7067bbe8361745b582c98e9091bbf3cc5d560242a06abeebf613";
        readonly resources: readonly [];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-git/SKILL.md";
            readonly blob: "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf";
        };
    }, {
        readonly id: "pi-research-code-debugging";
        readonly name: "pi-research-code-debugging";
        readonly description: "Use when debugging research code, failed development checks, incorrect metrics or artifacts, or adding a regression test before a code fix; reviewers inspect fixed evidence read-only.";
        readonly roles: readonly ["coordinator", "implementer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-code-debugging/SKILL.md";
        readonly digest: "03d5ccf4162e1ff94b9244b62c0c8dec38994ac3ba224b6248038dca22fe2ccf";
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
        readonly digest: "57665572f3405ee7436089865cc34b158e86fc22aa73dc131704ae655c872432";
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
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-evidence/SKILL.md";
            readonly blob: "2b15de716916abceb5cbf6a40e2cff75abc37cb1";
        };
    }, {
        readonly id: "pi-research-reports";
        readonly name: "pi-research-reports";
        readonly description: "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.";
        readonly roles: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
        readonly path: "skills/piresearch/pi-research-reports/SKILL.md";
        readonly digest: "4820d58829830192e36d2b2cbeff10e2ab7f45c82d0656af7b32813ce4a9d165";
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
        readonly description: "创建或修订真实LaTeX论文、预印本或章节草稿；也可仅检查固定TeX/Bib的引用结构和获准元数据，不改稿。沿用模板和配套资产，构建并交付真实结果；普通研究报告使用reports。";
        readonly roles: readonly ["coordinator", "writer", "reviewer"];
        readonly path: "skills/piresearch/pi-research-paper/SKILL.md";
        readonly digest: "9d899dc0a7ac224f90ca84512a72e25ecdd75b92eeefe31d13cf3d71de74b4b5";
        readonly resources: readonly [{
            readonly path: "assets/starter-main.tex";
            readonly digest: "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974";
        }, {
            readonly path: "assets/starter-refs.bib";
            readonly digest: "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9";
        }, {
            readonly path: "references/build-and-review.md";
            readonly digest: "a6edbec4972888ddfe3eddbcf396553fb2679096b0b2edbd0d38618491d92296";
        }, {
            readonly path: "references/scientific-review.md";
            readonly digest: "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c";
        }, {
            readonly path: "references/citation-integrity.md";
            readonly digest: "62707a85afba326207b612597f57e9883df2002e47f092aba71a668edc690e25";
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
        readonly digest: "a847808cdcdb9bec1488858a8a9b1b2e270fa7e4db740b4af5604a9f1b5f575b";
        readonly resources: readonly [{
            readonly path: "references/document-reading.md";
            readonly digest: "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140";
        }, {
            readonly path: "references/discovery-permissions.md";
            readonly digest: "cfc88ab5d3f28c876ab5e04ecb9bda138df57444726f04122fea7ca0057646cb";
        }, {
            readonly path: "references/systematic-review.md";
            readonly digest: "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda";
            readonly methodRequirements: readonly ["literature-identity"];
        }];
        readonly source: {
            readonly repository: "alphaXiv/OpenResearch";
            readonly commit: "3037f727e80e0ab20c61a87c613a50dde009a835";
            readonly path: "agent-skills/orx-lit-review/SKILL.md";
            readonly blob: "a64ea8d7f3ec04b4f325979951ba072bd74db3f8";
        };
    }];
    readonly manifestDigest: "cf8638daffd84643b72fd4bfaa298c8daf5eb0d2d36640985916cc57cae463da";
}, {
    readonly bundleId: "b149e69295f55d092fc7357b2d1134eefdd57bf7e78624ab6a2bc3bf62f17dd9";
    readonly skills: readonly [{
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
    readonly manifestDigest: "b149e69295f55d092fc7357b2d1134eefdd57bf7e78624ab6a2bc3bf62f17dd9";
}];
