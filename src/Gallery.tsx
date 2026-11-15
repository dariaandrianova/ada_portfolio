import { useLayoutEffect, useRef, useState } from 'react';
import type { ProjectGallery } from './galleries';
import { useRussianTypography } from './typography';
import './gallery.css';

export function Gallery({ gallery, layout = 'default' }: { gallery: ProjectGallery; layout?: 'default' | 'contest' }) {
  const [selected, setSelected] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const thumbnail = (image: ProjectGallery['images'][number], index: number) => <button key={image.src} type="button" className="gallery-thumbnail" aria-haspopup="dialog" aria-label={`Открыть изображение: ${image.alt}`}
      onClick={event => { opener.current = event.currentTarget;setSelected(index); }}>
      <span className="gallery-preview"><img src={image.thumbnail} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" /></span>
      <span className="gallery-caption">{image.alt}</span>
    </button>;
  return <div className={`project-gallery${layout === 'contest' ? ' project-gallery--contest' : ''}`} aria-label={`Галерея: ${gallery.title}`}>
    {layout === 'contest' ? <><div className="contest-gallery-cards">{gallery.images.slice(0,3).map(thumbnail)}</div><div className="contest-gallery-screens">{gallery.images.slice(3).map((image,index)=>thumbnail(image,index+3))}</div></> : gallery.images.map(thumbnail)}
    {selected !== null && <ImageViewer gallery={gallery} initialIndex={selected} opener={opener.current} onClose={() => setSelected(null)} />}
  </div>;
}

function ImageViewer({ gallery, initialIndex, opener, onClose }: { gallery: ProjectGallery; initialIndex: number; opener: HTMLElement | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [fullWidth, setFullWidth] = useState(false);
  const [failed, setFailed] = useState(false);
  useRussianTypography(dialog);
  const image = gallery.images[index];
  const move = (step: number) => { setIndex(i => (i + step + gallery.images.length) % gallery.images.length);setFullWidth(false);setFailed(false); };
  useLayoutEffect(() => {
    const element = dialog.current!;
    element.showModal();closeButton.current?.focus({ preventScroll: true });
    return () => { element.close();opener?.focus({ preventScroll: true }); };
  }, [opener]);
  useLayoutEffect(() => { scroller.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }, [index, fullWidth]);
  return <dialog ref={dialog} className="image-viewer" role="dialog" aria-modal="true" aria-label={`Изображения проекта ${gallery.title}`}
    onCancel={event => { event.preventDefault();event.stopPropagation();onClose(); }}
    onClick={event => { event.stopPropagation();if(event.target === event.currentTarget)onClose(); }}
    onKeyDown={event => {
      event.stopPropagation(); // The parent drawer must not trap this modal's focus or Escape.
      if(event.key === 'ArrowLeft'){event.preventDefault();move(-1);}
      if(event.key === 'ArrowRight'){event.preventDefault();move(1);}
      if(event.key === 'Tab'){
        const buttons = Array.from(dialog.current!.querySelectorAll<HTMLElement>('button:not([disabled]),[tabindex="0"]'));
        const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    }}>
    <div className="viewer-shell">
      <header className="viewer-toolbar">
        <span className="viewer-project">{gallery.title}</span>
        <button type="button" className="viewer-fit" aria-pressed={fullWidth} onClick={() => setFullWidth(v => !v)}>{fullWidth ? 'Вписать целиком' : 'На всю ширину'}</button>
        <button ref={closeButton} type="button" className="drawer-close" aria-label="Закрыть изображение" onClick={onClose}><span aria-hidden="true" /></button>
      </header>
      <div ref={scroller} className={`viewer-scroll${fullWidth ? ' viewer-scroll--width' : ''}`} tabIndex={0} aria-label="Просмотр изображения">
        {failed ? <p className="viewer-error" role="alert">Не удалось загрузить изображение: {image.alt}</p> : <img key={image.src} src={image.src} alt={image.alt} width={image.width} height={image.height} decoding="async" onError={() => setFailed(true)} />}
      </div>
      <footer className="viewer-footer">
        <button type="button" className="viewer-nav" aria-label="Предыдущее изображение" onClick={() => move(-1)}>←</button>
        <div className="viewer-description" aria-live="polite" aria-atomic="true"><span>{image.alt}</span><span className="viewer-counter">{index+1} / {gallery.images.length}</span></div>
        <button type="button" className="viewer-nav" aria-label="Следующее изображение" onClick={() => move(1)}>→</button>
      </footer>
    </div>
  </dialog>;
}
