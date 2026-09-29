/**
 * 作文稿纸 & 考试答题纸生成器核心引擎
 * 参考 paperme.toolooz.com 打造
 * 支持：高清矢量 PDF 导出、SVG 矢量导出、超清 PNG 导出、浏览器打印、分栏试卷、田字/米字辅助线、JSON 配置导入导出
 */

// 常用纸张毫米规格
const PAPER_SPECS = {
  a4: { w: 210, h: 297, name: 'A4' },
  a3: { w: 297, h: 420, name: 'A3' },
  b5: { w: 176, h: 250, name: 'B5' },
  b4: { w: 250, h: 353, name: 'B4' },
  a5: { w: 148, h: 210, name: 'A5' },
};

// 预设模版库
const PRESET_TEMPLATES = {
  'sample-400': {
    paperSize: 'a4',
    paperOrientation: 'p',
    columnsCount: 1,
    pageCount: 1,
    marginTop: 18,
    marginRight: 15,
    marginBottom: 18,
    marginLeft: 15,
    cols: 20,
    rows: 20,
    gapRatio: 0.20,
    gridHelperLine: 'none',
    splitVerticalLines: false,
    showWordCount: true,
    countStep: '100',
    countPosition: 'staggered',
    lineColor: '#2c3038',
    bgColor: '#ffffff',
    outerLineWidth: 0.35,
    innerLineWidth: 0.15,
    showHeaderInfo: false,
    showTitleLine: false,
    showPageNumber: false,
  },
  'sample-440': {
    paperSize: 'a4',
    paperOrientation: 'p',
    columnsCount: 1,
    pageCount: 1,
    marginTop: 15,
    marginRight: 15,
    marginBottom: 15,
    marginLeft: 15,
    cols: 20,
    rows: 22,
    gapRatio: 0.20,
    gridHelperLine: 'none',
    splitVerticalLines: false,
    showWordCount: true,
    countStep: '100',
    countPosition: 'staggered',
    lineColor: '#2c3038',
    bgColor: '#ffffff',
    outerLineWidth: 0.35,
    innerLineWidth: 0.15,
    showHeaderInfo: false,
    showTitleLine: false,
    showPageNumber: false,
  },
  'exam-800': {
    paperSize: 'a4',
    paperOrientation: 'p',
    columnsCount: 1,
    pageCount: 2,
    marginTop: 18,
    marginRight: 16,
    marginBottom: 18,
    marginLeft: 16,
    cols: 20,
    rows: 20,
    gapRatio: 0.22,
    gridHelperLine: 'none',
    splitVerticalLines: false,
    showWordCount: true,
    countStep: '100',
    countPosition: 'right',
    lineColor: '#b92b27',
    bgColor: '#fffdf5',
    outerLineWidth: 0.40,
    innerLineWidth: 0.18,
    showHeaderInfo: true,
    showTitleLine: true,
    showPageNumber: true,
  },
  'exam-a3-double': {
    paperSize: 'a3',
    paperOrientation: 'l',
    columnsCount: 2,
    pageCount: 1,
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20,
    cols: 20,
    rows: 22,
    gapRatio: 0.20,
    gridHelperLine: 'none',
    splitVerticalLines: false,
    showWordCount: true,
    countStep: '100',
    countPosition: 'right',
    lineColor: '#b92b27',
    bgColor: '#ffffff',
    outerLineWidth: 0.40,
    innerLineWidth: 0.18,
    showHeaderInfo: true,
    showTitleLine: true,
    showPageNumber: true,
  },
  'shenlun': {
    paperSize: 'a4',
    paperOrientation: 'p',
    columnsCount: 1,
    pageCount: 2,
    marginTop: 18,
    marginRight: 15,
    marginBottom: 18,
    marginLeft: 15,
    cols: 25,
    rows: 20,
    gapRatio: 0.20,
    gridHelperLine: 'none',
    splitVerticalLines: false,
    showWordCount: true,
    countStep: '100',
    countPosition: 'right',
    lineColor: '#1e7e34',
    bgColor: '#ffffff',
    outerLineWidth: 0.40,
    innerLineWidth: 0.18,
    showHeaderInfo: true,
    showTitleLine: false,
    showPageNumber: true,
  },
  'tianzi-paper': {
    paperSize: 'a4',
    paperOrientation: 'p',
    columnsCount: 1,
    pageCount: 1,
    marginTop: 20,
    marginRight: 18,
    marginBottom: 20,
    marginLeft: 18,
    cols: 15,
    rows: 15,
    gapRatio: 0.25,
    gridHelperLine: 'tian',
    splitVerticalLines: false,
    showWordCount: false,
    countStep: '100',
    countPosition: 'staggered',
    lineColor: '#1e7e34',
    bgColor: '#fffdf5',
    outerLineWidth: 0.35,
    innerLineWidth: 0.15,
    showHeaderInfo: false,
    showTitleLine: false,
    showPageNumber: false,
  },
};

