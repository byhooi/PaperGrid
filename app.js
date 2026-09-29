(function (grid) {
  'use strict';

  const storageKey = 'papergrid.config.v1';
  const templatesKey = 'papergrid.templates.v1';
  const element = identifier => document.getElementById(identifier);
  const control = key => element(key === 'lineColor' ? 'lineColorPicker' : key);
  let state = { ...grid.defaults };
  let currentPage = 0;
  let valid = true;
  let busy = false;
  let fitMode = true;
  let zoom = 1;
  let renderFrame = 0;
  let saveTimer = 0;
  let lastGeometry = '';
  let templates = [];
  let lastScene;

  function notify(message, error = false) {
    element('appStatus').textContent = message;
    element('appStatus').classList.toggle('status-error', error);
  }

  function updateActions() {
    for (const identifier of ['topExportPdfBtn', 'topPrintBtn', 'topExportSvgBtn', 'topExportPngBtn', 'exportConfigBtn', 'saveTemplateBtn']) {
      element(identifier).disabled = busy || !valid;
    }
    element('previousPage').disabled = currentPage === 0 || !valid;
    element('nextPage').disabled = currentPage >= state.pageCount - 1 || !valid;
    element('pagePosition').textContent = `${currentPage + 1} / ${state.pageCount}`;
    element('pageExportHint').textContent = `PDF / 打印：全部 ${state.pageCount} 页 · SVG / PNG：当前第 ${currentPage + 1} 页`;
    document.body.setAttribute('aria-busy', String(busy));
  }

  function showValidation(message = '') {
    valid = !message;
    element('validationMessage').textContent = message;
    element('validationMessage').hidden = !message;
    element('paperSheet').hidden = !valid;
    if (message) element('saveStatus').textContent = '参数有误，未保存';
    updateActions();
  }

  function saveState() {
    clearTimeout(saveTimer);
    element('saveStatus').textContent = '正在保存…';
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, grid.serializeConfiguration(state));
        element('saveStatus').textContent = '已自动保存到此浏览器';
      } catch {
        element('saveStatus').textContent = '无法自动保存，请导出 JSON 备份';
      }
    }, 300);
  }

  function flushSave() {
    clearTimeout(saveTimer);
    if (!valid) return;
    try { localStorage.setItem(storageKey, grid.serializeConfiguration(state)); }
    catch { element('saveStatus').textContent = '无法自动保存，请导出 JSON 备份'; }
  }

  function syncForm() {
    for (const [key, value] of Object.entries(state)) {
      const input = control(key);
      if (!input) continue;
      if (input.type === 'checkbox') input.checked = value;
      else input.value = value;
      input.removeAttribute('aria-invalid');
    }
    updateOptions();
  }

  function updateOptions() {
    for (const type of ['composition', 'english', 'lined']) element(`${type}Section`).style.display = type === state.paperType ? 'block' : 'none';
    element('gapConfigInputs').hidden = !state.enableGap;
    element('gapHeightMm').disabled = !state.enableGap || state.gapMode !== 'fixed';
    element('gapRatio').disabled = !state.enableGap || state.gapMode !== 'ratio';
    element('gapRatioVal').textContent = `${Math.round(state.gapRatio * 100)}%`;
    element('wordCountArea').hidden = !state.showWordCount;
    element('linedSpacing').disabled = state.linedFillVertical;
    document.querySelectorAll('.color-pill').forEach(button => {
      const active = button.dataset.color === state.lineColor;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.bg-swatch').forEach(button => {
      const active = button.dataset.bg === state.bgColor;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    let matched = false;
    document.querySelectorAll('.preset-card').forEach(button => {
      const preset = grid.presets[button.dataset.preset];
      const active = Object.keys(preset).every(key => key === 'pngDpi' || preset[key] === state[key]);
      matched ||= active;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    element('presetStatus').textContent = matched ? '预设模板' : '自定义配置';
  }

  function readForm(overrides = {}) {
    const candidate = { ...state };
    for (const [key, defaultValue] of Object.entries(grid.defaults)) {
      const input = control(key);
      if (!input) continue;
      input.removeAttribute('aria-invalid');
      if (input.type === 'checkbox') candidate[key] = input.checked;
      else if (typeof defaultValue === 'number') candidate[key] = input.value === '' ? NaN : Number(input.value);
      else candidate[key] = input.value;
    }
    return { ...candidate, ...overrides };
  }

  function acceptConfiguration(candidate, synchronize = false) {
    try {
      const normalized = grid.validateDocument(candidate);
      state = normalized;
      currentPage = Math.min(currentPage, state.pageCount - 1);
      showValidation();
      if (synchronize) syncForm();
      else updateOptions();
      saveState();
      scheduleRender();
      return true;
    } catch (error) {
      clearTimeout(saveTimer);
      showValidation(error.message);
      return false;
    }
  }

  function updateTags(scene) {
    const spec = grid.paperSpecs[state.paperSize];
    element('tagPaper').textContent = `${spec.name} ${state.paperOrientation === 'p' ? '纵向' : '横向'} · ${state.columnsCount === 2 ? '双栏' : '单栏'}`;
    if (state.paperType === 'composition') {
      const size = `${scene.cellWidth.toFixed(1)} × ${scene.cellHeight.toFixed(1)} mm`;
      element('tagGrid').textContent = `${state.cols}列 × ${state.rows}行`;
      element('tagCellSize').textContent = `方格 ${size}`;
      element('cellSizeDisplay').textContent = `${size} · 槽高 ${scene.gapHeight.toFixed(1)} mm`;
      const count = state.cols * state.rows * state.columnsCount;
      element('tagWords').textContent = `${count} 字/页 · 共 ${count * state.pageCount} 字`;
    } else if (state.paperType === 'english') {
      element('tagGrid').textContent = `${state.englishRows} 组四线三格`;
      element('tagCellSize').textContent = `组高 ${scene.english.groupHeight.toFixed(1)} · 间距 ${scene.english.gapHeight.toFixed(1)} mm`;
      element('tagWords').textContent = `${state.pageCount} 页`;
    } else {
      element('tagGrid').textContent = `${state.linedRows} 行横线`;
      element('tagCellSize').textContent = `行距 ${scene.lined.spacing.toFixed(1)} mm`;
      element('tagWords').textContent = `${state.pageCount} 页`;
    }
    element('layoutWarning').textContent = scene.warnings.join(' ');
    element('layoutWarning').hidden = !scene.warnings.length;
  }

  function renderPreview() {
    renderFrame = 0;
    if (!valid) return;
    const { pageCount, pngDpi, ...geometry } = state;
    const signature = JSON.stringify([geometry, currentPage]);
    if (signature !== lastGeometry) {
      lastScene = grid.buildScene(state, currentPage);
      element('svgContainer').innerHTML = grid.sceneToSvg(lastScene);
      lastGeometry = signature;
    }
    updateTags(lastScene);
    updateActions();
    if (fitMode) fitZoom();
    else applyZoom();
  }

  function scheduleRender() {
    if (!renderFrame) renderFrame = requestAnimationFrame(renderPreview);
  }

  function applyZoom() {
    if (!lastScene) return;
    const width = lastScene.paperWidth * 96 / 25.4;
    const height = lastScene.paperHeight * 96 / 25.4;
    element('paperSheet').style.width = `${width * zoom}px`;
    element('paperSheet').style.height = `${height * zoom}px`;
    element('svgContainer').style.transform = `scale(${zoom})`;
    element('zoomVal').textContent = `${Math.round(zoom * 100)}%`;
    element('zoomFit').setAttribute('aria-pressed', String(fitMode));
  }

  function fitZoom() {
    if (!lastScene) return;
    const viewport = element('paperViewport');
    if (!viewport.clientWidth || !viewport.clientHeight) return;
    zoom = Math.max(0.05, Math.min((viewport.clientWidth - 32) / (lastScene.paperWidth * 96 / 25.4), (viewport.clientHeight - 32) / (lastScene.paperHeight * 96 / 25.4), 1.25));
    applyZoom();
  }

  function manualZoom(delta) {
    fitMode = false;
    zoom = Math.max(0.05, Math.min(2.5, zoom + delta));
    applyZoom();
  }

  function refreshTemplates() {
    const select = element('savedTemplates');
    select.replaceChildren(new Option('选择已保存的模板', ''));
    templates.forEach((template, index) => select.add(new Option(template.name, String(index))));
    element('deleteTemplateBtn').disabled = true;
  }

  function persistTemplates(nextTemplates) {
    localStorage.setItem(templatesKey, JSON.stringify(nextTemplates));
    templates = nextTemplates;
    refreshTemplates();
  }

  async function importConfiguration(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error('配置文件不能超过 64 KB。');
      const candidate = grid.validateDocument(grid.parseConfiguration(await file.text()));
      acceptConfiguration(candidate, true);
      notify('配置已导入并保存。');
    } catch (error) {
      notify(`导入失败：${error.message} 原配置未改变。`, true);
    } finally {
      event.target.value = '';
    }
  }

  async function runExport(kind) {
    if (!valid || busy) return;
    const config = { ...state };
    const pageIndex = currentPage;
    let printWindow;
    if (kind === 'print') {
      printWindow = window.open('', '_blank');
      if (!printWindow) { notify('打印窗口被拦截，请允许弹窗后重试，或下载 PDF 后打印。', true); return; }
      printWindow.opener = null;
      printWindow.document.title = 'PaperGrid · 正在准备打印';
      printWindow.document.body.textContent = '正在生成 PDF，请稍候。打印时请选择“实际大小 / 100%”。';
    }
    busy = true;
    updateActions();
    notify('正在准备导出…');
    try {
      if (kind === 'pdf' || kind === 'print') {
        const documentPdf = await grid.createPdf(config, (completed, total) => notify(`正在生成 PDF：${completed} / ${total} 页`));
        if (kind === 'print') {
          if (printWindow.closed) throw new Error('打印窗口已关闭，请重试。');
          grid.openPrintPdf(documentPdf, printWindow);
        } else grid.downloadBlob(documentPdf.output('blob'), grid.filename(config, 'pdf'));
      } else if (kind === 'svg') await grid.exportSvg(config, pageIndex);
      else await grid.exportPng(config, pageIndex);
      notify(kind === 'print' ? '已打开打印 PDF；如未自动弹出，请在 PDF 窗口中打印，比例选择 100%。' : '已生成文件并发起下载。');
    } catch (error) {
      if (printWindow && !printWindow.closed) printWindow.close();
      notify(`导出失败：${error.message}`, true);
    } finally {
      busy = false;
      updateActions();
    }
  }

  function bindEvents() {
    for (const key of Object.keys(grid.defaults)) {
      const input = control(key);
      if (!input) continue;
      const eventName = input.tagName === 'SELECT' || input.type === 'checkbox' ? 'change' : 'input';
      input.addEventListener(eventName, () => {
        const accepted = acceptConfiguration(readForm());
        if (!accepted && !input.validity.valid) input.setAttribute('aria-invalid', 'true');
      });
    }
    document.querySelectorAll('.preset-card').forEach(button => button.addEventListener('click', () => {
      currentPage = 0;
      acceptConfiguration(grid.presets[button.dataset.preset], true);
    }));
    document.querySelectorAll('.color-pill').forEach(button => button.addEventListener('click', () => {
      element('lineColorPicker').value = button.dataset.color;
      acceptConfiguration(readForm());
    }));
    document.querySelectorAll('.bg-swatch').forEach(button => button.addEventListener('click', () => acceptConfiguration(readForm({ bgColor: button.dataset.bg }))));
    element('zoomIn').addEventListener('click', () => manualZoom(0.15));
    element('zoomOut').addEventListener('click', () => manualZoom(-0.15));
    element('zoomFit').addEventListener('click', () => { fitMode = true; fitZoom(); });
    element('paperViewport').addEventListener('wheel', event => {
      if (event.ctrlKey) { event.preventDefault(); manualZoom(event.deltaY < 0 ? 0.1 : -0.1); }
    }, { passive: false });
    element('previousPage').addEventListener('click', () => { currentPage = Math.max(0, currentPage - 1); scheduleRender(); });
    element('nextPage').addEventListener('click', () => { currentPage = Math.min(state.pageCount - 1, currentPage + 1); scheduleRender(); });
    for (const [identifier, kind] of [['topExportPdfBtn', 'pdf'], ['topPrintBtn', 'print'], ['topExportSvgBtn', 'svg'], ['topExportPngBtn', 'png']]) {
      element(identifier).addEventListener('click', () => runExport(kind));
    }
    element('exportConfigBtn').addEventListener('click', () => grid.downloadBlob(new Blob([grid.serializeConfiguration(state)], { type: 'application/json;charset=utf-8' }), 'PaperGrid配置.json'));
    element('importConfigFile').addEventListener('change', importConfiguration);
    element('importConfigBtn').addEventListener('click', () => element('importConfigFile').click());
    element('resetConfigBtn').addEventListener('click', () => {
      if (confirm('恢复默认配置？当前设置将被替换，已保存的自定义模板会保留。')) {
        currentPage = 0;
        acceptConfiguration(grid.defaults, true);
        notify('已恢复默认配置。');
      }
    });
    element('saveTemplateBtn').addEventListener('click', () => {
      const name = element('templateName').value.trim();
      if (!name || name.length > 30) { notify('请输入 1–30 个字符的模板名称。', true); return; }
      const existing = templates.findIndex(template => template.name === name);
      if (existing < 0 && templates.length >= 20) { notify('最多保存 20 个模板，请先删除不用的模板。', true); return; }
      if (existing >= 0 && !confirm(`覆盖模板“${name}”？`)) return;
      try {
        const next = templates.filter(template => template.name !== name);
        next.push({ name, config: { ...state } });
        persistTemplates(next);
        element('templateName').value = '';
        notify(`模板“${name}”已保存到此浏览器。`);
      } catch { notify('无法保存模板，请导出 JSON 备份。', true); }
    });
    element('savedTemplates').addEventListener('change', event => {
      const selected = event.target.value;
      element('deleteTemplateBtn').disabled = selected === '';
      if (selected !== '') acceptConfiguration(templates[Number(selected)].config, true);
    });
    element('deleteTemplateBtn').addEventListener('click', () => {
      const selected = element('savedTemplates').value;
      if (selected === '' || !confirm('删除选中的自定义模板？')) return;
      try { persistTemplates(templates.filter((template, index) => index !== Number(selected))); notify('模板已删除。'); }
      catch { notify('无法删除模板，请检查浏览器存储权限。', true); }
    });
    document.querySelectorAll('[data-workspace-view]').forEach(button => button.addEventListener('click', () => {
      document.body.dataset.view = button.dataset.workspaceView;
      document.querySelectorAll('[data-workspace-view]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
      if (fitMode) requestAnimationFrame(fitZoom);
    }));
    new ResizeObserver(() => { if (fitMode) fitZoom(); }).observe(element('paperViewport'));
    window.addEventListener('pagehide', flushSave);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });
  }

  function init() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) state = grid.validateDocument(grid.parseConfiguration(saved));
      element('saveStatus').textContent = saved ? '已恢复上次配置' : '调整后自动保存';
    } catch { notify('无法恢复上次配置，已使用默认模板。', true); }
    try {
      const saved = localStorage.getItem(templatesKey);
      if (saved && saved.length > 1310720) throw new Error('模板数据过大');
      const parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed) || parsed.length > 20) throw new Error('模板数据格式错误');
      templates = parsed.map(template => {
        if (!template || typeof template.name !== 'string' || !template.name.trim() || template.name.length > 30) throw new Error('模板名称错误');
        return { name: template.name, config: grid.validateDocument(template.config) };
      });
    } catch { notify('无法读取已保存模板，可通过 JSON 备份重新导入。', true); }
    refreshTemplates();
    bindEvents();
    syncForm();
    renderPreview();
  }

  init();
})(globalThis.PaperGrid);
