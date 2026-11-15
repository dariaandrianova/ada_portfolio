import { Gallery } from './Gallery';
import type { ProjectGallery } from './galleries';
import './contest.css';

const assets = './assets/contest/';
const artworkDescriptions = ['огненная коза под дождём', 'огненная коза и многорукий всадник', 'человек будущего в киберпанк-городе'];
const contestGallery: ProjectGallery = { title: 'Красная коза под дождём', images: [
  ...[1,2,3].map(n=>({src:`${assets}card_${n}.png`,thumbnail:`${assets}card_${n}.png`,alt:`Конкурсная карта ${n} — ${artworkDescriptions[n-1]}`,width:311,height:196})),
  ...[1,2,3].map(n=>({src:`${assets}SberPay_${n}.png`,thumbnail:`${assets}SberPay_${n}.png`,alt:`Экран SberPay ${n} — ${artworkDescriptions[n-1]}`,width:283,height:629})),
] };
export function ContestCase() {
  return <article className="contest-case" aria-label="Конкурсный кейс">
    <img className="contest-hero" src={`${assets}human_goat.png`} alt="Огненная коза и человек будущего с множеством рук под дождём" width={1287} height={725} />
    <div className="contest-row contest-inspiration">
      <figure><img src={`${assets}picture.jpg`} alt="Картина «Купание красного коня» в музейном зале" width={700} height={482} loading="lazy" /><figcaption>«Купание красного коня»<br />Кузьма Петров-Водкин, 1912</figcaption></figure>
      <div><p>Вдохновением для моей работы стала одна из моих любимых картин — «Купание красного коня» Кузьмы Петрова-Водкина.</p><p>Мне захотелось переосмыслить знакомый сюжет и объединить в нём сразу две темы конкурса: <strong>Огненную Козу — символ 2027 года и Сверхчеловека — образ будущего</strong>.</p></div>
    </div>
    <div className="contest-characters">
    <div className="contest-character">
      <figure><img src={`${assets}goat.png`} alt="Огненная коза" width={600} height={649} loading="lazy" /></figure>
      <p>На смену красному коню приходит огненная коза — символ созидательной энергии, силы и движения вперёд.</p>
    </div>
    <div className="contest-character">
      <figure><img src={`${assets}human.png`} alt="Многорукий человек будущего" width={649} height={649} loading="lazy" /></figure>
      <p>Её всадник — человек будущего с множеством рук, каждая из которых символизирует отдельное умение или область знаний.</p>
    </div>
    </div>
    <div className="contest-prose"><p>Это метафора того, как искусственный интеллект постепенно стирает границы между профессиями. Уже сегодня один человек благодаря технологиям может совмещать несколько ролей, осваивать новые навыки и решать задачи, которые раньше требовали участия целой команды.</p></div>
    <div className="contest-emphasis"><p><strong>Сверхчеловек будущего — не узкий специалист, ограниченный одной профессией, а многогранная личность, способная раскрывать свой потенциал в разных направлениях.</strong></p><p className="contest-emphasis-note">ИИ не заменяет его способности, а расширяет их</p></div>
    <div className="contest-row contest-style">
      <figure className="contest-detail"><img src={`${assets}human_goat.png`} alt="Неоновый город, дождь и фиолетовые отражения — фрагмент конкурсной иллюстрации" width={1287} height={725} loading="lazy" /></figure>
      <p>Для визуального воплощения я выбрала <strong>Cinematic Cyberpunk Hyperrealism</strong> — сочетание кинематографичного киберпанка, технофутуризма и гиперреалистичного цифрового искусства. Этот стиль переносит классический сюжет в воображаемое будущее, сохраняя связь с оригинальной композицией.</p>
    </div>
    <div className="contest-prose"><p>Мы можем экспериментировать, переосмыслять знакомые образы и создавать новые миры, сохраняя уважение к культурному наследию.</p><p>В моей работе классическое искусство и цифровое будущее не противопоставляются друг другу, а становятся продолжением одной истории.</p></div>
    <section className="contest-gallery" aria-labelledby="contest-gallery-title"><h2 id="contest-gallery-title">Галерея</h2><Gallery gallery={contestGallery} layout="contest" /></section>
  </article>;
}
