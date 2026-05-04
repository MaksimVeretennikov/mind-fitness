export type NeNiAnswer = 'слитно' | 'раздельно';
export type NeNiType = 'word' | 'sentence';

export interface NeNiItem {
  type: NeNiType;
  /** Full text shown to the user. Contains "(не)" or "(ни)" marker. */
  display: string;
  /** Substring inside `display` that holds the marker. For words, equal to display. */
  marker: string;
  answer: NeNiAnswer;
}

/* ─── Words & short phrases ────────────────────────────────────────────────── */

export const NE_NI_WORDS: NeNiItem[] = [
  { type: 'word', display: 'совершенно (не)подходящий к правилу пример', marker: '(не)подходящий', answer: 'раздельно' },

  // слитно — наречия и причастия без зависимых слов и противопоставления
  { type: 'word', display: '(не)избежно',     marker: '(не)избежно',     answer: 'слитно' },
  { type: 'word', display: '(не)лепо',        marker: '(не)лепо',        answer: 'слитно' },
  { type: 'word', display: '(не)отвязно',     marker: '(не)отвязно',     answer: 'слитно' },
  { type: 'word', display: '(не)доумевающе',  marker: '(не)доумевающе',  answer: 'слитно' },

  // раздельно — наречия, не образующие новой части речи
  { type: 'word', display: '(не)здесь',         marker: '(не)здесь',         answer: 'раздельно' },
  { type: 'word', display: '(не)так',           marker: '(не)так',           answer: 'раздельно' },
  { type: 'word', display: '(не)вполне',        marker: '(не)вполне',        answer: 'раздельно' },
  { type: 'word', display: '(не)полностью',     marker: '(не)полностью',     answer: 'раздельно' },
  { type: 'word', display: '(не)совсем',        marker: '(не)совсем',        answer: 'раздельно' },
  { type: 'word', display: '(не)хуже других',   marker: '(не)хуже других',   answer: 'раздельно' },
  { type: 'word', display: '(не)сегодня',       marker: '(не)сегодня',       answer: 'раздельно' },
  { type: 'word', display: '(не)иначе',         marker: '(не)иначе',         answer: 'раздельно' },
  { type: 'word', display: '(не)по-моему',      marker: '(не)по-моему',      answer: 'раздельно' },
  { type: 'word', display: '(не)по-товарищески',marker: '(не)по-товарищески',answer: 'раздельно' },
  { type: 'word', display: '(не)в зачёт',       marker: '(не)в зачёт',       answer: 'раздельно' },
  { type: 'word', display: '(не)в меру',        marker: '(не)в меру',        answer: 'раздельно' },
  { type: 'word', display: '(не)в пример',      marker: '(не)в пример',      answer: 'раздельно' },
  { type: 'word', display: '(не)к добру',       marker: '(не)к добру',       answer: 'раздельно' },
  { type: 'word', display: '(не)к спеху',       marker: '(не)к спеху',       answer: 'раздельно' },
  { type: 'word', display: '(не)по вкусу',      marker: '(не)по вкусу',      answer: 'раздельно' },
  { type: 'word', display: '(не)под силу',      marker: '(не)под силу',      answer: 'раздельно' },
  { type: 'word', display: '(не)по нутру',      marker: '(не)по нутру',      answer: 'раздельно' },
  { type: 'word', display: '(не)зря',           marker: '(не)зря',           answer: 'раздельно' },
  { type: 'word', display: '(не)с руки',        marker: '(не)с руки',        answer: 'раздельно' },

  // раздельно — краткие прилагательные / категория состояния, не образующие нового слова
  { type: 'word', display: '(не)виден',      marker: '(не)виден',      answer: 'раздельно' },
  { type: 'word', display: '(не)готов',      marker: '(не)готов',      answer: 'раздельно' },
  { type: 'word', display: '(не)должен',     marker: '(не)должен',     answer: 'раздельно' },
  { type: 'word', display: '(не)жаль',       marker: '(не)жаль',       answer: 'раздельно' },
  { type: 'word', display: '(не)надо',       marker: '(не)надо',       answer: 'раздельно' },
  { type: 'word', display: '(не)намерен',    marker: '(не)намерен',    answer: 'раздельно' },
  { type: 'word', display: '(не)нужен',      marker: '(не)нужен',      answer: 'раздельно' },
  { type: 'word', display: '(не)обязан',     marker: '(не)обязан',     answer: 'раздельно' },
  { type: 'word', display: '(не)похож',      marker: '(не)похож',      answer: 'раздельно' },
  { type: 'word', display: '(не)прав',       marker: '(не)прав',       answer: 'раздельно' },
  { type: 'word', display: '(не)рад',        marker: '(не)рад',        answer: 'раздельно' },
  { type: 'word', display: '(не)расположен', marker: '(не)расположен', answer: 'раздельно' },
  { type: 'word', display: '(не)согласен',   marker: '(не)согласен',   answer: 'раздельно' },
  { type: 'word', display: '(не)способен',   marker: '(не)способен',   answer: 'раздельно' },
  { type: 'word', display: '(не)суждено',    marker: '(не)суждено',    answer: 'раздельно' },
];

