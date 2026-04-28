export interface IntroWordItem {
  word: string;
  note?: string;
  isIntro: boolean;
}

export const INTRO_WORDS: IntroWordItem[] = [
  // === ВВОДНЫЕ СЛОВА ===

  // Уверенность
  { word: 'конечно', isIntro: true },
  { word: 'разумеется', isIntro: true },
  { word: 'несомненно', isIntro: true },
  { word: 'бесспорно', isIntro: true },
  { word: 'естественно', isIntro: true },
  { word: 'без сомнения', isIntro: true },
  { word: 'действительно', isIntro: true, note: 'в начале предложения' },
  { word: 'как правило', isIntro: true },

  // Неуверенность
  { word: 'наверное', isIntro: true },
  { word: 'вероятно', isIntro: true },
  { word: 'кажется', isIntro: true },
  { word: 'очевидно', isIntro: true },
  { word: 'видимо', isIntro: true },
  { word: 'по-видимому', isIntro: true },
  { word: 'возможно', isIntro: true },
  { word: 'пожалуй', isIntro: true },
  { word: 'может быть', isIntro: true },
  { word: 'должно быть', isIntro: true },
  { word: 'по всей вероятности', isIntro: true },

  // Чувства
  { word: 'к счастью', isIntro: true },
  { word: 'к несчастью', isIntro: true },
  { word: 'к сожалению', isIntro: true },
  { word: 'к удивлению', isIntro: true },
  { word: 'чего доброго', isIntro: true },
  { word: 'на беду', isIntro: true },

  // Источник сообщения
  { word: 'по-моему', isIntro: true },
  { word: 'по-твоему', isIntro: true },
  { word: 'говорят', isIntro: true },
  { word: 'помнится', isIntro: true },
  { word: 'дескать', isIntro: true },
  { word: 'мол', isIntro: true },
  { word: 'как известно', isIntro: true },

  // Порядок мыслей
  { word: 'во-первых', isIntro: true },
  { word: 'во-вторых', isIntro: true },
  { word: 'в-третьих', isIntro: true },
  { word: 'итак', isIntro: true },
  { word: 'следовательно', isIntro: true },
  { word: 'таким образом', isIntro: true },
  { word: 'кстати', isIntro: true },
  { word: 'наоборот', isIntro: true },
  { word: 'в частности', isIntro: true },
  { word: 'напротив', isIntro: true },
  { word: 'например', isIntro: true },
  { word: 'впрочем', isIntro: true },
  { word: 'стало быть', isIntro: true },
  { word: 'между прочим', isIntro: true },
  { word: 'наконец', isIntro: true },
  { word: 'кроме того', isIntro: true },
  { word: 'значит', isIntro: true, note: '=следовательно' },

  // Способ оформления мысли
  { word: 'иными словами', isIntro: true },
  { word: 'короче говоря', isIntro: true },
  { word: 'так сказать', isIntro: true },
  { word: 'словом', isIntro: true },
  { word: 'одним словом', isIntro: true },
  { word: 'иначе говоря', isIntro: true },

  // Привлечение внимания
  { word: 'пожалуйста', isIntro: true },
  { word: 'послушайте', isIntro: true },
  { word: 'видите ли', isIntro: true },
  { word: 'знаете', isIntro: true },
  { word: 'понимаете', isIntro: true },
  { word: 'допустим', isIntro: true },
  { word: 'скажем', isIntro: true },

  // Степень обычности
  { word: 'бывало', isIntro: true },
  { word: 'по обыкновению', isIntro: true },

  // === НЕ ВВОДНЫЕ СЛОВА ===

  { word: 'авось', isIntro: false },
  { word: 'большей частью', isIntro: false },
  { word: 'буквально', isIntro: false },
  { word: 'вдобавок', isIntro: false },
  { word: 'ведь', isIntro: false },
  { word: 'в конечном счёте', isIntro: false },
  { word: 'вряд ли', isIntro: false },
  { word: 'всё равно', isIntro: false },
  { word: 'всё-таки', isIntro: false },
  { word: 'вроде бы', isIntro: false },
  { word: 'даже', isIntro: false },
  { word: 'именно', isIntro: false },
  { word: 'иногда', isIntro: false },
  { word: 'как будто', isIntro: false },
  { word: 'как бы', isIntro: false },
  { word: 'к тому же', isIntro: false },
  { word: 'лишь', isIntro: false },
  { word: 'между тем', isIntro: false },
  { word: 'наверняка', isIntro: false },
  { word: 'на редкость', isIntro: false },
  { word: 'небось', isIntro: false },
  { word: 'непременно', isIntro: false },
  { word: 'определённо', isIntro: false },
  { word: 'отчасти', isIntro: false },
  { word: 'по крайней мере', isIntro: false },
  { word: 'поистине', isIntro: false },
  { word: 'по-прежнему', isIntro: false },
  { word: 'поэтому', isIntro: false },
  { word: 'просто', isIntro: false },
  { word: 'пусть', isIntro: false },
  { word: 'решительно', isIntro: false },
  { word: 'словно', isIntro: false },
  { word: 'тем не менее', isIntro: false },
  { word: 'только', isIntro: false },
  { word: 'якобы', isIntro: false },
  { word: 'абсолютно', isIntro: false },
  { word: 'вдруг', isIntro: false },
  { word: 'в основном', isIntro: false },
  { word: 'зря', isIntro: false },
  { word: 'напрасно', isIntro: false },
  { word: 'почти', isIntro: false },
  { word: 'постепенно', isIntro: false },
  { word: 'приблизительно', isIntro: false },
  { word: 'примерно', isIntro: false },
  { word: 'фактически', isIntro: false },
  { word: 'уже', isIntro: false },
  { word: 'скорее', isIntro: false },
  { word: 'зачастую', isIntro: false },
  { word: 'будто', isIntro: false },
  { word: 'на самом деле', isIntro: false },
  { word: 'в конце концов', isIntro: false },
  { word: 'значит', isIntro: false, note: '=это, вот, обозначает' },
];
