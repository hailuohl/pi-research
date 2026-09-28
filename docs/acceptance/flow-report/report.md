# 二阶回归真实实现与审查结果记录

生成时间：2026-09-28T06:33:48.732Z

这是根据实际终态运行和已采纳结论生成的确定性记录，不是新的模型推断。进程成功或审查通过不等于科学假设成立。

## Run ca819399-1714-4aaa-b50e-ef1700b3991f

执行：succeeded；完整性：complete；科研判断：pending

固定源码摘要：b8f9aaa5a47dd861e637e9c5405b81b8255ecde883057f49bf6db0de98da1b80

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | [0.000050345031695457565](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/a92a163ec08f0a6f4d790c9bc9f846e9322ce0d8160c33ceeedece0125a7f911) | squared-target |
| train\_mse | [0.00004962382619455619](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/a92a163ec08f0a6f4d790c9bc9f846e9322ce0d8160c33ceeedece0125a7f911) | 未定义 |
| r2 | [0.9999474271448613](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/a92a163ec08f0a6f4d790c9bc9f846e9322ce0d8160c33ceeedece0125a7f911) | 未定义 |

## 固定引用

- [Run ca819399-1714-4aaa-b50e-ef1700b3991f](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/64a53514d128703de8f880b3ed105f6c542aec76227629a9c53efd3ddaf60f97)
- [metrics.json](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/d15bc211d75cf880de400374bf308c15daeab8e55be5f618a4f03069be12ad00)
- [model.json](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/1c750c3fb5ed9a1556e98a5785fa42d6e6d6a6100f5caef8d51f9c3fe05ce1f8)
- [predictions.csv](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/40c6aba13e6264a548bf19e91a6b14b58b004db5473d308b0d3cf54f1d36f56c)
- [stdout.log](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/21cb2a21ffd27b283318d7fc830fe671c59ff37e0b3d15aaa64b7bb3d8fa9132)
- [stderr.log](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/f7dbafa59f308a367a2f5268fcc7552ff4055e35c58fa840472a2b74f48cb700)
- [execution.json](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/145a2c4b543cfe85399d7b5e61ab16ea34b1aafb969f3439728061b24f2b4a4d)
- [真实运行输出指标（解释仍需审核）](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/a92a163ec08f0a6f4d790c9bc9f846e9322ce0d8160c33ceeedece0125a7f911)
- [config.json](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/6e27f5ab6ec2a3c39f587bd517548fa96289a4a0675dacd2ed9605f3f67433ed)
- [data.csv](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/abefe8e969aed717a17a472bcbf4a425bd32bd64ce1b6d6552a5bd31e841c9fa)
- [main.py](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/602e97a6c77279689f7742483d3860ed683e5bf048641d43fa28e482505e92f9)
- [README.md](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/60f9f6ac7bacb85271b10612337cfabf04d968c2d860add2d19b416045a98bd9)
- [test\_main.py](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/65720765cf3e62af89830771991776ac39e62707da667222e00632fb540299f5)
- [该源码版本的开发测试](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/4f5b088b8909139c7ecc3d304150f5e73563b65e816a0992b64fc84dbbe2360b)
- [stdout.log](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/4a2d8eca3e979900287da3c127dc9bf4e4d182812ecba24e26a013cb2d2894fe)
- [stderr.log](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/ee7153b3bc26526b8cf22e40d68f6b2c9c5e94b56f476c2674846952bc697ea3)
- [test-report.json](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/cc74e4d710e578cf6fb436b3167f21094235a92e998bda076e9bdb289627aaaa)
- [该源码版本的独立审查](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/09ab325da5d58c6fa73253513f9bbe5757fe59045761fb3cbea67f0494c6a56b)
- [development-review-manifest.json](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/bc11213e3038d37d8341f54ea5807336736cba83cf36d758907fab60e0b719b0)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/a05105db4eb5c14d8fc6cbc6ab7ea926694da4769da9a2e4a2fdefce19544b04)
- [development-review-test-report.json](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/cafd1a8154f1e063dd1f44b4840d2c9851f9951b078016d32b2d416899fcb3cc)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/8f62c9500f47669ab8f2dea81a24a4f830582391511346b7a7dd425457a7dedc)
- [development-review-stdout.json](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/43196cfe4de283fe22f957762556d256177d74e71ea8cb830af667d0f7a73fbf)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/90efad6c66b338a5fdcbcde2a82f23db9545c3f3929d41c8489ac1955aa1a721)
- [development-review-stderr.json](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/3f0fbb957170eac7d9d589943d814808522add4fd51f8cae17b1cb91b4d5b814)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/28b4360a-b410-4956-b56e-125e094a74f7/reference/ed3883756d05e9f1d64ea60c5536e2c1b5cb9ba6c4b16994a0da4269000ac11a)

## 适用性与限制

报告原文是生成时的历史记录。使用结论或导出成果前，应在工作台重新核对前提与审查是否仍有效。模板中的合成数据不代表真实材料性能；其他研究结论也必须根据自己的数据和协议判断。