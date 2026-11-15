import { useLayoutEffect, type RefObject } from 'react';

const NBSP = '\u00a0';
const NON_BREAKING_HYPHEN = '\u2011';
const serviceWords = 'а|и|в|во|с|со|к|ко|у|о|об|обо|но|на|за|по|не|ни|же|бы|б|ли|ль|да|до|от|ото|из|из-за|из-под|без|для|при|про|под|над|перед|через|меж|между|или|либо|то|как|что|чтоб|чтобы|уж|ведь';
const servicePattern = serviceWords.replace(/-/g, '[-\\u2011]');
const glueServiceWord = new RegExp(`(^|[^\\p{L}\\p{N}_\\u2011-])(${servicePattern})([ \\t]+)(?=[\\p{L}\\p{N}«„“"(])`, 'giu');
const trailingServiceWord = new RegExp(`(^|[^\\p{L}\\p{N}_\\u2011-])(${servicePattern})[ \\t]+$`, 'iu');
const units = 'лет|год|года|мес\\.?|месяц|месяца|месяцев|дней|дня|день|час|часа|часов|мин\\.?|сек\\.?|с|мс|px|pt|rem|em|vh|vw|кг|г|мг|км|см|мм|м|л|мл|руб\\.?|₽|%|°[CFС]?';
const numberUnit = new RegExp(`(\\d)[ \\t]+(${units})(?![\\p{L}\\p{N}_])`, 'giu');
// Protect whole technical tokens before processing prose. No attributes or HTML are parsed.
const technicalToken = /(?:https?:\/\/|ftp:\/\/|mailto:|www\.)[^\s<>]+|(?:\.{0,2}\/|[A-Za-z]:\\)[^\s<>]+|[\p{L}\p{N}.-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}|[\p{L}\p{N}]+(?:_[\p{L}\p{N}]+)+|[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+|[\p{L}\p{N}_-]+[=:][^\s<>]+/gu;

function proseTypography(text: string): string {
  let result = text
    .replace(/\u00ad/g, '') // Explicit soft hyphens must not override the no-hyphenation rule.
    .replace(/"([^"\n]+)"/g, '«$1»')
    .replace(/“([^”\n]+)”/g, '«$1»')
    .replace(/(\d)[ \t]*[-–][ \t]*(?=\d)/g, '$1–')
    .replace(/(\S)[ \t]+-[ \t]+(?=\S)/g, `$1${NBSP}— `)
    .replace(/(?<=\p{L})-(?=\p{L})/gu, NON_BREAKING_HYPHEN)
    .replace(/(?<=\p{N})-(?=\p{L})/gu, NON_BREAKING_HYPHEN)
    .replace(numberUnit, `$1${NBSP}$2`)
    .replace(/(?<!\p{L})([А-ЯЁ])\.[ \t]+(?=[А-ЯЁ])/gu, `$1.${NBSP}`)
    .replace(/([А-ЯЁ][а-яё]+)[ \t]+(?=[А-ЯЁ]\.)/gu, `$1${NBSP}`);
  // Repeated matches handle adjacent service words, e.g. «а не на сайте».
  let previous: string;
  do { previous = result; result = result.replace(glueServiceWord, `$1$2${NBSP}`); } while (result !== previous);
  return result;
}

/** Idempotent Russian prose typography. URLs, file paths and identifiers stay verbatim.
 * Ambiguous spelling (е/ё), meaning and final punctuation remain editorial decisions. */
export function russianTypography(text: string): string {
  let result = '', cursor = 0;
  technicalToken.lastIndex = 0;
  for (const match of text.matchAll(technicalToken)) {
    let prose = proseTypography(text.slice(cursor, match.index));
    // Keep a preceding service word attached to a protected URL/identifier too.
    if (trailingServiceWord.test(prose)) prose = prose.replace(/[ \t]+$/, NBSP);
    result += prose + match[0];
    cursor = match.index! + match[0].length;
  }
  return result + proseTypography(text.slice(cursor));
}

/** Remove only the paragraph's final full stop; preserve internal punctuation,
 * ellipses, question/exclamation marks and protected technical tokens. */
export function removeParagraphFinalPeriod(text: string): string {
  const ending = /(?<!\.)\.(?=[»”"')\]]*\s*$)/u.exec(text);
  if (!ending) return text;
  technicalToken.lastIndex = 0;
  for (const token of text.matchAll(technicalToken)) {
    if (ending.index >= token.index! && ending.index < token.index! + token[0].length) return text;
  }
  return text.slice(0, ending.index) + text.slice(ending.index + 1);
}

const excluded = 'script,style,pre,code,kbd,samp,textarea,input,select,option,[contenteditable],[data-typography="off"]';
function isExcluded(node: Text): boolean { return !!node.parentElement?.closest(excluded); }
function isInline(element: Element): boolean {
  return /^(inline|contents)/.test(getComputedStyle(element).display) && element.tagName !== 'BR';
}
// Bind a trailing preposition to a following inline element, without crossing a block or <br>.
function hasInlineContinuation(node: Node, root: Element): boolean {
  let current: Node | null = node;
  while (current && current !== root) {
    let next = current.nextSibling;
    while (next) {
      if (next.nodeType === Node.TEXT_NODE && next.textContent?.trim()) return true;
      if (next instanceof Element) {
        if (next.matches(excluded) || !isInline(next)) return false;
        if (next.textContent?.trim()) return true;
      }
      next = next.nextSibling;
    }
    current = current.parentNode;
    if (current instanceof Element && !isInline(current)) return false;
  }
  return false;
}

/** Covers current and future text nodes, including async React renders.
 * Inputs, editable content, code and opt-out subtrees are never rewritten. */
export function installTypography(root: Element): () => void {
  const update = (node: Text) => {
    if (isExcluded(node)) return;
    let next = russianTypography(node.data);
    if (trailingServiceWord.test(next) && hasInlineContinuation(node, root)) {
      next = next.replace(/[ \t]+$/, NBSP);
    }
    if (next !== node.data) node.data = next;
  };
  const paragraphSelector = 'p,li,figcaption,h1,h2,h3,h4,h5,h6,.caption,.tag,.gallery-caption,.viewer-description';
  const trimParagraph = (element: Element) => {
    const text = element.textContent || '';
    const trimmed = removeParagraphFinalPeriod(text);
    if (text === trimmed) return;
    let index = 0;
    while (text[index] === trimmed[index]) index++;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (index < node.length) {
        if (!isExcluded(node)) node.deleteData(index, 1);
        return;
      }
      index -= node.length;
    }
  };
  const trimParagraphs = (node: Node) => {
    const element = node instanceof Element ? node : node.parentElement;
    if (!element) return;
    const enclosing = element.closest(paragraphSelector);
    if (enclosing) trimParagraph(enclosing);
    element.querySelectorAll(paragraphSelector).forEach(trimParagraph);
  };
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { update(node as Text);trimParagraphs(node);return; }
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) update(walker.currentNode as Text);
    trimParagraphs(node);
  };
  visit(root);
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') { update(mutation.target as Text);trimParagraphs(mutation.target); }
      else {
        mutation.addedNodes.forEach(visit);
        // Inline additions may complete a preceding short word.
        visit(mutation.target);
      }
    }
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true });
  return () => observer.disconnect();
}

export function useRussianTypography(root: RefObject<HTMLElement>): void {
  useLayoutEffect(() => root.current ? installTypography(root.current) : undefined, [root]);
}