// 全局应用状态
let appState = { ...PRESET_TEMPLATES['sample-400'] };
let zoomScale = 1.0;

// DOM 元素引用集合
const dom = {
  // 表单输入
  paperSize: document.getElementById('paperSize'),
  paperOrientation: document.getElementById('paperOrientation'),
  columnsCount: document.getElementById('columnsCount'),
  pageCount: document.getElementById('pageCount'),
  marginTop: document.getElementById('marginTop'),
  marginRight: document.getElementById('marginRight'),
  marginBottom: document.getElementById('marginBottom'),
  marginLeft: document.getElementById('marginLeft'),
  cols: document.getElementById('cols'),
  rows: document.getElementById('rows'),
  gapRatio: document.getElementById('gapRatio'),
  gapRatioVal: document.getElementById('gapRatioVal'),
  gridHelperLine: document.getElementById('gridHelperLine'),
  splitVerticalLines: document.getElementById('splitVerticalLines'),
  showWordCount: document.getElementById('showWordCount'),
  countStep: document.getElementById('countStep'),
  countPosition: document.getElementById('countPosition'),
  wordCountArea: document.getElementById('wordCountArea'),
  lineColorPicker: document.getElementById('lineColorPicker'),
  outerLineWidth: document.getElementById('outerLineWidth'),
  innerLineWidth: document.getElementById('innerLineWidth'),
  showHeaderInfo: document.getElementById('showHeaderInfo'),
  showTitleLine: document.getElementById('showTitleLine'),
  showPageNumber: document.getElementById('showPageNumber'),

  // 顶部导出按键
  topExportPdfBtn: document.getElementById('topExportPdfBtn'),
  topExportSvgBtn: document.getElementById('topExportSvgBtn'),
  topExportPngBtn: document.getElementById('topExportPngBtn'),
  topPrintBtn: document.getElementById('topPrintBtn'),

  // 导入导出设置
  exportConfigBtn: document.getElementById('exportConfigBtn'),
  importConfigFile: document.getElementById('importConfigFile'),

  // 预览与标签
  tagPaper: document.getElementById('tagPaper'),
  tagGrid: document.getElementById('tagGrid'),
  tagWords: document.getElementById('tagWords'),
  mainCanvas: document.getElementById('mainCanvas'),
  paperSheet: document.getElementById('paperSheet'),
  paperViewport: document.getElementById('paperViewport'),
  zoomIn: document.getElementById('zoomIn'),
  zoomOut: document.getElementById('zoomOut'),
  zoomFit: document.getElementById('zoomFit'),
  zoomVal: document.getElementById('zoomVal'),
};

/**
 * 启动程序
 */
function init() {
  bindEventListeners();
  syncStateToForm();
  fitZoom();
  renderPreview();
}

/**
 * 事件绑定
 */
