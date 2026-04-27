export interface PleonasmItem {
  words: string[];
  /** One or more redundant words — all are considered correct answers */
  redundant: string | string[];
}

export const PLEONASM_ITEMS: PleonasmItem[] = [
  { words: ['свободные', 'вакансии'], redundant: 'свободные' },
  { words: ['отступать', 'назад'], redundant: 'назад' },
  { words: ['кивали', 'головами'], redundant: 'головами' },
  { words: ['заранее', 'предупредила'], redundant: 'заранее' },
  { words: ['заранее', 'предчувствовала'], redundant: 'заранее' },
  { words: ['внутренний', 'интерьер'], redundant: 'внутренний' },
  { words: ['крупных', 'супермаркетов'], redundant: 'крупных' },
  { words: ['лицевой', 'фасад'], redundant: 'лицевой' },
  { words: ['вымышленным', 'псевдонимом'], redundant: 'вымышленным' },
  { words: ['приезжих', 'гастарбайтеров'], redundant: 'приезжих' },
  { words: ['бывший', 'экс-чемпион'], redundant: 'бывший' },
  { words: ['предельный', 'ежемесячный', 'лимит'], redundant: 'предельный' },
  { words: ['впервые', 'познакомился'], redundant: 'впервые' },
  { words: ['колючими', 'терниями'], redundant: 'колючими' },
  { words: ['водную', 'акваторию'], redundant: 'водную' },
  { words: ['бесплатные', 'подарки'], redundant: 'бесплатные' },
  { words: ['впервые', 'дебютировал'], redundant: 'впервые' },
  { words: ['действительные', 'реалии'], redundant: 'действительные' },
  { words: ['скоростным', 'экспрессом'], redundant: 'скоростным' },
  { words: ['временной', 'отсрочки'], redundant: 'временной' },
  { words: ['ветхую', 'рухлядь'], redundant: 'ветхую' },
  { words: ['высотным', 'небоскрёбом'], redundant: 'высотным' },
  { words: ['ледяной', 'айсберг'], redundant: 'ледяной' },
  { words: ['героические', 'подвиги'], redundant: 'героические' },
  { words: ['памятные', 'сувениры'], redundant: 'памятные' },
  { words: ['редкие', 'раритеты'], redundant: 'редкие' },
  { words: ['совместное', 'сотрудничество'], redundant: 'совместное' },
  { words: ['главная', 'суть'], redundant: 'главная' },
  { words: ['основная', 'суть'], redundant: 'основная' },
  { words: ['свою', 'автобиографию'], redundant: 'свою' },
  { words: ['период', 'времени'], redundant: 'времени' },
  { words: ['неожиданные', 'сюрпризы'], redundant: 'неожиданные' },
  { words: ['отрицательных', 'недостатках'], redundant: 'отрицательных' },
  { words: ['потупленными', 'вниз', 'глазами'], redundant: 'вниз' },
  { words: ['падал', 'вниз'], redundant: 'вниз' },
  { words: ['рухнуть', 'вниз'], redundant: 'вниз' },
  { words: ['временно', 'приостановить'], redundant: 'временно' },
  { words: ['самостоятельную', 'автономию'], redundant: 'самостоятельную' },
  { words: ['народного', 'фольклора'], redundant: 'народного' },
  { words: ['приоритет', 'первенства'], redundant: 'первенства' },
  { words: ['предварительных', 'анонсах'], redundant: 'предварительных' },
  { words: ['столичная', 'московская', 'актриса'], redundant: ['столичная', 'московская'] },
  { words: ['пернатые', 'птицы'], redundant: ['пернатые', 'птицы'] },
  { words: ['неприкосновенным', 'иммунитетом'], redundant: 'неприкосновенным' },
  { words: ['смешивать', 'вместе'], redundant: 'вместе' },
  { words: ['вечернего', 'заката'], redundant: 'вечернего' },
  { words: ['невероятных', 'парадоксах'], redundant: 'невероятных' },
  { words: ['странных', 'парадоксах'], redundant: 'странных' },
  { words: ['династии', 'рода'], redundant: 'рода' },
  { words: ['религиозного', 'вероисповедания'], redundant: 'религиозного' },
  { words: ['передовой', 'авангард'], redundant: 'передовой' },
  { words: ['глубокая', 'бездна'], redundant: 'глубокая' },
  { words: ['цельный', 'монолит'], redundant: 'цельный' },
  { words: ['изысканные', 'деликатесы'], redundant: 'изысканные' },
  { words: ['прейскурантом', 'цен'], redundant: 'цен' },
  { words: ['мировое', 'человечество'], redundant: 'мировое' },
  { words: ['очень', 'оптимальные'], redundant: 'очень' },
  { words: ['первую', 'премьеру'], redundant: 'первую' },
  { words: ['взаимный', 'диалог'], redundant: 'взаимный' },
  { words: ['ладони', 'рук'], redundant: 'рук' },
  { words: ['жестикулируя', 'руками'], redundant: 'руками' },
  { words: ['необычном', 'феномене'], redundant: 'необычном' },
  { words: ['замкнутых', 'интровертов'], redundant: 'замкнутых' },
  { words: ['совместное', 'соглашение'], redundant: 'совместное' },
  { words: ['ответная', 'контратака'], redundant: 'ответная' },
];

export function isRedundant(item: PleonasmItem, word: string): boolean {
  return Array.isArray(item.redundant)
    ? item.redundant.includes(word)
    : item.redundant === word;
}

export function correctLabel(item: PleonasmItem): string {
  return Array.isArray(item.redundant)
    ? item.redundant.join(' / ')
    : item.redundant;
}

/** For each phrase (words.join(' ')), the set of valid redundant words */
export const PLEONASM_VALID_MAP: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>();
  for (const item of PLEONASM_ITEMS) {
    const key = item.words.join(' ');
    const valid = Array.isArray(item.redundant) ? item.redundant : [item.redundant];
    m.set(key, new Set(valid));
  }
  return m;
})();
