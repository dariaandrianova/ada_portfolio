export interface GalleryImage { src: string; thumbnail: string; alt: string; width: number; height: number }
export interface ProjectGallery { title: string; images: GalleryImage[] }
function image(folder: string, name: string, alt: string, width: number, height: number): GalleryImage {
  const base = `./assets/projects/${folder}/${name}`;
  return { src: `${base}.png`, thumbnail: `${base}-preview.jpg`, alt, width, height };
}
export const projectGalleries = {
  sber: { title: 'Сбер', images: [
    image('sber', 'customer-journey', 'Карта клиентского пути', 2030, 786),
    image('sber', 'sales-flow', 'Сценарии новой технологии продаж', 2020, 648),
    image('sber', 'component-process', 'Процесс работы с компонентами', 1123, 821),
    image('sber', 'design-feedback', 'Работа с компонентами и обратная связь', 1179, 1403),
  ] },
  robot: { title: 'red_mad_robot', images: [
    image('red-mad-robot', 'daisy-gpt', 'Daisy × GPT-4 — карточка публикации', 1080, 1080),
    image('red-mad-robot', 'daisy-voice', 'Голосовые запросы к Daisy — карточка публикации', 1080, 1080),
    image('red-mad-robot', 'domains', 'Выбор домена', 2732, 2014),
    image('red-mad-robot', 'domain-settings', 'Настройки домена', 1400, 1886),
    image('red-mad-robot', 'chat', 'Интерфейс чата', 2880, 1920),
    image('red-mad-robot', 'loading', 'Экран загрузки данных', 1400, 800),
  ] },
  breadhead: { title: 'BreadHead · Scholae Mundi', images: [
    image('breadhead', 'home', 'Главная страница Scholae Mundi', 3024, 1662),
    image('breadhead', 'about', 'Страница «О фонде»', 2428, 1596),
    image('breadhead', 'projects', 'Страница «Наши проекты»', 3024, 1540),
    image('breadhead', 'values', 'Ценности фонда', 3024, 1588),
  ] },
  russia: { title: 'Выставка «Россия»', images: [
    image('russia-expo', 'favorite-events', 'Избранное — мероприятия', 2732, 5174),
    image('russia-expo', 'favorite-products', 'Избранное — товары', 2732, 5422),
    image('russia-expo', 'contests', 'Страница «Конкурсы»', 2732, 3250),
    image('russia-expo', 'tickets', 'Страница «Билеты»', 2732, 4398),
    image('russia-expo', 'profile', 'Страница «Профиль»', 2732, 3054),
    image('russia-expo', 'not-found', 'Страница ошибки 404', 1920, 1737),
  ] },
} satisfies Record<string, ProjectGallery>;
