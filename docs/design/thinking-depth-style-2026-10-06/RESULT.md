# 模型与思考深度：样式预览

用户范围：先只设计样式。本批交付独立浅色 HTML 预览；没有接入生产页面、API、保存逻辑或真实模型能力判断。

预览：`python -m http.server 4799 --bind 127.0.0.1 --directory docs/design/thinking-depth-style-2026-10-06`，打开 `http://127.0.0.1:4799/preview.html`。

## 验收与实际检查

| 验收条件 | 结果与证据 |
| --- | --- |
| 浅色模型列表下放思考强度滑动条 | 通过。`desktop.png`、`mobile-320.png`；两种模型名称和六档均为示例。 |
| 交互只影响预览，不保存真实设置 | 通过。脚本仅操作 DOM，无网络、存储或表单提交入口。 |
| 原生键盘可选模型、调整档位，菜单可关闭 | 通过。浏览器点击 Code Light 后按 ArrowLeft 选回 Research Pro；滑动条 Home 后逐次 ArrowRight 验证全部六档；Escape 关闭并返回触发器，点击触发器可重开。鼠标点击滑动条从“高”变为“低”。 |
| 桌面与手机菜单不溢出、不压住输入框 | 通过。真实浏览器在 1200、390、320 像素宽度检查 DOM 边界；菜单与输入框间距均为 8 像素。 |
| 生产代码与已有五个在途文件保持原样 | 通过。Git 新增仅限本设计目录；五文件 SHA256 与批次开始一致。未运行全项目构建/回归，原因是本批不改生产代码。 |

浏览器实际结果（像素；数字保留三位小数）：

```json
{
  "viewports": [
    {"width": 1200, "scrollWidth": 1200, "menuLeft": 591.333, "menuRight": 911.333, "menuWidth": 320, "composerGap": 8},
    {"width": 390, "scrollWidth": 390, "menuLeft": 44.333, "menuRight": 364.333, "menuWidth": 320, "composerGap": 8},
    {"width": 320, "scrollWidth": 320, "menuLeft": 25.667, "menuRight": 294.333, "menuWidth": 268.667, "composerGap": 8}
  ],
  "keyboardRangeLabels": ["关闭", "最少", "低", "中", "高", "超高"],
  "badgeTriggerAriaTextAgree": true,
  "radioKeyboardSelection": "Research Pro",
  "pointerRangeSelection": {"value": 2, "label": "低"},
  "escapeReturnsTriggerFocus": true,
  "menuReopens": true
}
```

复现交互检查：打开预览，点击 Code Light，按左方向键；在滑动条按 Home，然后逐次按五次右方向键；核对徽标、底部当前档位与选中标签；按 Escape 关闭，再点击模型触发器重开。

## 复核锚点

- 基线提交：`7e346a99b5399fb701393ff46fee3ea4a2e0fef8`。
- 唯一交互源码：`preview.html`，SHA256 `47045A902C8D2479BBFEBADC2B3D02799C037037FB2F8F11EF623AF8CF2CA965`。
- 独立只读复核请求：`gpt-6.1-sol` / `high`；接口接受，运行时未回显。独立检查包括脚本语法、DOM 状态同步、无持久化入口、截图与五个原有文件哈希。
- 非阻断后续项：接入正式组件时，菜单打开后将焦点移入选中模型，减少键盘回退；当前预览可用 Shift+Tab 进入菜单，原生 radio/range 和 Escape 已验证。

视觉参考：[shadcn Slider](https://ui.shadcn.com/docs/components/base/slider)。未新增组件依赖。
