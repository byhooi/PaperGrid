/**
 * 作文稿纸 & 答题纸 PDF 网页生成器
 * 核心逻辑：毫米级精准排版、Canvas 实时高清预览、jsPDF 矢量 PDF 导出
 */

// 常用纸张毫米尺寸
const PAPER_SIZES = {
  a4: { w: 210, h: 297 },
  b5: { w: 176, h: 250 },
  a3: { w: 297, h: 420 },
};

// 预设配置库
const PRESETS = {
  'sample-400': {
    paperSize: 'a4',
    paperOrientation: 'p',
    pageCount: 1,
    pageMargin: 15,
    cols: 20,
    rows: 20,
    gapRatio: 0.20,
    splitVerticalLines: false,
    showWordCount: true,
    countStep: '100',
    countPosition: 'staggered',
    showHeaderInfo: false,
    showTitleLine: false,
    color: '#2c3038',
    outerLineWidth: 0.35,
    innerLineWidth: 0.15,
  },
  'sample-440': {
    paperSize: 'a4',
    paperOrientation: 'p',
    pageCount: 1,
    pageMargin: 15,
    cols: 20,
    rows: 22,
    gapRatio: 0.20,
    splitVerticalLines: false,
    showWordCount: true,
    countStep: '100',
    countPosition: 'staggered',
    showHeaderInfo: false,
    showTitleLine: false,
    color: '#2c3038',
    outerLineWidth: 0.35,
    innerLineWidth: 0.15,
  },
  'exam-800': {
    paperSize: 'a4',
    paperOrientation: 'p',
    pageCount: 2,
    pageMargin: 16,
    cols: 20,
    rows: 20,
    gapRatio: 0.22,
    splitVerticalLines: false,
    showWordCount: true,
    countStep: '100',
    countPosition: 'right',
    showHeaderInfo: true,
    showTitleLine: true,
    color: '#b92b27',
    outerLineWidth: 0.4,
    innerLineWidth: 0.18,
  },
  'shenlun': {
    paperSize: 'a4',
    paperOrientation: 'p',
    pageCount: 2,
    pageMargin: 16,
    cols: 25,
    rows: 20,
    gapRatio: 0.2,
    splitVerticalLines: false,
    showWordCount: true,
    countStep: '100',
    countPosition: 'right',
    showHeaderInfo: true,
    showTitleLine: false,
    color: '#1e7e34',
    outerLineWidth: 0.4,
    innerLineWidth: 0.18,
  },
  'clean-practice': {
    paperSize: 'a4',
    paperOrientation: 'p',
    pageCount: 1,
    pageMargin: 18,
    cols: 16,
    rows: 18,
    gapRatio: 0.25,
    splitVerticalLines: false,
    showWordCount: false,
    countStep: '100',
    countPosition: 'staggered',
    showHeaderInfo: false,
    showTitleLine: false,
    color: '#1e7e34',
    outerLineWidth: 0.35,
    innerLineWidth: 0.15,
  },
};

// 状态管理
let state = { ...PRESETS['sample-400'] };
let zoom = 1.0;

// DOM 元素引用
const elements = {
  paperSize: document.getElementById('paperSize'),
  paperOrientation: document.getElementById('paperOrientation'),
  pageCount: document.getElementById('pageCount'),
  pageMargin: document.getElementById('pageMargin'),
  cols: document.getElementById('cols'),
  rows: document.getElementById('rows'),
  gapRatio: document.getElementById('gapRatio'),
  gapRatioVal: document.getElementById('gapRatioVal'),
  splitVerticalLines: document.getElementById('splitVerticalLines'),
  showWordCount: document.getElementById('showWordCount'),
  countStep: document.getElementById('countStep'),
  countPosition: document.getElementById('countPosition'),
  countOptionsArea: document.getElementById('countOptionsArea'),
  showHeaderInfo: document.getElementById('showHeaderInfo'),
  showTitleLine: document.getElementById('showTitleLine'),
  outerLineWidth: document.getElementById('outerLineWidth'),
  innerLineWidth: document.getElementById('innerLineWidth'),
  downloadPdfBtn: document.getElementById('downloadPdfBtn'),
  printBtn: document.getElementById('printBtn'),
  resetBtn: document.getElementById('resetBtn'),
  paperSummaryTag: document.getElementById('paperSummaryTag'),
  gridSummaryTag: document.getElementById('gridSummaryTag'),
  previewCanvas: document.getElementById('previewCanvas'),
  paperContainer: document.getElementById('paperContainer'),
  canvasViewport: document.getElementById('canvasViewport'),
  zoomInBtn: document.getElementById('zoomInBtn'),
  zoomOutBtn: document.getElementById('zoomOutBtn'),
  zoomFitBtn: document.getElementById('zoomFitBtn'),
  zoomLevelText: document.getElementById('zoomLevelText'),
};

