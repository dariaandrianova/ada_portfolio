import type { CSSProperties, MouseEventHandler } from 'react';
import { Arrow } from './content';

const sparks = Array.from({ length: 40 }, (_, index) => {
  const angle = index * 2.39996;
  const distance = 48 + (index % 6) * 12;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  return {
    '--spark-start': `${4 + (index * 17 % 93)}%`,
    '--spark-top': `${20 + (index * 23 % 60)}%`,
    '--spark-x': `${Math.round(x)}px`,
    '--spark-rise': `${Math.round(y)}px`,
    '--spark-angle': `${Math.round(angle * 180 / Math.PI)}deg`,
    '--spark-delay': `${-(index * .09)}s`,
    '--spark-duration': `${.55 + (index % 4) * .12}s`,
  } as CSSProperties;
});

export function ContestButton({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return <button type="button" className="competition competition--contest" aria-haspopup="dialog" onClick={onClick}>
    <span className="contest-button-label">работы для конкурса</span><Arrow />
    <span className="contest-embers" aria-hidden="true">
      {sparks.map((style,index)=><span key={index} className="contest-spark" style={style} />)}
    </span>
  </button>;
}