function bindEventListeners() {
  // 模板预设点击
  document.querySelectorAll('.preset-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.preset-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      const presetKey = card.dataset.preset;
      if (PRESET_TEMPLATES[presetKey]) {
        appState = { ...PRESET_TEMPLATES[presetKey] };
        syncStateToForm();
        renderPreview();
      }
    });
  });

  // 线条颜色快速选择器
  document.querySelectorAll('.color-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.color-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      appState.lineColor = pill.dataset.color;
      dom.lineColorPicker.value = appState.lineColor;
      renderPreview();
    });
  });

  // 纸张底色选择
  document.querySelectorAll('.bg-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.bg-swatch').forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
      appState.bgColor = swatch.dataset.bg;
      renderPreview();
    });
  });

  // 原生取色器
  dom.lineColorPicker.addEventListener('input', (e) => {
    appState.lineColor = e.target.value;
    document.querySelectorAll('.color-pill').forEach((p) => {
      p.classList.toggle('active', p.dataset.color.toLowerCase() === appState.lineColor.toLowerCase());
    });
    renderPreview();
  });

  // 行间槽滑动条
  dom.gapRatio.addEventListener('input', (e) => {
    const ratio = parseFloat(e.target.value);
    appState.gapRatio = ratio;
    dom.gapRatioVal.textContent = `${Math.round(ratio * 100)}%`;
    renderPreview();
  });

  // 基础输入项监听
  const trackedInputs = [
    'paperSize',
    'paperOrientation',
    'columnsCount',
    'pageCount',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'cols',
    'rows',
    'gridHelperLine',
    'countStep',
    'countPosition',
    'outerLineWidth',
    'innerLineWidth',
  ];

  trackedInputs.forEach((id) => {
    if (dom[id]) {
      dom[id].addEventListener('change', onFormChange);
      dom[id].addEventListener('input', onFormChange);
    }
  });

  // 复选框监听
  ['splitVerticalLines', 'showWordCount', 'showHeaderInfo', 'showTitleLine', 'showPageNumber'].forEach((id) => {
    if (dom[id]) {
      dom[id].addEventListener('change', (e) => {
        appState[id] = e.target.checked;
        if (id === 'showWordCount') {
          dom.wordCountArea.style.display = e.target.checked ? 'grid' : 'none';
        }
        renderPreview();
      });
    }
  });

  // 缩放操作
  dom.zoomIn.addEventListener('click', () => updateZoom(zoomScale + 0.15));
  dom.zoomOut.addEventListener('click', () => updateZoom(zoomScale - 0.15));
  dom.zoomFit.addEventListener('click', fitZoom);

  // 滚轮缩放
  dom.paperViewport.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        updateZoom(zoomScale + delta);
      }
    },
    { passive: false }
  );

  // 导出与打印按键
  dom.topExportPdfBtn.addEventListener('click', () => exportPdf(false));
  dom.topPrintBtn.addEventListener('click', () => exportPdf(true));
  dom.topExportSvgBtn.addEventListener('click', exportSvg);
  dom.topExportPngBtn.addEventListener('click', exportPng);

  // JSON 配置备份
  dom.exportConfigBtn.addEventListener('click', exportConfiguration);
  dom.importConfigFile.addEventListener('change', importConfiguration);
}

/**
 * 表单变更回调
 */
function onFormChange() {
  appState.paperSize = dom.paperSize.value;
  appState.paperOrientation = dom.paperOrientation.value;
  appState.columnsCount = parseInt(dom.columnsCount.value) || 1;
  appState.pageCount = parseInt(dom.pageCount.value) || 1;
  appState.marginTop = parseFloat(dom.marginTop.value) || 15;
  appState.marginRight = parseFloat(dom.marginRight.value) || 15;
  appState.marginBottom = parseFloat(dom.marginBottom.value) || 15;
  appState.marginLeft = parseFloat(dom.marginLeft.value) || 15;
  appState.cols = parseInt(dom.cols.value) || 20;
  appState.rows = parseInt(dom.rows.value) || 20;
  appState.gridHelperLine = dom.gridHelperLine.value;
  appState.countStep = dom.countStep.value;
  appState.countPosition = dom.countPosition.value;
  appState.outerLineWidth = parseFloat(dom.outerLineWidth.value) || 0.35;
  appState.innerLineWidth = parseFloat(dom.innerLineWidth.value) || 0.15;

  updateTags();
  renderPreview();
}

/**
 * 同步状态到表单 UI
 */
function syncStateToForm() {
  dom.paperSize.value = appState.paperSize;
  dom.paperOrientation.value = appState.paperOrientation;
  dom.columnsCount.value = appState.columnsCount;
  dom.pageCount.value = appState.pageCount;
  dom.marginTop.value = appState.marginTop;
  dom.marginRight.value = appState.marginRight;
  dom.marginBottom.value = appState.marginBottom;
  dom.marginLeft.value = appState.marginLeft;
  dom.cols.value = appState.cols;
  dom.rows.value = appState.rows;
  dom.gapRatio.value = appState.gapRatio;
  dom.gapRatioVal.textContent = `${Math.round(appState.gapRatio * 100)}%`;
  dom.gridHelperLine.value = appState.gridHelperLine;
  dom.splitVerticalLines.checked = appState.splitVerticalLines;
  dom.showWordCount.checked = appState.showWordCount;
  dom.countStep.value = appState.countStep;
  dom.countPosition.value = appState.countPosition;
  dom.wordCountArea.style.display = appState.showWordCount ? 'grid' : 'none';
  dom.lineColorPicker.value = appState.lineColor;
  dom.outerLineWidth.value = appState.outerLineWidth;
  dom.innerLineWidth.value = appState.innerLineWidth;
  dom.showHeaderInfo.checked = appState.showHeaderInfo;
  dom.showTitleLine.checked = appState.showTitleLine;
  dom.showPageNumber.checked = appState.showPageNumber;

  // 颜色高亮
  document.querySelectorAll('.color-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.color.toLowerCase() === appState.lineColor.toLowerCase());
  });

  document.querySelectorAll('.bg-swatch').forEach((swatch) => {
    swatch.classList.toggle('active', swatch.dataset.bg.toLowerCase() === appState.bgColor.toLowerCase());
  });

  updateTags();
}