/* ─── Sentences ─────────────────────────────────────────────────────────────── */

export const NE_NI_SENTENCES: NeNiItem[] = [
  { type: 'sentence', display: 'Несколько дней лил (не)переставая холодный дождь.',                     marker: '(не)переставая',     answer: 'раздельно' },
  { type: 'sentence', display: 'Наш спутник оказался (не)разговорчивым, а молчаливым молодым человеком.',marker: '(не)разговорчивым',  answer: 'раздельно' },
  { type: 'sentence', display: 'На таможне меня (не)досматривали.',                                     marker: '(не)досматривали',   answer: 'раздельно' },
  { type: 'sentence', display: '(Не)всякий способен вести себя естественно.',                           marker: '(Не)всякий',         answer: 'раздельно' },
  { type: 'sentence', display: 'Косо тянулись (не)остывшие вечерние лучи солнца.',                      marker: '(не)остывшие',       answer: 'слитно' },
  { type: 'sentence', display: 'Корабли вышли в море, (не)смотря на штормовое предупреждение.',         marker: '(не)смотря',         answer: 'слитно' },
  { type: 'sentence', display: 'Виктор гордился (не)кем иным, как своим дедушкой.',                     marker: '(не)кем',            answer: 'раздельно' },
  { type: 'sentence', display: 'Архыз — поистине удивительный край вовсе (не)тронутой цивилизацией кавказской природы.', marker: '(не)тронутой', answer: 'раздельно' },
  { type: 'sentence', display: 'Эта далеко (не)весёлая история была рассказана мне на постоялом дворе.',marker: '(не)весёлая',        answer: 'раздельно' },
  { type: 'sentence', display: 'Воздух едва колышется над (не)мощёной песчаной дорогой.',               marker: '(не)мощёной',        answer: 'слитно' },
  { type: 'sentence', display: 'Каждый сотрудник понимал, что он работал (не)впустую.',                 marker: '(не)впустую',        answer: 'раздельно' },
  { type: 'sentence', display: 'Глядя на картину, ощущаешь, что всё дышит запахом ни разу (не)кошенной травы.', marker: '(не)кошенной', answer: 'раздельно' },
  { type: 'sentence', display: 'В дымковской игрушке отразилась (не)разгаданная русская душа.',         marker: '(не)разгаданная',    answer: 'слитно' },
  { type: 'sentence', display: 'В этом году были (не)прекращавшиеся всё лето дожди.',                   marker: '(не)прекращавшиеся', answer: 'раздельно' },
  { type: 'sentence', display: 'В этом городе редко встретишь праздного, ничем (не)занятого человека.', marker: '(не)занятого',       answer: 'раздельно' },
  { type: 'sentence', display: '(Не)широкая, но быстрая река омывала берега острова.',                  marker: '(Не)широкая',        answer: 'слитно' },
  { type: 'sentence', display: 'За давно (не)крашенным забором заброшенной усадьбы виднелась сторожка.',marker: '(не)крашенным',      answer: 'раздельно' },
  { type: 'sentence', display: 'Мотивы поступка главного героя романа отнюдь (не)благородны.',          marker: '(не)благородны',     answer: 'раздельно' },
  { type: 'sentence', display: '(Не)зачем думать о том, чего нельзя исправить или вернуть.',            marker: '(Не)зачем',          answer: 'слитно' },
  { type: 'sentence', display: 'Любовь — это чувство, (не)контролируемое разумом.',                     marker: '(не)контролируемое', answer: 'раздельно' },
  { type: 'sentence', display: 'Всё в природе замерло до рассвета, даже (не)утихавший долгое время ветер словно уснул.', marker: '(не)утихавший', answer: 'раздельно' },
  { type: 'sentence', display: 'Алексей собрал несколько (не)раскрывшихся еловых шишек.',               marker: '(не)раскрывшихся',   answer: 'слитно' },
  { type: 'sentence', display: 'На мокрую землю падали далеко (не)мелкие капли дождя.',                 marker: '(не)мелкие',         answer: 'раздельно' },
  { type: 'sentence', display: 'Никому (не)нужный портрет пылился на чердаке заброшенного дома.',       marker: '(не)нужный',         answer: 'раздельно' },
  { type: 'sentence', display: 'У (не)вышедшего на связь лётчика оборудование оказалось повреждённым.', marker: '(не)вышедшего',      answer: 'раздельно' },
  { type: 'sentence', display: 'По утрам дети обычно (не)доедали кашу: им не нравились блюда, приготовленные на молоке.', marker: '(не)доедали', answer: 'раздельно' },
  { type: 'sentence', display: 'На экзамене мне досталась далеко (не)лёгкая задача.',                   marker: '(не)лёгкая',         answer: 'раздельно' },
  { type: 'sentence', display: 'В этом (не)прореженном лесу молодые деревья растут медленно.',          marker: '(не)прореженном',    answer: 'слитно' },
  { type: 'sentence', display: 'Мне всегда хотелось больше узнать о самых маленьких, (не)видимых невооружённым глазом животных.', marker: '(не)видимых', answer: 'раздельно' },
  { type: 'sentence', display: 'В этом фрагменте слышится (не)обыкновенная мелодия, а полный трагизма финал.', marker: '(не)обыкновенная', answer: 'раздельно' },
  { type: 'sentence', display: 'Посетители (не)спеша проходят по залам музея, открывшегося после реставрации.', marker: '(не)спеша',     answer: 'раздельно' },
];

/* ─── Marker resolution helpers ─────────────────────────────────────────────── */

/** Returns the marker substring with parens removed and joined according to the answer. */
export function correctMarker(item: NeNiItem): string {
  if (item.answer === 'слитно') {
    return item.marker.replace(/\(([^)]+)\)/g, '$1').replace(/\s+/g, '');
  }
  // раздельно — replace "(X)" with "X "
  return item.marker.replace(/\(([^)]+)\)/g, '$1 ').replace(/\s+/g, ' ').trim();
}

/** Returns the wrong marker variant — what the user effectively chose when wrong. */
export function wrongMarker(item: NeNiItem): string {
  if (item.answer === 'слитно') {
    // wrong = раздельно
    return item.marker.replace(/\(([^)]+)\)/g, '$1 ').replace(/\s+/g, ' ').trim();
  }
  // wrong = слитно
  return item.marker.replace(/\(([^)]+)\)/g, '$1').replace(/\s+/g, '');
}

/** Returns the full display with the marker resolved to its correct form. */
export function correctFull(item: NeNiItem): string {
  return item.display.replace(item.marker, correctMarker(item));
}
