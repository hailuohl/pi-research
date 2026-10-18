// Maintainer-generated reviewed release history. Never discover releases at runtime.
export const BUILTIN_RELEASES = [
    {
        "bundleId": "6683733f868b846a6bed3434bba1ff2bdceed99aece0538ac75fe1c70bbd89f2",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/openresearch/pi-research-overview/SKILL.md",
                "digest": "5a511f85b11b45d083747eb0d64b0e4396469aafdf0e70a56ed9589467f38806",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when a project is new, empty, imported, or needs a baseline or reproduction scope.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/openresearch/pi-research-create/SKILL.md",
                "digest": "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use when interpreting completed runs, planning a round, repairing, promoting, or stopping.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/openresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use when editing code, comparing a child, preparing a handoff, or avoiding shared-workspace conflicts.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/openresearch/pi-research-git/SKILL.md",
                "digest": "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use when proposing a team, splitting independent work, reviewing helper output, or handling a stalled team.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/openresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing, launching, cancelling, sizing, or reconciling an experiment run.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/openresearch/pi-research-compute/SKILL.md",
                "digest": "1e14da9bd14ea16cd36d38c57df9c454c1949de2a9b7586968fab2a79e23ccf3",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "6a216654ed6069e8959c2fd3a5b5cbaf2bb04e76c12efdde41cfed078a5c78b7"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "5b8a497ab023fac473b660b5cbf85961afb7d5de231aba955a11e1d65dfd2c62"
                    },
                    {
                        "path": "references/slurm.md",
                        "digest": "b3fd81092d8c18d4d1b9687c1e13e5fea71ee2b45166e7a51464731ac520bea2"
                    },
                    {
                        "path": "references/k8s.md",
                        "digest": "a321bac4fa039a0cde698e73201773da275098ee99610db7538a51b9462de097"
                    },
                    {
                        "path": "references/ray.md",
                        "digest": "404a3fcfdbe8a66c75d2169df2e006fc27071ade03dc9abd2b6c236bf0fc72a1"
                    },
                    {
                        "path": "references/hf.md",
                        "digest": "04dc0a6f797134afe4e8db41d554c2688dcac61d872731fa923a9ff4596d5854"
                    },
                    {
                        "path": "references/modal.md",
                        "digest": "841ab793672ec85a07fa5b5b566cb31485f2709a7c60a82e0bdcc7944d233dd7"
                    },
                    {
                        "path": "references/tinker.md",
                        "digest": "b747a1c81807e97135a3a579ea53d1b3ecc7fff0fa02ed39ff22e4eb5f3b10a8"
                    },
                    {
                        "path": "references/openresearch.md",
                        "digest": "81bcc82858ae56bb5d064529ae90aca99a7fb0ff27c058fe640a615a9453d728"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-instances",
                "name": "pi-research-instances",
                "description": "Use when a user asks for a persistent machine, provisioning, or an interactive remote workspace.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/openresearch/pi-research-instances/SKILL.md",
                "digest": "a3482be12289897c9d5a0c07c8bb6269ecaee3cd84d6a87ddb51c1cf9203e162",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-instances/SKILL.md",
                    "blob": "80bf26dc1634a4809fae9ee3d0c5598951258026"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use when reading logs, validating numerical claims, quoting papers, or checking stale evidence.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/openresearch/pi-research-evidence/SKILL.md",
                "digest": "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use when producing a report, comparison, durable research note, or end-of-round handoff.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/openresearch/pi-research-reports/SKILL.md",
                "digest": "722fb5b708289ccd369e789831ba816d5a957dd053e409e3fa2b018f03407936",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "Use when preparing a scientific plot, multi-panel figure, diagram, or figure audit.",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/openresearch/pi-research-figures/SKILL.md",
                "digest": "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs.",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/openresearch/pi-research-paper/SKILL.md",
                "digest": "de7dea0bda7027b4c315e25bc3697fb2e5b228174434ae11a2158661b6828022",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when reviewing a skill bundle, adding a research method, or selecting reusable templates.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/openresearch/pi-research-customize/SKILL.md",
                "digest": "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when recording a product bug, limitation, unexpected behavior, or requested capability.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/openresearch/pi-research-feedback/SKILL.md",
                "digest": "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "Use when searching literature, reading selected papers, or grounding scientific comparisons.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/openresearch/pi-research-lit-review/SKILL.md",
                "digest": "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "602fd69718ffe349b4ba2ce2531e8b3e427a27f826622da91f7ed070d7f5d367"
    },
    {
        "bundleId": "2a5141eda3efbe5934669fbc86fe95ad72e311c97303615d0d92dcfa78aa60cd",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/openresearch/pi-research-overview/SKILL.md",
                "digest": "5a511f85b11b45d083747eb0d64b0e4396469aafdf0e70a56ed9589467f38806",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when a project is new, empty, imported, or needs a baseline or reproduction scope.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/openresearch/pi-research-create/SKILL.md",
                "digest": "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use when interpreting completed runs, planning a round, repairing, promoting, or stopping.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/openresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use when editing code, comparing a child, preparing a handoff, or avoiding shared-workspace conflicts.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/openresearch/pi-research-git/SKILL.md",
                "digest": "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use when proposing a team, splitting independent work, reviewing helper output, or handling a stalled team.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/openresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing, launching, cancelling, sizing, or reconciling an experiment run.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/openresearch/pi-research-compute/SKILL.md",
                "digest": "1e14da9bd14ea16cd36d38c57df9c454c1949de2a9b7586968fab2a79e23ccf3",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "6a216654ed6069e8959c2fd3a5b5cbaf2bb04e76c12efdde41cfed078a5c78b7"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "5b8a497ab023fac473b660b5cbf85961afb7d5de231aba955a11e1d65dfd2c62"
                    },
                    {
                        "path": "references/slurm.md",
                        "digest": "b3fd81092d8c18d4d1b9687c1e13e5fea71ee2b45166e7a51464731ac520bea2"
                    },
                    {
                        "path": "references/k8s.md",
                        "digest": "a321bac4fa039a0cde698e73201773da275098ee99610db7538a51b9462de097"
                    },
                    {
                        "path": "references/ray.md",
                        "digest": "404a3fcfdbe8a66c75d2169df2e006fc27071ade03dc9abd2b6c236bf0fc72a1"
                    },
                    {
                        "path": "references/hf.md",
                        "digest": "04dc0a6f797134afe4e8db41d554c2688dcac61d872731fa923a9ff4596d5854"
                    },
                    {
                        "path": "references/modal.md",
                        "digest": "841ab793672ec85a07fa5b5b566cb31485f2709a7c60a82e0bdcc7944d233dd7"
                    },
                    {
                        "path": "references/tinker.md",
                        "digest": "b747a1c81807e97135a3a579ea53d1b3ecc7fff0fa02ed39ff22e4eb5f3b10a8"
                    },
                    {
                        "path": "references/openresearch.md",
                        "digest": "81bcc82858ae56bb5d064529ae90aca99a7fb0ff27c058fe640a615a9453d728"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-instances",
                "name": "pi-research-instances",
                "description": "Use when a user asks for a persistent machine, provisioning, or an interactive remote workspace.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/openresearch/pi-research-instances/SKILL.md",
                "digest": "a3482be12289897c9d5a0c07c8bb6269ecaee3cd84d6a87ddb51c1cf9203e162",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-instances/SKILL.md",
                    "blob": "80bf26dc1634a4809fae9ee3d0c5598951258026"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use when reading logs, validating numerical claims, quoting papers, or checking stale evidence.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/openresearch/pi-research-evidence/SKILL.md",
                "digest": "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use when producing a report, comparison, durable research note, or end-of-round handoff.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/openresearch/pi-research-reports/SKILL.md",
                "digest": "34e81e4131c0d357b0ffdbc8e08200b2d0c204552b986aba633ef0e760cbbced",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "Use when preparing a scientific plot, multi-panel figure, diagram, or figure audit.",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/openresearch/pi-research-figures/SKILL.md",
                "digest": "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs.",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/openresearch/pi-research-paper/SKILL.md",
                "digest": "b891b00397bb77733b91c7f168192a6bce576b3240c4f47f1f89e06f390ad1b4",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when reviewing a skill bundle, adding a research method, or selecting reusable templates.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/openresearch/pi-research-customize/SKILL.md",
                "digest": "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when recording a product bug, limitation, unexpected behavior, or requested capability.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/openresearch/pi-research-feedback/SKILL.md",
                "digest": "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "Use when searching literature, reading selected papers, or grounding scientific comparisons.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/openresearch/pi-research-lit-review/SKILL.md",
                "digest": "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "2a5141eda3efbe5934669fbc86fe95ad72e311c97303615d0d92dcfa78aa60cd"
    },
    {
        "bundleId": "344a44dcf73a8bcb2b2cdf5acf637f756c1763ef05c5ba464bc8285fa45a188b",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "5a511f85b11b45d083747eb0d64b0e4396469aafdf0e70a56ed9589467f38806",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when a project is new, empty, imported, or needs a baseline or reproduction scope.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use when interpreting completed runs, planning a round, repairing, promoting, or stopping.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use when editing code, comparing a child, preparing a handoff, or avoiding shared-workspace conflicts.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use when proposing a team, splitting independent work, reviewing helper output, or handling a stalled team.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing, launching, cancelling, sizing, or reconciling an experiment run.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "1e14da9bd14ea16cd36d38c57df9c454c1949de2a9b7586968fab2a79e23ccf3",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "6a216654ed6069e8959c2fd3a5b5cbaf2bb04e76c12efdde41cfed078a5c78b7"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "5b8a497ab023fac473b660b5cbf85961afb7d5de231aba955a11e1d65dfd2c62"
                    },
                    {
                        "path": "references/slurm.md",
                        "digest": "b3fd81092d8c18d4d1b9687c1e13e5fea71ee2b45166e7a51464731ac520bea2"
                    },
                    {
                        "path": "references/k8s.md",
                        "digest": "a321bac4fa039a0cde698e73201773da275098ee99610db7538a51b9462de097"
                    },
                    {
                        "path": "references/ray.md",
                        "digest": "404a3fcfdbe8a66c75d2169df2e006fc27071ade03dc9abd2b6c236bf0fc72a1"
                    },
                    {
                        "path": "references/hf.md",
                        "digest": "04dc0a6f797134afe4e8db41d554c2688dcac61d872731fa923a9ff4596d5854"
                    },
                    {
                        "path": "references/modal.md",
                        "digest": "841ab793672ec85a07fa5b5b566cb31485f2709a7c60a82e0bdcc7944d233dd7"
                    },
                    {
                        "path": "references/tinker.md",
                        "digest": "b747a1c81807e97135a3a579ea53d1b3ecc7fff0fa02ed39ff22e4eb5f3b10a8"
                    },
                    {
                        "path": "references/openresearch.md",
                        "digest": "81bcc82858ae56bb5d064529ae90aca99a7fb0ff27c058fe640a615a9453d728"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-instances",
                "name": "pi-research-instances",
                "description": "Use when a user asks for a persistent machine, provisioning, or an interactive remote workspace.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-instances/SKILL.md",
                "digest": "a3482be12289897c9d5a0c07c8bb6269ecaee3cd84d6a87ddb51c1cf9203e162",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-instances/SKILL.md",
                    "blob": "80bf26dc1634a4809fae9ee3d0c5598951258026"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use when reading logs, validating numerical claims, quoting papers, or checking stale evidence.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use when producing a report, comparison, durable research note, or end-of-round handoff.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "34e81e4131c0d357b0ffdbc8e08200b2d0c204552b986aba633ef0e760cbbced",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "Use when preparing a scientific plot, multi-panel figure, diagram, or figure audit.",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs.",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "b891b00397bb77733b91c7f168192a6bce576b3240c4f47f1f89e06f390ad1b4",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when reviewing a skill bundle, adding a research method, or selecting reusable templates.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when recording a product bug, limitation, unexpected behavior, or requested capability.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "Use when searching literature, reading selected papers, or grounding scientific comparisons.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "344a44dcf73a8bcb2b2cdf5acf637f756c1763ef05c5ba464bc8285fa45a188b"
    },
    {
        "bundleId": "547f5f0d9dc3a27db86a26d9747c8b102b73ccc5fb1073b80fba07c2f0fb2feb",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "5a511f85b11b45d083747eb0d64b0e4396469aafdf0e70a56ed9589467f38806",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when a project is new, empty, imported, or needs a baseline or reproduction scope.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use when interpreting completed runs, planning a round, repairing, promoting, or stopping.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use when editing code, comparing a child, preparing a handoff, or avoiding shared-workspace conflicts.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use when proposing a team, splitting independent work, reviewing helper output, or handling a stalled team.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing, launching, cancelling, sizing, or reconciling an experiment run.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "7f49408c562c43864ff8382971fab467344b2a095e413a93a045966bdae39a1d",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "b7bf1a0d303d53a73239d597a5415c302c77889d204e8cc35f75ea74a43a5298"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "466fb9db080bfbea1ad67044985d0405c4d8bde132a34c993eb6b55e704e6066"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-instances",
                "name": "pi-research-instances",
                "description": "Use when a user asks for a persistent machine, provisioning, or an interactive remote workspace.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-instances/SKILL.md",
                "digest": "b70d2802a9be595a72c505c3b4631487c4f5b9e7312f7c60ab9f4a11f90498cd",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-instances/SKILL.md",
                    "blob": "80bf26dc1634a4809fae9ee3d0c5598951258026"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use when reading logs, validating numerical claims, quoting papers, or checking stale evidence.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use when producing a report, comparison, durable research note, or end-of-round handoff.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "34e81e4131c0d357b0ffdbc8e08200b2d0c204552b986aba633ef0e760cbbced",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "Use when preparing a scientific plot, multi-panel figure, diagram, or figure audit.",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs.",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "b891b00397bb77733b91c7f168192a6bce576b3240c4f47f1f89e06f390ad1b4",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when reviewing a skill bundle, adding a research method, or selecting reusable templates.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when recording a product bug, limitation, unexpected behavior, or requested capability.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "Use when searching literature, reading selected papers, or grounding scientific comparisons.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "547f5f0d9dc3a27db86a26d9747c8b102b73ccc5fb1073b80fba07c2f0fb2feb"
    },
    {
        "bundleId": "ea9fd8e00f0fc2a5aca8c900f14ea2e97a0b613a6baa5a86111064646b364c5a",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "a616fa56550323e89283517ac75337bc4c79cdd6e8434d096162d4d6b99f595b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when a project is new, empty, imported, or needs a baseline or reproduction scope.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "3960cb2e658bb7208d04078c9ef9244839876a9d8d8e7d008ef73955299ccd0a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use when interpreting completed runs, planning a round, repairing, promoting, or stopping.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "cfbd4178626646e8be5e23cbaeb46439dbe5a2350a5d56b7be7894e9024408f6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use when editing code, comparing a child, preparing a handoff, or avoiding shared-workspace conflicts.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "32fc7a6560fbebd4c8488afcf5e4362839a4fad85ca4cb824c9ed475f678de91",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use when proposing a team, splitting independent work, reviewing helper output, or handling a stalled team.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "74e7cfec80151b5722d0e1c1daf75772032fc947a2e185cf7c640f562b4cfb56",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing, launching, cancelling, sizing, or reconciling an experiment run.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "7f49408c562c43864ff8382971fab467344b2a095e413a93a045966bdae39a1d",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "b7bf1a0d303d53a73239d597a5415c302c77889d204e8cc35f75ea74a43a5298"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "466fb9db080bfbea1ad67044985d0405c4d8bde132a34c993eb6b55e704e6066"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use when reading logs, validating numerical claims, quoting papers, or checking stale evidence.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "8a2eb3b79eea9f6ef66cea51fda81d0858fe29a059c657201ebfe8305523c7d3",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use when producing a report, comparison, durable research note, or end-of-round handoff.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "34e81e4131c0d357b0ffdbc8e08200b2d0c204552b986aba633ef0e760cbbced",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "Use when preparing a scientific plot, multi-panel figure, diagram, or figure audit.",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "104a0fbe5956ac53659ed85a18ca3a0b1fbf9c7b3dbfc584e55beef58c9ded01",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "e6c99ffe0b119ced12816571cc86e230bf13d422c967d9d6d57d753921b06ffc"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "340d38d97c74b326af4b0115339ef44f2560f5688e35316fbc367e166cd014ba"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "9cbf20b32934ab1d053cbf48e3023b0c4d905bfa7deab10a57fc13e6a8d232fd"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "e1938c26168ec217f9a1b4fc8f1ef8f39f2a2adcb64889008ffa001a267b8cd6"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "16c436e4d53b7eceb1ef3aeb5ed00e83639d989c810244d3c772cb50e3b7712a"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "e33af55a195e889d0dbda8ab4000d9b0847802f2826ddf8f235ff82f3ea6a734"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "Use when drafting a manuscript, preprint, LaTeX section, or checking references and compilation needs.",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "b891b00397bb77733b91c7f168192a6bce576b3240c4f47f1f89e06f390ad1b4",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when reviewing a skill bundle, adding a research method, or selecting reusable templates.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "1fcf97a9022ff9c5acbde566bd697380bf5d0b0fc061dd9bb837bd28ffbde5c6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when recording a product bug, limitation, unexpected behavior, or requested capability.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "7840904e65469f6aab637771caad1cd5a78d895eaed0c7460986f4c9396a50f5",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "Use when searching literature, reading selected papers, or grounding scientific comparisons.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "63b186ee963d40497a454bf98792599e5b7e0dc1374c98ed74e272f22e780808",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "ea9fd8e00f0fc2a5aca8c900f14ea2e97a0b613a6baa5a86111064646b364c5a"
    },
    {
        "bundleId": "5593bebb6fff813b6024746fee602370931e1da9961121c9feebaf244fea2326",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "171c8c52a3f6c6030186a7012b458deae1b32cabad5e7be21fa1c7119360de8b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "434e8ef80ff38899bc9fc00e1d065cd2860e3b415dce9828f871ada63576e708",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "9da51b89dee04b7862cb9f2a52ea73ea1194f659a9a1088e033bdf618bd568a0",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "4b7f5b525d6cb00353909b672eae3674f4d83523965f3d946ca0c13e3c0e85cf",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "c62ec4a09db90b2d05033539652715d39d71cc57ff1e69e28f848251ca30a70e",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "5a33728ecd0f7ee91e360749c4ae03d85bb0526f6027ad032fcc45b61b25cb33"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "ef026f3710e61d28e32bf01a5800332dd242c71f661d3b6fd4118f97cddcda83"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "246f0f316890b0a20e9d1fd11395c8508235490b22b47350198c9fb05ccd3b57",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use before writing or organizing durable reports, comparisons, figures, exported data, or end-of-work research handoffs.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "174b4dbaf9d177d11ba45c513563c3832f587284ea83555dda609096ba6b318a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用于论文级 matplotlib/TikZ 图：学习曲线、尺度律、基准与消融、Pareto、矩阵及方法图；保留尺寸、区间、矢量导出与自动审查。按图的问题读取一个参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "e7bc0704c5254c8451153f1a8fbaf8c60ec1927df8e808b43cff404b897f8f6e",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建真实LaTeX论文、预印本或章节草稿；模板、公式、图、引用、引擎和固定文稿构建，按当前角色与用户审批执行。普通报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "0512c87bb2dea06aaee360aae8a27fd09c0fa899823ebf212d7b708d801a5860",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when preparing or importing a reusable research skill, inspecting fixed skill versions/resources, or adapting a LaTeX template.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "c85db475aee1b461f91d86ac598bbe3a270b485c5f4194de84907d4846d5de94",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "c8b442130033810709d1b553e9f704fefe453a94da935e9c3ef917d0c1f63a50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "5593bebb6fff813b6024746fee602370931e1da9961121c9feebaf244fea2326"
    },
    {
        "bundleId": "4370f31787be05fc8687303c0ca0ca7052378d45de72e08d9562ab9783f855fc",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "6c0774405234125ebe6380eb9a5162c4a39aebf3fde272a98ff3864ea03b4ce1",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "434e8ef80ff38899bc9fc00e1d065cd2860e3b415dce9828f871ada63576e708",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "9da51b89dee04b7862cb9f2a52ea73ea1194f659a9a1088e033bdf618bd568a0",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "4b7f5b525d6cb00353909b672eae3674f4d83523965f3d946ca0c13e3c0e85cf",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "c62ec4a09db90b2d05033539652715d39d71cc57ff1e69e28f848251ca30a70e",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "5a33728ecd0f7ee91e360749c4ae03d85bb0526f6027ad032fcc45b61b25cb33"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "ef026f3710e61d28e32bf01a5800332dd242c71f661d3b6fd4118f97cddcda83"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "246f0f316890b0a20e9d1fd11395c8508235490b22b47350198c9fb05ccd3b57",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use before writing or organizing durable reports, comparisons, figures, exported data, or end-of-work research handoffs.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "174b4dbaf9d177d11ba45c513563c3832f587284ea83555dda609096ba6b318a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用于论文级 matplotlib/TikZ 图：学习曲线、尺度律、基准与消融、Pareto、矩阵及方法图；保留尺寸、区间、矢量导出与自动审查。按图的问题读取一个参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "e7bc0704c5254c8451153f1a8fbaf8c60ec1927df8e808b43cff404b897f8f6e",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建真实LaTeX论文、预印本或章节草稿；模板、公式、图、引用、引擎和固定文稿构建，按当前角色与用户审批执行。普通报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "683f75255ae9eb282631a221f0ff4f1000c4c69a2be603a1d5b3c81774091c98",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when preparing or importing a reusable research skill, inspecting fixed skill versions/resources, or adapting a LaTeX template.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "8f145970a35028f76b72842dd130d4206a323593656129b0e83b3915f43e7f0d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "c8b442130033810709d1b553e9f704fefe453a94da935e9c3ef917d0c1f63a50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "4370f31787be05fc8687303c0ca0ca7052378d45de72e08d9562ab9783f855fc"
    },
    {
        "bundleId": "ce58da58ca468628efe224f196f4fa9b756095484847de5f253e78f2fe0bbc3a",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "69b11f26e0ff1120bc9868b60d3da2feeced0ad68d33da1a1d4c4045353f6c70",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "a24dac45022b2de3a376cbedb4bac0c43410344c5072e218a5b9e1a1da639742",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "9da51b89dee04b7862cb9f2a52ea73ea1194f659a9a1088e033bdf618bd568a0",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "faf3f7254996a0dda1ab063c3fad9f0f4ad2d1b3e96357707fd879d919d14783",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "c62ec4a09db90b2d05033539652715d39d71cc57ff1e69e28f848251ca30a70e",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "5a33728ecd0f7ee91e360749c4ae03d85bb0526f6027ad032fcc45b61b25cb33"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "ef026f3710e61d28e32bf01a5800332dd242c71f661d3b6fd4118f97cddcda83"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "246f0f316890b0a20e9d1fd11395c8508235490b22b47350198c9fb05ccd3b57",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use before writing or organizing durable reports, comparisons, figures, exported data, or end-of-work research handoffs.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "174b4dbaf9d177d11ba45c513563c3832f587284ea83555dda609096ba6b318a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用于论文级 matplotlib/TikZ 图：学习曲线、尺度律、基准与消融、Pareto、矩阵及方法图；保留尺寸、区间、矢量导出与自动审查。按图的问题读取一个参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "e7bc0704c5254c8451153f1a8fbaf8c60ec1927df8e808b43cff404b897f8f6e",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建真实LaTeX论文、预印本或章节草稿；模板、公式、图、引用、引擎和固定文稿构建，按当前角色与用户审批执行。普通报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "683f75255ae9eb282631a221f0ff4f1000c4c69a2be603a1d5b3c81774091c98",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when preparing or importing a reusable research skill, inspecting fixed skill versions/resources, or adapting a LaTeX template.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "8f145970a35028f76b72842dd130d4206a323593656129b0e83b3915f43e7f0d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "c8b442130033810709d1b553e9f704fefe453a94da935e9c3ef917d0c1f63a50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "ce58da58ca468628efe224f196f4fa9b756095484847de5f253e78f2fe0bbc3a"
    },
    {
        "bundleId": "14e1170adc7bf3ab02a4b37a44172082d5853732fc1df1bd0aac9fbde70479cb",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "7acc3e3fc42e09575add132a0b4d85ae626e3ea8fabd68988129ab410e964151",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "472161f2c32eea89141294333d6398a40b08879c8b68d728078f417d315d8286",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "9699b2e29f9ae7748b202889d08ff6ace49d69b0c9cf9587d430e3f4b3e7b05a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "faf3f7254996a0dda1ab063c3fad9f0f4ad2d1b3e96357707fd879d919d14783",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "b0ce03bd9dedea3fd3fb2cdc55ad8edab8043c153bcd58e9dc0a3bcc7b4fd680",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "d345d7977a3c9393b554cb7210ec8ea88d5859393c800ad16bc635bd21f0cafb"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "b9b52c318cea1a61849601f2f0eb373c176f4787bb22ce5d2d5298a4aeb56764"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "ff0703e9013deecedf2088715af99f9fa481783d09d425c52e173f1039866e09",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use before writing or organizing durable reports, comparisons, figures, exported data, or end-of-work research handoffs.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "174b4dbaf9d177d11ba45c513563c3832f587284ea83555dda609096ba6b318a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用于论文级 matplotlib/TikZ 图：学习曲线、尺度律、基准与消融、Pareto、矩阵及方法图；保留尺寸、区间、矢量导出与自动审查。按图的问题读取一个参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "e7bc0704c5254c8451153f1a8fbaf8c60ec1927df8e808b43cff404b897f8f6e",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建真实LaTeX论文、预印本或章节草稿；模板、公式、图、引用、引擎和固定文稿构建，按当前角色与用户审批执行。普通报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "683f75255ae9eb282631a221f0ff4f1000c4c69a2be603a1d5b3c81774091c98",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when preparing or importing a reusable research skill, inspecting fixed skill versions/resources, or adapting a LaTeX template.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "8f145970a35028f76b72842dd130d4206a323593656129b0e83b3915f43e7f0d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "c8b442130033810709d1b553e9f704fefe453a94da935e9c3ef917d0c1f63a50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "14e1170adc7bf3ab02a4b37a44172082d5853732fc1df1bd0aac9fbde70479cb"
    },
    {
        "bundleId": "8f766452c9ab9af8b19245b323cfad8bfb5f04fd5e0ba08c321946073e96ef52",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "b62948f162bb359282b24925818a5b5661460934043a56c1f5fda860b7f3094b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "472161f2c32eea89141294333d6398a40b08879c8b68d728078f417d315d8286",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "9699b2e29f9ae7748b202889d08ff6ace49d69b0c9cf9587d430e3f4b3e7b05a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "faf3f7254996a0dda1ab063c3fad9f0f4ad2d1b3e96357707fd879d919d14783",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "83876eb1ab092dc06348f71f403fe0736a466dffbb701eb27c2677f236a024a0",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "ff0703e9013deecedf2088715af99f9fa481783d09d425c52e173f1039866e09",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use before writing or organizing durable reports, comparisons, figures, exported data, or end-of-work research handoffs.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "174b4dbaf9d177d11ba45c513563c3832f587284ea83555dda609096ba6b318a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用于论文级 matplotlib/TikZ 图：学习曲线、尺度律、基准与消融、Pareto、矩阵及方法图；保留尺寸、区间、矢量导出与自动审查。按图的问题读取一个参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "e7bc0704c5254c8451153f1a8fbaf8c60ec1927df8e808b43cff404b897f8f6e",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建真实LaTeX论文、预印本或章节草稿；模板、公式、图、引用、引擎和固定文稿构建，按当前角色与用户审批执行。普通报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "683f75255ae9eb282631a221f0ff4f1000c4c69a2be603a1d5b3c81774091c98",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when preparing or importing a reusable research skill, inspecting fixed skill versions/resources, or adapting a LaTeX template.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "8f145970a35028f76b72842dd130d4206a323593656129b0e83b3915f43e7f0d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "c8b442130033810709d1b553e9f704fefe453a94da935e9c3ef917d0c1f63a50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "8f766452c9ab9af8b19245b323cfad8bfb5f04fd5e0ba08c321946073e96ef52"
    },
    {
        "bundleId": "deacf6d3accce4602e8c28974a85dbebf56dd021e4d48672a2ddf0b0b6ce5715",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "e761291278715604063c5ebf3f3ea2211c02094a3a3b6b658247e540cbf992bb",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "472161f2c32eea89141294333d6398a40b08879c8b68d728078f417d315d8286",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "9699b2e29f9ae7748b202889d08ff6ace49d69b0c9cf9587d430e3f4b3e7b05a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "8293f65371e9cbadf5c08b11f75b20f3bd7cc1ac89101fa79d2d1b910454514a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "83876eb1ab092dc06348f71f403fe0736a466dffbb701eb27c2677f236a024a0",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "ff0703e9013deecedf2088715af99f9fa481783d09d425c52e173f1039866e09",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use before writing or organizing durable reports, comparisons, figures, exported data, or end-of-work research handoffs.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "174b4dbaf9d177d11ba45c513563c3832f587284ea83555dda609096ba6b318a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用于论文级 matplotlib/TikZ 图：学习曲线、尺度律、基准与消融、Pareto、矩阵及方法图；保留尺寸、区间、矢量导出与自动审查。按图的问题读取一个参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "e7bc0704c5254c8451153f1a8fbaf8c60ec1927df8e808b43cff404b897f8f6e",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建真实LaTeX论文、预印本或章节草稿；模板、公式、图、引用、引擎和固定文稿构建，按当前角色与用户审批执行。普通报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "683f75255ae9eb282631a221f0ff4f1000c4c69a2be603a1d5b3c81774091c98",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when preparing or importing a reusable research skill, inspecting fixed skill versions/resources, or adapting a LaTeX template.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "8f145970a35028f76b72842dd130d4206a323593656129b0e83b3915f43e7f0d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "c8b442130033810709d1b553e9f704fefe453a94da935e9c3ef917d0c1f63a50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "deacf6d3accce4602e8c28974a85dbebf56dd021e4d48672a2ddf0b0b6ce5715"
    },
    {
        "bundleId": "49efbc47bbccc6d19c12d60d77b9721219865dfce73a1f50552ac87bae296ca8",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "6bc4ce36371d4d0a8137e0630c5865a89bdb9c80c9eaaa0f7ed15956166ef7f5",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "472161f2c32eea89141294333d6398a40b08879c8b68d728078f417d315d8286",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "9699b2e29f9ae7748b202889d08ff6ace49d69b0c9cf9587d430e3f4b3e7b05a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "8293f65371e9cbadf5c08b11f75b20f3bd7cc1ac89101fa79d2d1b910454514a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "83876eb1ab092dc06348f71f403fe0736a466dffbb701eb27c2677f236a024a0",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "ff0703e9013deecedf2088715af99f9fa481783d09d425c52e173f1039866e09",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use before writing or organizing durable reports, comparisons, figures, exported data, or end-of-work research handoffs.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "780305096db188625ef38e5c5dfd291b87da4b19529602a881395eacee3f458f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用于论文级 matplotlib/TikZ 图：学习曲线、尺度律、基准与消融、Pareto、矩阵及方法图；保留尺寸、区间、矢量导出与自动审查。按图的问题读取一个参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "ac06e5dec2d774140ad74bb44eac2cdcd6c443dec2183bfca7002d38a8bcd6cf",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建真实LaTeX论文、预印本或章节草稿；模板、公式、图、引用、引擎和固定文稿构建，按当前角色与用户审批执行。普通报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "c001003a1f00d1092036dd7dd7c8e8f8383a083a03c67a9796519a3fed1b2558",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when preparing or importing a reusable research skill, inspecting fixed skill versions/resources, or adapting a LaTeX template.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "8f145970a35028f76b72842dd130d4206a323593656129b0e83b3915f43e7f0d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "c8b442130033810709d1b553e9f704fefe453a94da935e9c3ef917d0c1f63a50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "49efbc47bbccc6d19c12d60d77b9721219865dfce73a1f50552ac87bae296ca8"
    },
    {
        "bundleId": "50e285cf2ea51e8dfa1543894bfce13e14969ff3924f9dfd0ed6599377bb6664",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; cardinal rules and scoped tool reference.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "281e10f71e0910c100c197721f5c04856a9aa02a2062a7a9f3bae507be54d7a4",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "472161f2c32eea89141294333d6398a40b08879c8b68d728078f417d315d8286",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "9699b2e29f9ae7748b202889d08ff6ace49d69b0c9cf9587d430e3f4b3e7b05a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "8293f65371e9cbadf5c08b11f75b20f3bd7cc1ac89101fa79d2d1b910454514a",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "e7494bb3780e578ad575d4c7ea4d1a1c0ae021506ec80cb6dea76eb7236ed03d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "83876eb1ab092dc06348f71f403fe0736a466dffbb701eb27c2677f236a024a0",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Use before launching a run whose output must be judged, reading logs or numerical evidence, validating run-derived claims, or reporting results.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "cf2d86e86496177c7bb25d6ffbbe8757eff5be8bf8cc62fbf10b401593144bf2",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Use before writing or organizing durable reports, comparisons, figures, exported data, or end-of-work research handoffs.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "780305096db188625ef38e5c5dfd291b87da4b19529602a881395eacee3f458f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用于论文级 matplotlib/TikZ 图：学习曲线、尺度律、基准与消融、Pareto、矩阵及方法图；保留尺寸、区间、矢量导出与自动审查。按图的问题读取一个参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "ac06e5dec2d774140ad74bb44eac2cdcd6c443dec2183bfca7002d38a8bcd6cf",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建真实LaTeX论文、预印本或章节草稿；模板、公式、图、引用、引擎和固定文稿构建，按当前角色与用户审批执行。普通报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "f2c5a1ea072459d744546362cf4876e8d9d9f947540340d21137310f65fa1355",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "Use when preparing or importing a reusable research skill, inspecting fixed skill versions/resources, or adapting a LaTeX template.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "8f145970a35028f76b72842dd130d4206a323593656129b0e83b3915f43e7f0d",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "2b73d9777a60beb30cc2100495512cd458427745a8bb2e99c26f8fed140e3546",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "5186f5aa17c2986014900aaf9783b4097dfe8c9d8de37aec8db0b15d1f54803b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "50e285cf2ea51e8dfa1543894bfce13e14969ff3924f9dfd0ed6599377bb6664"
    },
    {
        "bundleId": "cffee2e2842e5cb4c849f99f81f855043ef49237f531ba681f29e99f46ece406",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "5dce809cbfd343c334c44f3a7f60c89af110257b5d2bdafb2a474b7bd3941526",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "60cbce9cf923348e0adc58213067b33ec2443033e3878f321bc3dfc694682ec1",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "c434396140dd6b5ca2b08992c8e4dd8378fdad13dab2b1544778c20200b37ff7",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "fccd118364bb0dad4ab83b0ebdd3d11513c9374c8ce990c6de31f111e1f0dded",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "2879ddda256e1d9e599c7463852ecca6dddfc668c74d2797185b797f69d87cc4",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "6ce6fd9d700b039cb0801fc6928b63b732e29634a397189f30fc8cdf108c54c2"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "1ade7cc681e0cce6a56fb2c594010eda2107a6bf8de2556bc58382ef25ed1832",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "4eea38878fa93e91f050601e4e889355558c9b6947e5ce65db7505a69a912814",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "4070d5e0ffe1e437e80aa993a488b614c44fd191e0f3dfdabf586b8b35084b65",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "4a62eae072f09ba2aa48d95baf5f1388ebc334130c49c159be7c9518551cfc6f"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "cffee2e2842e5cb4c849f99f81f855043ef49237f531ba681f29e99f46ece406"
    },
    {
        "bundleId": "7491426e81c2bd54888da1bd03fa517c8c001a981d4356e92024f50259ef863b",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "409b304acf143a33b0e6139abdb3d0079b8b2a553dadaf300af85ccf934c18e7",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "012b7aecfd73e0400b99e088b0153018077d0142b0886642068a745409fa4a23",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "0f86a87c8a61b8aaba8413146c991098062c04ec9e52d99fbd4b8c0e53dbc636"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "7491426e81c2bd54888da1bd03fa517c8c001a981d4356e92024f50259ef863b"
    },
    {
        "bundleId": "2c41de1dd7daeef40043ec76e4a5eeaa6819b575987d3c884c476b434424d5f7",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "2b6dc0328698eb2786b3442d1d6e20e92c0c7ed04065b22e73dfe7d957bd64f9",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "7854b3113fe080f5e422d601428c968dddc6efcf4f8344ea8a565118e4e51759",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "2c41de1dd7daeef40043ec76e4a5eeaa6819b575987d3c884c476b434424d5f7"
    },
    {
        "bundleId": "13b287f05de2899138026917bdecd79f967bb9813cda2bf9ac745fb2fc307509",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "2b6dc0328698eb2786b3442d1d6e20e92c0c7ed04065b22e73dfe7d957bd64f9",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "fe4edcda3b213e8ea097ef1706a638c7173f069ff02e9248b00dfe51c6122c7f",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "4d395133357e113b6c46c295a52a276a935ce0d4a2aff47ed6bcfc37ce429544"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "13b287f05de2899138026917bdecd79f967bb9813cda2bf9ac745fb2fc307509"
    },
    {
        "bundleId": "5f4e3bf3539b3a197bd5a2d71e43d1f8152fc2884afcaaf9a316c5b3f6ac7ac2",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "2b6dc0328698eb2786b3442d1d6e20e92c0c7ed04065b22e73dfe7d957bd64f9",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "4ade8f750ab24cfe9d19b1e7d72695f4bcc450d5fe885a32950210d833c95917"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "ba4da34a1fae6379559a79657e4ab1a890b86335ba9937a9d4c932604eaf80c2"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "0660ff2bd55da3851a44b871028b4482a1b19a2852cf6881e02406487c425bfe"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "fe4edcda3b213e8ea097ef1706a638c7173f069ff02e9248b00dfe51c6122c7f",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "6bb7ed4d485c581d9a1eab01b925e5ae5d3d4066d6a678551e0592a1b221092f"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "5f4e3bf3539b3a197bd5a2d71e43d1f8152fc2884afcaaf9a316c5b3f6ac7ac2"
    },
    {
        "bundleId": "4e1944bb74918d76764c87cd63cdb746122c7ab0c0cf73d87dd829a7365070b0",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "2b6dc0328698eb2786b3442d1d6e20e92c0c7ed04065b22e73dfe7d957bd64f9",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "7854b3113fe080f5e422d601428c968dddc6efcf4f8344ea8a565118e4e51759",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "4e1944bb74918d76764c87cd63cdb746122c7ab0c0cf73d87dd829a7365070b0"
    },
    {
        "bundleId": "5f147a56da6ba9ad7e665a7dfb5bcbe08ab9818a2c1645c6c5be325f0703df04",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "b787b1b6053155cc860027b720494c73adc41f474c4588bab807250d2bd8bb07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "Use before the first launch, planning or changing experiments, shaping rounds, interpreting completions, repairing, promoting, stopping, or reporting progress.",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "b30dfc80f3f5667100b6135fe91bd098b7bc03a5b1e5aa8d4aa22c2fc7823b0b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "Design verifiable run outputs and check logs or source evidence before judging claims or writing results; distinguish measurements, reported values, image observations, and interpretation.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "d9543d251a007a5de6ab2b6fdeec1c2380ec31cf84744ad43d6d9ceab0cefea9",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "2b6dc0328698eb2786b3442d1d6e20e92c0c7ed04065b22e73dfe7d957bd64f9",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "a62fe00df21805747b4741b14be6bb51f54d49c07ca6d1c2c03c7c56ea45e08b",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "fe4edcda3b213e8ea097ef1706a638c7173f069ff02e9248b00dfe51c6122c7f",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "6bb7ed4d485c581d9a1eab01b925e5ae5d3d4066d6a678551e0592a1b221092f"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "484dd1258f7afbf9af05a59220b42f94e21544df7b5ab94850da4a8c5082c396",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "5f147a56da6ba9ad7e665a7dfb5bcbe08ab9818a2c1645c6c5be325f0703df04"
    },
    {
        "bundleId": "1a4077f0830b90bb503e98fc1968a0171caa8136bbb35645487206c484b384e7",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "c7074be92ec9bfc86f455d5310bf037b3fbde7bcb6af784f7e9b7baa172b4f50",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "384286676f9d0bf9735e90cd1a626b542830941de6eb81c05bf404f92d8abb58",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "f1e7a22064392cdca2e0542f3bc41761269ec4f84431202c9fadf15fd1e411ea"
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "d6a104044ae5801bfe04fcc47f6cae4a30c3ee55346aa552deaccbf4a75c5d2b"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "b522415de2ed40d9e9d47a6596760818a6a24e82cc937f954945a8a5dc89cfa8"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "a775882f5bc3f76f9ff5b03e4d2271616c87bfddad2fc08e50137f2df866a9a2",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "f5c10c4f52c32a3d08ade671bbaaba2ac9fedd9d452516129809024227a5de5a"
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "04fc291850cabe3f73aae2f0e8d3554fd3b6cffe79989e4224961d061e025a8d"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "5964657e879eb6a9a10be78a820a9f5fa5e20e3e501d5776367a24ffa18363a9"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "2aebbef9046afe6c18f67c08b0bd554879527720764a5534de7c26bc8c07aacb",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "056ebe41093feb81cb9b222b70f09eb852b176d6b5b3be54f46ee73ac1a2f3f6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "1a4077f0830b90bb503e98fc1968a0171caa8136bbb35645487206c484b384e7"
    },
    {
        "bundleId": "102e4006ccf2cf55439402e59771014af258268d3ed4416ca53c1e9a74d8bdfa",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "de77f83ce10aa39844572518b273f1bac1ebea447a063630eb2bb0b683a124cc",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "384286676f9d0bf9735e90cd1a626b542830941de6eb81c05bf404f92d8abb58",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "f1e7a22064392cdca2e0542f3bc41761269ec4f84431202c9fadf15fd1e411ea"
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "d6a104044ae5801bfe04fcc47f6cae4a30c3ee55346aa552deaccbf4a75c5d2b"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "b522415de2ed40d9e9d47a6596760818a6a24e82cc937f954945a8a5dc89cfa8"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "a775882f5bc3f76f9ff5b03e4d2271616c87bfddad2fc08e50137f2df866a9a2",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "f5c10c4f52c32a3d08ade671bbaaba2ac9fedd9d452516129809024227a5de5a"
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "04fc291850cabe3f73aae2f0e8d3554fd3b6cffe79989e4224961d061e025a8d"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "5964657e879eb6a9a10be78a820a9f5fa5e20e3e501d5776367a24ffa18363a9"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "2aebbef9046afe6c18f67c08b0bd554879527720764a5534de7c26bc8c07aacb",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "056ebe41093feb81cb9b222b70f09eb852b176d6b5b3be54f46ee73ac1a2f3f6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "102e4006ccf2cf55439402e59771014af258268d3ed4416ca53c1e9a74d8bdfa"
    },
    {
        "bundleId": "ee525c7337715b07f1382494158f6eeaa3984e48b251d2c313478a179043b009",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "6404a908a6acc2817fdc5c8d6d89dc46752a70039cdde1f66158a007088cf7f6",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "384286676f9d0bf9735e90cd1a626b542830941de6eb81c05bf404f92d8abb58",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "bdc8109f57f670c4030ba30fc42546ab312e01f1008a2e7642b23fedac40e6d8"
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "65e021eff940babd846d42f5cc82c62f0bc8c1fba06f3aac1660a62ad9fc8ca4"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "a775882f5bc3f76f9ff5b03e4d2271616c87bfddad2fc08e50137f2df866a9a2",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "be7a5c25bc561ea0872b13fa0c57aedc9de61df0166367efd5acd2db963f71d6"
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "22231a0885d936564f494bd0ed255577ed6a44b088dda6f513f1b9c77d49539f"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "858d0ad853ece3593850ecd7976c704e94ca0034e15236e15287ab9686e3ad62"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "ee525c7337715b07f1382494158f6eeaa3984e48b251d2c313478a179043b009"
    },
    {
        "bundleId": "65b19e243a1b0571def4f1c664a47d1e723626e8242944c89c057d01f899b620",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "39575e3973d6849826cd939749ad7ea06b6520d5bf7cb27b0f7130f7cd99a2e1",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "384286676f9d0bf9735e90cd1a626b542830941de6eb81c05bf404f92d8abb58",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "bdc8109f57f670c4030ba30fc42546ab312e01f1008a2e7642b23fedac40e6d8"
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                }
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "0d9f486de92ff1fdb2fd888c7356f21fb0f4ba96b108f8a1e450b129064b0d07",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "5b8062350f3886c0b3b77858a05cb21e2548d5fa0697c4a6068a9ea71bb7a686",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "21e17af76ce4dafa290ec0d9cf9001def138fc626b761b6a0fb8c256e606a236"
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "999f4d46f7f1544f7a9c34faabd7efe32e627c320ce9c4a4da0e4f493a547235"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "65b19e243a1b0571def4f1c664a47d1e723626e8242944c89c057d01f899b620"
    },
    {
        "bundleId": "40fedddf46a128cf3e845f25710bb98d1ddb68154949ca1c55341cebecdc02bb",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "25fde392a4d01edb7592dfec299cd9e22e7485e82e9bda8f26491b3802973019",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "bdc8109f57f670c4030ba30fc42546ab312e01f1008a2e7642b23fedac40e6d8"
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                },
                "prerequisites": [
                    {
                        "skillId": "pi-research-evidence",
                        "resource": "references/scientific-critical-thinking.md"
                    }
                ]
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "e1b026bc0c13def7f9b56a7deccf6a9979a61408cb075f7da9c079be5a06b38c",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "4063f3eadbcfdac17271c69dc5d2400c39fdc191457b4ac3c7cc94f9b53171ac",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "21e17af76ce4dafa290ec0d9cf9001def138fc626b761b6a0fb8c256e606a236"
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "999f4d46f7f1544f7a9c34faabd7efe32e627c320ce9c4a4da0e4f493a547235"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "40fedddf46a128cf3e845f25710bb98d1ddb68154949ca1c55341cebecdc02bb"
    },
    {
        "bundleId": "eaedaaa0df1a48559bdc26b5020a94b4c98877db6973c29dc6c4e6000b8c0d95",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "e9af70cce6ed4a7e342bc29ad633667f2838d7ca7f1bc679e4ba1f669db91830",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "bdc8109f57f670c4030ba30fc42546ab312e01f1008a2e7642b23fedac40e6d8"
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                },
                "prerequisites": [
                    {
                        "skillId": "pi-research-evidence",
                        "resource": "references/scientific-critical-thinking.md"
                    }
                ]
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "26c5e1874c5b156cc908a98aab082bf87f9b629b08b5639bf356c23728f22e85",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "e2b5d6073074d47b07b5810d37f36de380681c3d4617e554f5534d7386552f12",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "21e17af76ce4dafa290ec0d9cf9001def138fc626b761b6a0fb8c256e606a236"
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "999f4d46f7f1544f7a9c34faabd7efe32e627c320ce9c4a4da0e4f493a547235"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "eaedaaa0df1a48559bdc26b5020a94b4c98877db6973c29dc6c4e6000b8c0d95"
    },
    {
        "bundleId": "c3c9adcca6b4ece0df4ad5ca3adaf634a115b3b4e0b5998e386d4e2d8b343434",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "7701b568d5f020a1a8d41fb2db9c632e57c8bcf60bf2cd4853ba8c9b21cdf725",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "f0850e3293d4662e22422f4083d89bd916579b1610fac93361d1c92a7824978f",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                },
                "prerequisites": [
                    {
                        "skillId": "pi-research-evidence",
                        "resource": "references/scientific-critical-thinking.md"
                    }
                ]
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "9eaade7ee68ce731fc9f25480b0cd1420b9f686fd4f4607501d94cbbde90a6e0",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "e2b5d6073074d47b07b5810d37f36de380681c3d4617e554f5534d7386552f12",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "7cee56917511130eba6b53068dbb51d512253c0f34b2dc84d55f8f78b5c25f18",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda",
                        "methodRequirements": [
                            "literature-identity"
                        ]
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "c3c9adcca6b4ece0df4ad5ca3adaf634a115b3b4e0b5998e386d4e2d8b343434"
    },
    {
        "bundleId": "bd2c000f20c49ee33caccb0d83dac71e212634d8fd42809bf53ed11b2e724441",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "03dab155c69e0f23820c57a3a259539a23d527a7cf123fed3e8b17ff9fb6d5ac",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "84909fa0fe965dff444150f0d7aaf4ba0aadf87701e47908e406f1b57878250f",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                },
                "prerequisites": [
                    {
                        "skillId": "pi-research-evidence",
                        "resource": "references/scientific-critical-thinking.md"
                    }
                ]
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "25b19e440143182210cdf302a5f6a9e751d8a3269edc4e3f2b3974a3a82b5fe4",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "e2b5d6073074d47b07b5810d37f36de380681c3d4617e554f5534d7386552f12",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "60e639ea43b601a037eaf6900ee8276c8a3c78bdc0d4b9dca4b3e7a556f56059",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda",
                        "methodRequirements": [
                            "literature-identity"
                        ]
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "bd2c000f20c49ee33caccb0d83dac71e212634d8fd42809bf53ed11b2e724441"
    },
    {
        "bundleId": "6d6bd5b661a6fb02d0e3941878ff5a57b5540ce033915f79e8e15684a6a8e931",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "67076823af6202b545bfbdfe18044b81e9f9ce87212e6a26c206a9d219d727ea",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "3fb47a4a4f8aefb2c987cd4611e308c29380eaa4a8a48d6865f535e3dd0838b3",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                },
                "prerequisites": [
                    {
                        "skillId": "pi-research-evidence",
                        "resource": "references/scientific-critical-thinking.md"
                    }
                ]
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "6c518112c28c069deb46ac7b35da1a7a1a9aaa729197d2e65f024f22ec890988",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "e2b5d6073074d47b07b5810d37f36de380681c3d4617e554f5534d7386552f12",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "f823c235a71db649fdcedac1880b0b8b2e6cbd629efac55d030701dfd6288128",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/paired-polynomial-comparison.md",
                        "digest": "d563c6b2ba105d1b94700803f57ee636d0a972a69d175cb7080ee6377596c207",
                        "methodRequirements": [
                            "structured-paired-protocol"
                        ]
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda",
                        "methodRequirements": [
                            "literature-identity"
                        ]
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "6d6bd5b661a6fb02d0e3941878ff5a57b5540ce033915f79e8e15684a6a8e931"
    },
    {
        "bundleId": "cc80014242e5cd4e3489d0cf9e6dbf2a5361b18c8fd347e20ca3f889ba7e9214",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "67076823af6202b545bfbdfe18044b81e9f9ce87212e6a26c206a9d219d727ea",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "3fb47a4a4f8aefb2c987cd4611e308c29380eaa4a8a48d6865f535e3dd0838b3",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                },
                "prerequisites": [
                    {
                        "skillId": "pi-research-evidence",
                        "resource": "references/scientific-critical-thinking.md"
                    }
                ]
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "6c518112c28c069deb46ac7b35da1a7a1a9aaa729197d2e65f024f22ec890988",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "e2b5d6073074d47b07b5810d37f36de380681c3d4617e554f5534d7386552f12",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "f823c235a71db649fdcedac1880b0b8b2e6cbd629efac55d030701dfd6288128",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/paired-polynomial-comparison.md",
                        "digest": "e2d0df40251d23396a051a694fcd7f74edc0f73af419f4a4fdb8944877c32815",
                        "methodRequirements": [
                            "structured-paired-protocol"
                        ]
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda",
                        "methodRequirements": [
                            "literature-identity"
                        ]
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "cc80014242e5cd4e3489d0cf9e6dbf2a5361b18c8fd347e20ca3f889ba7e9214"
    },
    {
        "bundleId": "bd3c61039758b0b9e6707605fd8a7753de4e8e8b6c4bd6fc469597c48d29aa9f",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "1bae37997d13b740a1020bd95ef88138411e6899f124441c5a81eb8066e09abf",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "a0aecd732223d685039031147821b11074b0306cbd960a4e2ac83dc6cd1cbb72",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                },
                "prerequisites": [
                    {
                        "skillId": "pi-research-evidence",
                        "resource": "references/scientific-critical-thinking.md"
                    }
                ]
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "db281259c4b6fc5a0ed461b469b950e11500c62180630372fba911d97acda784",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "360adc5b6ee62d08cecc290c17660df48ecaffc28addb2d814d61994434f2f0c",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "4b94c40e5b2fd76e8d2e9f7c56752ab9128c842787418f7937cdf47127fc44d7",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/paired-polynomial-comparison.md",
                        "digest": "1eba414b008acfcbbed5f696e2d057370cafe298c341d06f8610b6a594104b16",
                        "methodRequirements": [
                            "structured-paired-protocol",
                            "closed-paired-evidence"
                        ]
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; use for analysis handoffs, fixed report records, or local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "c1a90173c7d48abfc6d846017ace8ebafdf01ed0dab4e26a9a5fe1fa9d51de47",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                }
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda",
                        "methodRequirements": [
                            "literature-identity"
                        ]
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "bd3c61039758b0b9e6707605fd8a7753de4e8e8b6c4bd6fc469597c48d29aa9f"
    },
    {
        "bundleId": "4f49f6cde539fd582c1c8d2caa8bca4f937457ea68c14ccbb79a3219ff2c5091",
        "skills": [
            {
                "id": "pi-research-overview",
                "name": "pi-research-overview",
                "description": "Use when starting, resuming, or handing over research in Pi Research; choose the workflow for the user's goal and preserve the cardinal research rules.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-overview/SKILL.md",
                "digest": "1bae37997d13b740a1020bd95ef88138411e6899f124441c5a81eb8066e09abf",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "SKILL.md",
                    "blob": "904b26802cf62d7ba84fa99f3c2c804026cd9e46"
                }
            },
            {
                "id": "pi-research-create",
                "name": "pi-research-create",
                "description": "Use when starting or importing a project, selecting a baseline/parent, defining a fixed run contract, or creating a reproduction experiment.",
                "roles": [
                    "coordinator",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-create/SKILL.md",
                "digest": "784f8d0be5837e9826eb3d7a7f97c651578de7732e8f6cf4f10cecf298dd937f",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-create/SKILL.md",
                    "blob": "6d502f794f82a124cdd93723e2676d8cf0f8861b"
                }
            },
            {
                "id": "pi-research-experiment-tree",
                "name": "pi-research-experiment-tree",
                "description": "规划可检验假设、实验设计与样本量/重复依据；在首次启动、调整实验轮次、解释完成结果、修复、晋级、停止或汇报研究进展时使用。",
                "roles": [
                    "coordinator",
                    "designer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-experiment-tree/SKILL.md",
                "digest": "ff0786573b1431c774bc584c60e882c5cdf44151312afcf02160ba689e1c64e3",
                "resources": [
                    {
                        "path": "references/experimental-design.md",
                        "digest": "a0aecd732223d685039031147821b11074b0306cbd960a4e2ac83dc6cd1cbb72",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/statistical-power.md",
                        "digest": "bdc1bb8c1bfbdc30359172a24d685de42b98b23a516ad96c1ee13451779b830e"
                    },
                    {
                        "path": "references/hypothesis-generation.md",
                        "digest": "5498b771883f6645889205cbf2d1fefbc433273e04b39ad31481a94d263ea400"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-experiment-tree/SKILL.md",
                    "blob": "e888fc9d179ddfae87c4a0732224cf354a9c5430"
                },
                "prerequisites": [
                    {
                        "skillId": "pi-research-evidence",
                        "resource": "references/scientific-critical-thinking.md"
                    }
                ]
            },
            {
                "id": "pi-research-git",
                "name": "pi-research-git",
                "description": "Use before reading, editing, committing or comparing experiment code, coordinating worktree ownership, or diagnosing stale source.",
                "roles": [
                    "coordinator",
                    "implementer",
                    "reviewer",
                    "designer"
                ],
                "path": "skills/piresearch/pi-research-git/SKILL.md",
                "digest": "db281259c4b6fc5a0ed461b469b950e11500c62180630372fba911d97acda784",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-git/SKILL.md",
                    "blob": "13af3bae031a9434c111c9c5ef77bbb8c80cc3bf"
                }
            },
            {
                "id": "pi-research-agent-delegation",
                "name": "pi-research-agent-delegation",
                "description": "Use before proposing helpers or a team, writing standalone briefs, protecting source/compute, or interpreting task results; main-agent retrieval stays local.",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-agent-delegation/SKILL.md",
                "digest": "075ef98881cf7f6fd8a747115b89fd401137ce182d332f5114b2023a42825759",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-agent-delegation/SKILL.md",
                    "blob": "2cb9938569dca476c99c108df491835eadc19b65"
                }
            },
            {
                "id": "pi-research-compute",
                "name": "pi-research-compute",
                "description": "Use before preparing or launching a run, relaunching, sizing, cancellation, recovery, or completion reconciliation; read one local/Docker/SSH reference.",
                "roles": [
                    "coordinator",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-compute/SKILL.md",
                "digest": "e8ace80016ba452dfc6664a386df8b2103a325218d1f31a270e18ebafc11a491",
                "resources": [
                    {
                        "path": "references/local.md",
                        "digest": "1939fcc9ab3c99141b7257f4f19ac92dd5aafd694f065cbf10ef8c7425b8d121"
                    },
                    {
                        "path": "references/docker.md",
                        "digest": "ab7fa4c06d8b33d40b1f5d83b59658caea9fa3efe7873a29cee35fc14cf895b6"
                    },
                    {
                        "path": "references/ssh.md",
                        "digest": "d25e98f2759bf8f2e8580a923f61ecc023ba4a35bc0992eb24fffe73828b9ff6"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-compute/SKILL.md",
                    "blob": "60566d92cd5e86f1d6684d731444af512531ea0c"
                }
            },
            {
                "id": "pi-research-evidence",
                "name": "pi-research-evidence",
                "description": "检查数据质量、统计结果、测量不确定性与科学主张支持程度；设计可核验运行输出，回读日志和原始来源，区分实测、论文报告值、图片观察与解释。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-evidence/SKILL.md",
                "digest": "360adc5b6ee62d08cecc290c17660df48ecaffc28addb2d814d61994434f2f0c",
                "resources": [
                    {
                        "path": "references/exploratory-data-analysis.md",
                        "digest": "2f6fd4bce9bc499d9cc622671b339f56a7ad1e1cdee2fe3e4a2690ed3711e3d7"
                    },
                    {
                        "path": "references/statistical-analysis.md",
                        "digest": "4b94c40e5b2fd76e8d2e9f7c56752ab9128c842787418f7937cdf47127fc44d7",
                        "methodRequirements": [
                            "quantitative-decision"
                        ]
                    },
                    {
                        "path": "references/paired-polynomial-comparison.md",
                        "digest": "1eba414b008acfcbbed5f696e2d057370cafe298c341d06f8610b6a594104b16",
                        "methodRequirements": [
                            "structured-paired-protocol",
                            "closed-paired-evidence"
                        ]
                    },
                    {
                        "path": "references/uncertainty-and-units.md",
                        "digest": "dfef4a9f4bf559383cee0b75358ed83cfa08f8a1f0265845926d8d2c6febc3b4"
                    },
                    {
                        "path": "references/scientific-critical-thinking.md",
                        "digest": "dea70d80c26e4088b17803089d88a52e55bc75e8cd8c6416c5d04bb4a56d8b1c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-evidence/SKILL.md",
                    "blob": "2b15de716916abceb5cbf6a40e2cff75abc37cb1"
                }
            },
            {
                "id": "pi-research-reports",
                "name": "pi-research-reports",
                "description": "Write and save evidence-backed research reports and run comparisons; prepare fixed-source independent review of formal Run reports, analysis handoffs, fixed report records, and local result exports.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-reports/SKILL.md",
                "digest": "4820d58829830192e36d2b2cbeff10e2ab7f45c82d0656af7b32813ce4a9d165",
                "resources": [
                    {
                        "path": "references/fixed-report.md",
                        "digest": "4d9a3a6df3262015e69eeb80abaa203ca31c82f3013eade6d7e0edf1de5b73bc"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-reports/SKILL.md",
                    "blob": "313d3ca61372e5f2e101cac6e78828393d03ad87"
                },
                "prerequisites": [
                    {
                        "skillId": "pi-research-evidence",
                        "resource": "references/exploratory-data-analysis.md"
                    },
                    {
                        "skillId": "pi-research-evidence",
                        "resource": "references/scientific-critical-thinking.md"
                    }
                ]
            },
            {
                "id": "pi-research-figures",
                "name": "pi-research-figures",
                "description": "用真实数据制作论文级 matplotlib/TikZ 图，保留打印尺寸、统计区间、矢量输出及来源；分别执行脚本自检、获准视觉检查与科学论证核查，按图的问题读取参考。",
                "roles": [
                    "coordinator",
                    "analyst",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-figures/SKILL.md",
                "digest": "7c68699a594c76541cc8c35f4c7b3bc18ff62a705867ce8ee8bad61fd07caf89",
                "resources": [
                    {
                        "path": "references/curves.md",
                        "digest": "767af116d4f4519e3f6a59fe47e503cf4d796a68541b2ebdca4c365861bca4df"
                    },
                    {
                        "path": "references/scaling.md",
                        "digest": "f61dce7691b5aead2fe5c296d480f4bc85b5037026ecda6cf6f95c21589480a9"
                    },
                    {
                        "path": "references/comparison.md",
                        "digest": "f871360e181f4e50513d9ce2a26846d9dd341779b4eede7c76ad14ed0b22b1b7"
                    },
                    {
                        "path": "references/pareto.md",
                        "digest": "6fbf9c102ed78c525d714657c401ee704067d2e73bfcd4b4efef2a23cd15600a"
                    },
                    {
                        "path": "references/matrix.md",
                        "digest": "95f5d38d28360e4a74da1cbd9c673cf91ac8195c91805985e5dba60394d10823"
                    },
                    {
                        "path": "references/diagram.md",
                        "digest": "8a344e384560508b45df77f537c8a104ba6cf5419912fdec36132e64c8109a18"
                    },
                    {
                        "path": "assets/pi_figstyle.py",
                        "digest": "205353be185f959be1b8c83bdc686c93dd6e8be7ea9d4aa007c38a1e3742523f"
                    },
                    {
                        "path": "assets/pi-tikz-preamble.tex",
                        "digest": "d40e7130f36d437711d433bab1e6bd71c2329479ac520af24323ba296ecb5f7e"
                    },
                    {
                        "path": "examples/README.md",
                        "digest": "554796ae3f887cd70dc99c3eeaa42b3163f45e4d979dac57c56505aea096cc71"
                    },
                    {
                        "path": "examples/loss_curve.py",
                        "digest": "45650778bba66dba9088db083dd899ae745a037ae6966c631dfd7dc05eec64af"
                    },
                    {
                        "path": "examples/scaling.py",
                        "digest": "7d752a66966a28121d584afdd7a80e44830c5f982ea27169b81d72490f0c954d"
                    },
                    {
                        "path": "examples/benchmarks.py",
                        "digest": "7827d755d20f87b92fe768650378acb99a265864943cc8fa7b47db750a8f08d3"
                    },
                    {
                        "path": "examples/ablation.py",
                        "digest": "525c7bdc434bc2ef0295ee95afa706afb7bcd16a4a3812d97e19e05c14e769b4"
                    },
                    {
                        "path": "examples/pareto.py",
                        "digest": "3cd6bbd9f5492b06ef73f6148222be91ab75271bcd11c55f8f4f6368c102373d"
                    },
                    {
                        "path": "examples/sweep.py",
                        "digest": "b0c6b3ed17d2e5bba2550b4683fc6905b65df553bd46b1ca5c2a825557dad08e"
                    },
                    {
                        "path": "examples/confusion.py",
                        "digest": "ece8bda7304cbba8530fb21a8fea0c819f2475e610633eaeb4e947183947a6ae"
                    },
                    {
                        "path": "examples/method.tex",
                        "digest": "6db10e33e3a91f9c6d9adfa69884b7896393702ed4cf5cf11e267e3697ed4f0d"
                    },
                    {
                        "path": "examples/software-demo-data.py",
                        "digest": "21a1f640df88384656908cba48b3cb2eab7d0656834683d8ce34d874f8e7fbc3"
                    },
                    {
                        "path": "PROVENANCE.md",
                        "digest": "ad4d96da66228cc19f0d4318395cff154f7138b7281aa52fe8b5855d660e13d1"
                    },
                    {
                        "path": "LICENSE",
                        "digest": "c84f7f49136436f347d86e71adb0a6bc132f0b5a3817d84bf572edee71bf33e7"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-figures/SKILL.md",
                    "blob": "611c11b12c395789d3aa0d2c015cf4ce0594a345"
                }
            },
            {
                "id": "pi-research-paper",
                "name": "pi-research-paper",
                "description": "创建或修订真实LaTeX论文、预印本或章节草稿；沿用模板和配套资产，固定稿件，构建、检查并交付源码与实际结果。普通研究报告使用reports。",
                "roles": [
                    "coordinator",
                    "writer",
                    "reviewer"
                ],
                "path": "skills/piresearch/pi-research-paper/SKILL.md",
                "digest": "405ff266347ac9316b620616292d5854bb68fc25a5a9322c9f632828c9ad2733",
                "resources": [
                    {
                        "path": "assets/starter-main.tex",
                        "digest": "90df19bd739a5412b60265ac86b76e69c12356e71506ce7f62ef85dc39cfd974"
                    },
                    {
                        "path": "assets/starter-refs.bib",
                        "digest": "c57204ba9da2ca018498dc9a397fc8cb17bd7b2603828e67338cf5566e40b8c9"
                    },
                    {
                        "path": "references/build-and-review.md",
                        "digest": "162935f26fa70e766db47ce56c87dd6a3279c8f250faa010077f4f3dbcdae192"
                    },
                    {
                        "path": "references/scientific-review.md",
                        "digest": "913d1af5e5549029757f8add6fba81020bf3b6f60a78caa1c93a14c2362a247c"
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-paper/SKILL.md",
                    "blob": "46fdc3e4207e1ca9c3c8ec51649bc1b242c6ecaa"
                }
            },
            {
                "id": "pi-research-customize",
                "name": "pi-research-customize",
                "description": "准备可复用研究技能、读取固定技能资源，或选择、生成、入库与复用LaTeX个人模板；保留配套文件和旧版本。",
                "roles": [
                    "coordinator"
                ],
                "path": "skills/piresearch/pi-research-customize/SKILL.md",
                "digest": "2a5b44288e2e4bff06940f9b54cf97a7e4127d4ca205330e27816487c286914b",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-customize/SKILL.md",
                    "blob": "51d608098dc24df19518bea4f6fc71963a26c2b4"
                }
            },
            {
                "id": "pi-research-feedback",
                "name": "pi-research-feedback",
                "description": "Use when identifying a meaningful Pi Research product bug, limitation, feature request or user frustration; protect research and distinguish local facts from external feedback.",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "implementer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-feedback/SKILL.md",
                "digest": "a7291d6ada6d73ef62875fc37a4bf1b4b0a26fcc2061d47a80b08b14fafd0a80",
                "resources": [],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-feedback/SKILL.md",
                    "blob": "82a729e681bb9fe361589aa953d92769b698196f"
                }
            },
            {
                "id": "pi-research-lit-review",
                "name": "pi-research-lit-review",
                "description": "用原始研究证据解释、比较科学或技术概念，适用于研究主张、架构问题、文献综述与related work，即使用户未点名论文；按问题缩放检索，明确系统/范围综述时读取专用方法。",
                "roles": [
                    "coordinator",
                    "literature",
                    "designer",
                    "analyst",
                    "reviewer",
                    "writer"
                ],
                "path": "skills/piresearch/pi-research-lit-review/SKILL.md",
                "digest": "e9e16567a44057c0d8b056c0dc6f82729880138eba6916158ecd8634d10647ff",
                "resources": [
                    {
                        "path": "references/document-reading.md",
                        "digest": "0d9ce18da2ddd1a7effee54219b3760a9b9e55d144339e920ff9b4c48ddf4140"
                    },
                    {
                        "path": "references/discovery-permissions.md",
                        "digest": "9b26d75b3f6df622c44daed8381826d0afb0d7a6845c09f8bc1315343be19193"
                    },
                    {
                        "path": "references/systematic-review.md",
                        "digest": "ba53d57c35bf0fdc1c37efd1a2add4e09d40be46d7b3923757a5679acf6cffda",
                        "methodRequirements": [
                            "literature-identity"
                        ]
                    }
                ],
                "source": {
                    "repository": "alphaXiv/OpenResearch",
                    "commit": "3037f727e80e0ab20c61a87c613a50dde009a835",
                    "path": "agent-skills/orx-lit-review/SKILL.md",
                    "blob": "a64ea8d7f3ec04b4f325979951ba072bd74db3f8"
                }
            }
        ],
        "manifestDigest": "4f49f6cde539fd582c1c8d2caa8bca4f937457ea68c14ccbb79a3219ff2c5091"
    }
];
//# sourceMappingURL=releases.js.map