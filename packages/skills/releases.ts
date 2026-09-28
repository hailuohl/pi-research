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
  }
] as const;