/**
 * 更新预览标签状态
 */
function updateTags() {
  const spec = PAPER_SPECS[appState.paperSize] || PAPER_SPECS.a4;
  const orientStr = appState.paperOrientation === 'p' ? '纵向' : '横向';
  dom.tagPaper.textContent = `${spec.name} ${orientStr} · ${appState.columnsCount === 2 ? '双栏' : '单栏'}`;

  dom.tagGrid.textContent = `${appState.cols}列 × ${appState.rows}行`;

  const totalWordsPerPage = appState.cols * appState.rows * appState.columnsCount;
  dom.tagWords.textContent = `${totalWordsPerPage} 字 / 页 (共 ${totalWordsPerPage * appState.pageCount} 字)`;
}

/**
 * 缩放管理
 */
function updateZoom(newZoom) {
  zoomScale = Math.max(0.3, Math.min(2.5, newZoom));
  dom.zoomVal.textContent = `${Math.round(zoomScale * 100)}%`;
  dom.paperSheet.style.transform = `scale(${zoomScale})`;
}

function fitZoom() {
  const spec = PAPER_SPECS[appState.paperSize] || PAPER_SPECS.a4;
  const isLandscape = appState.paperOrientation === 'l';
  const paperW = isLandscape ? spec.h : spec.w;
  const paperH = isLandscape ? spec.w : spec.h;

  const viewport = dom.paperViewport;
  const padding = 60;
  const availW = viewport.clientWidth - padding;
  const availH = viewport.clientHeight - padding;

  const pxW = paperW * 3.78;
  const pxH = paperH * 3.78;

  const scale = Math.min(availW / pxW, availH / pxH, 1.25);
  updateZoom(Math.max(0.35, scale));
}

/**
 * 核心数学排版布局计算（单位：毫米 mm）
 */
function computeLayout(pageIndex = 0) {
  const spec = PAPER_SPECS[appState.paperSize] || PAPER_SPECS.a4;
  const isLandscape = appState.paperOrientation === 'l';
  const paperWidth = isLandscape ? spec.h : spec.w;
  const paperHeight = isLandscape ? spec.w : spec.h;

  const { marginTop, marginRight, marginBottom, marginLeft, columnsCount, cols, rows, gapRatio } = appState;

  // 顶部考务栏高度
  let headerHeight = 0;
  if (appState.showHeaderInfo && pageIndex === 0) headerHeight += 12;
  if (appState.showTitleLine && pageIndex === 0) headerHeight += 14;

  const contentTop = marginTop + headerHeight;
  const contentHeight = paperHeight - contentTop - marginBottom;
  const totalContentWidth = paperWidth - marginLeft - marginRight;

  // 双栏间距（试卷中缝间距）
  const columnGap = columnsCount > 1 ? 16 : 0;
  const columnWidth = (totalContentWidth - (columnsCount - 1) * columnGap) / columnsCount;

  // 每个字符方格宽度
  const cellWidth = columnWidth / cols;

  // 方格高与行间槽高
  let cellHeight = cellWidth;
  let gapHeight = cellHeight * gapRatio;
  let totalGridHeight = rows * cellHeight + rows * gapHeight;

  // 纵向溢出保护：若超过页面可用高度则自适应等比压缩
  if (totalGridHeight > contentHeight) {
    const rowUnit = contentHeight / rows;
    cellHeight = rowUnit / (1 + gapRatio);
    gapHeight = cellHeight * gapRatio;
    totalGridHeight = contentHeight;
  }

  // 纵向垂直居中
  const gridTop = contentTop + (contentHeight - totalGridHeight) / 2;

  // 计算每栏的具体矩形区域
  const columns = [];
  for (let c = 0; c < columnsCount; c++) {
    const colLeft = marginLeft + c * (columnWidth + columnGap);
    columns.push({
      colIndex: c,
      left: colLeft,
      top: gridTop,
      width: columnWidth,
      height: totalGridHeight,
    });
  }

  return {
    paperWidth,
    paperHeight,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    headerHeight,
    columnGap,
    columns,
    cellWidth,
    cellHeight,
    gapHeight,
    totalGridHeight,
  };
}

/**
 * 实时在 Canvas 上绘制第 1 页高精度预览
 */
