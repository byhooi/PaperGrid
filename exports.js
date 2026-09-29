(function (grid) {
  'use strict';

  const scripts = new Map();
  const liveUrls = new Set();

  function releaseUrl(url) {
    URL.revokeObjectURL(url);
    liveUrls.delete(url);
  }

  function createUrl(blob) {
    const url = URL.createObjectURL(blob);
    liveUrls.add(url);
    return url;
  }

  function downloadBlob(blob, filename) {
    const url = createUrl(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => releaseUrl(url), 60000);
  }

  function loadScript(source) {
    if (!scripts.has(source)) {
      const promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const timer = setTimeout(() => fail(), 20000);
        const fail = () => {
          clearTimeout(timer);
          script.remove();
          reject(new Error(`无法加载 ${source}，请检查文件是否完整，然后重试。`));
        };
        script.src = source;
        script.onload = () => { clearTimeout(timer); resolve(); };
        script.onerror = fail;
        document.head.append(script);
      }).catch(error => { scripts.delete(source); throw error; });
      scripts.set(source, promise);
    }
    return scripts.get(source);
  }

  async function loadFont() {
    if (!grid.fontBase64) await loadScript('assets/papergrid-font.js');
    if (!grid.fontBase64) throw new Error('中文字体加载失败，请重试。');
    return grid.fontBase64;
  }

  function filename(config, extension, pageIndex) {
    const name = { composition: '作文纸', english: '英语作业纸', lined: '横线纸' }[config.paperType];
    return `${name}_${config.paperSize.toUpperCase()}_${pageIndex === undefined ? config.pageCount + '页' : '第' + (pageIndex + 1) + '页'}.${extension}`;
  }

  async function createPdf(input, onProgress = () => {}) {
    const config = grid.validateDocument(input);
    const [font] = await Promise.all([loadFont(), loadScript('assets/jspdf-4.2.1.umd.min.js')]);
    if (!globalThis.jspdf?.jsPDF) throw new Error('PDF 引擎加载失败，请重试。');
    const first = grid.computeLayout(config, 0);
    const orientation = config.paperOrientation === 'l' ? 'landscape' : 'portrait';
    const documentPdf = new globalThis.jspdf.jsPDF({ orientation, unit: 'mm', format: [first.paperWidth, first.paperHeight], compress: true, putOnlyUsedFonts: true });
    documentPdf.addFileToVFS('PaperGridSans.ttf', font);
    documentPdf.addFont('PaperGridSans.ttf', 'PaperGridSans', 'normal');
    documentPdf.setFont('PaperGridSans');
    documentPdf.setProperties({ title: filename(config, 'pdf'), creator: 'PaperGrid' });
    for (let pageIndex = 0; pageIndex < config.pageCount; pageIndex++) {
      const scene = grid.buildScene(config, pageIndex);
      if (pageIndex > 0) documentPdf.addPage([scene.paperWidth, scene.paperHeight], orientation);
      let opacity = 1;
      for (const shape of scene.shapes) {
        const nextOpacity = shape.opacity ?? 1;
        if (nextOpacity !== opacity) {
          documentPdf.setGState(new documentPdf.GState({ opacity: nextOpacity, 'stroke-opacity': nextOpacity }));
          opacity = nextOpacity;
        }
        if (shape.type === 'rect') {
          documentPdf.setFillColor(shape.fill);
          documentPdf.rect(shape.left, shape.top, shape.width, shape.height, 'F');
        } else if (shape.type === 'line') {
          documentPdf.setDrawColor(shape.color);
          documentPdf.setLineWidth(shape.width);
          documentPdf.setLineDashPattern(shape.dash, 0);
          documentPdf.line(shape.startX, shape.startY, shape.endX, shape.endY);
        } else {
          documentPdf.setTextColor(shape.color);
          documentPdf.setFontSize(shape.size * 72 / 25.4);
          documentPdf.text(shape.value, shape.left, shape.baseline, { align: shape.align });
        }
      }
      documentPdf.setGState(new documentPdf.GState({ opacity: 1, 'stroke-opacity': 1 }));
      onProgress(pageIndex + 1, config.pageCount);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return documentPdf;
  }

  async function exportSvg(config, pageIndex) {
    const font = await loadFont();
    const content = grid.sceneToSvg(grid.buildScene(config, pageIndex), font);
    downloadBlob(new Blob([content], { type: 'image/svg+xml;charset=utf-8' }), filename(config, 'svg', pageIndex));
  }

  async function exportPng(config, pageIndex) {
    const font = await loadFont();
    const scene = grid.buildScene(config, pageIndex);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(scene.paperWidth / 25.4 * config.pngDpi);
    canvas.height = Math.round(scene.paperHeight / 25.4 * config.pngDpi);
    if (canvas.width * canvas.height > 25000000) throw new Error('图片过大，请选择 150 DPI。');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器无法创建画布，请改用 SVG 或 PDF。');
    const url = createUrl(new Blob([grid.sceneToSvg(scene, font)], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('图片生成超时，请重试。')), 20000);
        image.onload = () => { clearTimeout(timer); resolve(); };
        image.onerror = () => { clearTimeout(timer); reject(new Error('图片加载失败，请重试或导出 SVG。')); };
        image.src = url;
      });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG 生成失败，请选择较低的 DPI。');
      downloadBlob(blob, filename(config, 'png', pageIndex));
    } finally {
      releaseUrl(url);
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  function openPrintPdf(documentPdf, printWindow) {
    documentPdf.autoPrint();
    const url = createUrl(documentPdf.output('blob'));
    printWindow.location.replace(url);
    const timer = setInterval(() => {
      if (printWindow.closed) { releaseUrl(url); clearInterval(timer); }
    }, 1000);
  }

  window.addEventListener('pagehide', () => liveUrls.forEach(releaseUrl));
  Object.assign(grid, { downloadBlob, loadFont, filename, createPdf, exportSvg, exportPng, openPrintPdf });
})(globalThis.PaperGrid ||= {});