/**
 * 初始化应用
 */
function initApp() {
  bindEvents();
  updateFormFromState();
  fitZoomToViewport();
  renderPreview();
}

/**
 * 绑定界面与输入事件
 */
function bindEvents() {
  // 预设按钮切换
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const presetKey = btn.dataset.preset;
      if (PRESETS[presetKey]) {
        state = { ...PRESETS[presetKey] };
        updateFormFromState();
        renderPreview();
      }
    });
  });

  // 颜色选择器
  document.querySelectorAll('.color-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.color-dot').forEach((d) => d.classList.remove('active'));
      dot.classList.add('active');
      state.color = dot.dataset.color;
      renderPreview();
    });
  });

  // 表单输入监听
  const inputs = [
    'paperSize',
    'paperOrientation',
    'pageCount',
    'pageMargin',
    'cols',
    'rows',
    'outerLineWidth',
    'innerLineWidth',
    'countStep',
    'countPosition',
  ];

  inputs.forEach((id) => {
    if (elements[id]) {
      elements[id].addEventListener('change', () => {
        readStateFromForm();
        renderPreview();
      });
      elements[id].addEventListener('input', () => {
        readStateFromForm();
        renderPreview();
      });
    }
  });

  // 范围滑动条联动
  elements.gapRatio.addEventListener('input', (e) => {
    const val = Math.round(parseFloat(e.target.value) * 100);
    elements.gapRatioVal.textContent = `${val}%`;
    state.gapRatio = parseFloat(e.target.value);
    renderPreview();
  });

  // 复选框监听
  ['splitVerticalLines', 'showWordCount', 'showHeaderInfo', 'showTitleLine'].forEach((id) => {
    if (elements[id]) {
      elements[id].addEventListener('change', (e) => {
        state[id] = e.target.checked;
        if (id === 'showWordCount') {
          elements.countOptionsArea.style.display = e.target.checked ? 'flex' : 'none';
        }
        renderPreview();
      });
    }
  });

  // 缩放控制
  elements.zoomInBtn.addEventListener('click', () => setZoom(zoom + 0.15));
  elements.zoomOutBtn.addEventListener('click', () => setZoom(zoom - 0.15));
  elements.zoomFitBtn.addEventListener('click', fitZoomToViewport);

  // 滚轮缩放预览
  elements.canvasViewport.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setZoom(zoom + delta);
      }
    },
    { passive: false }
  );

  // 窗口调整自适应
  window.addEventListener('resize', () => {
    // 保持预览比例
  });

  // 导出 PDF 与打印
  elements.downloadPdfBtn.addEventListener('click', generatePdf);
  elements.printBtn.addEventListener('click', () => {
    generatePdf(true);
  });

  // 重置
  elements.resetBtn.addEventListener('click', () => {
    state = { ...PRESETS['sample-400'] };
    document.querySelectorAll('.preset-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.preset === 'sample-400');
    });
    updateFormFromState();
    renderPreview();
  });
}

/**
 * 将状态同步到表单 UI
 */
function updateFormFromState() {
  elements.paperSize.value = state.paperSize;
  elements.paperOrientation.value = state.paperOrientation;
  elements.pageCount.value = state.pageCount;
  elements.pageMargin.value = state.pageMargin;
  elements.cols.value = state.cols;
  elements.rows.value = state.rows;
  elements.gapRatio.value = state.gapRatio;
  elements.gapRatioVal.textContent = `${Math.round(state.gapRatio * 100)}%`;
  elements.splitVerticalLines.checked = state.splitVerticalLines;
  elements.showWordCount.checked = state.showWordCount;
  elements.countStep.value = state.countStep;
  elements.countPosition.value = state.countPosition;
  elements.showHeaderInfo.checked = state.showHeaderInfo;
  elements.showTitleLine.checked = state.showTitleLine;
  elements.outerLineWidth.value = state.outerLineWidth;
  elements.innerLineWidth.value = state.innerLineWidth;

  elements.countOptionsArea.style.display = state.showWordCount ? 'flex' : 'none';

  // 颜色高亮
  document.querySelectorAll('.color-dot').forEach((dot) => {
    dot.classList.toggle('active', dot.dataset.color.toLowerCase() === state.color.toLowerCase());
  });

  updateSummaryTags();
}

