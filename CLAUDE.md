# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目与开发命令

PaperGrid 是纯前端、离线可用的稿纸生成器，支持中文作文纸、英语四线三格和课业横线纸。没有后端、数据上传、在线 CDN、npm 依赖或构建步骤。对话和文档使用中文。

以下命令在仓库根目录执行：

```sh
# 启动开发用静态服务器，访问 http://127.0.0.1:8000
python -m http.server 8000 --bind 127.0.0.1

# 单文件 JavaScript 语法检查（不是单元测试）
node --check render.js
```

也可直接打开 `index.html`，但本地文件模式可能限制字体加载和持久存储，优先使用静态服务器。

项目现有的完整基础检查命令（需要 PowerShell、Node.js 和 Git）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify.ps1
```

该脚本检查应用脚本与字体脚本的 JavaScript 语法、离线资源是否存在，运行 `scripts/test_layout.js` 布局回归检查，并执行 `git diff --check`。布局回归也可单独运行 `node scripts/test_layout.js`，不需要 npm 依赖。目前没有独立 lint 配置或自动化单元测试框架。排版和导出仍须在浏览器中验证；具体清单见 `README.md` 的“验证”章节。

## 架构与数据流

页面通过有序的 `defer` 脚本加载 `config.js` → `layout.js` → `render.js` → `exports.js` → `app.js`，模块通过 `globalThis.PaperGrid` 共享接口，不使用模块打包器。

核心处理链是：**表单／导入配置 → 配置校验 → 毫米布局 → 通用绘图数据 → SVG 预览或文件导出**。

- `config.js` 定义默认配置、预设、字段校验和 JSON 版本兼容。配置导入必须拒绝未知字段、非法值及无法排版的组合，失败时保持当前配置不变。
- `layout.js` 是不依赖 DOM 的布局层，计算纸张、栏、行和边界；不要把屏幕缩放或 DOM 尺寸引入物理排版计算。
- `render.js` 将布局变为共享绘图数据并序列化为 SVG。预览和不同导出格式应复用这套数据，而不是各自实现排版。
- `exports.js` 处理 SVG、PNG、PDF、打印以及本地资源加载；PDF 引擎首次使用时才加载，PDF 保留矢量线条和文字。
- `app.js` 连接表单、配置、预览、缩放、翻页和 `localStorage`。预览更新通过 `requestAnimationFrame` 合并；仅修改页数或 PNG DPI 不重建当前页 SVG。

## 跨模块约束

- 布局与绘图以毫米为单位；显示缩放与 PNG DPI 只影响呈现或栅格输出，不改变物理纸张尺寸。B4/B5 使用 ISO 尺寸，而非 JIS 尺寸。
- 作文纸自动适配使用可容纳的最大正方格，保留行列数及槽高规则，在各栏槽内居中；栏槽宽度与实际内容宽度需区分，双栏折线不随内容居中偏移。未开启适配时按栏宽确定格子尺寸。
- 未开启自动铺满时必须保留用户指定尺寸；超出可用空间应提示可容纳的行／组数并禁止导出，不能静默压缩或裁切。英语纸自动铺满保留组高与间距的比例，横线纸自动铺满由可用高度与行数确定间距。
- 信息栏和题目行仅出现在第一页，字数跨栏、跨页连续计算。PDF 和打印输出全部页面；SVG、PNG 仅输出当前预览页。
- 有效配置自动保存到当前站点的 `localStorage`，具名模板最多 20 个。切换纸型保留通用设置及各纸型参数，应用预设则替换完整配置。
- 配置 JSON 使用 `{ "version": 1, "config": { ... } }`，也兼容旧版无版本号格式；导入上限为 64 KB。缺省字段使用默认值，旧版行槽按比例恢复。
- 修改布局或导出时，重点覆盖三种纸型、横竖版、单双栏、首尾页、溢出后的恢复、跨页字数和物理尺寸；同时验证非法导入不改变状态、断网导出和资源加载失败重试。完整验证项以 `README.md` 为准。

## 离线资源与字体

PDF 使用仓库内固定版本的 jsPDF 4.2.1，不改为在线 CDN。`assets/PaperGridSans.ttf` 用于浏览器，`assets/papergrid-font.js` 是同一字体的 Base64 导出资源，两者必须同步更新并保留第三方许可证。

仅在修改可打印文字、需要增加字形时重建字体；只改界面文案不需要。先安装开发用 Python 依赖 `fonttools` 并下载上游 Noto Sans SC 字体，再运行：

```sh
python -m pip install fonttools
python scripts/subset_font.py path/to/NotoSansSC.ttf
```

字形集合定义在 `scripts/subset_font.py` 的 `subsetter.populate(...)`；脚本固定字重为 400，将字体重命名为 PaperGridSans，并同时生成上述两份资源。
