import { Gallery } from './Gallery';
import type { ContentBlock, ContentSection, InlineContent } from './drawerContent';
export const Arrow = () => <span className="arrow" aria-hidden="true" />;
export const Tag = ({ children }: { children: string }) => <span className="tag">{children}</span>;
export function ExternalButton({ href, children }: { href: string; children: string }) {
  return <a className="drawer-link" href={href} target="_blank" rel="noopener noreferrer">{children}<Arrow /></a>;
}
export function Media({ block }: { block: Extract<ContentBlock, { type: 'image' | 'video' }> }) {
  return <figure className="drawer-media">
    {block.type === 'image' ? <img src={block.src} alt={block.alt} loading="lazy" /> : <video src={block.src} poster={block.poster} controls preload="metadata" playsInline />}
    {block.caption && <figcaption>{block.caption}</figcaption>}
  </figure>;
}
function InlineText({ text }: { text: string | InlineContent[] }) {
  if (typeof text === 'string') return <>{text}</>;
  return <>{text.map((part, i) => typeof part === 'string' ? part : part.type === 'strong'
    ? <strong key={i}>{part.text}</strong>
    : <a key={i} className="drawer-inline-link" href={part.href} target="_blank" rel="noopener noreferrer" aria-label={`${part.text} (откроется в новой вкладке)`}>{part.text}<Arrow /></a>)}</>;
}
export function Blocks({ blocks }: { blocks: ContentBlock[] }) {
  return <>{blocks.map((block, i) => {
    if (block.type === 'paragraph') return <p key={i}><InlineText text={block.text} /></p>;
    if (block.type === 'list') return <ul key={i}>{block.items.map((text, j) => <li key={j}>{text}</li>)}</ul>;
    return <Media key={i} block={block} />;
  })}</>;
}
export function TextSection({ section }: { section: ContentSection }) {
  return <section className="drawer-section" aria-labelledby={`section-${section.id}`}>
    <h2 id={`section-${section.id}`}>{section.title}</h2>
    {section.period && <p className="drawer-period">{section.period}</p>}
    <Blocks blocks={section.blocks} />
    {section.gallery && <Gallery gallery={section.gallery} />}
  </section>;
}