/**
 * 从表单 UI 读取到状态对象
 */
function readStateFromForm() {
  state.paperSize = elements.paperSize.value;
  state.paperOrientation = elements.paperOrientation.value;
  state.pageCount = parseInt(elements.pageCount.value) || 1;
  state.pageMargin = parseFloat(elements.pageMargin.value) || 15;
  state.cols = parseInt(elements.cols.value) || 20;
  state.rows = parseInt(elements.rows.value) || 20;
  state.gapRatio = parseFloat(elements.gapRatio.value) || 0.2;
  state.countStep = elements.countStep.value;
  state.countPosition = elements.countPosition.value;
  state.outerLineWidth = parseFloat(elements.outerLineWidth.value) || 0.35;
  state.innerLineWidth = parseFloat(elements.innerLineWidth.value) || 0.15;

  updateSummaryTags();
}

function updateSummaryTags() {
  const sizeName = state.paperSize.toUpperCase();
  const orientName = state.paperOrientation === 'p' ? '纵向' : '横向';
  elements.paperSummaryTag.textContent = `${sizeName} ${orientName} (${state.pageCount}页)`;

  const totalWordsPerPage = state.cols * state.rows;
  elements.gridSummaryTag.textContent = `${state.cols} 列 × ${state.rows} 行 (${totalWordsPerPage} 字/页)`;
}

/**
 * 缩放管理
 */
function setZoom(val) {
  zoom = Math.max(0.3, Math.min(2.5, val));
  elements.zoomLevelText.textContent = `${Math.round(zoom * 100)}%`;
  elements.paperContainer.style.transform = `scale(${zoom})`;
}

function fitZoomToViewport() {
  const viewport = elements.canvasViewport;
  const padding = 60;
  const availW = viewport.clientWidth - padding;
  const availH = viewport.clientHeight - padding;

  const baseSize = PAPER_SIZES[state.paperSize] || PAPER_SIZES.a4;
  const isLandscape = state.paperOrientation === 'l';
  const paperW = isLandscape ? baseSize.h : baseSize.w;
  const paperH = isLandscape ? baseSize.w : baseSize.h;

  // 屏幕显示像素基准（假定 1mm ≈ 3.78px）
  const displayW = paperW * 3.78;
  const displayH = paperH * 3.78;

  const scaleW = availW / displayW;
  const scaleH = availH / displayH;
  const bestZoom = Math.min(scaleW, scaleH, 1.2);

  setZoom(Math.max(0.4, bestZoom));
}

/**
 * 计算网格几何布局参数（单位：毫米 mm）
 */
function calculateLayout(pageIndex = 0) {
  const baseSize = PAPER_SIZES[state.paperSize] || PAPER_SIZES.a4;
  const isLandscape = state.paperOrientation === 'l';
  const paperWidth = isLandscape ? baseSize.h : baseSize.w;
  const paperHeight = isLandscape ? baseSize.w : baseSize.h;

  const margin = state.pageMargin;
  const availableWidth = paperWidth - 2 * margin;

  // 顶部可能的信息栏高度
  let headerHeight = 0;
  if (state.showHeaderInfo && pageIndex === 0) {
    headerHeight += 12; // 考号姓名栏
  }
  if (state.showTitleLine && pageIndex === 0) {
    headerHeight += 14; // 作文题目行
  }

  const availableHeight = paperHeight - 2 * margin - headerHeight;

  // 方格宽度
  const cellWidth = availableWidth / state.cols;

  // 每一个行单元由主格 + 行间槽组成
  // cellHeight + gapHeight = rowUnitHeight
  // gapHeight = cellHeight * gapRatio
  // rowUnitHeight = cellHeight * (1 + gapRatio)
  // 为保持方格接近正方形，优先使用 cellWidth，如果超出页面则自动压缩
  let cellHeight = cellWidth;
  let gapHeight = cellHeight * state.gapRatio;
  let totalGridHeight = state.rows * cellHeight + state.rows * gapHeight;

  if (totalGridHeight > availableHeight) {
    // 纵向放不下时，自适应收缩
    const rowUnitHeight = availableHeight / state.rows;
    cellHeight = rowUnitHeight / (1 + state.gapRatio);
    gapHeight = cellHeight * state.gapRatio;
    totalGridHeight = availableHeight;
  }

  const gridLeft = margin;
  const gridTop = margin + headerHeight + (availableHeight - totalGridHeight) / 2;
  const gridWidth = availableWidth;

  return {
    paperWidth,
    paperHeight,
    margin,
    headerHeight,
    gridLeft,
    gridTop,
    gridWidth,
    gridHeight: totalGridHeight,
    cellWidth,
    cellHeight,
    gapHeight,
  };
}

