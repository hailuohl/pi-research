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
  }
] as const;
