/**
 * 作文稿纸 & 英语四线三格 & 课业横线纸生成器核心引擎
 * 支持：中文作文纸 (方格)、英语作业纸 (四线三格)、课业横线纸 (横线本)
 * 全格式导出：矢量 PDF、无损 SVG、超清 PNG、系统打印
 */

// 常用纸张毫米规格
const PAPER_SPECS = {
  a4: { w: 210, h: 297, name: 'A4' },
  a3: { w: 297, h: 420, name: 'A3' },
  b5: { w: 176, h: 250, name: 'B5' },
  b4: { w: 250, h: 353, name: 'B4' },
  a5: { w: 148, h: 210, name: 'A5' },
};

// 预设模版库（中文大格、标准格、英语四线三格、课业横线纸）
const PRESET_TEMPLATES = {
  'primary-300': {
    paperType: 'composition',
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
    lineColor: '#2c3038',
    bgColor: '#ffffff',
    outerLineWidth: 0.35,
    innerLineWidth: 0.15,
    showHeaderInfo: false,
    showTitleLine: false,
    showPageNumber: false,
  },
  'sample-400': {
    paperType: 'composition',
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
    lineColor: '#2c3038',
    bgColor: '#ffffff',
    outerLineWidth: 0.35,
    innerLineWidth: 0.15,
    showHeaderInfo: false,
    showTitleLine: false,
    showPageNumber: false,
  },
  'english-four': {
    paperType: 'english',
    paperSize: 'a4',
    paperOrientation: 'p',
    columnsCount: 1,
    pageCount: 1,
    marginTop: 15,
    marginRight: 15,
    marginBottom: 15,
    marginLeft: 15,
    englishGroupHeight: 9.0,
    englishGapHeight: 5.0,
    englishRows: 14,
    englishMidLineStyle: 'same',
    englishFillVertical: true,
    englishSlantedGuides: false,
    lineColor: '#2c3038',
    bgColor: '#ffffff',
    outerLineWidth: 0.35,
    innerLineWidth: 0.18,
    showHeaderInfo: false,
    showTitleLine: false,
    showPageNumber: false,
  },
  'lined-paper': {
    paperType: 'lined',
    paperSize: 'a4',
    paperOrientation: 'p',
    columnsCount: 1,
    pageCount: 1,
    marginTop: 15,
    marginRight: 15,
    marginBottom: 15,
    marginLeft: 15,
    linedSpacing: 9.5,
    linedStyle: 'solid',
    linedRows: 25,
    linedFillVertical: true,
    linedMarginLine: false,
    lineColor: '#2c3038',
    bgColor: '#ffffff',
    outerLineWidth: 0.35,
    innerLineWidth: 0.18,
    showHeaderInfo: false,
    showTitleLine: false,
    showPageNumber: false,
  },
};

// 全局应用状态（默认小学生作文 300 字规格）
let appState = { ...PRESET_TEMPLATES['primary-300'] };
let zoomScale = 1.0;