/**
 * 在 Canvas 上实时渲染预览纸张（第 1 页）
 */
function renderPreview() {
  const layout = calculateLayout(0);
  const canvas = elements.previewCanvas;
  const ctx = canvas.getContext('2d');

  // 高清 Retina 屏幕比例
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

  // 纸张底色（模拟优质书写纸）
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, layout.paperWidth, layout.paperHeight);

  // 绘制考务栏/标题栏
  if (state.showHeaderInfo) {
    drawHeaderInfo(ctx, layout);
  }
  if (state.showTitleLine) {
    drawTitleLine(ctx, layout);
  }

  // 绘制网格主体
  drawGrid(ctx, layout, 0);

  ctx.restore();
}

/**
 * 绘制顶部考生信息栏
 */
function drawHeaderInfo(ctx, layout) {
  ctx.save();
  ctx.fillStyle = state.color;
  ctx.font = '3.2px -apple-system, sans-serif';
  ctx.textBaseline = 'middle';

  const y = layout.margin + 4;
  const items = ['姓名：__________', '班级：__________', '准考证号：________________'];
  const colSpacing = layout.gridWidth / 3;

  items.forEach((text, i) => {
    ctx.fillText(text, layout.gridLeft + i * colSpacing, y);
  });
  ctx.restore();
}

/**
 * 绘制作文题目行
 */