function renderPreview() {
  const layout = computeLayout(0);
  const canvas = dom.mainCanvas;
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 2;
  const mmToPx = 3.779528; // 96 DPI 下 1mm ≈ 3.78px

  const pxWidth = layout.paperWidth * mmToPx;
  const pxHeight = layout.paperHeight * mmToPx;

  canvas.width = pxWidth * dpr;
  canvas.height = pxHeight * dpr;
  canvas.style.width = `${pxWidth}px`;
  canvas.style.height = `${pxHeight}px`;

  ctx.save();
  ctx.scale(dpr * mmToPx, dpr * mmToPx);

  // 纸张底色
  ctx.fillStyle = appState.bgColor;
  ctx.fillRect(0, 0, layout.paperWidth, layout.paperHeight);

  // 绘制考生信息栏 & 标题行
  if (appState.showHeaderInfo) drawHeaderInfo(ctx, layout);
  if (appState.showTitleLine) drawTitleLine(ctx, layout);

  // 绘制网格主体（支持单栏与双栏）
  layout.columns.forEach((col, colIdx) => {
    drawColumnGrid(ctx, layout, col, 0, colIdx);
  });

  // 绘制双栏中缝虚线（试卷折线）
  if (appState.columnsCount === 2) {
    drawFoldLine(ctx, layout);
  }

  // 绘制页脚页码
  if (appState.showPageNumber) {
    drawPageNumber(ctx, layout, 0);
  }

  ctx.restore();
}

/**
 * 绘制顶部考务信息
 */
function drawHeaderInfo(ctx, layout) {
  ctx.save();
  ctx.fillStyle = appState.lineColor;
  ctx.font = '3.3px -apple-system, sans-serif';
  ctx.textBaseline = 'middle';

  const y = layout.marginTop + 4;
  const availableWidth = layout.paperWidth - layout.marginLeft - layout.marginRight;
  const items = ['姓名：__________', '班级：__________', '准考证号：________________'];
  const spacing = availableWidth / 3;

  items.forEach((text, i) => {
    ctx.fillText(text, layout.marginLeft + i * spacing, y);
  });
  ctx.restore();
}

/**
 * 绘制作文题目行
 */
