const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/galleries.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const result = { exports: {} };
new Function('module','exports',compiled)(result,result.exports);
const seen = new Set();
for (const gallery of Object.values(result.exports.projectGalleries)) {
  test(`Gallery assets and original aspect ratios: ${gallery.title}`, () => {
    assert.ok(gallery.images.length);
    for (const image of gallery.images) {
      assert.ok(image.alt.trim());
      assert.ok(!seen.has(image.src), `duplicate ${image.src}`);seen.add(image.src);
      assert.ok(!image.src.includes('ornament'), 'ornaments are intentionally excluded');
      const original = fs.readFileSync(path.join(__dirname, '../public', image.src));
      assert.equal(original.toString('hex',0,8),'89504e470d0a1a0a');
      assert.equal(original.readUInt32BE(16),image.width,image.src);
      assert.equal(original.readUInt32BE(20),image.height,image.src);
      const thumbnail = fs.readFileSync(path.join(__dirname, '../public', image.thumbnail));
      assert.equal(thumbnail.toString('hex',0,2),'ffd8');
    }
  });
}
