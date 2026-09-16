---
name: 城迹
description: 可操作的北京周末城市指南
colors:
  accent: "#c8ef32"
  accent-soft: "#e9f8ad"
  accent-ink: "#171b16"
  paper: "#eff2ed"
  surface: "#fbfcfa"
  surface-strong: "#e3e7df"
  ink: "#171b16"
  muted: "#535c50"
  line: "#cbd2c7"
  focus: "#526900"
  inverse: "#20241e"
  inverse-ink: "#f6f8f2"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(3rem, 5.2vw, 4.85rem)"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2rem, 3.6vw, 3.4rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 850
    lineHeight: 1.45
    letterSpacing: "0.055em"
rounded:
  md: "8px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "48px"
  selection-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  selection-chip-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: "44px"
  nav-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 13px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px"
---

# Design System: 城迹

## Overview

**Creative North Star: "可操作的城市周刊"**

“可操作的城市周刊”把城市杂志的编辑判断与工具界面的即时操作合在同一套视觉秩序里。冷灰纸张承载深炭墨信息，荧光青柠只在当前选择、天气摘要和关键状态中发声；非对称图片与紧凑信息块让内容像经过本地编辑，而不是通用活动目录。

整体气质克制、编辑感、本地、可信、紧凑。层级默认由色块、1px 分隔线和留白建立，所有核心控件保持可触，动效只解释状态变化；界面拒绝营销落地页、装饰性渐变球、泛滥卡片、过度圆润和无来源夸张表达。

**Key Characteristics:**

- 冷灰纸张与深炭墨构成阅读底色
- 单一荧光青柠标记关键行动与状态
- 非对称编辑式节奏与紧凑工具密度并存
- 8px 几何贯穿容器、图片与控件
- 明暗主题保持同一信息层级与色彩角色

## Colors

配色以近中性的纸张与墨色建立可信阅读环境，只保留一个高辨识度青柠色族承担强调。

### Primary

- **荧光青柠**：`colors.accent` 用于已选筛选项、天气摘要、活动状态和主要按钮悬停。
- **柔和青柠**：`colors.accent-soft` 用于当前导航和低强度成功背景，不与主强调争夺注意力。
- **强调墨色**：`colors.accent-ink` 保证青柠表面上的信息清晰稳定。

### Neutral

- **冷灰纸张**：`colors.paper` 是页面底色，也是输入控件的内层表面。
- **干净表面**：`colors.surface` 承载导航、内容区块、卡片和弹层。
- **强化表面**：`colors.surface-strong` 表达禁用、警告和图片回退状态。
- **深炭墨**：`colors.ink` 用于主文字、主按钮和关键边界。
- **次级墨色**：`colors.muted` 用于说明、标签、元数据和次要图标。
- **安静分隔线**：`colors.line` 划分信息，不制造浮起的卡片感。
- **聚焦绿**：`colors.focus` 只用于键盘焦点和输入聚焦。
- **反转炭面与纸白**：`colors.inverse` 和 `colors.inverse-ink` 用于图片说明、组队预览等反转区块。

### Named Rules

**The One Accent Rule.** 荧光青柠只标记当前状态、关键信息和主要反馈，不承担大面积装饰。

## Typography

单一现代无衬线字体栈贯穿标题、正文与工具标签，通过字重、负字距和紧凑行高形成编辑感，不引入装饰性衬线字体。

### Hierarchy

- **Display**：使用 `typography.display`，服务首页主标题与页面级标题，短句、强字重、紧行高。
- **Headline**：使用 `typography.headline`，服务章节标题与路线标题，保持明显但不压过页面标题。
- **Title**：使用 `typography.title`，服务卡片标题、预览标题与弹层标题。
- **Body**：使用 `typography.body`，服务说明、推荐理由和攻略摘要，控制为易扫读的短段落。
- **Label**：使用 `typography.label`，服务 kicker、字段名称、事实标签和元数据。

### Named Rules

**The Dense Hierarchy Rule.** 用字重、行高和负字距建立层级，禁止用超大字号或额外字体制造虚假戏剧性。

## Layout

页面使用最大宽度 1240px 的居中容器，桌面横向边距为 40px，移动端为 28px，支持最窄 320px 视口。非对称编辑式节奏用于表达跨页面的信息优先级，但具体列数、双栏组合和内容密度由各页面的 surface brief 定义。

