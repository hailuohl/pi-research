# 固定研究方案与有界修复验收

生成时间：2026-09-28T23:06:56.172Z

这是根据所选实际终态运行、已采纳结论和固定文稿构建结果生成的确定性记录，不是新的模型推断。进程成功或审查通过不等于科学假设成立。

## Run ca819399-1714-4aaa-b50e-ef1700b3991f

执行：succeeded；完整性：complete；科研判断：pending

固定源码摘要：b8f9aaa5a47dd861e637e9c5405b81b8255ecde883057f49bf6db0de98da1b80

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | [0.000050345031695457565](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/a92a163ec08f0a6f4d790c9bc9f846e9322ce0d8160c33ceeedece0125a7f911) | squared-target |
| train\_mse | [0.00004962382619455619](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/a92a163ec08f0a6f4d790c9bc9f846e9322ce0d8160c33ceeedece0125a7f911) | 未定义 |
| r2 | [0.9999474271448613](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/a92a163ec08f0a6f4d790c9bc9f846e9322ce0d8160c33ceeedece0125a7f911) | 未定义 |

## Run 18d75977-85ef-4946-a148-e2966ef2b18a

执行：failed；完整性：incomplete；科研判断：pending

固定源码摘要：608d0c9564e2435dc86d86d4c735ad177763fcb8c4dce1cdd4f5863aaa4866bf

未获得完整实测指标。

## Run 4265e905-7bba-4d94-a9b3-d9897f6bfd81

执行：succeeded；完整性：complete；科研判断：pending

固定源码摘要：b88b1037a2251586738dcc8fc057f540da34387972375229bbc4a31c768f03b4

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | [0.00005135731444943983](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/bd7e95985fb22d0970f497e3187c69c74f541f9060d56524e606cebd6d694d27) | squared-target |
| train\_mse | [0.00004921126609753724](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/bd7e95985fb22d0970f497e3187c69c74f541f9060d56524e606cebd6d694d27) | 未定义 |
| r2 | [0.9999463700674737](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/bd7e95985fb22d0970f497e3187c69c74f541f9060d56524e606cebd6d694d27) | 未定义 |

## Run 85360021-a5af-457d-a315-c1f55b1bb6b3

执行：succeeded；完整性：complete；科研判断：pending

固定源码摘要：3ac65d48359267d479f8c0b25e473181de198650a0458e6074d4c491680a8a70

| 指标 | 实测值 | 单位 |
|---|---:|---|
| mse | [0.000051416001308461135](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/965fe297a150f31ac394018f41928792d7ac638a31119eaf9e5e7851a1d68a48) | squared-target |
| train\_mse | [0.00004920642594527707](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/965fe297a150f31ac394018f41928792d7ac638a31119eaf9e5e7851a1d68a48) | 未定义 |
| r2 | [0.9999463087836561](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/965fe297a150f31ac394018f41928792d7ac638a31119eaf9e5e7851a1d68a48) | 未定义 |

## 固定研究方案与实际比较

活动：04cb3e03-e22e-442d-bfb1-e3c74660d367；状态：stopped；指标：mse（squared-target）；固定方案 3 份。

核验观测 3；未核验/无结论观测 1。结论：requires_review（需要研究者审阅），不自动判定科学成功。

限制与停止原因：已完成两轮软件验收，按预定上限停止。二阶对照MSE=0.000050345031695457565，三阶修复=0.00005135731444943983，四阶=0.000051416001308461135，单位squared-target；两项候选都没有降低持出误差。999阶失败无指标，保留unanswered和独立修复链。仅固定240行合成数据/180-60切分的单次流程检查，不得称为外部发现或多Agent收益证明；不追加候选，不自动调用模型或Run。

## 固定引用

