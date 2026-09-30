(function (grid) {
  'use strict';

  function computeLayout(input, pageIndex = 0) {
    const config = grid.validateConfig(input);
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= config.pageCount) throw new Error('页码超出生成范围。');
    const spec = grid.paperSpecs[config.paperSize];
    const landscape = config.paperOrientation === 'l';
    const paperWidth = landscape ? spec.height : spec.width;
    const paperHeight = landscape ? spec.width : spec.height;
    const headerHeight = pageIndex === 0 ? (config.showHeaderInfo ? 12 : 0) + (config.showTitleLine ? 14 : 0) : 0;
    const footerHeight = config.showPageNumber ? 8 : 0;
    const contentTop = config.marginTop + headerHeight;
    const contentHeight = paperHeight - contentTop - config.marginBottom - footerHeight;
    const columnGap = config.columnsCount === 2 ? 16 : 0;
    const columnWidth = (paperWidth - config.marginLeft - config.marginRight - columnGap) / config.columnsCount;
    const layout = { paperWidth, paperHeight, contentTop, contentHeight, columnWidth, columnGap, columns: [], warnings: [], footerBaseline: paperHeight - config.marginBottom - 1.5 };
    if (contentHeight <= 0 || columnWidth <= 0) throw new Error('边距与页眉占用过多空间，请缩小边距。');
    let totalHeight;
    let contentWidth = columnWidth;

    if (config.paperType === 'composition') {
      const ratio = config.enableGap && config.gapMode === 'ratio' ? config.gapRatio : 0;
      const fixedGap = config.enableGap && config.gapMode === 'fixed' ? config.gapHeightMm : 0;
      const widthLimit = columnWidth / config.cols;
      const heightLimit = (contentHeight / config.rows - fixedGap) / (1 + ratio);
      const cellWidth = config.fillVerticalHeight ? Math.min(widthLimit, heightLimit) : widthLimit;
      const cellHeight = cellWidth;
      const gapHeight = fixedGap + cellHeight * ratio;
      if (cellHeight < 1) throw new Error('方格边长不足 1 mm，请减少行列数、缩小槽高或边距。');
      contentWidth = config.cols * cellWidth;
      totalHeight = config.rows * (cellHeight + gapHeight);
      Object.assign(layout, { cellWidth, cellHeight, gapHeight });
      if (config.showWordCount && gapHeight <= 0.8) layout.warnings.push('行间槽不足 0.8 mm，字数标记不显示。');
    } else if (config.paperType === 'english') {
      const baseHeight = config.englishRows * config.englishGroupHeight + (config.englishRows - 1) * config.englishGapHeight;
      const scale = config.englishFillVertical ? contentHeight / baseHeight : 1;
      const groupHeight = config.englishGroupHeight * scale;
      const gapHeight = config.englishGapHeight * scale;
      totalHeight = config.englishRows * groupHeight + (config.englishRows - 1) * gapHeight;
      layout.english = { rows: config.englishRows, groupHeight, gapHeight, subHeight: groupHeight / 3 };
    } else {
      const spacing = config.linedFillVertical ? contentHeight / config.linedRows : config.linedSpacing;
      totalHeight = config.linedRows * spacing;
      layout.lined = { rows: config.linedRows, spacing };
      if (config.linedMarginLine && columnWidth <= 25) throw new Error('分栏宽度不足以容纳 25 mm 装订线，请减少边距或改为单栏。');
    }
    if (totalHeight > contentHeight + 0.001) {
      const english = config.paperType === 'english';
      const rowHeight = english ? layout.english.groupHeight + layout.english.gapHeight : config.paperType === 'composition' ? layout.cellHeight + layout.gapHeight : layout.lined.spacing;
      const trailingGap = english ? layout.english.gapHeight : 0;
      const maximumRows = Math.floor((contentHeight + trailingGap + 0.001) / rowHeight);
      const rowsKey = english ? 'englishRows' : config.paperType === 'composition' ? 'rows' : 'linedRows';
      const minimumRows = grid.numericRules[rowsKey][0];
      const unit = english ? '组' : '行';
      const suggestion = maximumRows >= minimumRows
        ? `保持当前尺寸时，请减少至 ${maximumRows} ${unit}以内，或缩小间距、边距。`
        : `当前尺寸最多可放 ${maximumRows} ${unit}，不足最少 ${minimumRows} ${unit}；请缩小书写尺寸、间距、边距或换用更大的纸张。`;
      const fitOption = config.paperType === 'composition' ? '自动适配页面' : '按行数铺满';
      throw new Error(`内容需要 ${totalHeight.toFixed(1)} mm，可用高度只有 ${contentHeight.toFixed(1)} mm。${suggestion}也可开启“${fitOption}”，允许自动调整书写尺寸。`);
    }
    for (let columnIndex = 0; columnIndex < config.columnsCount; columnIndex++) {
      layout.columns.push({ left: config.marginLeft + columnIndex * (columnWidth + columnGap) + (columnWidth - contentWidth) / 2, top: contentTop + (contentHeight - totalHeight) / 2, width: contentWidth, height: totalHeight });
    }
    return layout;
  }

  function validateDocument(config) {
    const normalized = grid.validateConfig(config);
    computeLayout(normalized, 0);
    if (normalized.pageCount > 1) computeLayout(normalized, normalized.pageCount - 1);
    return normalized;
  }

  Object.assign(grid, { computeLayout, validateDocument });
})(globalThis.PaperGrid ||= {});