// DOM 元素引用集合
const dom = {
  // 模式与预设
  paperType: document.getElementById('paperType'),
  compositionSection: document.getElementById('compositionSection'),
  englishSection: document.getElementById('englishSection'),
  linedSection: document.getElementById('linedSection'),

  // 基础纸张
  paperSize: document.getElementById('paperSize'),
  paperOrientation: document.getElementById('paperOrientation'),
  columnsCount: document.getElementById('columnsCount'),
  pageCount: document.getElementById('pageCount'),
  marginTop: document.getElementById('marginTop'),
  marginRight: document.getElementById('marginRight'),
  marginBottom: document.getElementById('marginBottom'),
  marginLeft: document.getElementById('marginLeft'),

  // 作文方格专属
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
  wordCountArea: document.getElementById('wordCountArea'),

  // 英语四线三格专属
  englishGroupHeight: document.getElementById('englishGroupHeight'),
  englishGapHeight: document.getElementById('englishGapHeight'),
  englishRows: document.getElementById('englishRows'),
  englishMidLineStyle: document.getElementById('englishMidLineStyle'),
  englishFillVertical: document.getElementById('englishFillVertical'),
  englishSlantedGuides: document.getElementById('englishSlantedGuides'),

  // 横线纸专属
  linedSpacing: document.getElementById('linedSpacing'),
  linedStyle: document.getElementById('linedStyle'),
  linedRows: document.getElementById('linedRows'),
  linedFillVertical: document.getElementById('linedFillVertical'),
  linedMarginLine: document.getElementById('linedMarginLine'),

  // 通用样式与考务
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

  // 导入导出
  exportConfigBtn: document.getElementById('exportConfigBtn'),
  importConfigFile: document.getElementById('importConfigFile'),

  // 预览容器与标签
  tagPaper: document.getElementById('tagPaper'),
  tagGrid: document.getElementById('tagGrid'),
  tagCellSize: document.getElementById('tagCellSize'),
  tagWords: document.getElementById('tagWords'),
  paperSheet: document.getElementById('paperSheet'),
  paperViewport: document.getElementById('paperViewport'),
  zoomIn: document.getElementById('zoomIn'),
  zoomOut: document.getElementById('zoomOut'),
  zoomFit: document.getElementById('zoomFit'),
  zoomVal: document.getElementById('zoomVal'),
};

/**
 * 启动初始化
 */
function init() {
  bindEventListeners();
  syncStateToForm();
  updateSectionVisibility();
  fitZoom();
  renderPreview();
}

/**
 * 切换不同纸张专属选项卡片的显隐
 */
function updateSectionVisibility() {
  const type = appState.paperType || 'composition';
  if (dom.compositionSection) dom.compositionSection.style.display = (type === 'composition') ? 'block' : 'none';
  if (dom.englishSection) dom.englishSection.style.display = (type === 'english') ? 'block' : 'none';
  if (dom.linedSection) dom.linedSection.style.display = (type === 'lined') ? 'block' : 'none';
}

/**
 * 事件监听绑定
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
        updateSectionVisibility();
        renderPreview();
      }
    });
  });

  // 纸张类型下拉切换
  dom.paperType.addEventListener('change', (e) => {
    const newType = e.target.value;
    if (newType !== appState.paperType) {
      if (newType === 'english' && PRESET_TEMPLATES['english-four']) {
        appState = { ...PRESET_TEMPLATES['english-four'] };
        document.querySelectorAll('.preset-card').forEach((c) => {
          c.classList.toggle('active', c.dataset.preset === 'english-four');
        });
        syncStateToForm();
      } else if (newType === 'lined' && PRESET_TEMPLATES['lined-paper']) {
        appState = { ...PRESET_TEMPLATES['lined-paper'] };
        document.querySelectorAll('.preset-card').forEach((c) => {
          c.classList.toggle('active', c.dataset.preset === 'lined-paper');
        });
        syncStateToForm();
      } else if (newType === 'composition' && PRESET_TEMPLATES['primary-300']) {
        appState = { ...PRESET_TEMPLATES['primary-300'] };
        document.querySelectorAll('.preset-card').forEach((c) => {
          c.classList.toggle('active', c.dataset.preset === 'primary-300');
        });
        syncStateToForm();
      } else {
        appState.paperType = newType;
      }
    }
    updateSectionVisibility();
    renderPreview();
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
    'outerLineWidth',
    'innerLineWidth',
    // 英语
    'englishGroupHeight',
    'englishGapHeight',
    'englishRows',
    'englishMidLineStyle',
    // 横线
    'linedSpacing',
    'linedStyle',
    'linedRows',
  ];

  trackedInputs.forEach((id) => {
    if (dom[id]) {
      dom[id].addEventListener('change', onFormChange);
      dom[id].addEventListener('input', onFormChange);
    }
  });

  // 复选框监听
  [
    'fillVerticalHeight',
    'splitVerticalLines',
    'showWordCount',
    'showHeaderInfo',
    'showTitleLine',
    'showPageNumber',
    'englishFillVertical',
    'englishSlantedGuides',
    'linedFillVertical',
    'linedMarginLine',
  ].forEach((id) => {
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
  appState.paperType = dom.paperType.value;
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
  appState.outerLineWidth = parseFloat(dom.outerLineWidth.value) || 0.35;
  appState.innerLineWidth = parseFloat(dom.innerLineWidth.value) || 0.15;

  // 英语四线三格参数
  appState.englishGroupHeight = parseFloat(dom.englishGroupHeight.value) || 9.0;
  appState.englishGapHeight = parseFloat(dom.englishGapHeight.value) || 5.0;
  appState.englishRows = parseInt(dom.englishRows.value) || 14;
  appState.englishMidLineStyle = dom.englishMidLineStyle.value;

  // 横线纸参数
  appState.linedSpacing = parseFloat(dom.linedSpacing.value) || 9.5;
  appState.linedStyle = dom.linedStyle.value;
  appState.linedRows = parseInt(dom.linedRows.value) || 25;

  renderPreview();
}

/**
 * 同步状态到表单 UI
 */