全局使用 1023px、767px 和 430px 三个响应断点：1023px 作为紧凑桌面边界，767px 以下切换移动导航与窄屏容器，430px 以下适配极窄视口。核心控件最小可触高度为 44px，主要操作为 48px；移动端底部为安全区和固定导航预留空间。

**The Asymmetric Utility Rule.** 非对称比例用于表达编辑优先级，但每个布局变化都必须缩短决策路径，不能只为制造视觉变化。

## Elevation & Depth

系统默认扁平。页面层级依靠 `colors.paper`、`colors.surface`、`colors.inverse`、1px 分隔线与稳定留白构造；普通内容、卡片和导航不使用投影。只有模态弹层使用侧车中的 `dialog-structural` 阴影，并配合深色遮罩明确阻断背景操作。

### Named Rules

**The Flat By Default Rule.** 静止内容保持无阴影，只有需要脱离页面流的弹层获得结构性阴影。

## Shapes

主要容器、图片、按钮、输入框和弹层统一使用 `rounded.md`，形成精确的 8px 几何。筛选、状态和小型数据标签使用 `rounded.pill`，但不会把普通卡片或大面积内容做成胶囊；1px 边线保持边界清楚且克制。

**The Eight Pixel Geometry Rule.** 8px 是默认外形语言，胶囊只属于选择与状态，不扩散到内容容器。

## Components

组件哲学是“精确、可触、工具导向”。状态必须由颜色、边线、文字或持久反馈共同表达，不能只靠短暂动效或图标。

### Buttons

- **Shape:** 主次按钮使用 `rounded.md`，主要操作采用 `components.button-primary`，次要操作采用 `components.button-secondary`。
- **Hover / Focus:** 主按钮悬停切换到 `components.button-primary-hover`；所有可操作元素显示清晰的 3px 聚焦轮廓，按下只位移 1px。
- **Disabled:** 禁用态使用强化表面、安静分隔线和次级墨色，同时保留原因说明。

### Chips

- **Style:** 未选状态使用 `components.selection-chip`，选中状态使用 `components.selection-chip-selected`。
- **State:** 原生 checkbox 或 radio 保留语义，视觉胶囊覆盖完整 44px 点击区域。

### Cards / Containers

- **Corner Style:** 内容卡和图片共享 `rounded.md`，图片与正文保持清楚边界。
- **Background:** 使用 `colors.surface`，反转预览使用 `colors.inverse`。
- **Shadow Strategy:** 默认无阴影，通过边线、色块和网格错落形成层级。
- **Internal Padding:** 紧凑卡片以 `components.card` 为基准，信息密集区允许按布局增减。

### Inputs / Fields

- **Style:** 输入、选择和文本域使用 `components.input-field`，具有纸张底色、安静边线和可触高度。
- **Focus:** 聚焦时边线转为 `colors.focus`，并添加低透明度焦点轮廓。
- **Error / Disabled:** 错误就地显示并与字段关联；禁用后仍保持文字可读。

### Navigation

桌面导航为紧凑文字工具条，当前项使用 `components.nav-active`；移动端固定为四项图标加文字底栏，当前项使用同一柔和青柠角色。品牌标记只保留一个小型青柠方点，主题切换始终是有边界的 44px 控件。

### Weather Summary

天气摘要使用整块荧光青柠承载天气、简短判断和推荐理由。桌面横排，移动端重组为两列并让理由独占下一行，始终把“为什么推荐”与结果放在一起。

### Named Rules

**The Tool First Rule.** 每个组件先保证动作、状态和反馈可理解，再允许加入编辑式节奏。

## Do's and Don'ts

### Do:

- Do 使用冷灰纸张、深炭墨和单一荧光青柠保持稳定识别。
- Do 用非对称编辑式节奏、1px 分隔线和紧凑留白表达编辑层级。
- Do 保持核心控件至少 44px 可触，并提供清晰键盘焦点。
- Do 让明暗主题复用相同的颜色角色、组件状态和信息顺序。
- Do 只让 transform 与 opacity 参与进入和布局动效，并尊重减少动态效果偏好。

### Don't:

- Don't 把界面做成营销落地页，或加入无来源的夸张表达。
- Don't 使用装饰性渐变球、泛滥状态点或三列等宽功能卡片。
- Don't 给普通内容添加阴影，或用大量独立卡片切碎连续信息。
- Don't 过度圆润普通容器，胶囊只用于选择和状态。
- Don't 引入装饰性衬线字体、混杂图标体系或脱离操作目的的动效。
