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
}];