function syncStateToForm() {
  dom.paperType.value = appState.paperType || 'composition';
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
  dom.gapHeightMm.value = appState.gapHeightMm || 2.0;
  dom.gapRatio.value = appState.gapRatio;
  dom.gapRatioVal.textContent = `${Math.round(appState.gapRatio * 100)}%`;
  dom.fillVerticalHeight.checked = appState.fillVerticalHeight;
  dom.gridHelperLine.value = appState.gridHelperLine;
  dom.splitVerticalLines.checked = appState.splitVerticalLines;
  dom.showWordCount.checked = appState.showWordCount;
  dom.countStep.value = appState.countStep;
  dom.wordCountArea.style.display = appState.showWordCount ? 'grid' : 'none';

  // 英语
  dom.englishGroupHeight.value = appState.englishGroupHeight || 9.0;
  dom.englishGapHeight.value = appState.englishGapHeight || 5.0;
  dom.englishRows.value = appState.englishRows || 14;
  dom.englishMidLineStyle.value = appState.englishMidLineStyle || 'same';
  dom.englishFillVertical.checked = appState.englishFillVertical !== false;
  dom.englishSlantedGuides.checked = !!appState.englishSlantedGuides;

  // 横线
  dom.linedSpacing.value = appState.linedSpacing || 9.5;
  dom.linedStyle.value = appState.linedStyle || 'solid';
  dom.linedRows.value = appState.linedRows || 25;
  dom.linedFillVertical.checked = appState.linedFillVertical !== false;
  dom.linedMarginLine.checked = !!appState.linedMarginLine;

  // 样式与考务
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
 * 核心数学排版布局计算（支持作文纸、英语四线三格、横线纸）
 */
function computeLayout(pageIndex = 0) {
  const spec = PAPER_SPECS[appState.paperSize] || PAPER_SPECS.a4;
  const isLandscape = appState.paperOrientation === 'l';
  const paperWidth = isLandscape ? spec.h : spec.w;
  const paperHeight = isLandscape ? spec.w : spec.h;

  const { marginTop, marginRight, marginBottom, marginLeft, columnsCount } = appState;

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

  const layout = {
    paperWidth,
    paperHeight,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    headerHeight,
    contentTop,
    contentHeight,
    columnGap,
    columns: [],
  };

  const type = appState.paperType || 'composition';

  if (type === 'composition') {
    // 1. 中文作文方格纸布局
    const { cols, rows, gapRatio, fillVerticalHeight } = appState;
    const effectiveGapRatio = (appState.enableGap !== false) ? gapRatio : 0;

    let cellWidth = columnWidth / cols;
    let cellHeight = cellWidth;
    let gapHeight = cellHeight * effectiveGapRatio;
    let totalGridHeight = rows * (cellHeight + gapHeight);

    if (fillVerticalHeight) {
      const availableRowUnit = contentHeight / rows;
      const maxCellHeight = availableRowUnit / (1 + effectiveGapRatio);
      cellHeight = maxCellHeight;
      gapHeight = (appState.enableGap !== false) ? cellHeight * effectiveGapRatio : 0;
      totalGridHeight = contentHeight;
    } else {
      if (totalGridHeight > contentHeight) {
        const rowUnit = contentHeight / rows;
        cellHeight = rowUnit / (1 + effectiveGapRatio);
        gapHeight = (appState.enableGap !== false) ? cellHeight * effectiveGapRatio : 0;
        totalGridHeight = contentHeight;
      }
    }

    const gridTop = contentTop + (contentHeight - totalGridHeight) / 2;

    for (let c = 0; c < columnsCount; c++) {
      const colLeft = marginLeft + c * (columnWidth + columnGap);
      layout.columns.push({
        colIndex: c,
        left: colLeft,
        top: gridTop,
        width: columnWidth,
        height: totalGridHeight,
      });
    }

    layout.cellWidth = cellWidth;
    layout.cellHeight = cellHeight;
    layout.gapHeight = gapHeight;
    layout.totalGridHeight = totalGridHeight;

  } else if (type === 'english') {
    // 2. 英语四线三格布局
    const rows = appState.englishRows || 14;
    let groupH = appState.englishGroupHeight || 9.0;
    let gapH = appState.englishGapHeight || 5.0;

    if (appState.englishFillVertical) {
      const availableUnit = contentHeight / rows;
      groupH = availableUnit * 0.65;
      gapH = availableUnit * 0.35;
    }

    const totalH = rows * (groupH + gapH) - gapH;
    const gridTop = contentTop + (contentHeight - totalH) / 2;

    for (let c = 0; c < columnsCount; c++) {
      const colLeft = marginLeft + c * (columnWidth + columnGap);
      layout.columns.push({
        colIndex: c,
        left: colLeft,
        top: gridTop,
        width: columnWidth,
        height: totalH,
      });
    }

    layout.english = {
      rows,
      groupHeight: groupH,
      gapHeight: gapH,
      subHeight: groupH / 3,
    };

  } else if (type === 'lined') {
    // 3. 通用横线纸布局
    const rows = appState.linedRows || 25;
    let spacing = appState.linedSpacing || 9.5;

    if (appState.linedFillVertical) {
      spacing = contentHeight / rows;
    }

    const totalH = rows * spacing;
    const gridTop = contentTop + (contentHeight - totalH) / 2;

    for (let c = 0; c < columnsCount; c++) {
      const colLeft = marginLeft + c * (columnWidth + columnGap);
      layout.columns.push({
        colIndex: c,
        left: colLeft,
        top: gridTop,
        width: columnWidth,
        height: totalH,
      });
    }

    layout.lined = {
      rows,
      spacing,
    };
  }

  return layout;
}

/**
 * 实时在容器中生成并渲染第 1 页原生矢量 SVG (杜绝任何缩放下的像素走样)
 */
function renderPreview() {
  const layout = computeLayout(0);
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
  const { outerLineWidth, innerLineWidth, lineColor, bgColor, showHeaderInfo, showTitleLine, showPageNumber, columnsCount } = appState;
  const type = appState.paperType || 'composition';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${paperWidth}mm" height="${paperHeight}mm" viewBox="0 0 ${paperWidth} ${paperHeight}" style="width:${paperWidth}mm; height:${paperHeight}mm; display:block; shape-rendering:geometricPrecision; text-rendering:geometricPrecision;">\n`;

  // 1. 纸张底色
  svg += `  <rect width="${paperWidth}" height="${paperHeight}" fill="${bgColor}" />\n`;

  // 2. 考生/学生信息
  if (showHeaderInfo && pageIndex === 0) {
    const y = layout.marginTop + 4;
    const availW = paperWidth - layout.marginLeft - layout.marginRight;
    const spacing = availW / 3;
    const label1 = (type === 'english') ? 'Name: __________' : '姓名：__________';
    const label2 = (type === 'english') ? 'Class: __________' : '班级：__________';
    const label3 = (type === 'english') ? 'No: ____________' : '学号：________________';
    svg += `  <text x="${layout.marginLeft}" y="${y}" font-size="3.3" font-family="-apple-system, sans-serif" fill="${lineColor}" dominant-baseline="central">${label1}</text>\n`;
    svg += `  <text x="${layout.marginLeft + spacing}" y="${y}" font-size="3.3" font-family="-apple-system, sans-serif" fill="${lineColor}" dominant-baseline="central">${label2}</text>\n`;
    svg += `  <text x="${layout.marginLeft + 2 * spacing}" y="${y}" font-size="3.3" font-family="-apple-system, sans-serif" fill="${lineColor}" dominant-baseline="central">${label3}</text>\n`;
  }

  // 3. 题目行
  if (showTitleLine && pageIndex === 0) {
    const y = layout.marginTop + (showHeaderInfo ? 14 : 4);
    const titleText = (type === 'english') ? 'Title: ' : '题目：';
    svg += `  <text x="${layout.marginLeft}" y="${y}" font-size="3.6" font-family="-apple-system, sans-serif" fill="${lineColor}" dominant-baseline="central">${titleText}</text>\n`;
    svg += `  <line x1="${layout.marginLeft + 14}" y1="${y + 2.5}" x2="${paperWidth - layout.marginRight}" y2="${y + 2.5}" stroke="${lineColor}" stroke-width="${innerLineWidth}" />\n`;
  }

  // 4. 分纸张类型渲染主体
  if (type === 'composition') {
    // A. 作文纸 (方格)
    const { cols, rows, splitVerticalLines, showWordCount, gridHelperLine, countStep } = appState;
    const { cellWidth, cellHeight, gapHeight } = layout;

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

        // 行间槽底部横线
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

        // 字数标记提示 (方案 A: 精准定位到具体字格下方)
        if (showWordCount && gapHeight > 0.8) {
          const wordsPerColumn = cols * rows;
          const accumulated = pageIndex * (wordsPerColumn * columnsCount) + colIdx * wordsPerColumn;
          const rowStartWords = accumulated + r * cols;
          const rowEndWords = accumulated + (r + 1) * cols;

          const fontSize = Math.min(gapHeight * 0.75, 2.8);
          const capHeight = fontSize * 0.71;
          const baselineY = rowBottom + (gapHeight + capHeight) / 2;

          if (countStep === 'row') {
            const targetWords = rowEndWords;
            const targetX = left + width - 1.2;
            svg += `  <text x="${targetX}" y="${baselineY}" font-size="${fontSize}" font-family="'Segoe UI', Arial, sans-serif" fill="${lineColor}" text-anchor="end">${targetWords}</text>\n`;
          } else {
            const step = parseInt(countStep) || 100;
            const firstTarget = Math.ceil((rowStartWords + 1) / step) * step;
            for (let targetWords = firstTarget; targetWords <= rowEndWords; targetWords += step) {
              const c = (targetWords - rowStartWords) - 1;
              const targetX = left + (c + 0.5) * cellWidth;
              svg += `  <text x="${targetX}" y="${baselineY}" font-size="${fontSize}" font-family="'Segoe UI', Arial, sans-serif" fill="${lineColor}" text-anchor="middle">${targetWords}</text>\n`;
            }
          }
        }
      }
    });

  } else if (type === 'english') {
    // B. 英语作业纸 (四线三格)
    const { rows, groupHeight, gapHeight, subHeight } = layout.english;
    const midStyle = appState.englishMidLineStyle || 'same';

    layout.columns.forEach((col) => {
      const { left, top, width } = col;

      for (let r = 0; r < rows; r++) {
        const groupTop = top + r * (groupHeight + gapHeight);
        const y1 = groupTop;
        const y2 = groupTop + subHeight;
        const y3 = groupTop + 2 * subHeight;
        const y4 = groupTop + 3 * subHeight;

        // 第 1 线（顶实线）
        svg += `  <line x1="${left}" y1="${y1}" x2="${left + width}" y2="${y1}" stroke="${lineColor}" stroke-width="${innerLineWidth}" />\n`;

        // 第 2 线（中虚线）
        let midStroke = lineColor;
        let midDash = 'stroke-dasharray="1.2,1.2"';
        if (midStyle === 'red') {
          midStroke = '#ef4444';
        } else if (midStyle === 'solid') {
          midDash = '';
        }
        svg += `  <line x1="${left}" y1="${y2}" x2="${left + width}" y2="${y2}" stroke="${midStroke}" stroke-width="${innerLineWidth}" ${midDash} />\n`;

        // 第 3 线（基线 - 实线）
        svg += `  <line x1="${left}" y1="${y3}" x2="${left + width}" y2="${y3}" stroke="${lineColor}" stroke-width="${innerLineWidth * 1.2}" />\n`;

        // 第 4 线（底实线）
        svg += `  <line x1="${left}" y1="${y4}" x2="${left + width}" y2="${y4}" stroke="${lineColor}" stroke-width="${innerLineWidth}" />\n`;

        // 可选：75度书写倾斜辅助线
        if (appState.englishSlantedGuides) {
          const slantSpacing = 15; // 每隔 15mm 一条斜虚线
          const dx = groupHeight / Math.tan((75 * Math.PI) / 180);
          for (let sx = left + 10; sx < left + width - 10; sx += slantSpacing) {
            svg += `  <line x1="${sx + dx}" y1="${y1}" x2="${sx}" y2="${y4}" stroke="${lineColor}" stroke-width="${innerLineWidth * 0.6}" stroke-dasharray="0.8,0.8" opacity="0.6" />\n`;
          }
        }
      }
    });

  } else if (type === 'lined') {
    // C. 课业横线纸
    const { rows, spacing } = layout.lined;
    const style = appState.linedStyle || 'solid';

    layout.columns.forEach((col) => {
      const { left, top, width, height } = col;

      // 顶部与底部边框封闭
      svg += `  <line x1="${left}" y1="${top}" x2="${left + width}" y2="${top}" stroke="${lineColor}" stroke-width="${outerLineWidth}" />\n`;
      svg += `  <line x1="${left}" y1="${top + height}" x2="${left + width}" y2="${top + height}" stroke="${lineColor}" stroke-width="${outerLineWidth}" />\n`;

      // 内部横线
      let dashStr = '';
      if (style === 'dashed') dashStr = 'stroke-dasharray="2.0,1.5"';
      else if (style === 'dotted') dashStr = 'stroke-dasharray="0.8,1.2"';

      for (let r = 1; r < rows; r++) {
        const y = top + r * spacing;
        svg += `  <line x1="${left}" y1="${y}" x2="${left + width}" y2="${y}" stroke="${lineColor}" stroke-width="${innerLineWidth}" ${dashStr} />\n`;
      }

      // 可选：左侧装订垂直线 (Margin Line)
      if (appState.linedMarginLine) {
        const marginLineX = left + 25;
        svg += `  <line x1="${marginLineX}" y1="${top}" x2="${marginLineX}" y2="${top + height}" stroke="#ef4444" stroke-width="${innerLineWidth * 1.3}" />\n`;
      }
    });
  }

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

  const type = appState.paperType || 'composition';

  if (type === 'composition') {
    dom.tagGrid.textContent = `${appState.cols}列 × ${appState.rows}行`;
    const cellWStr = layout.cellWidth.toFixed(1);
    const cellHStr = layout.cellHeight.toFixed(1);
    dom.tagCellSize.textContent = `方格 ${cellWStr} × ${cellHStr} mm`;
    const slotText = (appState.enableGap !== false && layout.gapHeight > 0.1) 
      ? `(行槽高 ${layout.gapHeight.toFixed(1)} mm)` 
      : `(无行间槽)`;
    dom.cellSizeDisplay.textContent = `约 ${cellWStr} mm × ${cellHStr} mm ${slotText}`;
    const totalWordsPerPage = appState.cols * appState.rows * appState.columnsCount;
    dom.tagWords.textContent = `${totalWordsPerPage} 字 / 页 (共 ${totalWordsPerPage * appState.pageCount} 字)`;

  } else if (type === 'english') {
    dom.tagGrid.textContent = `${appState.englishRows} 组四线三格`;
    const gh = layout.english.groupHeight.toFixed(1);
    const gap = layout.english.gapHeight.toFixed(1);
    dom.tagCellSize.textContent = `组高 ${gh} mm (槽间距 ${gap} mm)`;
    dom.tagWords.textContent = `英语作业纸 · ${appState.pageCount} 页`;

  } else if (type === 'lined') {
    dom.tagGrid.textContent = `${appState.linedRows} 行横线`;
    const sp = layout.lined.spacing.toFixed(1);
    dom.tagCellSize.textContent = `行距 ${sp} mm`;
    dom.tagWords.textContent = `课业横线纸 · ${appState.pageCount} 页`;
  }
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
  const type = appState.paperType || 'composition';

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
      const label1 = (type === 'english') ? 'Name: __________' : '姓名：__________';
      const label2 = (type === 'english') ? 'Class: __________' : '班级：__________';
      const label3 = (type === 'english') ? 'No: ____________' : '学号：________________';
      doc.text(label1, layout.marginLeft, y);
      doc.text(label2, layout.marginLeft + spacing, y);
      doc.text(label3, layout.marginLeft + 2 * spacing, y);
    }

    // 绘制题目行
    if (appState.showTitleLine && p === 0) {
      doc.setFontSize(10);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const y = layout.marginTop + (appState.showHeaderInfo ? 14 : 4);
      const titleText = (type === 'english') ? 'Title: ' : '题目：';
      doc.text(titleText, layout.marginLeft, y);
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(appState.innerLineWidth);
      doc.line(layout.marginLeft + 14, y + 1.5, layout.paperWidth - layout.marginRight, y + 1.5);
    }

    // 分类型绘制主体
    if (type === 'composition') {
      layout.columns.forEach((col, colIdx) => {
        drawColumnPdfComposition(doc, layout, col, p, colIdx, rgb);
      });
    } else if (type === 'english') {
      layout.columns.forEach((col) => {
        drawColumnPdfEnglish(doc, layout, col, rgb);
      });
    } else if (type === 'lined') {
      layout.columns.forEach((col) => {
        drawColumnPdfLined(doc, layout, col, rgb);
      });
    }

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

  const typeNameMap = { composition: '作文纸', english: '英语作业纸', lined: '横线纸' };
  const filename = `${typeNameMap[type] || '练习纸'}_${totalPages}页.pdf`;

  if (triggerPrint) {
    doc.autoPrint();
    const blob = doc.output('bloburl');
    window.open(blob);
  } else {
    doc.save(filename);
  }
}

