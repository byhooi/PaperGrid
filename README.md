# 作文稿纸 & 考试答题纸生成器 (PaperGrid Studio)

> 参考 [paperme.toolooz.com](https://paperme.toolooz.com/) 深度重构与升级，专门针对标准作文稿纸、高考申论答题卡与方格练字纸优化的现代 Web 工具。

---

## 🌟 核心功能亮点

- 🎯 **支持三大纸张类型**：
  - 📝 **方格作文纸**：
    - 精确字数排版：默认聚焦「小学生作文 (300字)」与「小学生作文 (400字)」等高频需求，大字号、消除上下多余留白。
    - 字符方格 + 行间留白槽（标点符号与修改栏，支持开启/关闭与槽高自由配置）。
    - **阶梯错开字数标记**：100/200/300/400 阶梯错开排版或行末对齐。
    - 辅助练字线：支持纯方格、田字虚线格、米字虚线格。
  - 🔤 **英语四线三格 (4-Line 3-Space)**：
    - 组高度、组间距自由调节，支持纵向自适应撑满页面。
    - 中间基准虚线支持同色、突出红线或实线。
    - 可选 75° 字母书写倾斜辅助虚线。
  - 📃 **课业横线纸 (Ruled Paper)**：
    - 行距自由配置，支持纵向自适应撑满纸张。
    - 支持实线、虚线、点状线。
    - 可选经典左侧垂直红色装订边界线 (Margin Line)。
- 📦 **全套专业导出格式（参考 PaperMe）**：
  - 📕 **导出高清矢量 PDF**：基于 `jsPDF` 纯矢量渲染，毫米级精度，打印边缘无锯齿。
  - 🎨 **导出 SVG 矢量图**：原生 SVG 矢量图，放大无马赛克，可二次排版。
  - 🖼️ **导出超清 PNG**：Retina 高清分辨率图片输出。
  - 🖨️ **一键打印**：调起系统打印机即刻出纸。
- 📄 **专业版面与分栏**：
  - 支持 **单栏** 与 **左右双栏试卷分栏**（中考、高考、模拟考作文答题卡经典样式）。
  - 覆盖 A4、A3、B5、B4、A5 等多种常用纸张。
- 🎨 **色彩与纸张质感**：
  - 线条颜色：经典墨黑、经典红、护眼绿、高考蓝、淡灰。
  - 纸张底色：标准纯白、护眼米黄、复古宣纸、清新浅绿、极浅冷灰。
- ✍️ **考务与辅助信息**：
  - 顶部考生信息栏（姓名 / 班级 / 考号）。
  - 作文题目专用下划线行。
  - 底部居中页码。
- 💾 **配置方案导入与导出**：
  - 一键将参数保存为 `.json` 文件，随时导入复用。

---

## 🚀 本地运行与体验

纯静态前端，双击 `index.html` 或在终端运行：

```bash
# 使用 Python 启动本地测试
python -m http.server 8000
```
访问 `http://localhost:8000` 即可使用。

---

## 📦 托管到 GitHub

在终端中执行以下命令（将 `YOUR_USERNAME` 替换为你的 GitHub 账号）：

```bash
# 1. 提交所有更新
git add .
git commit -m "feat: 参考 paperme.toolooz.com 升级全格式导出、双栏排版与纸张质感"

# 2. 关联并推送到你的 GitHub 远程仓库
git remote add origin https://github.com/YOUR_USERNAME/Paper.git
git push -u origin main
```

---

## ☁️ 通过 Cloudflare Pages 一键发布

本项目为纯静态高品质前端，部署到 Cloudflare Pages **完全免费且无需构建**：

1. 打开 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 导航至 **Workers 和 Pages** -> 点击 **Pages**。
3. 点击 **连接到 Git (Connect to Git)** 并选择你的 `Paper` 仓库。
4. 构建设置项（Build settings）：
   - **Framework preset (框架预设)**：选择 **None**
   - **Build command (构建命令)**：**留空**
   - **Build output directory (输出目录)**：填写 `/` 或 `.`
5. 点击 **保存并部署 (Save and Deploy)**。
6. 约 10 秒后，你即可获得一个可全球 CDN 加速的 `https://paper-xxx.pages.dev` 访问地址！
