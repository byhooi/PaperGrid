# 作文稿纸 & 考试答题纸 PDF 在线生成器 (PaperGrid Studio)

一个用于在线生成中文标准作文稿纸、考试答题纸、申论方格纸的现代 Web 应用。

支持**毫米级精确排版**、**双横线行间槽**、**字数阶梯错开标记**、**实时高清预览**与**高精度矢量 PDF 导出**。

---

## ✨ 核心特性

- 🎯 **1:1 复刻真实稿纸格式**：支持经典的主方格 + 行间窄条（留白槽，给标点/修改批注留空）。
- 🔢 **智能字数标记**：
  - **原图同款阶梯错开分布**：第 5 行在 1/4 处（100字）、第 10 行在正中（200字）、第 15 行在 3/4 处（300字）、第 20 行在左侧（400字）。
  - **行末对齐模式**：经典右下角/行末标注。
  - **支持步长设置**：每 100 字、每 50 字、每行末尾。
- 📄 **多种规格与多页支持**：A4 / B5 / A3 纸张规格，单页或多页（如中高考 800 字、1000 字作文答题纸）。
- 🎨 **经典配色预设**：原图墨黑、传统文墨红、答题卡护眼绿、高考经典蓝、淡灰铅印。
- ⚡ **纯矢量高精 PDF 导出**：基于 `jsPDF` 纯前端矢量指令生成，毫秒级下载，打印边缘锐利无任何锯齿。
- 🌐 **零依赖静态部署**：无需后端，无编译构建负担，支持直接通过 GitHub + Cloudflare Pages 免费发布。

---

## 🚀 本地快速预览

双击打开 `index.html` 即可在任意现代浏览器中使用，或通过命令行启动本地服务：

```bash
# Python 3
python -m http.server 8000
```
然后在浏览器访问 `http://localhost:8000`。

---

## 📦 托管到 GitHub

在项目根目录下执行以下 Git 命令：

```bash
# 1. 初始化 Git 仓库
git init

# 2. 暂存并提交代码
git add .
git commit -m "feat: 初版作文稿纸生成器，支持原图格式与矢量PDF导出"

# 3. 创建 main 分支
git branch -M main

# 4. 关联你的 GitHub 远程仓库 (将 YOUR_USERNAME 替换为你的 GitHub 用户名)
git remote add origin https://github.com/YOUR_USERNAME/Paper.git

# 5. 推送到 GitHub
git push -u origin main
```

---

## ☁️ 通过 Cloudflare Pages 发布上线

本项目为纯静态前端，部署到 Cloudflare Pages **完全免费且无需任何构建步骤**。

### 推荐方式：通过 Cloudflare 控制台连接 GitHub 自动部署

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 在左侧菜单点击 **Workers 和 Pages** -> 选择 **Pages**。
3. 点击 **连接到 Git (Connect to Git)**。
4. 授权并选择刚刚创建的 `Paper` 仓库。
5. 配置构建设置（Build settings）：
   - **Framework preset (框架预设)**: 选择 `None`。
   - **Build command (构建命令)**: **留空**（无需构建）。
   - **Build output directory (输出目录)**: 填入 `/` 或 `.`（即根目录）。
6. 点击 **保存并部署 (Save and Deploy)**。
7. 部署完成后，Cloudflare Pages 会提供一个免费的 `*.pages.dev` 访问链接（也可绑定自定义域名并自带免费 SSL 证书）。后续每当你 `git push` 到 GitHub，站点都会自动更新发布！

---

## 🛠️ 项目文件结构

```text
├── index.html       # 网页主结构与控制面板
├── style.css        # 现代拟物 UI 样式与响应式布局
├── app.js           # 网格几何计算、Canvas 预览与 jsPDF 矢量导出引擎
├── image.png        # 原始样式参考图
├── .gitignore       # Git 忽略配置
└── README.md        # 项目说明与发布指引
```