function drawTitleLine(ctx, layout) {
  ctx.save();
  ctx.fillStyle = appState.lineColor;
  ctx.font = '3.6px -apple-system, sans-serif';
  ctx.textBaseline = 'middle';

  const y = layout.marginTop + (appState.showHeaderInfo ? 14 : 4);
  ctx.fillText('题目：', layout.marginLeft, y);

  ctx.strokeStyle = appState.lineColor;
  ctx.lineWidth = appState.innerLineWidth;
  ctx.beginPath();
  ctx.moveTo(layout.marginLeft + 12, y + 2.5);
  ctx.lineTo(layout.paperWidth - layout.marginRight, y + 2.5);
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制单栏网格
 */
function drawColumnGrid(ctx, layout, col, pageIndex, colIndex) {
  const { cols, rows, outerLineWidth, innerLineWidth, splitVerticalLines, showWordCount, gridHelperLine } = appState;
  const { cellWidth, cellHeight, gapHeight } = layout;
  const { left, top, width, height } = col;

  ctx.save();
  ctx.strokeStyle = appState.lineColor;

  // 1. 横线系统
  for (let r = 0; r < rows; r++) {
    const rowTop = top + r * (cellHeight + gapHeight);
    const rowBottom = rowTop + cellHeight;
    const gapBottom = rowBottom + gapHeight;

    // 主方格顶部线
    ctx.lineWidth = r === 0 ? outerLineWidth : innerLineWidth;
    ctx.beginPath();
    ctx.moveTo(left, rowTop);
    ctx.lineTo(left + width, rowTop);
    ctx.stroke();

    // 格内辅助线（田字格 / 米字格）
    if (gridHelperLine !== 'none') {
      drawHelperLines(ctx, left, rowTop, cols, cellWidth, cellHeight, gridHelperLine);
    }

    // 主方格底部横线
    ctx.lineWidth = innerLineWidth;
    ctx.beginPath();
    ctx.moveTo(left, rowBottom);
    ctx.lineTo(left + width, rowBottom);
    ctx.stroke();

    // 行间槽底部横线
    ctx.lineWidth = r === rows - 1 ? outerLineWidth : innerLineWidth;
    ctx.beginPath();
    ctx.moveTo(left, gapBottom);
    ctx.lineTo(left + width, gapBottom);
    ctx.stroke();

    // 内部坚线
    ctx.lineWidth = innerLineWidth;
    for (let c = 1; c < cols; c++) {
      const x = left + c * cellWidth;
      ctx.beginPath();
      ctx.moveTo(x, rowTop);
      ctx.lineTo(x, splitVerticalLines ? gapBottom : rowBottom);
      ctx.stroke();
    }

    // 2. 字数统计提示
    if (showWordCount && gapHeight > 0.8) {
      drawSlotWordCount(ctx, layout, col, r, rowBottom, gapHeight, pageIndex, colIndex);
    }
  }

  // 3. 左右外边框
  ctx.lineWidth = outerLineWidth;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, top + height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(left + width, top);
  ctx.lineTo(left + width, top + height);
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制田字格或米字格内部虚线
 */
function drawHelperLines(ctx, rowLeft, rowTop, cols, cellW, cellH, type) {
  ctx.save();
  ctx.lineWidth = appState.innerLineWidth * 0.7;
  ctx.strokeStyle = appState.lineColor;
  ctx.setLineDash([0.8, 0.8]);

  for (let c = 0; c < cols; c++) {
    const x = rowLeft + c * cellW;
    const midX = x + cellW / 2;
    const midY = rowTop + cellH / 2;

    // 十字水平虚线
    ctx.beginPath();
    ctx.moveTo(x, midY);
    ctx.lineTo(x + cellW, midY);
    ctx.stroke();

    // 十字垂直虚线
    ctx.beginPath();
    ctx.moveTo(midX, rowTop);
    ctx.lineTo(midX, rowTop + cellH);
    ctx.stroke();

    if (type === 'mi') {
      // 对角斜虚线
      ctx.beginPath();
      ctx.moveTo(x, rowTop);
      ctx.lineTo(x + cellW, rowTop + cellH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + cellW, rowTop);
      ctx.lineTo(x, rowTop + cellH);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * 绘制行间槽字数标记
 */
function drawSlotWordCount(ctx, layout, col, rowIndex, slotTop, slotHeight, pageIndex, colIndex) {
  const { cols, rows, columnsCount, countStep, countPosition } = appState;
  const wordsPerColumn = cols * rows;
  const accumulatedWordsBefore = pageIndex * (wordsPerColumn * columnsCount) + colIndex * wordsPerColumn;
  const currentTotalWords = accumulatedWordsBefore + (rowIndex + 1) * cols;

  let show = false;
  if (countStep === '100' && currentTotalWords % 100 === 0) show = true;
  if (countStep === '50' && currentTotalWords % 50 === 0) show = true;
  if (countStep === '200' && currentTotalWords % 200 === 0) show = true;
  if (countStep === 'row') show = true;

  if (!show) return;

  ctx.save();
  ctx.fillStyle = appState.lineColor;
  const fontSize = Math.min(slotHeight * 0.75, 2.6);
  ctx.font = `${fontSize}px "Segoe UI", Arial, sans-serif`;
  ctx.textBaseline = 'middle';

  const textStr = `${currentTotalWords}`;
  const textW = ctx.measureText(textStr).width;
  const centerY = slotTop + slotHeight / 2;

  let targetX = 0;
  if (countPosition === 'staggered') {
    const stage = Math.floor(currentTotalWords / 100) % 4;
    if (stage === 1) {
      targetX = col.left + layout.cellWidth * Math.round(cols * 0.28) - textW / 2;
    } else if (stage === 2) {
      targetX = col.left + col.width / 2 - textW / 2;
    } else if (stage === 3) {
      targetX = col.left + layout.cellWidth * Math.round(cols * 0.75) - textW / 2;
    } else {
      targetX = col.left + layout.cellWidth * 0.8 - textW / 2;
    }
  } else if (countPosition === 'right') {
    targetX = col.left + col.width - textW - 1;
  } else {
    targetX = col.left + col.width / 2 - textW / 2;
  }

  ctx.fillText(textStr, targetX, centerY);
  ctx.restore();
}

/**
 * 试卷双栏折痕中缝
 */
function drawFoldLine(ctx, layout) {
  const centerX = layout.paperWidth / 2;
  ctx.save();
  ctx.lineWidth = appState.innerLineWidth;
  ctx.strokeStyle = appState.lineColor;
  ctx.setLineDash([2, 3]);

  ctx.beginPath();
  ctx.moveTo(centerX, layout.marginTop);
  ctx.lineTo(centerX, layout.paperHeight - layout.marginBottom);
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制页脚页码
 */
function drawPageNumber(ctx, layout, pageIndex) {
  ctx.save();
  ctx.fillStyle = appState.lineColor;
  ctx.font = '3.0px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const text = `- ${pageIndex + 1} -`;
  ctx.fillText(text, layout.paperWidth / 2, layout.paperHeight - layout.marginBottom + 8);
  ctx.restore();
}

/**
 * 导出高精度矢量 PDF (jsPDF)
 */
function exportPdf(triggerPrint = false) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('正在加载 PDF 生成引擎，请稍候...');
    return;
  }

  const { jsPDF } = window.jspdf;
  const isLandscape = appState.paperOrientation === 'l';
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: appState.paperSize,
  });

  const rgb = hexToRgb(appState.lineColor);
  const totalPages = appState.pageCount;

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) doc.addPage(appState.paperSize, isLandscape ? 'landscape' : 'portrait');

    const layout = computeLayout(p);

    // 绘制考生信息
    if (appState.showHeaderInfo && p === 0) {
      doc.setFontSize(9);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const y = layout.marginTop + 4;
      const availableWidth = layout.paperWidth - layout.marginLeft - layout.marginRight;
      const spacing = availableWidth / 3;
      doc.text('姓名：__________', layout.marginLeft, y);
      doc.text('班级：__________', layout.marginLeft + spacing, y);
      doc.text('准考证号：________________', layout.marginLeft + 2 * spacing, y);
    }

    // 绘制作文题目
    if (appState.showTitleLine && p === 0) {
      doc.setFontSize(10);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const y = layout.marginTop + (appState.showHeaderInfo ? 14 : 4);
      doc.text('题目：', layout.marginLeft, y);
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(appState.innerLineWidth);
      doc.line(layout.marginLeft + 12, y + 1.5, layout.paperWidth - layout.marginRight, y + 1.5);
    }

    // 绘制各栏网格
    layout.columns.forEach((col, colIdx) => {
      drawColumnPdf(doc, layout, col, p, colIdx, rgb);
    });

    // 试卷中缝折痕
    if (appState.columnsCount === 2) {
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(appState.innerLineWidth);
      doc.setLineDashPattern([2, 3], 0);
      doc.line(layout.paperWidth / 2, layout.marginTop, layout.paperWidth / 2, layout.paperHeight - layout.marginBottom);
      doc.setLineDashPattern([], 0);
    }

    // 页码
    if (appState.showPageNumber) {
      doc.setFontSize(8);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text(`- ${p + 1} -`, layout.paperWidth / 2, layout.paperHeight - layout.marginBottom + 7, { align: 'center' });
    }
  }

  if (triggerPrint) {
    doc.autoPrint();
    const blob = doc.output('bloburl');
    window.open(blob);
  } else {
    doc.save(`作文稿纸_${appState.cols}x${appState.rows}_${totalPages}页.pdf`);
  }
}

