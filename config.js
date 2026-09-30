(function (grid) {
  'use strict';

  const paperSpecs = {
    a4: { width: 210, height: 297, name: 'A4' },
    a3: { width: 297, height: 420, name: 'A3' },
    b5: { width: 176, height: 250, name: 'B5' },
    b4: { width: 250, height: 353, name: 'B4' },
    a5: { width: 148, height: 210, name: 'A5' },
  };
  const defaults = {
    paperType: 'composition', paperSize: 'a4', paperOrientation: 'p', columnsCount: 1, pageCount: 1,
    marginTop: 12, marginRight: 12, marginBottom: 12, marginLeft: 12,
    cols: 15, rows: 20, enableGap: true, gapMode: 'fixed', gapHeightMm: 2, gapRatio: 0.18,
    fillVerticalHeight: true, gridHelperLine: 'none', splitVerticalLines: false, showWordCount: true, countStep: '100',
    englishGroupHeight: 9, englishGapHeight: 5, englishRows: 14, englishMidLineStyle: 'same',
    englishFillVertical: true, englishSlantedGuides: false,
    linedSpacing: 9.5, linedStyle: 'solid', linedRows: 25, linedFillVertical: true, linedMarginLine: false,
    lineColor: '#2c3038', bgColor: '#ffffff', outerLineWidth: 0.35, innerLineWidth: 0.15,
    showHeaderInfo: false, showTitleLine: false, showPageNumber: false, pngDpi: 300,
  };
  const presets = {
    'primary-300': { ...defaults },
    'sample-400': { ...defaults, marginTop: 14, marginRight: 14, marginBottom: 14, marginLeft: 14, cols: 20, gapMode: 'ratio', gapHeightMm: 1.8, gapRatio: 0.3 },
    'english-four': { ...defaults, paperType: 'english', marginTop: 15, marginRight: 15, marginBottom: 15, marginLeft: 15, innerLineWidth: 0.18 },
    'lined-paper': { ...defaults, paperType: 'lined', marginTop: 15, marginRight: 15, marginBottom: 15, marginLeft: 15, innerLineWidth: 0.18 },
  };
  const numericRules = {
    columnsCount: [1, 2, true, '分栏数'], pageCount: [1, 20, true, '页数'],
    marginTop: [5, 40, false, '上边距'], marginRight: [5, 40, false, '右边距'],
    marginBottom: [5, 40, false, '下边距'], marginLeft: [5, 40, false, '左边距'],
    cols: [5, 35, true, '列数'], rows: [5, 40, true, '行数'],
    gapHeightMm: [0, 15, false, '固定槽高'], gapRatio: [0, 0.5, false, '槽高比例'],
    englishGroupHeight: [4, 25, false, '四线三格高度'], englishGapHeight: [2, 20, false, '组间距'],
    englishRows: [5, 30, true, '四线三格组数'], linedSpacing: [5, 30, false, '横线间距'],
    linedRows: [5, 50, true, '横线行数'], outerLineWidth: [0.1, 1.5, false, '外框线宽'],
    innerLineWidth: [0.05, 0.8, false, '内部线宽'],
  };
  const enumRules = {
    paperType: ['composition', 'english', 'lined'], paperSize: Object.keys(paperSpecs),
    paperOrientation: ['p', 'l'], gapMode: ['fixed', 'ratio'], gridHelperLine: ['none', 'tian', 'mi'],
    countStep: ['50', '100', '200', 'row'], englishMidLineStyle: ['same', 'red', 'solid'],
    linedStyle: ['solid', 'dashed', 'dotted'], pngDpi: [150, 300],
  };

  function validateConfig(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('配置必须是 JSON 对象。');
    for (const key of Object.keys(input)) {
      if (!Object.hasOwn(defaults, key)) throw new Error(`不支持的配置字段：${key}`);
    }
    const config = { ...defaults, ...input };
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (typeof config[key] !== typeof defaultValue) throw new Error(`配置字段 ${key} 的类型不正确。`);
      if (numericRules[key]) {
        const [minimum, maximum, integer, label] = numericRules[key];
        if (!Number.isFinite(config[key]) || config[key] < minimum || config[key] > maximum || (integer && !Number.isInteger(config[key]))) {
          throw new Error(`${label}须为 ${minimum}–${maximum} 之间的${integer ? '整数' : '数值'}。`);
        }
      }
      if (enumRules[key] && !enumRules[key].includes(config[key])) throw new Error(`配置字段 ${key} 的选项不受支持。`);
    }
    for (const key of ['lineColor', 'bgColor']) {
      if (!/^#[a-f\d]{6}$/i.test(config[key])) throw new Error('颜色须为 #RRGGBB 格式。');
      config[key] = config[key].toLowerCase();
    }
    return config;
  }

  function parseConfiguration(text) {
    if (typeof text !== 'string' || text.length > 65536) throw new Error('配置文件不能超过 64 KB。');
    let imported;
    try { imported = JSON.parse(text); } catch { throw new Error('配置文件不是有效的 JSON。'); }
    if (!imported || typeof imported !== 'object' || Array.isArray(imported)) throw new Error('配置必须是 JSON 对象。');
    let config = imported;
    if (Object.hasOwn(imported, 'version')) {
      if (imported.version !== 1 || Object.keys(imported).some(key => !['version', 'config'].includes(key))) throw new Error('不支持此配置版本，请使用版本 1。');
      config = imported.config;
    } else if (Object.hasOwn(imported, 'gapRatio') && !Object.hasOwn(imported, 'gapMode')) {
      config = { ...imported, gapMode: 'ratio' };
    }
    return validateConfig(config);
  }

  function serializeConfiguration(config) {
    return JSON.stringify({ version: 1, config: validateConfig(config) }, null, 2);
  }

  Object.assign(grid, { paperSpecs, defaults, presets, numericRules, validateConfig, parseConfiguration, serializeConfiguration });
})(globalThis.PaperGrid ||= {});