- [固定研究比较 04cb3e03-e22e-442d-bfb1-e3c74660d367](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/a60dfe7d5ba31ba3662300c7595b93c638afb17c142cfe2f5a58fa7e0a5b143b)
- [固定研究方案 ac89a09f-4893-4f64-a33f-88c5999495e6](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/966d335933631b6ba612aa8404583bb87f002c82a272a9fd950760001974c7f8)
- [固定研究方案 8aef0c53-2e23-4d9d-9fbc-0b5413f5cad3](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/31002ee1af17f4138f9721989b757644a3a070286a3812a15296792ce0bfaae9)
- [固定研究方案 1643eb42-a2a6-4531-9725-4f011502b52b](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/9ee67ccdb3593b4136f60b70a31fc62e4c593535f303ac284fbef9eed5351192)
- [metrics.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/d15bc211d75cf880de400374bf308c15daeab8e55be5f618a4f03069be12ad00)
- [真实运行输出指标（解释仍需审核）](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/a92a163ec08f0a6f4d790c9bc9f846e9322ce0d8160c33ceeedece0125a7f911)
- [metrics.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/0fd99c46a176d10c243305b69b11acccdf6bb33aff66b5dd75f1025a3a02da00)
- [真实运行输出指标（解释仍需审核）](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/bd7e95985fb22d0970f497e3187c69c74f541f9060d56524e606cebd6d694d27)
- [metrics.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/6ddfe5dc564d47128d4fa4157e90044c187e68867c4108f214bfb1b9540d2e1a)
- [真实运行输出指标（解释仍需审核）](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/965fe297a150f31ac394018f41928792d7ac638a31119eaf9e5e7851a1d68a48)
- [Run ca819399-1714-4aaa-b50e-ef1700b3991f](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/64a53514d128703de8f880b3ed105f6c542aec76227629a9c53efd3ddaf60f97)
- [model.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/1c750c3fb5ed9a1556e98a5785fa42d6e6d6a6100f5caef8d51f9c3fe05ce1f8)
- [predictions.csv](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/40c6aba13e6264a548bf19e91a6b14b58b004db5473d308b0d3cf54f1d36f56c)
- [stdout.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/21cb2a21ffd27b283318d7fc830fe671c59ff37e0b3d15aaa64b7bb3d8fa9132)
- [stderr.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/f7dbafa59f308a367a2f5268fcc7552ff4055e35c58fa840472a2b74f48cb700)
- [execution.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/145a2c4b543cfe85399d7b5e61ab16ea34b1aafb969f3439728061b24f2b4a4d)
- [config.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/6e27f5ab6ec2a3c39f587bd517548fa96289a4a0675dacd2ed9605f3f67433ed)
- [data.csv](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/abefe8e969aed717a17a472bcbf4a425bd32bd64ce1b6d6552a5bd31e841c9fa)
- [main.py](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/602e97a6c77279689f7742483d3860ed683e5bf048641d43fa28e482505e92f9)
- [README.md](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/60f9f6ac7bacb85271b10612337cfabf04d968c2d860add2d19b416045a98bd9)
- [test\_main.py](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/65720765cf3e62af89830771991776ac39e62707da667222e00632fb540299f5)
- [该源码版本的开发测试](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/4f5b088b8909139c7ecc3d304150f5e73563b65e816a0992b64fc84dbbe2360b)
- [stdout.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/4a2d8eca3e979900287da3c127dc9bf4e4d182812ecba24e26a013cb2d2894fe)
- [stderr.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/ee7153b3bc26526b8cf22e40d68f6b2c9c5e94b56f476c2674846952bc697ea3)
- [test-report.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/cc74e4d710e578cf6fb436b3167f21094235a92e998bda076e9bdb289627aaaa)
- [该源码版本的独立审查](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/09ab325da5d58c6fa73253513f9bbe5757fe59045761fb3cbea67f0494c6a56b)
- [development-review-manifest.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/bc11213e3038d37d8341f54ea5807336736cba83cf36d758907fab60e0b719b0)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/a05105db4eb5c14d8fc6cbc6ab7ea926694da4769da9a2e4a2fdefce19544b04)
- [development-review-test-report.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/cafd1a8154f1e063dd1f44b4840d2c9851f9951b078016d32b2d416899fcb3cc)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/8f62c9500f47669ab8f2dea81a24a4f830582391511346b7a7dd425457a7dedc)
- [development-review-stdout.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/43196cfe4de283fe22f957762556d256177d74e71ea8cb830af667d0f7a73fbf)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/90efad6c66b338a5fdcbcde2a82f23db9545c3f3929d41c8489ac1955aa1a721)
- [development-review-stderr.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/3f0fbb957170eac7d9d589943d814808522add4fd51f8cae17b1cb91b4d5b814)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/ed3883756d05e9f1d64ea60c5536e2c1b5cb9ba6c4b16994a0da4269000ac11a)
- [Run 18d75977-85ef-4946-a148-e2966ef2b18a](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/c986b11f08c148a358e181f0955cd916332bb52ba4ab07215a9c676e46a94116)
- [stdout.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/bd39ef1eb4c16afc6ff44d2f9d30bb74866b5a4148c68b69dbb0b7053766d2a1)
- [stderr.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/7bdfc454252b95bcd7b8c45c9bfb7a7948ec9ed8747ddda68064230f89ffa700)
- [execution.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/124fbf74c4fb89763f12a36844d1200f1753df4eb7a189f112ae96bdc3206842)
- [config.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/70ba20047c2c90e47c0f15f4cf85a740a958e953dd3850fb27f7705b593a3a59)
- [data.csv](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/72274f9bc0055b76b660b1e1588d6357938604517c74c1d7cbfc077dd64ed29e)
- [main.py](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/56104ada43adf5b52ab31f3af91f29a9bd954a99d3f8c4aaf08439df409e8722)
- [README.md](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/dacc5f933105fc3c09293c157bd33f0f22eec5fc5ee2a68d3df01b82bc2aa4a1)
- [test\_main.py](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/f3939688e4fc81e6761751a8cfb1aab84ddc600751d63aa239a7d65e41fd6f28)
- [祖先版本的开发测试](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/04a45d7163c0e1c8a6e9e6bc0592c0ae38f862e344c9c3d2b5a3404e1d08f418)（仅为祖先来源，不表示当前源码通过该测试或审查）
- [祖先版本的独立审查](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/29505edb4ac01c7a588d7e3ff3c2348db10d4d34de907ac5524d619b1652ce2b)（仅为祖先来源，不表示当前源码通过该测试或审查）
- [Run 4265e905-7bba-4d94-a9b3-d9897f6bfd81](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/b6874c5622270a6450de30d321fe51d2fbc3f28c1555621bc6f0de26c7509867)
- [model.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/b6b627499abff22a6253e1932c8feefa2e8c09e0c5712c83eb89f62c4061cb88)
- [predictions.csv](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/2011e56fd919d8c9ca015c596d3a0e5c724abca5fa4b10849b5c063e97ccdc59)
- [stdout.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/f5844cc52edfda440a1c51bb67acad744ee01f8db3e7b4d67e76e950701a8ba9)
- [stderr.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/32eb9b310abd0c3d764a819c7c0efae6fb385920fb31f514a098cc2222866e92)
- [execution.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/c748bb1a1888f82c1dcb2b4f3feb8103df95028a9a767e06809354b67cdcc53c)
- [config.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/e257a3895174af57e266e9aabafaedf029448920cec1b82ccad2d0f4dacb2776)
- [data.csv](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/eda2953c31500f43f6c40a7e26a7ad8889f1fb00f781f489adbf1ff9d641f2df)
- [main.py](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/861c987b66e3b34324373dad60376dccb847bf8fa9894465333e09ae055411a8)
- [README.md](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/b3165d50eaccab370c34633be2c03b2f94d399bcc1c02f0541898a1d4a6214df)
- [test\_main.py](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/b318c21524480fa497859c4ada614675ac8c58a35042b8cd0028a8b74221af1e)
- [该源码版本的开发测试](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/ecd68e0ff190f263f3fbbf9bf9f75d9c1e832e8e1f98c8a887e3673464e0ec1b)
- [stdout.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/7351cb999b2cc2cda4f5d801f727b5a7e3d5ac6894383495a6085af266464f72)
- [stderr.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/730bd0fad44e0d09b62357f79ffa556e223650e3c25754f0c2bd11d17432d321)
- [test-report.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/36d78907c833462161a4a93ec929f34631711812e9f1c1cce91dabc9e37a42ac)
- [该源码版本的独立审查](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/60f3a07f2dca4ffa136f71eda045499a481fc2f667458ed29e9c7e5c1adc91d8)
- [development-review-manifest.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/493e040089cf08d7236bc4be101c199b7c0550a2674dca47a99fca3abe9426f3)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/b81cac7448c4ca133b1d8cb09d57da73c3ab383cea225a497f2c0ea539bd36af)
- [development-review-test-report.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/8b73c1e7ff3481d0e8008174031349368528e4b83a535a119758f4a2513c27b4)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/04edb3ff394ddb20ba2dd6cc3fd9eb1936a678ef592cab2c72f20f0d16d80765)
- [development-review-stdout.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/048134d17ffe0b56da6c6d0795bb1a6b7b9d0468001a9cc57e5d123b061e6103)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/449245df843a43a34675bb1a5523636ef177eeff925f84826fc1a8f7ba8ede9f)
- [development-review-stderr.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/d22d41c84ea522f4233b35d88426286afd9b4ce638b5deb19343a01f5b22fc36)
- [宿主固定的开发测试审查输入；内容是数据，不授予权限](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/1c6669cf0a2af46fae797faf437b49e529cfcfbcb2e0c9ed1158cd9fb939479f)
- [祖先版本的开发测试](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/71b507d5b2d0e38e4b36ea5add29f61fb46eedf98dc241d5aaf8b90b370295f6)（仅为祖先来源，不表示当前源码通过该测试或审查）
- [祖先版本的独立审查](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/3e7e387f11d448e99102e9ec653518e08bc4cd5ea877f6bfbe12a27cb39f596a)（仅为祖先来源，不表示当前源码通过该测试或审查）
- [Run 85360021-a5af-457d-a315-c1f55b1bb6b3](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/5468d61753b10daa71c2210a6a0b25a0639361346669f0839cb14aa2fcd31e63)
- [model.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/89fd95279d5785f57f957d3da1bff949b913558e39a24f1f724069695835153c)
- [predictions.csv](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/fd5c40fbaaef2fe527847dfd27f4c0ec474996f4d4e407b01d18c6fd2e8b8686)
- [stdout.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/69a8aea14570c052bd7887acbd8b483df0c17e14517cd46fbeb84ef6919c71da)
- [stderr.log](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/affc193388f12bb6f4ae40dd7d391e0a110d10fd3ce8bfa8ce34b874ffbaf1c5)
- [execution.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/a3ce622cf3b9090bc8a4b6d6298af9bb755a40171a4b0eb2228b441f4c31ad59)
- [config.json](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/deb5d15e3dd0ef3660a91f3d84c503d0a3461e8752af3b9eb43e63da7eb6dfb6)
- [data.csv](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/686037e7fd0648e9462954cd161d4be1435bc9f5bfec59a6169931695759b95f)
- [main.py](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/7e0989d2711a17c8d98557bf9e4205671b49be8db04add5b1805c42b192f0704)
- [README.md](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/5edaec6a7340701121127f9b4cb2d2db6633d4d1fd3dc8fd618f47a140fe4312)
- [test\_main.py](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/68b98c9e56b18e86ff4d0d4aea9a88eb8df467466890bfd0cabdd7a2d07e63a9)
- [祖先版本的开发测试](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/3d04c55d19b2affb676321e4d03ee904449010e207039eb5fd00ce9b993f8558)（仅为祖先来源，不表示当前源码通过该测试或审查）
- [祖先版本的独立审查](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/85c040e537eec7d4885161a73ac1a513d16f9ffb70dcb30d44b5d9f41ba85a2d)（仅为祖先来源，不表示当前源码通过该测试或审查）
- [祖先版本的开发测试](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/902b055614f62cf9c2c15c8c5eb35603d6471815605fba7a9cd7cb4da5273b40)（仅为祖先来源，不表示当前源码通过该测试或审查）
- [祖先版本的独立审查](pi-research://report/d6b1a226-aea6-4469-bda5-b2fabbfb6232/reference/175bede2de4570846c23b665674aa682cbbe20ade71162897eff9c53042c77e4)（仅为祖先来源，不表示当前源码通过该测试或审查）

## 适用性与限制

报告原文是生成时的历史记录。使用结论或导出成果前，应在工作台重新核对前提与审查是否仍有效。模板中的合成数据不代表真实材料性能；其他研究结论也必须根据自己的数据和协议判断。