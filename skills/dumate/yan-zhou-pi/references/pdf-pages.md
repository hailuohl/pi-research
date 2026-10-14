# PDF原页与阅读观察

原文字层extract保留。原图、排版、扫描页或公式需要实际页像素时，用pdf_pages渲染已登记的原PDF；物理页号从1开始，不能猜印刷页码。

```text
python scripts/pdf_pages.py --workspace 工作区 --task T1 render --id P1 --source S1 --spec inputs/pages.json
python scripts/pdf_pages.py --workspace 工作区 --task T1 render --id PV1 --paper V1 --paper-kind manuscript --spec inputs/pages.json
python scripts/pdf_pages.py --workspace 工作区 --task T1 render --id PF1 --paper F1 --paper-kind formatted --spec inputs/pages.json
```

规格 `{"pages":[1,3],"dpi":144}`；每次显式选择1–40个不重复的实际页，DPI72–200，单页最多2500万像素。加密/损坏/非PDF、越界或超限失败，保留尝试。PyMuPDF须已具备，不自动安装。页面没有文字层时仍保留真实图，不把空文本等同空论文；无OCR或自动面板解释。

pages/P1保留每页PNG、独立文字层TXT及pages.json，绑定原件、页数、渲染版本、物理页、尺寸和图片/文本SHA。actual_view保持not_recorded；生成图不证明模型看过。

实际收到并看过原页后，记录带出处的视觉转述：

```text
python scripts/pdf_pages.py --workspace 工作区 --task T1 observe --id EV1 --pages P1 --spec inputs/observation.json
```

```json
{"physical_page":1,"image_sha256":"对应实际PNG摘要","observer":"真实会话或阅读者","view_evidence":"实际图片查看工具或人工阅读记录出处","observation":"实际看图得到的转述/估读及其范围","limitations":"清晰度、估读误差、未覆盖面板等实际限制"}
```

证据类型visual_observation、quote为空、actual_view为reported_by_observer，署名观察的真实性不由脚本机器验证。不能用它冒充可逐字符验证的作者原话；原话用extract/evidence。原图只嵌一次同一底层文件，后续引用实际路径。文稿页图不能作为该论文的外部书目证据，改用review_workflow记录页面检查。

视觉证据可按普通evidence_ids入当前稿上下文，但仍需对应source与citation；科学解释另核。DuMate未实际送达像素时保持待看，不用其它模型/角色扮演补成pass。