/**
 * 绘制 PDF 作文方格单栏
 */
function drawColumnPdfComposition(doc, layout, col, pageIndex, colIndex, rgb) {
  const { cols, rows, outerLineWidth, innerLineWidth, splitVerticalLines, showWordCount, countStep, gridHelperLine } = appState;
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

    // 行间槽底横线
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

    // 字数标记提示 (方案 A: 精准定位到具体字格下方)
    if (showWordCount && gapHeight > 0.8) {
      const wordsPerColumn = cols * rows;
      const accumulatedWordsBefore = pageIndex * (wordsPerColumn * appState.columnsCount) + colIndex * wordsPerColumn;
      const rowStartWords = accumulatedWordsBefore + r * cols;
      const rowEndWords = accumulatedWordsBefore + (r + 1) * cols;

      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const pdfFontSize = Math.max(5, Math.min(8.5, gapHeight * 2.8));
      doc.setFontSize(pdfFontSize);
      const capHeightMm = (pdfFontSize * 0.71) * (25.4 / 72);
      const baselineY = rowBottom + (gapHeight + capHeightMm) / 2;

      if (countStep === 'row') {
        const textStr = `${rowEndWords}`;
        const textW = doc.getTextWidth(textStr);
        const targetX = left + width - textW - 1.0;
        doc.text(textStr, targetX, baselineY);
      } else {
        const step = parseInt(countStep) || 100;
        const firstTarget = Math.ceil((rowStartWords + 1) / step) * step;
        for (let targetWords = firstTarget; targetWords <= rowEndWords; targetWords += step) {
          const textStr = `${targetWords}`;
          const textW = doc.getTextWidth(textStr);
          const c = (targetWords - rowStartWords) - 1;
          const targetX = left + (c + 0.5) * cellWidth - textW / 2;
          doc.text(textStr, targetX, baselineY);
        }
      }
    }
  }

  // 左右外边框
  doc.setLineWidth(outerLineWidth);
  doc.line(left, top, left, top + height);
  doc.line(left + width, top, left + width, top + height);
}

