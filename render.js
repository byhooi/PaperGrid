(function (grid) {
  'use strict';

  function buildScene(input, pageIndex = 0) {
    const config = grid.validateConfig(input);
    const layout = grid.computeLayout(config, pageIndex);
    const shapes = [{ type: 'rect', left: 0, top: 0, width: layout.paperWidth, height: layout.paperHeight, fill: config.bgColor }];
    const line = (startX, startY, endX, endY, width = config.innerLineWidth, dash = [], color = config.lineColor, opacity = 1) => {
      shapes.push({ type: 'line', startX, startY, endX, endY, width, dash, color, opacity });
    };
    const text = (value, left, baseline, size, align = 'left') => {
      shapes.push({ type: 'text', value, left, baseline, size, align, color: config.lineColor });
    };
    const english = config.paperType === 'english';
    if (pageIndex === 0 && config.showHeaderInfo) {
      const labels = english ? ['Name: __________', 'Class: __________', 'No: __________'] : ['姓名：__________', '班级：__________', '学号：__________'];
      const availableWidth = layout.paperWidth - config.marginLeft - config.marginRight;
      labels.forEach((label, labelIndex) => text(label, config.marginLeft + labelIndex * availableWidth / 3, config.marginTop + 4, Math.min(3.3, availableWidth / 65)));
    }
    if (pageIndex === 0 && config.showTitleLine) {
      const baseline = config.marginTop + (config.showHeaderInfo ? 16 : 4);
      text(english ? 'Title: ' : '题目：', config.marginLeft, baseline, 3.6);
      line(config.marginLeft + 14, baseline + 1.5, layout.paperWidth - config.marginRight, baseline + 1.5);
    }
    layout.columns.forEach((column, columnIndex) => {
      const { left, top, width, height } = column;
      if (config.paperType === 'composition') {
        const { cellWidth, cellHeight, gapHeight } = layout;
        line(left, top, left, top + height, config.outerLineWidth);
        line(left + width, top, left + width, top + height, config.outerLineWidth);
        for (let rowIndex = 0; rowIndex < config.rows; rowIndex++) {
          const rowTop = top + rowIndex * (cellHeight + gapHeight);
          const rowBottom = rowTop + cellHeight;
          const gapBottom = rowBottom + gapHeight;
          if (rowIndex === 0) line(left, rowTop, left + width, rowTop, config.outerLineWidth);
          line(left, rowBottom, left + width, rowBottom, gapHeight === 0 && rowIndex === config.rows - 1 ? config.outerLineWidth : config.innerLineWidth);
          if (gapHeight > 0) line(left, gapBottom, left + width, gapBottom, rowIndex === config.rows - 1 ? config.outerLineWidth : config.innerLineWidth);
          for (let columnNumber = 1; columnNumber < config.cols; columnNumber++) {
            const coordinate = left + columnNumber * cellWidth;
            line(coordinate, rowTop, coordinate, config.splitVerticalLines ? gapBottom : rowBottom);
          }
          if (config.gridHelperLine !== 'none') {
            for (let cellIndex = 0; cellIndex < config.cols; cellIndex++) {
              const cellLeft = left + cellIndex * cellWidth;
              const helperWidth = config.innerLineWidth * 0.7;
              line(cellLeft, rowTop + cellHeight / 2, cellLeft + cellWidth, rowTop + cellHeight / 2, helperWidth, [0.8, 0.8]);
              line(cellLeft + cellWidth / 2, rowTop, cellLeft + cellWidth / 2, rowBottom, helperWidth, [0.8, 0.8]);
              if (config.gridHelperLine === 'mi') {
                line(cellLeft, rowTop, cellLeft + cellWidth, rowBottom, helperWidth, [0.8, 0.8]);
                line(cellLeft + cellWidth, rowTop, cellLeft, rowBottom, helperWidth, [0.8, 0.8]);
              }
            }
          }
          if (config.showWordCount && gapHeight > 0.8) {
            const wordsPerColumn = config.cols * config.rows;
            const rowStart = (pageIndex * config.columnsCount + columnIndex) * wordsPerColumn + rowIndex * config.cols;
            const rowEnd = rowStart + config.cols;
            const size = Math.min(gapHeight * 0.75, 2.8);
            const baseline = rowBottom + (gapHeight + size * 0.71) / 2;
            if (config.countStep === 'row') text(String(rowEnd), left + width - 1.2, baseline, size, 'right');
            else {
              const step = Number(config.countStep);
              for (let target = Math.ceil((rowStart + 1) / step) * step; target <= rowEnd; target += step) {
                text(String(target), left + (target - rowStart - 0.5) * cellWidth, baseline, size, 'center');
              }
            }
          }
        }
      } else if (english) {
        const { rows, groupHeight, gapHeight, subHeight } = layout.english;
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          const groupTop = top + rowIndex * (groupHeight + gapHeight);
          line(left, groupTop, left + width, groupTop);
          line(left, groupTop + subHeight, left + width, groupTop + subHeight, config.innerLineWidth, config.englishMidLineStyle === 'solid' ? [] : [1.2, 1.2], config.englishMidLineStyle === 'red' ? '#ef4444' : config.lineColor);
          line(left, groupTop + 2 * subHeight, left + width, groupTop + 2 * subHeight, config.innerLineWidth * 1.2);
          line(left, groupTop + groupHeight, left + width, groupTop + groupHeight);
          if (config.englishSlantedGuides) {
            const offset = groupHeight / Math.tan(75 * Math.PI / 180);
            for (let guideLeft = left + 10; guideLeft + offset < left + width; guideLeft += 15) {
              line(guideLeft + offset, groupTop, guideLeft, groupTop + groupHeight, config.innerLineWidth * 0.6, [0.8, 0.8], config.lineColor, 0.6);
            }
          }
        }
      } else {
        const { rows, spacing } = layout.lined;
        line(left, top, left + width, top, config.outerLineWidth);
        line(left, top + height, left + width, top + height, config.outerLineWidth);
        const dash = config.linedStyle === 'dashed' ? [2, 1.5] : config.linedStyle === 'dotted' ? [0.8, 1.2] : [];
        for (let rowIndex = 1; rowIndex < rows; rowIndex++) line(left, top + rowIndex * spacing, left + width, top + rowIndex * spacing, config.innerLineWidth, dash);
        if (config.linedMarginLine) line(left + 25, top, left + 25, top + height, config.innerLineWidth * 1.3, [], '#ef4444');
      }
    });
    if (config.columnsCount === 2) {
      const foldLeft = layout.columns[0].left + layout.columnWidth + layout.columnGap / 2;
      line(foldLeft, config.marginTop, foldLeft, layout.paperHeight - config.marginBottom - (config.showPageNumber ? 8 : 0), config.innerLineWidth, [2, 3]);
    }
    if (config.showPageNumber) text(`- ${pageIndex + 1} -`, layout.paperWidth / 2, layout.footerBaseline, 3, 'center');
    return { ...layout, pageIndex, shapes };
  }

  function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
  }

  function sceneToSvg(scene, embeddedFont = '') {
    const content = scene.shapes.map(shape => {
      if (shape.type === 'rect') return `<rect x="${shape.left}" y="${shape.top}" width="${shape.width}" height="${shape.height}" fill="${escapeXml(shape.fill)}"/>`;
      if (shape.type === 'line') return `<line x1="${shape.startX}" y1="${shape.startY}" x2="${shape.endX}" y2="${shape.endY}" stroke="${escapeXml(shape.color)}" stroke-width="${shape.width}" stroke-dasharray="${shape.dash.join(',') || 'none'}" opacity="${shape.opacity}"/>`;
      const anchor = { left: 'start', center: 'middle', right: 'end' }[shape.align];
      return `<text x="${shape.left}" y="${shape.baseline}" font-size="${shape.size}" font-family="PaperGridSans, sans-serif" fill="${escapeXml(shape.color)}" text-anchor="${anchor}">${escapeXml(shape.value)}</text>`;
    }).join('');
    const fontStyle = embeddedFont ? `<defs><style>@font-face{font-family:PaperGridSans;src:url(data:font/ttf;base64,${embeddedFont}) format('truetype');}</style></defs>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.paperWidth}mm" height="${scene.paperHeight}mm" viewBox="0 0 ${scene.paperWidth} ${scene.paperHeight}" role="img" aria-label="稿纸第 ${scene.pageIndex + 1} 页">${fontStyle}${content}</svg>`;
  }

  Object.assign(grid, { buildScene, sceneToSvg });
})(globalThis.PaperGrid ||= {});
