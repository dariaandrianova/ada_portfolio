import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { DrawerContent } from './drawerContent';
import { Blocks, ExternalButton, Tag, TextSection } from './content';
import { useRussianTypography } from './typography';
import './drawer.css';
import { Gallery } from './Gallery';

export function Drawer({ content, opener, onClosed, children }: { content: DrawerContent; opener: HTMLElement | null; onClosed: () => void; children?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const mounted = useRef(false);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;
  const closing = useRef(false);
  useRussianTypography(dialog);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    // Reverse from the CURRENT compositor position, even during entry.
    // Unmount only after both the panel and overlay have reached their exit frame.
    const exits: Promise<Animation>[] = [];
    for (const animation of animations.current) {
      if (animation.currentTime === null || animation.currentTime === 0) animation.cancel();
      else { animation.reverse();exits.push(animation.finished); }
    }
    Promise.all(exits).then(() => {
      if (mounted.current) onClosedRef.current();
    }).catch(() => { /* Cancellation during unmount is expected. */ });
  }, []);
  useLayoutEffect(() => {
    const element = dialog.current!;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    mounted.current = true;
    closing.current = false;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const offscreen = matchMedia('(max-width: 759px)').matches ? 'translate3d(0,100%,0)' : 'translate3d(100%,0,0)';
    const timing: KeyframeAnimationOptions = { duration: reducedMotion.matches ? 0 : 550, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'both' };
    // Start before the first paint; no React frame hand-off or initial visible flash.
    animations.current = [
      panel.current!.animate([{ transform: offscreen }, { transform: 'translate3d(0,0,0)' }], timing),
      shade.current!.animate([{ opacity: 0 }, { opacity: 1 }], timing),
    ];
    const finishForReducedMotion = () => { if (reducedMotion.matches) animations.current.forEach(animation => animation.finish()); };
    reducedMotion.addEventListener('change', finishForReducedMotion);
    return () => {
      mounted.current = false;
      reducedMotion.removeEventListener('change', finishForReducedMotion);
      animations.current.forEach(animation => animation.cancel());
      animations.current = [];
      element.close();
      document.body.style.overflow = oldOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, [opener]);
  return <dialog ref={dialog} className={`drawer${content.variant === 'case' ? ' drawer--case' : ''}`} role="dialog" aria-modal="true" aria-label={content.title}
    onCancel={event => { event.preventDefault();close(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.current!.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(element => element.getClientRects().length > 0);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault();last?.focus({ preventScroll: true }); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault();first?.focus({ preventScroll: true }); }
    }}
    onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div ref={shade} className="drawer-shade" aria-hidden="true" onClick={close} />
    <div ref={panel} className="drawer-panel">
      <div className={`drawer-toolbar${scrolled ? ' is-scrolled' : ''}`}><h1 className="drawer-mobile-title">{content.title}</h1><button ref={closeButton} className="drawer-close" type="button" aria-label="Закрыть шторку" onClick={close}><span aria-hidden="true" /></button></div>
      <div className="drawer-scroll" onScroll={event => setScrolled(event.currentTarget.scrollTop > 4)} tabIndex={0} aria-label="Содержимое шторки">
        <header className="drawer-heading">
          <h1 className="drawer-desktop-title" id={`drawer-title-${content.id}`}>{content.title}</h1>
          {content.period && <p className="drawer-period">{content.period}</p>}
          {content.role && <p className="drawer-role">{content.role}</p>}
          {content.subtitle && <p className="drawer-subtitle">{content.subtitle}</p>}
          {content.tags && <div className="drawer-tags" aria-label="Специализация">{content.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}</div>}
        </header>
        <div className="drawer-body">{children ?? <Blocks blocks={content.blocks} />}</div>
        {content.links && <div className="drawer-links">{content.links.map(link => <ExternalButton key={link.href} href={link.href}>{link.label}</ExternalButton>)}</div>}
        {content.responsibilities && <section className="drawer-duties" aria-label="Основные обязанности">
          <h2>Основные обязанности</h2>
          <ul className="drawer-responsibilities">{content.responsibilities.map((item, index) => <li key={item}><span>{item}</span>{index < content.responsibilities!.length-1 && <span className="responsibility-separator" aria-hidden="true"> | </span>}</li>)}</ul>
        </section>}
        {content.gallery && <Gallery gallery={content.gallery} />}
        {content.sections?.map(section => <TextSection key={section.id} section={section} />)}
      </div>
    </div>
  </dialog>;
}