/**
 * 绘制 PDF 英语四线三格
 */
function drawColumnPdfEnglish(doc, layout, col, rgb) {
  const { innerLineWidth } = appState;
  const { rows, groupHeight, gapHeight, subHeight } = layout.english;
  const { left, top, width } = col;
  const midStyle = appState.englishMidLineStyle || 'same';

  for (let r = 0; r < rows; r++) {
    const groupTop = top + r * (groupHeight + gapHeight);
    const y1 = groupTop;
    const y2 = groupTop + subHeight;
    const y3 = groupTop + 2 * subHeight;
    const y4 = groupTop + 3 * subHeight;

    // Line 1
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    doc.setLineWidth(innerLineWidth);
    doc.line(left, y1, left + width, y1);

    // Line 2 (中虚线)
    if (midStyle === 'red') doc.setDrawColor(239, 68, 68);
    else doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

    if (midStyle !== 'solid') doc.setLineDashPattern([1.2, 1.2], 0);
    doc.line(left, y2, left + width, y2);
    doc.setLineDashPattern([], 0);

    // Line 3 (基线)
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    doc.setLineWidth(innerLineWidth * 1.2);
    doc.line(left, y3, left + width, y3);

    // Line 4
    doc.setLineWidth(innerLineWidth);
    doc.line(left, y4, left + width, y4);

    // 75度斜辅助线
    if (appState.englishSlantedGuides) {
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(innerLineWidth * 0.6);
      doc.setLineDashPattern([0.8, 0.8], 0);
      const slantSpacing = 15;
      const dx = groupHeight / Math.tan((75 * Math.PI) / 180);
      for (let sx = left + 10; sx < left + width - 10; sx += slantSpacing) {
        doc.line(sx + dx, y1, sx, y4);
      }
      doc.setLineDashPattern([], 0);
    }
  }
}

