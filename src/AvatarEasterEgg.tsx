import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRussianTypography } from './typography';
import './avatar-easter-egg.css';

export function AvatarEasterEgg() {
  const button = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, tipLeft: 0, tipTop: 0 });
  const animation = useRef<{ target: (real: boolean, instant?: boolean) => void } | null>(null);
  const revealed = open || hovered || focused;
  const immediate = useRef(false);
  useRussianTypography(overlay);

  useEffect(() => {
    const element = canvas.current!;
    const context = element.getContext('2d');
    if (!context) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover:hover) and (pointer:fine)');
    const image = new Image();image.src = './assets/real.jpg';
    let disposed = false, loaded = false, frame = 0, progress = 0, goal = 0, last = 0;
    const size = element.clientWidth;
    const ratio = Math.min(devicePixelRatio || 1, 3);
    element.width = Math.round(size * ratio);element.height = Math.round(size * ratio);
    context.scale(ratio, ratio);
    // Fixed diagonal ordering with deterministic jitter; reversal uses the same cells.
    const count = Math.ceil(size / 5);
    const cells = Array.from({ length: count * count }, (_, index) => {
      const x = index % count, y = Math.floor(index / count);
      const noise = ((index * 73 + 19) % 101) / 101;
      return { x, y, order: (x + y + (noise - .5) * 2.4) / (2 * count) };
    }).sort((a,b) => a.order - b.order);
    const paint = () => {
      context.clearRect(0,0,size,size);
      element.dataset.progress = progress.toFixed(3);
      if (!loaded || progress === 0) return;
      // Static cover crop centered on the face in the supplied portrait.
      const crop = Math.min(image.naturalWidth,image.naturalHeight) / 1.5;
      const sx = Math.max(0, Math.min(image.naturalWidth-crop,image.naturalWidth*.4-crop/2));
      const sy = Math.max(0, Math.min(image.naturalHeight-crop,image.naturalHeight*.4-crop/2));
      context.save();context.beginPath();
      cells.slice(0,Math.ceil(progress*cells.length)).forEach(cell => context.rect(cell.x*5,cell.y*5,5,5));
      context.clip();context.drawImage(image,sx,sy,crop,crop,0,0,size,size);context.restore();
    };
    const tick = (now: number) => {
      frame = 0;
      const elapsed = Math.min(now-last,64);last = now;
      progress = goal > progress ? Math.min(goal,progress+elapsed/560) : Math.max(goal,progress-elapsed/560);
      paint();
      if (progress !== goal) frame = requestAnimationFrame(tick);
    };
    const target = (real: boolean, instant = false) => {
      goal = real ? 1 : 0;
      if (reduced.matches || !fine.matches || instant) {
        cancelAnimationFrame(frame);frame = 0;progress = goal;paint();
      } else if (!frame && progress !== goal) { last = performance.now();frame = requestAnimationFrame(tick); }
    };
    animation.current = { target };
    image.decode().then(() => { if (!disposed) { loaded = true;paint(); } }).catch(() => { /* Original avatar remains visible if the photo fails. */ });
    const motionChange = () => target(goal === 1);
    reduced.addEventListener('change',motionChange);fine.addEventListener('change',motionChange);
    return () => { disposed = true;cancelAnimationFrame(frame);animation.current = null;reduced.removeEventListener('change',motionChange);fine.removeEventListener('change',motionChange); };
  }, []);

  useEffect(() => { animation.current?.target(revealed,immediate.current);immediate.current = false; }, [revealed]);
  useLayoutEffect(() => {
    if (!hovered && !focused && !open) return;
    const place = () => {
      const rect = button.current!.getBoundingClientRect();
      const width = Math.min(300,window.innerWidth-32);
      const height = panel.current?.offsetHeight ?? 240;
      setPosition({
        left: Math.max(16,Math.min(rect.left,window.innerWidth-width-16)),
        top: Math.max(16,Math.min(rect.bottom+12,window.innerHeight-height-16)),
        tipLeft: Math.max(16,Math.min(rect.right+8,window.innerWidth-156)),
        tipTop: rect.bottom+8,
      });
    };
    place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
    return () => { window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true); };
  }, [hovered,focused,open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !button.current?.contains(event.target) && !panel.current?.contains(event.target)) { setFocused(false);setOpen(false); }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault();event.stopPropagation();setOpen(false);button.current?.focus({preventScroll:true});setFocused(false); }
    };
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);
    return () => { document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true); };
  }, [open]);

  return <>
    <button ref={button} type="button" className="header-portrait-ring avatar-easter-egg" aria-label="А вот и настоящая я — пасхалка" aria-expanded={open} aria-controls="avatar-fact" aria-haspopup="dialog"
      onPointerEnter={event => { if (event.pointerType === 'mouse' || event.pointerType === 'pen') setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={event => { immediate.current = event.pointerType === 'touch'; }}
      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setFocused(true); }}
      onBlur={() => setFocused(false)}
      onClick={event => { immediate.current = immediate.current || (event.detail > 0 && !matchMedia('(hover:hover) and (pointer:fine)').matches);setOpen(value => !value); }}>
      <span className="header-portrait"><img src="./assets/avatar.png" alt="" aria-hidden="true" /><canvas ref={canvas} role="img" aria-label={revealed ? 'Настоящая фотография Дарьи Андриановой' : 'Стилизованный аватар Дарьи Андриановой'} /></span>
    </button>
    {createPortal(<div ref={overlay} className="avatar-easter-overlay">
      <span className={`avatar-easter-tip${(hovered || focused) && !open ? ' is-visible' : ''}`} style={{left:position.tipLeft,top:position.tipTop}} aria-hidden="true">это чё, пасхалка?</span>
      {open && <div ref={panel} id="avatar-fact" role="dialog" aria-modal="false" aria-labelledby="avatar-fact-title" className="avatar-fact" style={{left:position.left,top:position.top}}>
        <h2 id="avatar-fact-title">А вот и настоящая я</h2>
        <p>В дизайне уже 6 лет, но до сих пор иногда оставляю слои с названием <code data-typography="off">Frame 234729374</code></p>
        <p className="avatar-fact-aside"><em>Не говорите никому, ладно?</em></p>
      </div>}
    </div>,document.body)}
  </>;
}
