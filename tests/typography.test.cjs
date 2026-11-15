const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../src/typography.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const formatterModule = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, formatterModule, formatterModule.exports);
const { russianTypography: format } = formatterModule.exports;

test('service-word chains, punctuation, compound prepositions and line boundaries', () => {
  assert.equal(format('А не на сайте, а в работе. Из-за погоды и проектов'), 'А\u00a0не\u00a0на\u00a0сайте, а\u00a0в\u00a0работе. Из\u2011за\u00a0погоды и\u00a0проектов');
  assert.equal(format('в\nработе'), 'в\nработе');
  assert.equal(format('команда и проекты'), 'команда и\u00a0проекты');
});
test('hyphenated Cyrillic and mixed Latin words stay whole; punctuation dashes remain distinct', () => {
  assert.equal(format('по-хорошему как-то B2B-продукты всё-таки'), 'по\u2011хорошему как\u2011то B2B\u2011продукты всё\u2011таки');
  assert.equal(format('2024-2026 — опыт, дизайн - работа'), '2024–2026 — опыт, дизайн\u00a0— работа');
});
test('number-unit groups, initials and quotes', () => {
  assert.equal(format('6 лет, 16 px, 100 %, А. С. Пушкин, "Россия"'), '6\u00a0лет, 16\u00a0px, 100\u00a0%, А.\u00a0С.\u00a0Пушкин, «Россия»');
});
test('URLs, file paths, mail and technical identifiers remain byte-for-byte intact', () => {
  const technical = 'https://example.com/по-хорошему?q=6%20лет ./src/my-file.ts red_mad_robot user-name@example.com C:\\src\\my-file.ts';
  assert.equal(format(technical), technical);
});
test('formatting is idempotent, preserves ordinary spaces and does not guess spelling', () => {
  const input = 'Портфолио в работе — все проекты, 6 лет, всё-таки «Россия»';
  assert.equal(format(format(input)), format(input));
  assert.equal(format('сложные продуктовые системы'), 'сложные продуктовые системы');
  assert.equal(format('все проекты'), 'все проекты');
});

test('a service word binds to a protected technical token without modifying that token', () => {
  assert.equal(format('В red_mad_robot и на https://example.com/my-page'), 'В\u00a0red_mad_robot и\u00a0на\u00a0https://example.com/my-page');
});

test('paragraph endings omit only the last full stop and retain other punctuation', () => {
  const trim = formatterModule.exports.removeParagraphFinalPeriod;
  assert.equal(trim('Одно предложение.'), 'Одно предложение');
  assert.equal(trim('Первое. Второе. Третье.'), 'Первое. Второе. Третье');
  assert.equal(trim('Текст «Пример.»'), 'Текст «Пример»');
  assert.equal(trim('Продолжение...'), 'Продолжение...');
  assert.equal(trim('Вопрос?'), 'Вопрос?');
  assert.equal(trim('https://example.com/file.png'), 'https://example.com/file.png');
  assert.equal(trim(trim('Первое. Последнее.')), 'Первое. Последнее');
});
