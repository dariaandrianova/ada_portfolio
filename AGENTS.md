# Permanent typography rules

The complete user requirements are in `TYPOGRAPHY.md`; follow them for all subsequent edits.

Apply these to every existing/new text component on this portfolio.

- Keep the global `useRussianTypography` root hook in place. Its observer covers newly rendered text nodes; reuse `russianTypography` for prose generated outside that root.
- Bind short Russian prepositions, conjunctions and particles to the following word with NBSP. Bind numbers/units and initials/surnames. Do not replace every space.
- Keep hyphenated prose words unbroken with U+2011; preserve their spelling. Never auto-hyphenate or split ordinary words. Keep CSS `hyphens:none`, `word-break:normal`, `overflow-wrap:normal`.
- Preserve semantic groups, avoid dangling short heading endings, and use manual <br> only when justified by the Figma composition.
- Local Unbounded for headings/accents and Manrope for body/supporting text; preserve the Figma metrics. Existing SVG labels preserve unavailable original Figma font outlines.
- Russian quotes «», correct ё where required, em dash for punctuation, en dash for ranges. Review ambiguous spelling semantically; never blanket-replace е with ё. Keep the page's no-final-period caption style.
- Process only prose text nodes, never markup, attributes, URLs, paths, identifiers, code or user input. Use `data-typography="off"` for technical subtrees and `.technical-text` only when a long URL needs wrapping.
- The formatter must stay idempotent. Test mixed prose/technical tokens, service-word chains, hyphens, ranges, numbers/units and initials when changing its logic.
- Check desktop, tablet and mobile widths for clipping, overlaps, dangling words and unexpected line breaks. Retain the one-screen, no-scroll layout.

- Always omit the final full stop of every prose paragraph (including one-sentence paragraphs). Keep full stops between sentences. `removeParagraphFinalPeriod` handles text-node endings even inside inline emphasis; do not change URLs, filenames, code, ellipses or question/exclamation marks.