function drawTitleLine(ctx, layout) {
  ctx.save();
  ctx.fillStyle = state.color;
  ctx.font = '3.5px -apple-system, sans-serif';
  ctx.textBaseline = 'middle';

  const y = layout.margin + (state.showHeaderInfo ? 14 : 4);
  ctx.fillText('题目：', layout.gridLeft, y);

  // 下划线
  ctx.strokeStyle = state.color;
  ctx.lineWidth = state.innerLineWidth;
  ctx.beginPath();
  ctx.moveTo(layout.gridLeft + 12, y + 2.5);
  ctx.lineTo(layout.gridLeft + layout.gridWidth, y + 2.5);
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制主网格与字数标记
 */
function drawGrid(ctx, layout, pageIndex = 0) {
  const { gridLeft, gridTop, gridWidth, cols, rows, cellWidth, cellHeight, gapHeight } = {
    ...layout,
    cols: state.cols,
    rows: state.rows,
  };

  ctx.save();
  ctx.strokeStyle = state.color;

  // 1. 绘制网格线与行槽
  for (let r = 0; r < rows; r++) {
    const rowTop = gridTop + r * (cellHeight + gapHeight);
    const rowBottom = rowTop + cellHeight;
    const gapBottom = rowBottom + gapHeight;

    // 主方格顶部横线
    ctx.lineWidth = r === 0 ? state.outerLineWidth : state.innerLineWidth;
    ctx.beginPath();
    ctx.moveTo(gridLeft, rowTop);
    ctx.lineTo(gridLeft + gridWidth, rowTop);
    ctx.stroke();

    // 主方格底部横线
    ctx.lineWidth = state.innerLineWidth;
    ctx.beginPath();
    ctx.moveTo(gridLeft, rowBottom);
    ctx.lineTo(gridLeft + gridWidth, rowBottom);
    ctx.stroke();

    // 行间槽底部横线
    ctx.lineWidth = r === rows - 1 ? state.outerLineWidth : state.innerLineWidth;
    ctx.beginPath();
    ctx.moveTo(gridLeft, gapBottom);
    ctx.lineTo(gridLeft + gridWidth, gapBottom);
    ctx.stroke();

    // 内部垂直坚线
    ctx.lineWidth = state.innerLineWidth;
    for (let c = 1; c < cols; c++) {
      const x = gridLeft + c * cellWidth;
      ctx.beginPath();
      ctx.moveTo(x, rowTop);
      // 是否穿透行间槽
      ctx.lineTo(x, state.splitVerticalLines ? gapBottom : rowBottom);
      ctx.stroke();
    }

    // 2. 字数统计标记（印在行间槽内）
    if (state.showWordCount && gapHeight > 0.8) {
      drawRowWordCount(ctx, layout, r, rowBottom, gapHeight, pageIndex);
    }
  }

  // 3. 最左与最右的外边框
  ctx.lineWidth = state.outerLineWidth;
  ctx.beginPath();
  ctx.moveTo(gridLeft, gridTop);
  ctx.lineTo(gridLeft, gridTop + layout.gridHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(gridLeft + gridWidth, gridTop);
  ctx.lineTo(gridLeft + gridWidth, gridTop + layout.gridHeight);
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制字数标记（支持原图错开分布与行末分布）
 */
function drawRowWordCount(ctx, layout, rowIndex, slotTop, slotHeight, pageIndex) {
  const wordsPerRow = state.cols;
  const currentTotalWords = pageIndex * (state.cols * state.rows) + (rowIndex + 1) * wordsPerRow;

  let shouldShow = false;
  let wordNum = currentTotalWords;

  if (state.countStep === '100') {
    if (currentTotalWords % 100 === 0) shouldShow = true;
  } else if (state.countStep === '50') {
    if (currentTotalWords % 50 === 0) shouldShow = true;
  } else if (state.countStep === '200') {
    if (currentTotalWords % 200 === 0) shouldShow = true;
  } else if (state.countStep === 'row') {
    shouldShow = true;
  }

  if (!shouldShow) return;

  ctx.save();
  ctx.fillStyle = state.color;
  // 字体高度略小于槽高，字迹清晰且精细
  const fontSize = Math.min(slotHeight * 0.75, 2.6);
  ctx.font = `${fontSize}px "Segoe UI", Arial, sans-serif`;
  ctx.textBaseline = 'middle';

  const textStr = `${wordNum}`;
  const textMetrics = ctx.measureText(textStr);
  const textWidth = textMetrics.width;

  const centerY = slotTop + slotHeight / 2;
  let targetX = 0;

  if (state.countPosition === 'staggered') {
    // 原图经典错开分布：
    // 5行(100) -> 约第5-6格 (1/4)
    // 10行(200) -> 约第10-11格 (1/2 居中)
    // 15行(300) -> 约第15-16格 (3/4)
    // 20行(400) -> 最左侧第1格
    const stage = Math.floor(wordNum / 100) % 4;
    if (stage === 1) {
      targetX = layout.gridLeft + layout.cellWidth * Math.round(state.cols * 0.28) - textWidth / 2;
    } else if (stage === 2) {
      targetX = layout.gridLeft + layout.gridWidth / 2 - textWidth / 2;
    } else if (stage === 3) {
      targetX = layout.gridLeft + layout.cellWidth * Math.round(state.cols * 0.75) - textWidth / 2;
    } else {
      // stage === 0 (如 400, 800)
      targetX = layout.gridLeft + layout.cellWidth * 0.8 - textWidth / 2;
    }
  } else if (state.countPosition === 'right') {
    // 靠右对齐（行末下方）
    targetX = layout.gridLeft + layout.gridWidth - textWidth - 1;
  } else {
    // 居中
    targetX = layout.gridLeft + layout.gridWidth / 2 - textWidth / 2;
  }

  ctx.fillText(textStr, targetX, centerY);
  ctx.restore();
}

/**
 * 转换 HEX 颜色为 RGB 数组
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [44, 48, 56];
}

/**
 * 使用 jsPDF 生成并导出高精度矢量 PDF
 */
function generatePdf(triggerPrint = false) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('正在加载 PDF 生成引擎，请稍候再试...');
    return;
  }

  const { jsPDF } = window.jspdf;
  const isLandscape = state.paperOrientation === 'l';
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: state.paperSize,
  });

  const rgb = hexToRgb(state.color);
  const totalPages = state.pageCount;

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) doc.addPage(state.paperSize, isLandscape ? 'landscape' : 'portrait');

    const layout = calculateLayout(p);

    // 绘制信息栏
    if (state.showHeaderInfo && p === 0) {
      doc.setFontSize(9);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const y = layout.margin + 4;
      const colSpacing = layout.gridWidth / 3;
      doc.text('姓名：__________', layout.gridLeft, y);
      doc.text('班级：__________', layout.gridLeft + colSpacing, y);
      doc.text('准考证号：________________', layout.gridLeft + 2 * colSpacing, y);
    }

    // 绘制题目行
    if (state.showTitleLine && p === 0) {
      doc.setFontSize(10);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const y = layout.margin + (state.showHeaderInfo ? 14 : 4);
      doc.text('题目：', layout.gridLeft, y);
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(state.innerLineWidth);
      doc.line(layout.gridLeft + 12, y + 1.5, layout.gridLeft + layout.gridWidth, y + 1.5);
    }

    // 绘制网格
    const { gridLeft, gridTop, gridWidth, cellWidth, cellHeight, gapHeight } = layout;
    const { cols, rows } = state;

    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

    for (let r = 0; r < rows; r++) {
      const rowTop = gridTop + r * (cellHeight + gapHeight);
      const rowBottom = rowTop + cellHeight;
      const gapBottom = rowBottom + gapHeight;

      // 主方格顶部横线
      doc.setLineWidth(r === 0 ? state.outerLineWidth : state.innerLineWidth);
      doc.line(gridLeft, rowTop, gridLeft + gridWidth, rowTop);

      // 主方格底部横线
      doc.setLineWidth(state.innerLineWidth);
      doc.line(gridLeft, rowBottom, gridLeft + gridWidth, rowBottom);

      // 行间槽底部横线
      doc.setLineWidth(r === rows - 1 ? state.outerLineWidth : state.innerLineWidth);
      doc.line(gridLeft, gapBottom, gridLeft + gridWidth, gapBottom);

      // 内部垂直竖线
      doc.setLineWidth(state.innerLineWidth);
      for (let c = 1; c < cols; c++) {
        const x = gridLeft + c * cellWidth;
        doc.line(x, rowTop, x, state.splitVerticalLines ? gapBottom : rowBottom);
      }

      // 字数标记
      if (state.showWordCount && gapHeight > 0.8) {
        const wordsPerRow = cols;
        const currentTotalWords = p * (cols * rows) + (r + 1) * wordsPerRow;

        let shouldShow = false;
        if (state.countStep === '100' && currentTotalWords % 100 === 0) shouldShow = true;
        if (state.countStep === '50' && currentTotalWords % 50 === 0) shouldShow = true;
        if (state.countStep === '200' && currentTotalWords % 200 === 0) shouldShow = true;
        if (state.countStep === 'row') shouldShow = true;

        if (shouldShow) {
          doc.setTextColor(rgb[0], rgb[1], rgb[2]);
          // 8pt ~ 2.8mm
          const pdfFontSize = Math.max(5, Math.min(8, gapHeight * 2.8));
          doc.setFontSize(pdfFontSize);

          const textStr = `${currentTotalWords}`;
          const textWidth = doc.getTextWidth(textStr);
          const centerY = rowBottom + gapHeight * 0.72;

          let targetX = 0;
          if (state.countPosition === 'staggered') {
            const stage = Math.floor(currentTotalWords / 100) % 4;
            if (stage === 1) {
              targetX = gridLeft + cellWidth * Math.round(cols * 0.28) - textWidth / 2;
            } else if (stage === 2) {
              targetX = gridLeft + gridWidth / 2 - textWidth / 2;
            } else if (stage === 3) {
              targetX = gridLeft + cellWidth * Math.round(cols * 0.75) - textWidth / 2;
            } else {
              targetX = gridLeft + cellWidth * 0.8 - textWidth / 2;
            }
          } else if (state.countPosition === 'right') {
            targetX = gridLeft + gridWidth - textWidth - 1;
          } else {
            targetX = gridLeft + gridWidth / 2 - textWidth / 2;
          }

          doc.text(textStr, targetX, centerY);
        }
      }
    }

    // 外框左右边线
    doc.setLineWidth(state.outerLineWidth);
    doc.line(gridLeft, gridTop, gridLeft, gridTop + layout.gridHeight);
    doc.line(gridLeft + gridWidth, gridTop, gridLeft + gridWidth, gridTop + layout.gridHeight);
  }

  if (triggerPrint) {
    doc.autoPrint();
    const blob = doc.output('bloburl');
    window.open(blob);
  } else {
    const filename = `作文稿纸_${state.cols}x${state.rows}_${state.pageCount}页.pdf`;
    doc.save(filename);
  }
}

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', initApp);