/**
 * 绘制 PDF 课业横线纸
 */
function drawColumnPdfLined(doc, layout, col, rgb) {
  const { outerLineWidth, innerLineWidth } = appState;
  const { rows, spacing } = layout.lined;
  const { left, top, width, height } = col;
  const style = appState.linedStyle || 'solid';

  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

  // 顶底外框
  doc.setLineWidth(outerLineWidth);
  doc.line(left, top, left + width, top);
  doc.line(left, top + height, left + width, top + height);

  // 内部横线
  doc.setLineWidth(innerLineWidth);
  if (style === 'dashed') doc.setLineDashPattern([2.0, 1.5], 0);
  else if (style === 'dotted') doc.setLineDashPattern([0.8, 1.2], 0);

  for (let r = 1; r < rows; r++) {
    const y = top + r * spacing;
    doc.line(left, y, left + width, y);
  }
  doc.setLineDashPattern([], 0);

  // 左侧装订垂直线
  if (appState.linedMarginLine) {
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(innerLineWidth * 1.3);
    const marginLineX = left + 25;
    doc.line(marginLineX, top, marginLineX, top + height);
  }
}

/**
 * 导出 SVG 格式
 */
function exportSvg() {
  const layout = computeLayout(0);
  const svgContent = buildPageSvgString(layout, 0);

  const typeNameMap = { composition: '作文纸', english: '英语作业纸', lined: '横线纸' };
  const filename = `${typeNameMap[appState.paperType] || '纸张模板'}.svg`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 导出超清 PNG
 */
function exportPng() {
  const layout = computeLayout(0);
  const svgString = buildPageSvgString(layout, 0);

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const typeNameMap = { composition: '作文纸', english: '英语作业纸', lined: '横线纸' };
  const filename = `${typeNameMap[appState.paperType] || '纸张模板'}.png`;

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
    link.download = filename;
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
  downloadAnchor.setAttribute('download', `纸张配置_${appState.paperType || 'custom'}.json`);
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
      updateSectionVisibility();
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
