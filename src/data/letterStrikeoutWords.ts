// Words with all distinct letters — used by the LetterStrikeout exercise.
// Grouped by difficulty (string length).

export type StrikeoutDifficulty = 'easy' | 'medium' | 'hard';

const RAW_WORDS = {
  easy: [
    'МИР', 'СОН', 'ЛЕС', 'ДОМ', 'КОТ', 'ЛИС', 'БЕГ', 'ЭХО', 'ШУМ', 'ДУХ',
    'ШАГ', 'СНЕГ', 'ЛУНА', 'РЕКА', 'МОРЕ', 'ВЕРА', 'ДЕНЬ', 'ИГРА', 'УРОК',
    'СВЕТ', 'ПУТЬ', 'ЦЕЛЬ', 'ОПЫТ', 'ЧУДО', 'ВОДА', 'ЛИСТ', 'РОЗА', 'ПЛЯЖ',
    'ГОРА', 'ВОЛК', 'ТРУД', 'СОЛЬ', 'ЗАРЯ', 'ЗНАК', 'ЯЗЫК', 'ПЛАН', 'ЗВУК',
    'БЛИК', 'ВКУС', 'ЗИМА', 'ЛЕТО', 'БЕДА',
  ],
  medium: [
    'РАЗУМ', 'УСПЕХ', 'ВРЕМЯ', 'МЕЧТА', 'МЫСЛЬ', 'ОКЕАН', 'ШКОЛА', 'ВОЛНА',
    'БУКВА', 'ПЕСОК', 'ПОИСК', 'ВЕТКА', 'ЗВЕНО', 'ВЕСНА', 'ОСЕНЬ', 'ВЫБОР',
    'ПОЛЁТ', 'БЕЛКА', 'ЛОДКА', 'РУЧКА', 'КНИГА',
    'УЛЫБКА', 'ПОБЕДА', 'ПАМЯТЬ', 'ЛЮБОВЬ', 'СОЛНЦЕ', 'КОРЕНЬ', 'КАМЕНЬ',
    'ЦВЕТОК', 'ПОЭЗИЯ', 'МУЗЫКА', 'ВЗГЛЯД', 'РОДНИК', 'УЛИЦА', 'СУДЬБА',
  ],
  hard: [
    // 7 букв
    'РАДОСТЬ', 'ЭНЕРГИЯ', 'СВЕТЛЯК', 'ВЕРШИНА', 'ВЫСОКИЙ',
    'СТОЛИЦА', 'ДЕВУШКА', 'МАЛЬЧИК', 'ПОДРУГА', 'УЧЕБНИК',
    'СТРОЙКА', 'ХОЗЯЙКА', 'БЕДНЯГА', 'МЕЛОДИЯ', 'ОБЛАСТЬ',
    // 8 букв
    'МУДРОСТЬ', 'ОБМАНЩИК', 'ВИНОГРАД', 'РОМАНТИК', 'БРУСНИКА',
    'ТЮЛЬПАНЫ',
  ],
} as const;

// Sanity-filter at module load: only words with all distinct letters survive.
function distinctLetters(w: string): boolean {
  const s = new Set<string>();
  for (const ch of w) {
    if (s.has(ch)) return false;
    s.add(ch);
  }
  return true;
}

export const STRIKEOUT_WORDS: Record<StrikeoutDifficulty, string[]> = {
  easy: RAW_WORDS.easy.filter(distinctLetters),
  medium: RAW_WORDS.medium.filter(distinctLetters),
  hard: RAW_WORDS.hard.filter(distinctLetters),
};

export const RU_ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');
