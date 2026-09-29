/**
 * 作文稿纸 & 考试答题纸生成器核心引擎
 * 针对小学生大格练字、中高考答题、申论排版优化
 * 支持：上下留白自适应撑满、方格物理尺寸精确显示、多格式导出 (PDF/SVG/PNG/打印)
 */

// 常用纸张毫米规格
const PAPER_SPECS = {
  a4: { w: 210, h: 297, name: 'A4' },
  a3: { w: 297, h: 420, name: 'A3' },
  b5: { w: 176, h: 250, name: 'B5' },
  b4: { w: 250, h: 353, name: 'B4' },
  a5: { w: 148, h: 210, name: 'A5' },
};

// 预设模版库（精简为小学生常用 300 字大格与 400 字标准格）
const PRESET_TEMPLATES = {
  'primary-300': {
    paperSize: 'a4',
    paperOrientation: 'p',
    columnsCount: 1,
    pageCount: 1,
    marginTop: 12,
    marginRight: 12,
    marginBottom: 12,
    marginLeft: 12,
    cols: 15,
    rows: 20,
    enableGap: true,
    gapHeightMm: 2.0,
    gapRatio: 0.18,
    fillVerticalHeight: true,
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
  'sample-400': {
    paperSize: 'a4',
    paperOrientation: 'p',
    columnsCount: 1,
    pageCount: 1,
    marginTop: 14,
    marginRight: 14,
    marginBottom: 14,
    marginLeft: 14,
    cols: 20,
    rows: 20,
    enableGap: true,
    gapHeightMm: 1.8,
    gapRatio: 0.20,
    fillVerticalHeight: true,
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
};

// 全局应用状态（默认使用小学生作文 300 字规格）
let appState = { ...PRESET_TEMPLATES['primary-300'] };
let zoomScale = 1.0;

// DOM 元素引用
const dom = {
  // 属性表单
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
  enableGap: document.getElementById('enableGap'),
  gapHeightMm: document.getElementById('gapHeightMm'),
  gapRatio: document.getElementById('gapRatio'),
  gapRatioVal: document.getElementById('gapRatioVal'),
  gapConfigInputs: document.getElementById('gapConfigInputs'),
  fillVerticalHeight: document.getElementById('fillVerticalHeight'),
  cellSizeDisplay: document.getElementById('cellSizeDisplay'),
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

  // 顶部按键
  topExportPdfBtn: document.getElementById('topExportPdfBtn'),
  topExportSvgBtn: document.getElementById('topExportSvgBtn'),
  topExportPngBtn: document.getElementById('topExportPngBtn'),
  topPrintBtn: document.getElementById('topPrintBtn'),

  // 备份
  exportConfigBtn: document.getElementById('exportConfigBtn'),
  importConfigFile: document.getElementById('importConfigFile'),

  // 预览
  tagPaper: document.getElementById('tagPaper'),
  tagGrid: document.getElementById('tagGrid'),
  tagCellSize: document.getElementById('tagCellSize'),
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
 * 事件监听
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

  // 行间槽启用切换
  dom.enableGap.addEventListener('change', (e) => {
    appState.enableGap = e.target.checked;
    dom.gapConfigInputs.style.display = e.target.checked ? 'grid' : 'none';
    renderPreview();
  });

  // 行间槽固定毫米数输入
  dom.gapHeightMm.addEventListener('input', (e) => {
    const mm = Math.max(0, parseFloat(e.target.value) || 0);
    appState.gapHeightMm = mm;
    const layout = computeLayout(0);
    if (layout.cellHeight > 0) {
      appState.gapRatio = Math.min(0.5, mm / layout.cellHeight);
      dom.gapRatio.value = appState.gapRatio;
      dom.gapRatioVal.textContent = `${Math.round(appState.gapRatio * 100)}%`;
    }
    renderPreview();
  });

  // 行间槽比例滑动条
  dom.gapRatio.addEventListener('input', (e) => {
    const ratio = parseFloat(e.target.value);
    appState.gapRatio = ratio;
    dom.gapRatioVal.textContent = `${Math.round(ratio * 100)}%`;
    const layout = computeLayout(0);
    const mm = layout.cellHeight * ratio;
    appState.gapHeightMm = parseFloat(mm.toFixed(1));
    dom.gapHeightMm.value = appState.gapHeightMm;
    renderPreview();
  });

  // 基础输入项
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

  // 复选框
  ['fillVerticalHeight', 'splitVerticalLines', 'showWordCount', 'showHeaderInfo', 'showTitleLine', 'showPageNumber'].forEach((id) => {
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

  // 导出与打印
  dom.topExportPdfBtn.addEventListener('click', () => exportPdf(false));
  dom.topPrintBtn.addEventListener('click', () => exportPdf(true));
  dom.topExportSvgBtn.addEventListener('click', exportSvg);
  dom.topExportPngBtn.addEventListener('click', exportPng);

  // JSON 配置
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
  appState.marginTop = parseFloat(dom.marginTop.value) || 12;
  appState.marginRight = parseFloat(dom.marginRight.value) || 12;
  appState.marginBottom = parseFloat(dom.marginBottom.value) || 12;
  appState.marginLeft = parseFloat(dom.marginLeft.value) || 12;
  appState.cols = parseInt(dom.cols.value) || 15;
  appState.rows = parseInt(dom.rows.value) || 20;
  appState.gridHelperLine = dom.gridHelperLine.value;
  appState.countStep = dom.countStep.value;
  appState.countPosition = dom.countPosition.value;
  appState.outerLineWidth = parseFloat(dom.outerLineWidth.value) || 0.35;
  appState.innerLineWidth = parseFloat(dom.innerLineWidth.value) || 0.15;

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
  dom.enableGap.checked = appState.enableGap !== false;
  dom.gapConfigInputs.style.display = (appState.enableGap !== false) ? 'grid' : 'none';
  dom.gapHeightMm.value = appState.gapHeightMm || 2.2;
  dom.gapRatio.value = appState.gapRatio;
  dom.gapRatioVal.textContent = `${Math.round(appState.gapRatio * 100)}%`;
  dom.fillVerticalHeight.checked = appState.fillVerticalHeight;
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
 * 核心数学排版布局计算（消除上下巨大留白、格子尺寸最大化）
 */
function computeLayout(pageIndex = 0) {
  const spec = PAPER_SPECS[appState.paperSize] || PAPER_SPECS.a4;
  const isLandscape = appState.paperOrientation === 'l';
  const paperWidth = isLandscape ? spec.h : spec.w;
  const paperHeight = isLandscape ? spec.w : spec.h;

  const { marginTop, marginRight, marginBottom, marginLeft, columnsCount, cols, rows, gapRatio, fillVerticalHeight } = appState;

  // 顶部考务栏高度
  let headerHeight = 0;
  if (appState.showHeaderInfo && pageIndex === 0) headerHeight += 12;
  if (appState.showTitleLine && pageIndex === 0) headerHeight += 14;

  const contentTop = marginTop + headerHeight;
  const contentHeight = paperHeight - contentTop - marginBottom;
  const totalContentWidth = paperWidth - marginLeft - marginRight;

  // 双栏间距
  const columnGap = columnsCount > 1 ? 16 : 0;
  const columnWidth = (totalContentWidth - (columnsCount - 1) * columnGap) / columnsCount;

  const effectiveGapRatio = (appState.enableGap !== false) ? gapRatio : 0;

  let cellWidth = columnWidth / cols;
  let cellHeight = cellWidth;
  let gapHeight = cellHeight * effectiveGapRatio;
  let totalGridHeight = rows * (cellHeight + gapHeight);

  if (fillVerticalHeight) {
    // 💡 核心优化：纵向自动撑满页面，消除上下巨大留白，最大化小学生方格尺寸！
    // 允许根据页面纵横比动态拉大方格高度或等比放大整个网格
    const availableRowUnit = contentHeight / rows;
    const maxCellHeight = availableRowUnit / (1 + effectiveGapRatio);

    // 如果方格按宽度算过小导致上下大面积留白，我们取纵向能容纳的最大高度，保持方正
    if (totalGridHeight < contentHeight) {
      // 适度放大方格高度与行槽，消除上下空虚
      cellHeight = maxCellHeight;
      gapHeight = (appState.enableGap !== false) ? cellHeight * effectiveGapRatio : 0;
      totalGridHeight = contentHeight;
    } else {
      // 纵向放不下时自适应收缩
      cellHeight = maxCellHeight;
      gapHeight = (appState.enableGap !== false) ? cellHeight * effectiveGapRatio : 0;
      totalGridHeight = contentHeight;
    }
  } else {
    // 若不开启撑满，当纵向超出时依然保护
    if (totalGridHeight > contentHeight) {
      const rowUnit = contentHeight / rows;
      cellHeight = rowUnit / (1 + effectiveGapRatio);
      gapHeight = (appState.enableGap !== false) ? cellHeight * effectiveGapRatio : 0;
      totalGridHeight = contentHeight;
    }
  }

  // 纵向居中或顶端紧凑排布
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
 * 实时在容器中生成并渲染第 1 页原生矢量 SVG (杜绝任何缩放下的像素走样与波浪感)
 */
function renderPreview() {
  const layout = computeLayout(0);

  // 更新尺寸信息横幅与状态标签
  updateInfoTags(layout);

  const container = document.getElementById('svgContainer');
  if (container) {
    container.innerHTML = buildPageSvgString(layout, 0);
  }
}

/**
 * 构造单页完整矢量 SVG 字符串
 */
function buildPageSvgString(layout, pageIndex = 0) {
  const { paperWidth, paperHeight } = layout;
  const { outerLineWidth, innerLineWidth, lineColor, bgColor, showHeaderInfo, showTitleLine, showPageNumber, columnsCount, cols, rows, splitVerticalLines, showWordCount, gridHelperLine, countStep, countPosition } = appState;
  const { cellWidth, cellHeight, gapHeight } = layout;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${paperWidth}mm" height="${paperHeight}mm" viewBox="0 0 ${paperWidth} ${paperHeight}" style="width:${paperWidth}mm; height:${paperHeight}mm; display:block; shape-rendering:geometricPrecision; text-rendering:geometricPrecision;">\n`;

  // 1. 纸张底色
  svg += `  <rect width="${paperWidth}" height="${paperHeight}" fill="${bgColor}" />\n`;

  // 2. 考生信息
  if (showHeaderInfo && pageIndex === 0) {
    const y = layout.marginTop + 4;
    const availW = paperWidth - layout.marginLeft - layout.marginRight;
    const spacing = availW / 3;
    svg += `  <text x="${layout.marginLeft}" y="${y}" font-size="3.3" font-family="-apple-system, sans-serif" fill="${lineColor}" dominant-baseline="central">姓名：__________</text>\n`;
    svg += `  <text x="${layout.marginLeft + spacing}" y="${y}" font-size="3.3" font-family="-apple-system, sans-serif" fill="${lineColor}" dominant-baseline="central">班级：__________</text>\n`;
    svg += `  <text x="${layout.marginLeft + 2 * spacing}" y="${y}" font-size="3.3" font-family="-apple-system, sans-serif" fill="${lineColor}" dominant-baseline="central">学号：________________</text>\n`;
  }

  // 3. 题目行
  if (showTitleLine && pageIndex === 0) {
    const y = layout.marginTop + (showHeaderInfo ? 14 : 4);
    svg += `  <text x="${layout.marginLeft}" y="${y}" font-size="3.6" font-family="-apple-system, sans-serif" fill="${lineColor}" dominant-baseline="central">题目：</text>\n`;
    svg += `  <line x1="${layout.marginLeft + 12}" y1="${y + 2.5}" x2="${paperWidth - layout.marginRight}" y2="${y + 2.5}" stroke="${lineColor}" stroke-width="${innerLineWidth}" />\n`;
  }

  // 4. 网格绘制 (每栏)
  layout.columns.forEach((col, colIdx) => {
    const { left, top, width, height } = col;

    // 左右外边框
    svg += `  <line x1="${left}" y1="${top}" x2="${left}" y2="${top + height}" stroke="${lineColor}" stroke-width="${outerLineWidth}" />\n`;
    svg += `  <line x1="${left + width}" y1="${top}" x2="${left + width}" y2="${top + height}" stroke="${lineColor}" stroke-width="${outerLineWidth}" />\n`;

    for (let r = 0; r < rows; r++) {
      const rowTop = top + r * (cellHeight + gapHeight);
      const rowBottom = rowTop + cellHeight;
      const gapBottom = rowBottom + gapHeight;

      // 主方格顶部横线
      const topW = r === 0 ? outerLineWidth : innerLineWidth;
      svg += `  <line x1="${left}" y1="${rowTop}" x2="${left + width}" y2="${rowTop}" stroke="${lineColor}" stroke-width="${topW}" />\n`;

      // 田字格/米字格辅助线
      if (gridHelperLine !== 'none') {
        for (let c = 0; c < cols; c++) {
          const x = left + c * cellWidth;
          const midX = x + cellWidth / 2;
          const midY = rowTop + cellHeight / 2;
          svg += `  <line x1="${x}" y1="${midY}" x2="${x + cellWidth}" y2="${midY}" stroke="${lineColor}" stroke-width="${innerLineWidth * 0.7}" stroke-dasharray="0.8,0.8" />\n`;
          svg += `  <line x1="${midX}" y1="${rowTop}" x2="${midX}" y2="${rowTop + cellHeight}" stroke="${lineColor}" stroke-width="${innerLineWidth * 0.7}" stroke-dasharray="0.8,0.8" />\n`;
          if (gridHelperLine === 'mi') {
            svg += `  <line x1="${x}" y1="${rowTop}" x2="${x + cellWidth}" y2="${rowTop + cellHeight}" stroke="${lineColor}" stroke-width="${innerLineWidth * 0.7}" stroke-dasharray="0.8,0.8" />\n`;
            svg += `  <line x1="${x + cellWidth}" y1="${rowTop}" x2="${x}" y2="${rowTop + cellHeight}" stroke="${lineColor}" stroke-width="${innerLineWidth * 0.7}" stroke-dasharray="0.8,0.8" />\n`;
          }
        }
      }

      // 主方格底部横线
      const isLastRow = r === rows - 1;
      const subBottomW = (gapHeight <= 0.05 && isLastRow) ? outerLineWidth : innerLineWidth;
      svg += `  <line x1="${left}" y1="${rowBottom}" x2="${left + width}" y2="${rowBottom}" stroke="${lineColor}" stroke-width="${subBottomW}" />\n`;

      // 行间槽底部横线 (仅在有行间槽时绘制)
      if (gapHeight > 0.05) {
        const botW = isLastRow ? outerLineWidth : innerLineWidth;
        svg += `  <line x1="${left}" y1="${gapBottom}" x2="${left + width}" y2="${gapBottom}" stroke="${lineColor}" stroke-width="${botW}" />\n`;
      }

      // 竖线
      for (let c = 1; c < cols; c++) {
        const x = left + c * cellWidth;
        const y2 = splitVerticalLines ? gapBottom : rowBottom;
        svg += `  <line x1="${x}" y1="${rowTop}" x2="${x}" y2="${y2}" stroke="${lineColor}" stroke-width="${innerLineWidth}" />\n`;
      }

      // 字数标记提示
      if (showWordCount && gapHeight > 0.8) {
        const wordsPerColumn = cols * rows;
        const accumulated = pageIndex * (wordsPerColumn * columnsCount) + colIdx * wordsPerColumn;
        const currentTotal = accumulated + (r + 1) * cols;

        let show = false;
        if (countStep === '100' && currentTotal % 100 === 0) show = true;
        if (countStep === '50' && currentTotal % 50 === 0) show = true;
        if (countStep === '200' && currentTotal % 200 === 0) show = true;
        if (countStep === 'row') show = true;

        if (show) {
          const centerY = rowBottom + gapHeight / 2;
          const fontSize = Math.min(gapHeight * 0.75, 2.8);
          let targetX = left + width / 2;
          let textAnchor = 'middle';

          if (countPosition === 'staggered') {
            const stepVal = parseInt(countStep) || 50;
            const stage = Math.floor(currentTotal / stepVal) % 4;
            if (stage === 1) targetX = left + cellWidth * Math.round(cols * 0.28);
            else if (stage === 2) targetX = left + width / 2;
            else if (stage === 3) targetX = left + cellWidth * Math.round(cols * 0.75);
            else targetX = left + cellWidth * 0.8;
          } else if (countPosition === 'right') {
            targetX = left + width - 1.2;
            textAnchor = 'end';
          }

          svg += `  <text x="${targetX}" y="${centerY}" font-size="${fontSize}" font-family="'Segoe UI', Arial, sans-serif" fill="${lineColor}" text-anchor="${textAnchor}" dominant-baseline="central">${currentTotal}</text>\n`;
        }
      }
    }
  });

  // 5. 双栏中缝折线
  if (columnsCount === 2) {
    const midX = paperWidth / 2;
    svg += `  <line x1="${midX}" y1="${layout.marginTop}" x2="${midX}" y2="${paperHeight - layout.marginBottom}" stroke="${lineColor}" stroke-width="${innerLineWidth}" stroke-dasharray="2,3" />\n`;
  }

  // 6. 页脚页码
  if (showPageNumber) {
    const pageY = paperHeight - layout.marginBottom + 7;
    svg += `  <text x="${paperWidth / 2}" y="${pageY}" font-size="3.0" font-family="-apple-system, sans-serif" fill="${lineColor}" text-anchor="middle" dominant-baseline="bottom">- ${pageIndex + 1} -</text>\n`;
  }

  svg += `</svg>`;
  return svg;
}

/**
 * 刷新当前尺寸与字数标签
 */
function updateInfoTags(layout) {
  const spec = PAPER_SPECS[appState.paperSize] || PAPER_SPECS.a4;
  const orientStr = appState.paperOrientation === 'p' ? '纵向' : '横向';
  dom.tagPaper.textContent = `${spec.name} ${orientStr} · ${appState.columnsCount === 2 ? '双栏' : '单栏'}`;
  dom.tagGrid.textContent = `${appState.cols}列 × ${appState.rows}行`;

  const cellWStr = layout.cellWidth.toFixed(1);
  const cellHStr = layout.cellHeight.toFixed(1);
  const sizeText = `方格 ${cellWStr} × ${cellHStr} mm`;
  const slotText = (appState.enableGap !== false && layout.gapHeight > 0.1) 
    ? `(行槽高 ${layout.gapHeight.toFixed(1)} mm)` 
    : `(无行间槽)`;
  dom.cellSizeDisplay.textContent = `约 ${cellWStr} mm × ${cellHStr} mm ${slotText}`;

  const totalWordsPerPage = appState.cols * appState.rows * appState.columnsCount;
  dom.tagWords.textContent = `${totalWordsPerPage} 字 / 页 (共 ${totalWordsPerPage * appState.pageCount} 字)`;
}

/**
 * 绘制顶部学生信息栏
 */
function drawHeaderInfo(ctx, layout) {
  ctx.save();
  ctx.fillStyle = appState.lineColor;
  ctx.font = '3.3px -apple-system, sans-serif';
  ctx.textBaseline = 'middle';

  const y = layout.marginTop + 4;
  const availableWidth = layout.paperWidth - layout.marginLeft - layout.marginRight;
  const items = ['姓名：__________', '班级：__________', '学号：________________'];
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

    // 主方格顶部横线
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

    // 2. 字数统计标记
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
  const fontSize = Math.min(slotHeight * 0.75, 2.8);
  ctx.font = `${fontSize}px "Segoe UI", Arial, sans-serif`;
  ctx.textBaseline = 'middle';

  const textStr = `${currentTotalWords}`;
  const textW = ctx.measureText(textStr).width;
  const centerY = slotTop + slotHeight / 2;

  let targetX = 0;
  if (countPosition === 'staggered') {
    const stepVal = parseInt(countStep) || 50;
    const stage = Math.floor(currentTotalWords / stepVal) % 4;
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
  ctx.fillText(text, layout.paperWidth / 2, layout.paperHeight - layout.marginBottom + 7);
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

    // 绘制信息栏
    if (appState.showHeaderInfo && p === 0) {
      doc.setFontSize(9);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const y = layout.marginTop + 4;
      const availableWidth = layout.paperWidth - layout.marginLeft - layout.marginRight;
      const spacing = availableWidth / 3;
      doc.text('姓名：__________', layout.marginLeft, y);
      doc.text('班级：__________', layout.marginLeft + spacing, y);
      doc.text('学号：________________', layout.marginLeft + 2 * spacing, y);
    }

    // 绘制题目行
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
      doc.text(`- ${p + 1} -`, layout.paperWidth / 2, layout.paperHeight - layout.marginBottom + 6, { align: 'center' });
    }
  }

  if (triggerPrint) {
    doc.autoPrint();
    const blob = doc.output('bloburl');
    window.open(blob);
  } else {
    doc.save(`小学生作文纸_${appState.cols}x${appState.rows}_${totalPages}页.pdf`);
  }
}

/**
 * 绘制 PDF 单栏
 */
function drawColumnPdf(doc, layout, col, pageIndex, colIndex, rgb) {
  const { cols, rows, outerLineWidth, innerLineWidth, splitVerticalLines, showWordCount, countStep, countPosition, gridHelperLine } = appState;
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

    // 格内辅助线
    if (gridHelperLine !== 'none') {
      doc.setLineWidth(innerLineWidth * 0.7);
      doc.setLineDashPattern([0.8, 0.8], 0);
      for (let c = 0; c < cols; c++) {
        const x = left + c * cellWidth;
        const midX = x + cellWidth / 2;
        const midY = rowTop + cellHeight / 2;
        doc.line(x, midY, x + cellWidth, midY);
        doc.line(midX, rowTop, midX, rowTop + cellHeight);
        if (gridHelperLine === 'mi') {
          doc.line(x, rowTop, x + cellWidth, rowTop + cellHeight);
          doc.line(x + cellWidth, rowTop, x, rowTop + cellHeight);
        }
      }
      doc.setLineDashPattern([], 0);
    }

    // 主格底横线
    const isLastRow = r === rows - 1;
    const subBottomW = (gapHeight <= 0.05 && isLastRow) ? outerLineWidth : innerLineWidth;
    doc.setLineWidth(subBottomW);
    doc.line(left, rowBottom, left + width, rowBottom);

    // 行间槽底横线 (仅在有行间槽时绘制)
    if (gapHeight > 0.05) {
      doc.setLineWidth(isLastRow ? outerLineWidth : innerLineWidth);
      doc.line(left, gapBottom, left + width, gapBottom);
    }

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
      const currentTotalWords = accumulatedWordsBefore + (r + 1) * cols;

      let show = false;
      if (countStep === '100' && currentTotalWords % 100 === 0) show = true;
      if (countStep === '50' && currentTotalWords % 50 === 0) show = true;
      if (countStep === '200' && currentTotalWords % 200 === 0) show = true;
      if (countStep === 'row') show = true;

      if (show) {
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        const pdfFontSize = Math.max(5, Math.min(8.5, gapHeight * 2.8));
        doc.setFontSize(pdfFontSize);

        const textStr = `${currentTotalWords}`;
        const textW = doc.getTextWidth(textStr);
        const centerY = rowBottom + gapHeight * 0.72;

        let targetX = 0;
        if (countPosition === 'staggered') {
          const stepVal = parseInt(countStep) || 50;
          const stage = Math.floor(currentTotalWords / stepVal) % 4;
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
 * 导出 SVG 格式 (直接导出无损高精矢量文本)
 */
function exportSvg() {
  const layout = computeLayout(0);
  const svgContent = buildPageSvgString(layout, 0);

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `作文稿纸_${appState.cols}x${appState.rows}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 导出超清 PNG (基于高精度矢量渲染，彻底杜绝模糊和走样)
 */
function exportPng() {
  const layout = computeLayout(0);
  const svgString = buildPageSvgString(layout, 0);

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const scaleFactor = 3; // 3倍超清
    const mmToPx = 3.779528;
    const canvas = document.createElement('canvas');
    canvas.width = layout.paperWidth * mmToPx * scaleFactor;
    canvas.height = layout.paperHeight * mmToPx * scaleFactor;
    const ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);
    ctx.drawImage(img, 0, 0, layout.paperWidth * mmToPx, layout.paperHeight * mmToPx);

    const link = document.createElement('a');
    link.download = `作文稿纸_${appState.cols}x${appState.rows}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
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
