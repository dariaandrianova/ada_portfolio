import { useEffect } from 'react';
import './cursor.css';

const clickable = 'a[href],button:not(:disabled),[role="button"],[role="link"],input[type="submit"],input[type="button"],summary,[data-cursor="pointer"]';
const editable = 'textarea,input:not([type="button"]):not([type="submit"]),[contenteditable="true"]';

/** Kept outside React's DOM tree so it can follow the topmost native dialog. */
export function CustomCursor() {
  useEffect(() => {
    const media = matchMedia('(hover: hover) and (pointer: fine)');
    let teardown: (() => void) | undefined;
    const enable = () => {
      teardown?.();teardown = undefined;
      if (!media.matches) return;
      const cursor = document.createElement('div');
      cursor.className = 'custom-cursor';
      cursor.setAttribute('popover', 'manual');
      cursor.setAttribute('aria-hidden', 'true');
      const glow = document.createElement('span');glow.className = 'custom-cursor-glow';
      const icon = document.createElement('img');icon.className = 'custom-cursor-icon';icon.alt = '';icon.draggable = false;
      cursor.append(glow, icon);
      let x = 0, y = 0, inside = false, frame = 0;
      let mode = '';
      const setMode = (pointer: boolean) => {
        const next = pointer ? 'pointer' : 'default';
        if (next === mode) return;
        mode = next;cursor.dataset.mode = next;
        icon.src = `./assets/cursor-${next}.svg`;
      };
      setMode(false);
      // Preload both originals so the first hover doesn't wait for the network.
      ['./assets/cursor-default.svg','./assets/cursor-pointer.svg'].forEach(src => { const image = new Image();image.src = src; });
      const host = () => {
        const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]'));
        const parent = dialogs[dialogs.length - 1] ?? document.body;
        if (cursor.parentElement !== parent) {
          if (cursor.isConnected && cursor.matches(':popover-open')) cursor.hidePopover();
          parent.append(cursor);cursor.showPopover();
        }
      };
      host();
      const observer = new MutationObserver(host);
      observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
      document.documentElement.classList.add('custom-cursor-enabled');
      const hide = () => { inside = false;cursor.dataset.visible = 'false';cursor.dataset.pressed = 'false';document.documentElement.removeAttribute('data-cursor-text'); };
      const update = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        x = event.clientX;y = event.clientY;inside = true;
        const target = event.target instanceof Element ? event.target : null;
        document.documentElement.removeAttribute('data-cursor-text');
        const interactive = target?.closest(clickable);
        const text = !interactive && !!target && (target.matches(editable) || !!target.closest('[contenteditable="true"]') || getComputedStyle(target).cursor === 'text');
        document.documentElement.toggleAttribute('data-cursor-text', text);
        setMode(!!interactive);
        cursor.dataset.visible = String(!text);
        // Position is never interpolated: one update per paint, at the latest pointer coordinates.
        if (!frame) frame = requestAnimationFrame(() => {
          frame = 0;
          if (inside) cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
        });
      };
      const down = (event: PointerEvent) => { update(event);cursor.dataset.pressed = 'true'; };
      const up = () => { cursor.dataset.pressed = 'false'; };
      const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide(); };
      const visibility = () => { if (document.hidden) hide(); };
      document.addEventListener('pointermove', update, { passive: true });
      document.addEventListener('pointerover', update, { passive: true });
      document.addEventListener('pointerdown', down, { passive: true });
      document.addEventListener('pointerup', up, { passive: true });
      document.addEventListener('pointercancel', hide);
      document.addEventListener('pointerout', leave);
      document.addEventListener('visibilitychange', visibility);
      window.addEventListener('blur', hide);
      teardown = () => {
        observer.disconnect();cancelAnimationFrame(frame);cursor.remove();
        document.documentElement.classList.remove('custom-cursor-enabled');
        document.documentElement.removeAttribute('data-cursor-text');
        document.removeEventListener('pointermove', update);document.removeEventListener('pointerover', update);
        document.removeEventListener('pointerdown', down);document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', hide);document.removeEventListener('pointerout', leave);
        document.removeEventListener('visibilitychange', visibility);window.removeEventListener('blur', hide);
      };
    };
    enable();media.addEventListener('change', enable);
    return () => { media.removeEventListener('change', enable);teardown?.(); };
  }, []);
  return null;
}
