import { AvatarEasterEgg } from './AvatarEasterEgg';
import { CustomCursor } from './CustomCursor';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Visual } from './visual';
import { links } from './config';
import './style.css';
import { useRussianTypography } from './typography';
import { Drawer } from './Drawer';
import { drawerContent, type DrawerId } from './drawerContent';
import { Arrow } from './content';
import { ContestCase } from './ContestCase';
import { ContestButton } from './ContestButton';

function Surface({ href, className = '', children, ...props }: React.HTMLAttributes<HTMLElement> & { href?: string; children: React.ReactNode }) {
  return href ? <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...props}>{children}</a> : <div className={className} {...props}>{children}</div>;
}
function App() {
  const stage = useRef<HTMLElement>(null);
  useRussianTypography(stage);
  const [scale, setScale] = useState(1);
  const [activeDrawer, setActiveDrawer] = useState<DrawerId | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openDrawer = (id: DrawerId, element: HTMLElement) => { opener.current = element;setActiveDrawer(id); };
  useLayoutEffect(() => {
    const update = () => {
      const { innerWidth: width, innerHeight: height } = window;
      setScale(1);
      if (stage.current && width >= 760) {
        const snap = (value: number) => Math.floor(value / 8) * 8;
        const compact = height <= 700;
        const heading = snap(Math.max(48, Math.min(width * .062, height * .10, 96)));
        const cards = compact ? 192 : snap(Math.max(224, Math.min(height * .27, 304)));
        const hero = heading * 2 + 152;
        const gap = snap(Math.max(0, (height - 96 - 48 - hero - cards) / 2));
        stage.current.style.setProperty('--heading-size', `${heading}px`);
        stage.current.style.setProperty('--card-height', `${cards}px`);
        stage.current.style.setProperty('--section-gap', `${gap}px`);
        stage.current.style.setProperty('--first-column', `${snap((width - 96 - 24) * .58)}px`);
      }
    };
    update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update);
  }, []);
  return <><CustomCursor /><div className="viewport" style={{ '--stage-scale': scale } as React.CSSProperties}>
    <main ref={stage} className="stage" aria-label="Портфолио Дарьи Андриановой">
      <Visual stage={stage} />
      <header className="header">
        <AvatarEasterEgg />
        <div className="header-copy"><img className="year" src="./assets/label-7.svg" alt="2к26" />
        <div className="identity"><img className="name" src="./assets/label-42.svg" alt="Дарья Андрианова" /></div></div>
      </header>
      <div className="hero-group"><div className="intro">
      <h1>Портфолио<br />в работе</h1>
      <div className="tags" aria-label="Специализация"><span className="tag">Продуктовый дизигнер</span><span className="tag">6 лет опыта</span><span className="tag">CX / UX</span><span className="tag">B2B / B2E</span><span className="tag">UX Research</span><span className="channel-tag-slot"><Surface href={links.telegram} className="tag channel-tag" aria-label="тгк — откроется в новой вкладке"><span>тгк</span><Arrow /></Surface></span></div>
      </div>
      <ContestButton onClick={event => openDrawer('contest',event.currentTarget)} />
      </div>
      <section className="cards" aria-label="Опыт и менторство">
        <button type="button" aria-haspopup="dialog" onClick={event => openDrawer('sber', event.currentTarget)} className="card card-sber" data-glass="40"><span className="caption">сейчас тут</span><h2>Сбер</h2><p>Учу ИИ помогать сотрудникам, а сложные процессы — становиться понятнее</p><Arrow /></button>
        <button type="button" aria-haspopup="dialog" onClick={event => openDrawer('mentoring', event.currentTarget)} className="card card-mentoring" data-glass="20"><span className="caption">ещё вот тут</span><h2>Менторство</h2><Arrow /></button>
        <button type="button" aria-haspopup="dialog" onClick={event => openDrawer('experience', event.currentTarget)} className="card card-experience" data-glass="20"><span className="caption">ещё вот тут</span><h2>red_mad_robot,<br />BreadHead, Выставка «Россия»</h2><Arrow /></button>
      </section>
    </main>
  </div>
    {activeDrawer && <Drawer key={activeDrawer} content={drawerContent[activeDrawer]} opener={opener.current} onClosed={() => setActiveDrawer(null)}>{activeDrawer === 'contest' && <ContestCase />}</Drawer>}
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
