# 验收结果

完成本地受管提交之后的准确 SHA 同步回执查询。`project_inspect.githubCommit` 仅接受完整小写 40 位 SHA；按本项目和 SHA 查询最多 20 个 ref 回执，保留单独状态、记录时间和 hasMore。不返回账号、仓库地址、snapshot、原始 stderr 或其他项目数据。

相同 callId 重查并重新授权，原操作回执不覆盖；默认查询、旧提交/记录和历史重开保留。用户读取使用只读一致快照，Agent 保持现有审计框架。新读取不运行 git/gh、联网、恢复同步任务或推送。无回执不等于失败，saved synced 只证明记录时准确 ref 已确认。

Git 技能增加本地完成→准确提交→各 ref 回执的流程、合法 Pi 参数包装和等待/unknown/failed 的处理；开发检查路由到独立 Docker 指南。新发行 `deacf6d3accce4602e8c28974a85dbebf56dd021e4d48672a2ddf0b0b6ce5715`，原 10 份发行保留。

- 集中回归 1215 项：1192 通过、0 失败、23 跳过（可选真实 Docker/编译器实测与 Windows 不适用的 POSIX 检查）。
- 后端聚焦 26/26；主代理技能、schema、HTTP/CLI 和真实 Pi SDK 接线 31/31；独立 Astra/xhigh 4/4，冻结 78 文件哈希一致，无阻断。请求配置已接受，运行时未回显。
- 真实本地 Git 提交经现有 mock GitHub worker 到 saved synced，准确 SHA/ref、同 callId 新观察、旧回执及重开通过。真实固定 Pi SDK 接收保存的回执，私密错误哨兵未进入模型请求。
- 干净安装/构建/类型检查通过，554 个 dist 文件完全一致。关键路径已纳入三平台 CI，远端结果另行确认。
- 提交 `b88711e` 的[远端 CI](https://github.com/hailuohl/pi-research/actions/runs/37622102857) 中 macOS/Linux 通过，Windows 在既有取消测试删除临时目录时遇到 EPERM。局部测试修正先观察真实 running，再等待自己启动的监管进程 close 才清理；原状态断言保留，不改生产代码。相关 10/10 与独立 Sol/high 定向复核通过，实际 CI 复验另行记录。
- 修正提交 `2f10b5d57ec6a7e44c38d648b5eceaafdc82d50f` 的[三平台 CI](https://github.com/hailuohl/pi-research/actions/runs/37625190539) 已全部通过。
- 没有实际研究仓库的远端上传测试或外部模型自主行为实测；mock 远端与离线供应商不算此项验证。
- 第一批已记录的 parity 旧目录文档缺口继续保留，不重复检查或扩入本批。原有五个在途文件未修改或提交。

同目录 `evidence.json` 为精简机器证据。原始日志留在 `.validation/agent-github-receipt/` 和原干净构建目录。