/**
 * 绘制 PDF 单栏
 */
function drawColumnPdf(doc, layout, col, pageIndex, colIndex, rgb) {
  const { cols, rows, outerLineWidth, innerLineWidth, splitVerticalLines, showWordCount, countStep, countPosition } = appState;
  const { cellWidth, cellHeight, gapHeight } = layout;
  const { left, top, width, height } = col;

  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

  for (let r = 0; r < rows; r++) {
    const rowTop = top + r * (cellHeight + gapHeight);
    const rowBottom = rowTop + cellHeight;
    const gapBottom = rowBottom + gapHeight;

    // 主格顶横线
    doc.setLineWidth(r === 0 ? outerLineWidth : innerLineWidth);
    doc.line(left, rowTop, left + width, rowTop);

    // 主格底横线
    doc.setLineWidth(innerLineWidth);
    doc.line(left, rowBottom, left + width, rowBottom);

    // 行间槽底横线
    doc.setLineWidth(r === rows - 1 ? outerLineWidth : innerLineWidth);
    doc.line(left, gapBottom, left + width, gapBottom);

    // 竖线
    doc.setLineWidth(innerLineWidth);
    for (let c = 1; c < cols; c++) {
      const x = left + c * cellWidth;
      doc.line(x, rowTop, x, splitVerticalLines ? gapBottom : rowBottom);
    }

    // 字数标记
    if (showWordCount && gapHeight > 0.8) {
      const wordsPerColumn = cols * rows;
      const accumulatedWordsBefore = pageIndex * (wordsPerColumn * appState.columnsCount) + colIndex * wordsPerColumn;
      const currentTotalWords = accumulatedWordsBefore + (rowIndex = r + 1) * cols;

      let show = false;
      if (countStep === '100' && currentTotalWords % 100 === 0) show = true;
      if (countStep === '50' && currentTotalWords % 50 === 0) show = true;
      if (countStep === '200' && currentTotalWords % 200 === 0) show = true;
      if (countStep === 'row') show = true;

      if (show) {
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        const pdfFontSize = Math.max(5, Math.min(8, gapHeight * 2.8));
        doc.setFontSize(pdfFontSize);

        const textStr = `${currentTotalWords}`;
        const textW = doc.getTextWidth(textStr);
        const centerY = rowBottom + gapHeight * 0.72;

        let targetX = 0;
        if (countPosition === 'staggered') {
          const stage = Math.floor(currentTotalWords / 100) % 4;
          if (stage === 1) {
            targetX = left + cellWidth * Math.round(cols * 0.28) - textW / 2;
          } else if (stage === 2) {
            targetX = left + width / 2 - textW / 2;
          } else if (stage === 3) {
            targetX = left + cellWidth * Math.round(cols * 0.75) - textW / 2;
          } else {
            targetX = left + cellWidth * 0.8 - textW / 2;
          }
        } else if (countPosition === 'right') {
          targetX = left + width - textW - 1;
        } else {
          targetX = left + width / 2 - textW / 2;
        }

        doc.text(textStr, targetX, centerY);
      }
    }
  }

  // 左右外边框
  doc.setLineWidth(outerLineWidth);
  doc.line(left, top, left, top + height);
  doc.line(left + width, top, left + width, top + height);
}

