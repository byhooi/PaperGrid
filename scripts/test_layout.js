'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
for (const source of ['config.js', 'layout.js', 'render.js']) require(path.join(__dirname, '..', source));
const grid = globalThis.PaperGrid;
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} != ${expected}`);
const gapOptions = [
  { gapMode: 'fixed', gapHeightMm: 2 },
  { gapMode: 'fixed', gapHeightMm: 0 },
  { gapMode: 'fixed', gapHeightMm: 4 },
  { gapMode: 'ratio', gapRatio: 0 },
  { gapMode: 'ratio', gapRatio: 0.5 },
  { enableGap: false },
];
let cases = 0;
let rejected = 0;

for (const preset of ['primary-300', 'sample-400', 'english-four', 'lined-paper']) {
  for (const paperSize of Object.keys(grid.paperSpecs)) {
    for (const paperOrientation of ['p', 'l']) {
      for (const columnsCount of [1, 2]) {
        for (const header of [false, true]) {
          for (const gap of preset === 'primary-300' ? gapOptions : [{}]) {
            const config = {
              ...grid.presets[preset], ...gap, paperSize, paperOrientation, columnsCount,
              marginLeft: 13, marginRight: 21, marginBottom: 5, pageCount: 3,
              showHeaderInfo: header, showTitleLine: header, showPageNumber: true,
              gridHelperLine: 'mi', splitVerticalLines: true, englishSlantedGuides: true,
            };
            // 小纸张叠加页眉和大固定槽时，可能连 1 mm 格子也放不下。
            const paperHeight = grid.paperSpecs[paperSize][paperOrientation === 'p' ? 'height' : 'width'];
            const availableHeight = paperHeight - config.marginTop - config.marginBottom - (header ? 26 : 0) - 8;
            if (config.paperType === 'composition' && config.enableGap && config.gapMode === 'fixed' && availableHeight / config.rows - config.gapHeightMm < 1) {
              assert.throws(() => grid.validateDocument(config), /边长不足/);
              rejected++;
              continue;
            }
            grid.validateDocument(config);
            for (const pageIndex of [0, 2]) {
              const scene = grid.buildScene(config, pageIndex);
              const spec = grid.paperSpecs[paperSize];
              close(scene.paperWidth, paperOrientation === 'p' ? spec.width : spec.height);
              close(scene.paperHeight, paperOrientation === 'p' ? spec.height : spec.width);
              for (const [index, column] of scene.columns.entries()) {
                const slotLeft = config.marginLeft + index * (scene.columnWidth + scene.columnGap);
                close(column.left - slotLeft, slotLeft + scene.columnWidth - column.left - column.width);
                close(column.top - scene.contentTop, scene.contentTop + scene.contentHeight - column.top - column.height);
                assert.ok(column.width <= scene.columnWidth + 0.000001);
                assert.ok(column.height <= scene.contentHeight + 0.000001);
                if (config.paperType === 'composition') {
                  close(scene.cellWidth, scene.cellHeight);
                  close(column.width, config.cols * scene.cellWidth);
                  close(column.height, config.rows * (scene.cellHeight + scene.gapHeight));
                  const expectedGap = !config.enableGap ? 0 : config.gapMode === 'fixed' ? config.gapHeightMm : scene.cellHeight * config.gapRatio;
                  close(scene.gapHeight, expectedGap);
                  assert.ok(Math.abs(column.width - scene.columnWidth) < 0.000001 || Math.abs(column.height - scene.contentHeight) < 0.000001);
                } else if (config.paperType === 'english') {
                  close(scene.english.groupHeight / scene.english.gapHeight, config.englishGroupHeight / config.englishGapHeight);
                } else {
                  close(scene.lined.spacing, scene.contentHeight / config.linedRows);
                }
              }
              if (columnsCount === 2) {
                const fold = scene.shapes.find(shape => shape.type === 'line' && shape.dash.join(',') === '2,3');
                const center = config.marginLeft + (scene.paperWidth - config.marginLeft - config.marginRight) / 2;
                close(fold.startX, center);
                close(fold.endX, center);
              }
              for (const shape of scene.shapes) {
                if (shape.type === 'line') {
                  for (const x of [shape.startX, shape.endX]) assert.ok(x >= 0 && x <= scene.paperWidth + 0.000001);
                  for (const y of [shape.startY, shape.endY]) assert.ok(y >= 0 && y <= scene.paperHeight + 0.000001);
                } else if (shape.type === 'text') {
                  assert.ok(shape.left >= 0 && shape.left <= scene.paperWidth);
                  assert.ok(shape.baseline > 0 && shape.baseline < scene.paperHeight);
                  if (pageIndex > 0) assert.ok(!/姓名|Name:|题目|Title:/.test(shape.value));
                }
              }
              const svg = grid.sceneToSvg(scene);
              assert.ok(svg.includes(`width="${scene.paperWidth}mm" height="${scene.paperHeight}mm" viewBox="0 0 ${scene.paperWidth} ${scene.paperHeight}"`));
              assert.ok(!svg.includes('NaN'));
              cases++;
            }
          }
        }
      }
    }
  }
}

// 400 字竖版使用适中的比例槽高，不靠拉伸方格强行铺满。
const sample400 = grid.presets['sample-400'];
assert.equal(sample400.cols, 20);
assert.equal(sample400.rows, 20);
assert.equal(sample400.gapMode, 'ratio');
close(sample400.gapRatio, 0.3);
const portrait400 = grid.computeLayout(sample400);
close(portrait400.cellWidth, 9.1);
close(portrait400.cellHeight, 9.1);
close(portrait400.gapHeight, 2.73);
close(portrait400.columns[0].top, 30.2);
const fixed400 = grid.computeLayout({ ...sample400, gapMode: 'fixed' });
close(fixed400.gapHeight, 1.8);
assert.ok(portrait400.columns[0].top < fixed400.columns[0].top);

// 非适配模式保留原尺寸；方向切换不自动改行列数。
for (const paperOrientation of ['p', 'l']) {
  const composition = grid.computeLayout({ ...grid.defaults, paperOrientation, cols: 25, rows: 5, fillVerticalHeight: false });
  close(composition.cellWidth, composition.columnWidth / 25);
  close(composition.cellHeight, composition.cellWidth);
  close(composition.gapHeight, 2);
  const english = grid.computeLayout({ ...grid.presets['english-four'], paperOrientation, englishRows: 5, englishFillVertical: false });
  close(english.english.groupHeight, 9);
  close(english.english.gapHeight, 5);
  const lined = grid.computeLayout({ ...grid.presets['lined-paper'], paperOrientation, linedRows: 5, linedFillVertical: false });
  close(lined.lined.spacing, 9.5);
}

// 超高建议使用当前毫米尺寸，英语末组不额外计入组间距。
for (const [input, unit, expected] of [
  [{ ...grid.defaults, fillVerticalHeight: false }, '行', 9],
  [{ ...grid.presets['english-four'], englishFillVertical: false }, '组', 13],
  [{ ...grid.presets['lined-paper'], linedFillVertical: false }, '行', 18],
]) {
  const config = { ...input, paperOrientation: 'l' };
  assert.throws(() => grid.validateDocument(config), new RegExp(`减少至 ${expected} ${unit}以内`));
  const key = config.paperType === 'composition' ? 'rows' : config.paperType === 'english' ? 'englishRows' : 'linedRows';
  grid.validateDocument({ ...config, [key]: expected });
  assert.throws(() => grid.validateDocument({ ...config, [key]: expected + 1 }));
}
assert.throws(() => grid.computeLayout({ paperType: 'english', paperSize: 'a5', paperOrientation: 'l', marginTop: 40, marginBottom: 40, englishGroupHeight: 25, englishGapHeight: 20, englishFillVertical: false }), /最多可放 1 组，.*最少 5 组/);
assert.throws(() => grid.computeLayout({ paperSize: 'a5', paperOrientation: 'l', gapHeightMm: 15 }), /边长不足/);

// 横版推荐保留字数，首尾页的字数跨栏连续，行末标记跟随实际内容边界。
for (const [cols, rows, words] of [[25, 12, 300], [25, 16, 400]]) {
  for (const countStep of ['100', 'row']) {
    const config = { ...grid.defaults, cols, rows, paperOrientation: 'l', columnsCount: 2, pageCount: 3, showHeaderInfo: true, showTitleLine: true, countStep };
    assert.equal(cols * rows, words);
    for (const pageIndex of [0, 2]) {
      const scene = grid.buildScene(config, pageIndex);
      const counts = scene.shapes.filter(shape => shape.type === 'text' && /^\d+$/.test(shape.value));
      assert.equal(Number(counts.at(-1).value), (pageIndex + 1) * 2 * words);
      assert.equal(Number(counts[0].value), pageIndex * 2 * words + (countStep === 'row' ? cols : 100));
      if (countStep === 'row') {
        counts.forEach((shape, index) => {
          const column = scene.columns[Math.floor(index / rows)];
          close(shape.left, column.left + column.width - 1.2);
        });
      }
    }
  }
}

// JSON 字段及旧配置兼容性保持不变。
assert.deepEqual(grid.parseConfiguration(grid.serializeConfiguration(grid.defaults)), grid.defaults);
assert.equal(grid.parseConfiguration('{"gapRatio":0.3}').gapMode, 'ratio');
for (const input of ['{"version":2,"config":{}}', '{"unknown":true}', '{"lineColor":"bad"}', '{"pageCount":-1}', '{']) {
  assert.throws(() => grid.parseConfiguration(input));
}
assert.equal(rejected, 2);
console.log(`布局回归通过：${cases} 种有效页面组合、${rejected} 种无法排版配置，以及固定尺寸、超高恢复、跨页字数和配置兼容检查。`);
