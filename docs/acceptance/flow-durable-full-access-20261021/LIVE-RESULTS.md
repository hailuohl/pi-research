# 完全访问：真实 Pi 与控制器重启验收

2026-10-21，已在原工作台 http://127.0.0.1:4794/ 使用已提交版本 `45136508`，沿用原数据目录。部署逐字节匹配该提交；使用默认真实 Pi Worker、SDK/AI 0.87.1，以及原配置 zai-coding-cn / glm-5.3。low 为请求配置，运行时未回显实际档位。未使用 fixture Worker 或模型 HTTP 替身。

验证项目：`29cc52e6-73ad-4df9-8688-9964b511a534`；会话：`21aa6e31-70c9-4bc7-96b6-0ca4ddd23cbb`。仅此新会话明确启用 scope2 四项 null 总额度、recoverAfterRestart:true；旧会话授权未扩权。

| 实测步骤 | 结果 |
|---|---|
| 真实 Pi 提交原本地程序 | Run `90f4104b` 因变量拼写错误失败，failed/incomplete、exit 1、可信本地诊断；冻结源码保留 |
| 执行中关闭控制器 | g1 在05:09:25.799 UTC关闭；原监管器继续执行，于05:09:37.352归档；g2在05:09:50启动后恢复结果续接 |
| 无新增人工提示，Pi 自主修复 | 仅 valuse→values；私有候选保留75秒窗口及 test.py 原断言，真实Docker开发测试 `b421cafb` 成功且完整 |
| 自动推进到新子实验与Run | 子实验 `ea4f03ff`；Run `cd2efd8c` 使用准确已测源码，succeeded/complete，归档实测 value=6 |
| 最终结算 | 同一continuation/授权epoch，3次续接均完成；15次模型HTTP成功，4个Worker均退出；预算used=3/reserved=0/unknown=0，checkpoint completed且scientificConclusion:false |

只读验证器14项全部通过；独立Astra/xhigh核对部署、实际数据库与归档证据并复算通过。代理模型/档位为已请求、运行时未回显，未把请求值当作实际核验。重启未替换原Run ID、intent/job绑定或native execution ID，没有重复计算。研究授权跨重启保留，Shell按设计失效，没有重新enable原grant。

原有11928条记录全部存在，除计算连接和research owner两条瞬态记录外，旧记录摘要不变。已有605份文件（47份原生历史、558份产物）与前批激活摘要一致，48个旧原生历史引用均可用。102729条旧事件的内容摘要证明首次升级后的观测点至本次控制器重启及最终一致；首次升级前仅捕获事件数量/末序号，不能声称那一段事件内容已逐字节比对。

标准完整备份被既有3条unknown task-attempt拦住，未清理状态或绕过guard，也未生成新的完整可恢复备份。首次本批采样未解析logical原生路径，完整原生字节基线缺失；47份可用前批摘要验证，另1个旧原生引用只确认当前存在。

本次是合成算术程序的平台流程验证，不是科研有效性结论。未注入prepared-only、模型HTTP在途或监管器崩溃中断；原监管器generation=1/recoveryCount=0，不能称为新监管器接管。超时、并发、撤权、暂停及unknown分支沿用同产品版本已有自动检查，未新增真实负例注入。前端布局未改，CSS与旧部署SHA256完全一致。

机器证据见 [live-verification.json](live-verification.json)。凭据、运行数据库、原生对话正文及原日志留在本机，不纳入Git。本批只补实机验收文档，不改产品源码。