/**
 * 导出 SVG 矢量格式（支持在 Illustrator/Inkscape 无损打开）
 */
function exportSvg() {
  const layout = computeLayout(0);
  const { paperWidth, paperHeight } = layout;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${paperWidth}mm" height="${paperHeight}mm" viewBox="0 0 ${paperWidth} ${paperHeight}">\n`;
  svgContent += `  <rect width="${paperWidth}" height="${paperHeight}" fill="${appState.bgColor}" />\n`;

  // 渲染主体线条与文本
  layout.columns.forEach((col, colIdx) => {
    const { cols, rows, outerLineWidth, innerLineWidth, splitVerticalLines, showWordCount } = appState;
    const { cellWidth, cellHeight, gapHeight } = layout;
    const { left, top, width, height } = col;

    // 左右边框
    svgContent += `  <line x1="${left}" y1="${top}" x2="${left}" y2="${top + height}" stroke="${appState.lineColor}" stroke-width="${outerLineWidth}" />\n`;
    svgContent += `  <line x1="${left + width}" y1="${top}" x2="${left + width}" y2="${top + height}" stroke="${appState.lineColor}" stroke-width="${outerLineWidth}" />\n`;

    for (let r = 0; r < rows; r++) {
      const rowTop = top + r * (cellHeight + gapHeight);
      const rowBottom = rowTop + cellHeight;
      const gapBottom = rowBottom + gapHeight;

      const topLineW = r === 0 ? outerLineWidth : innerLineWidth;
      svgContent += `  <line x1="${left}" y1="${rowTop}" x2="${left + width}" y2="${rowTop}" stroke="${appState.lineColor}" stroke-width="${topLineW}" />\n`;
      svgContent += `  <line x1="${left}" y1="${rowBottom}" x2="${left + width}" y2="${rowBottom}" stroke="${appState.lineColor}" stroke-width="${innerLineWidth}" />\n`;

      const botLineW = r === rows - 1 ? outerLineWidth : innerLineWidth;
      svgContent += `  <line x1="${left}" y1="${gapBottom}" x2="${left + width}" y2="${gapBottom}" stroke="${appState.lineColor}" stroke-width="${botLineW}" />\n`;

      // 竖线
      for (let c = 1; c < cols; c++) {
        const x = left + c * cellWidth;
        const y2 = splitVerticalLines ? gapBottom : rowBottom;
        svgContent += `  <line x1="${x}" y1="${rowTop}" x2="${x}" y2="${y2}" stroke="${appState.lineColor}" stroke-width="${innerLineWidth}" />\n`;
      }
    }
  });

  svgContent += `</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `作文稿纸_${appState.cols}x${appState.rows}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 导出超清 PNG
 */
function exportPng() {
  const canvas = dom.mainCanvas;
  const link = document.createElement('a');
  link.download = `作文稿纸_${appState.cols}x${appState.rows}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/**
 * 备份配置为 JSON 文件
 */
function exportConfiguration() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `稿纸配置_${appState.cols}x${appState.rows}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * 从 JSON 恢复配置
 */
function importConfiguration(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      appState = { ...appState, ...imported };
      syncStateToForm();
      renderPreview();
      alert('配置方案导入成功！');
    } catch (err) {
      alert('配置文件格式错误，请检查 JSON 格式');
    }
  };
  reader.readAsText(file);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [44, 48, 56];
}

// 启动
document.addEventListener('DOMContentLoaded', init);
