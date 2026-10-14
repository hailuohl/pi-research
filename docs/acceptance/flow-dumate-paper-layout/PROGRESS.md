# Pi Research风格论文排版交付

本批仅为既有DuMate V2增加article后排版。实际中文Pi Research稿采用A4、25mm页边距、11pt单栏serif、独立摘要、编号章节和居中页码。本批迁移这些版式规则，未复制原示例论文的作者、正文或参考文献，未引入TeX执行器、Pi或后端。

发布包为yan-zhou-pi-1.0.2-article.zip，40836字节，SHA9238769c6a61456ff479f93e195dd9468d591133a22421989ba8c54e36900e9f，12运行文件。新增format_paper.py SHA d3ff99ea22e205ebb3fa5217482b42b6e759b1ccf76bb43dc791245317ed9dbf；原research.py和figstyle.py保持原字节。Word字号采用最近半磅17.5/14.5；PDF题名17.28/章节14.4，正文11/13.6。现有Noto字体只按实际字符在内存生成400/700子集，未安装、下载或打包完整字体；真实失败明确partial。

当前桌面安装版仍1.0.1。主代理将新包置于明确选择的工作区inputs/paper-layout-1.0.2-article，DuMate实际读取、校验并运行，产生tasks/T1/formatted/V3的8个文件。该任务没有重新分析或绘图，未绕过插件安全提示。新版PDF194739字节、两页，SHAe929f1927a1ff51611e663316e9273d5c79f9863a50ab3604e5f042f9423c40a；DOCX91251字节，SHAc89f77870dae83bdebb987930509bec9cd99314b0dda6f4e92972fd3ce944b0f。MD、context、map及PNG与V2相同，旧141文件摘要全部保持。旧稿、包和公开链接保持。

实现者Sol/high完成3项相关测试；独立Astra/xhigh复核隔离运行3项测试并通过，检查新包、当前V3的真实摘要/字体/A4/图/Word属性及旧历史，并打开两页实际120dpiPNG。零阻断；一项非阻断为第2页讨论段一处行首逗号，记录后续优化。原immutable receipt和layout-manifest的pending未改，实际页面检查另存inputs/article-V3-checks.json。没有新科学同行评议，没有独立DOCX逐页渲染认证，没有新干净安装验证。既有未改变helper与后端检查复用，不重跑全量。

首次1.0.2候选包混入另批科学核对说明但未包含其文件，独立复核发现发布阻断。该候选和副本保留，最终article包只在发行副本中移除精确另批尾部说明，12条目与所有相对链接经局部复核。源工作区的scientific-review/check_revision在途改动保持并排除，不提交、不覆盖。旧五项无关修改也排除。

P3-article已准备九份普通发布副本；原件不交平台处理。桌面输入及恢复重新绑定均报failed to activate captured window，实际附件导出暂未运行，不能称已导出。新稿和技能包可直接交付；分享测试按用户要求跳过，原链接https://www.dumate.cn/s/d9oLSggG仍是先前版本。正式提交推送在交付前核对；只提交本批代码、必要说明及精简摘要，原件/工作区/截图/大日志不进入Git。
