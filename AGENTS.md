# Repository Guidelines

## 项目结构与架构

PaperGrid 是离线可用的纯前端稿纸生成器，无后端、npm 依赖或构建步骤。

- `index.html`、`style.css`：页面入口与样式。
- `config.js`：默认值、预设、配置校验及 JSON 兼容。
- `layout.js`：不依赖 DOM 的毫米布局计算。
- `render.js`：共享绘图数据及 SVG 序列化。
- `exports.js`：PDF、SVG、PNG 导出与打印；`app.js`：交互、预览与本地存储。
- `assets/`：离线引擎、字体及许可证；`scripts/`：验证、回归测试与字体生成工具。

脚本按 `config → layout → render → exports → app` 顺序使用 `defer` 加载，通过 `globalThis.PaperGrid` 共享接口。保持预览与导出复用绘图数据，不将屏幕缩放引入物理布局。

## 开发与验证命令

在仓库根目录执行；本地服务需要 Python，完整验证需要 PowerShell、Node.js 和 Git。

```sh
python -m http.server 8000 --bind 127.0.0.1
node --check render.js
node scripts/test_layout.js
```

以上依次启动静态服务、检查单文件语法、运行布局回归。访问 `http://127.0.0.1:8000`；优先使用服务器而非直接打开 HTML。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify.ps1
```

完整检查包含 JavaScript 语法、离线资源存在性、布局回归及 `git diff --check`。

## 代码风格与命名

- JavaScript、HTML、CSS 使用两空格缩进；Python、PowerShell 使用四空格，遵循相邻代码风格。
- JavaScript 保留严格模式、单引号和分号；变量与函数使用 `camelCase`，预设键与 CSS 类使用 `kebab-case`。
- 工具脚本沿用 `test_layout.js`、`subset_font.py` 等下划线命名。对话、说明和文档使用中文。
- 当前无独立 lint 或格式化配置；避免无关的全文件格式化，不手工修改压缩库及生成的字体数据。

## 测试要求

回归测试使用 Node.js 内置 `node:assert/strict`，无第三方测试框架或覆盖率门槛。布局、预设和配置变更应在 `scripts/test_layout.js` 补充断言，覆盖正常值、边界值与拒绝路径。

自动检查不能替代浏览器验收。按 `README.md` 的“验证”清单检查三种纸型、横竖版、单双栏、首尾页、溢出恢复和配置兼容；导出变更需核对 PDF 物理尺寸、中文字体及 SVG/PNG 当前页。界面变更检查桌面与 390 px 移动端，离线功能需断网验证。

## 提交与拉取请求

历史提交主要采用 `feat:`、`fix:`、`refactor:` 前缀，建议延续并简短描述具体变化，例如 `fix: 修正双栏字数累计`。每次提交聚焦单一改动。

PR 应说明目的、影响范围、验证命令及结果；有关联问题时附链接。界面或排版变更附前后截图，导出变更附输出样例；行为变化同步更新 `README.md`，未完成的验证明确列出。

## 配置与资源约束

保持无数据上传、无在线 CDN。配置导入须拒绝未知字段、非法值和无法排版的组合，失败时不改变当前状态；保留旧配置兼容性。

新增可打印字形时，更新 `scripts/subset_font.py` 的字形集合，安装开发依赖 `fonttools` 后运行 `python scripts/subset_font.py path/to/NotoSansSC.ttf`。同时提交生成的 `assets/PaperGridSans.ttf` 与 `assets/papergrid-font.js`，保留第三方许可证。
