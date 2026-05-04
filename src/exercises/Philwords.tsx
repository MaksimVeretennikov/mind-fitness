import { useState, useCallback, useEffect, useRef } from 'react';
import { saveResult } from '../lib/auth';

const WORD_BANK = [
  // 3 буквы
  'КОТ', 'ДОМ', 'ЛЕС', 'МИР', 'СОН',
  'ЛУГ', 'ЛЕД', 'РОТ', 'ЛУК', 'МАК',
  'РАК', 'БЫК', 'ЖУК', 'ДУБ', 'КИТ',
  'ЛЕВ', 'ВОЛ', 'КОД', 'БОР', 'ВОЗ',
  'СОК', 'НОС', 'РОГ', 'УХО', 'ВЕК',
  'ГОД', 'ЖАР', 'ЗАЛ', 'МЁД', 'МОХ',
  'ПИР', 'РИС', 'РОВ', 'РЯД', 'СЫР',
  'ТАЗ', 'ШАГ', 'ЩИТ', 'СУП', 'ЛОБ',
  'РОЙ', 'ВАЛ', 'ВИД', 'ДАР', 'КОН',
  'УЖ', 'ЁЖ',
  // 4 буквы
  'СТОЛ', 'ОКНО', 'ВОДА', 'НЕБО', 'КУСТ',
  'ЛИСТ', 'ГОРА', 'МОСТ', 'ПАРК', 'ЗИМА',
  'СНЕГ', 'ПОЛЕ', 'РЕКА', 'ЛУНА', 'ЗВУК',
  'ВОЛК', 'СОЛЬ', 'ХЛЕБ', 'ПЫЛЬ', 'ЦВЕТ',
  'СВЕТ', 'ТРУД', 'КРОТ', 'ЛОСЬ', 'КОНЬ',
  'УТКА', 'РОЗА', 'КЛЁН', 'НОЧЬ', 'СЛЕД',
  'РУКА', 'НОГА', 'ГЛАЗ', 'УТРО', 'МОРЕ',
  'ПЛАЩ', 'ШУБА', 'ЗОНТ', 'ВАЗА', 'ОБЕД',
  'ГРИБ', 'ИГРА', 'СЛОН', 'КЛАД', 'ВРАЧ',
  'РОЛЬ', 'ПУТЬ', 'КОЗА', 'ЛУПА', 'БОБР',
  'СОЛО', 'ЯЩИК', 'ОВЁС', 'ЭТАЖ', 'ОРЁЛ',
  'СТУЛ', 'ВЕЕР', 'УЗЕЛ', 'ОЛЕНЬ', 'ЁЛКА',
  // 5 букв
  'КНИГА', 'ВЕТЕР', 'ГОРОД', 'ГОЛОС', 'ШКОЛА',
  'ЗЕМЛЯ', 'БЕРЕГ', 'ПЕСОК', 'ВОЛНА', 'ЛЕТО',
  'ОСЕНЬ', 'ВЕСНА', 'ДОЖДЬ', 'ЗАМОК', 'СОСНА',
  'ТРАВА', 'СЛОВО', 'ТАЙГА', 'СТЕПЬ', 'МЕЧТА',
  'НАРОД', 'ЗАКАТ', 'РУЧЕЙ', 'ПЧЕЛА', 'ОГОНЬ',
  'ОКЕАН', 'РАДИО', 'СЛИВА', 'ВРЕМЯ', 'ЯГОДА',
  'БАШНЯ', 'ПЛАМЯ', 'СКАЛА', 'ВЕНОК', 'ОВРАГ',
  'КОВЁР', 'БАГАЖ', 'ПЕРЕЦ', 'КАРТА', 'РОЯЛЬ',
  'ГРОЗА', 'ЛОДКА', 'ВИШНЯ', 'ШАЛАШ', 'КАПЛЯ',
  'ЛИВЕНЬ', 'ТУЧКА', 'ВОЛОС', 'ЗАРЯ', 'ПОЛКА',
  'СВЕЧА', 'ПЛОТ', 'ИВОЛГА', 'СНЕЖОК',
  // 6 букв
  'КАМЕНЬ', 'СОЛНЦЕ', 'ДЕРЕВО', 'ПОЛЯНА', 'КОРЕНЬ',
  'ПИСЬМО', 'ДОРОГА', 'СИРЕНЬ', 'ЗВЕЗДА', 'СУГРОБ',
  'ЯБЛОКО', 'ПОГОДА', 'РАДУГА', 'УРОЖАЙ', 'ЯНТАРЬ',
  'РОДНИК', 'МУЗЫКА', 'ВЕРБЛЮД', 'ОБЛАКО', 'ПИОНЕР',
  'КОСМОС', 'ПУСТЫНЯ', 'СНЕГИРЬ', 'ВОРОБЕЙ', 'СКВОРЕЦ',
  'ПОЛЁТ', 'РАКЕТА', 'ПУЛЬТ', 'СВИРЕЛЬ', 'СНЕЖИНКА',
  'ПЕЙЗАЖ', 'РАВНИНА', 'СТУДЕНТ', 'УЧИТЕЛЬ', 'ХУДОЖНИК',
  'ОЛЕНЁНОК', 'ЛАСТОЧКА', 'РОМАШКА', 'ВАСИЛЁК', 'ОДУВАНЧИК',
  'БАБОЧКА', 'ОСЬМИНОГ', 'СОКРОВИЩЕ', 'СНЕГОПАД',
];

type Difficulty = 'small' | 'medium' | 'large';

const DIFFICULTIES: Record<Difficulty, { label: string; desc: string; wordCount: number; size: number }> = {
  small:  { label: 'Маленькая', desc: '5 слов · 8×8',   wordCount: 5,  size: 8  },
  medium: { label: 'Средняя',   desc: '10 слов · 12×12', wordCount: 10, size: 12 },
  large:  { label: 'Большая',   desc: '15 слов · 16×16', wordCount: 15, size: 16 },
};

type Grid = string[][];
type Direction = [number, number];
const DIRECTIONS: Direction[] = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
  [0, -1], [-1, 0], [-1, -1], [1, -1],
];
const LETTERS = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЬЭЮЯ';

function buildGrid(words: string[], size: number): { grid: Grid; placed: string[] } {
  const grid: Grid = Array.from({ length: size }, () => Array(size).fill(''));
  const placed: string[] = [];

  for (const word of words) {
    let ok = false;
    for (let attempt = 0; attempt < 200 && !ok; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const rStart = Math.floor(Math.random() * size);
      const cStart = Math.floor(Math.random() * size);
      const rEnd = rStart + dr * (word.length - 1);
      const cEnd = cStart + dc * (word.length - 1);
      if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;
      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const cell = grid[rStart + dr * i][cStart + dc * i];
        if (cell !== '' && cell !== word[i]) { canPlace = false; break; }
      }
      if (canPlace) {
        for (let i = 0; i < word.length; i++) {
          grid[rStart + dr * i][cStart + dc * i] = word[i];
        }
        placed.push(word);
        ok = true;
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    }
  }

  return { grid, placed };
}

function generateGame(difficulty: Difficulty) {
  const { wordCount, size } = DIFFICULTIES[difficulty];
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5).slice(0, wordCount);
  return buildGrid(shuffled, size);
}

interface CellPos { r: number; c: number; }
function posToKey(p: CellPos) { return `${p.r},${p.c}`; }

function getCellsBetween(a: CellPos, b: CellPos): CellPos[] | null {
  const dr = b.r - a.r;
  const dc = b.c - a.c;
  const len = Math.max(Math.abs(dr), Math.abs(dc));
  if (len === 0) return [a];
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
  const cells: CellPos[] = [];
  for (let i = 0; i <= len; i++) {
    cells.push({ r: a.r + stepR * i, c: a.c + stepC * i });
  }
  return cells;
}

type Phase = 'settings' | 'playing';

export default function Philwords() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [phase, setPhase] = useState<Phase>('settings');
  const [{ grid, placed }, setGame] = useState<ReturnType<typeof generateGame>>({ grid: [], placed: [] });
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [selStart, setSelStart] = useState<CellPos | null>(null);
  const [hoverCell, setHoverCell] = useState<CellPos | null>(null);
  const [flash, setFlash] = useState<{ cells: string[]; ok: boolean } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [win, setWin] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [started, setStarted] = useState(false);
  const savedRef = useRef(false);

  const size = DIFFICULTIES[difficulty].size;

  const startGame = useCallback((diff: Difficulty) => {
    const game = generateGame(diff);
    setGame(game);
    setFoundWords(new Set());
    setFoundCells(new Set());
    setSelStart(null);
    setHoverCell(null);
    setFlash(null);
    setElapsed(0);
    setWin(false);
    setStarted(true);
    savedRef.current = false;
    setPhase('playing');
  }, []);

  const backToSettings = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('settings');
    setWin(false);
    setStarted(false);
  }, []);

  // Save result on win
  useEffect(() => {
    if (win && !savedRef.current) {
      savedRef.current = true;
      saveResult('philwords', 100, {
        elapsed,
        wordCount: placed.length,
        difficulty,
        gridSize: size,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win]);

  useEffect(() => {
    if (!started || win) return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, win]);

  const previewCells = new Set<string>();
  if (selStart && hoverCell) {
    const cells = getCellsBetween(selStart, hoverCell);
    if (cells) cells.forEach(c => previewCells.add(posToKey(c)));
  }

  const handleCellClick = (r: number, c: number) => {
    if (win) return;
    if (!selStart) {
      setSelStart({ r, c });
    } else {
      const cells = getCellsBetween(selStart, { r, c });
      if (!cells) { setSelStart({ r, c }); return; }
      const word = cells.map(p => grid[p.r][p.c]).join('');
      const wordRev = [...word].reverse().join('');
      const match = placed.find(w => (w === word || w === wordRev) && !foundWords.has(w));
      const cellKeys = cells.map(posToKey);

      if (match) {
        setFoundWords(prev => {
          const next = new Set([...prev, match]);
          if (next.size === placed.length) {
            setWin(true);
            if (timerRef.current) clearInterval(timerRef.current);
          }
          return next;
        });
        setFoundCells(prev => new Set([...prev, ...cellKeys]));
        setFlash({ cells: cellKeys, ok: true });
      } else {
        setFlash({ cells: cellKeys, ok: false });
      }
      setTimeout(() => setFlash(null), 500);
      setSelStart(null);
    }
  };

  const getCellBg = (r: number, c: number) => {
    const key = posToKey({ r, c });
    if (foundCells.has(key)) return 'bg-green-400 text-white';
    if (flash?.cells.includes(key)) return flash.ok ? 'bg-green-300 text-white' : 'bg-red-300 text-white';
    if (previewCells.has(key)) return 'bg-violet-300 text-white';
    if (selStart && posToKey(selStart) === key) return 'bg-violet-500 text-white';
    return 'bg-white/60 text-gray-700 hover:bg-violet-100';
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}м ${s % 60}с` : `${s}с`;
  };

  // Settings screen
  if (phase === 'settings') {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <div className="glass rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Настройки</h2>
          <span className="text-gray-600 font-medium text-sm">Сложность</span>
          <div className="flex flex-col gap-3 mt-2 mb-6">
            {(Object.entries(DIFFICULTIES) as [Difficulty, typeof DIFFICULTIES[Difficulty]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setDifficulty(key)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                  difficulty === key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white/70 text-gray-600 hover:bg-blue-50'
                }`}
              >
                <span>{cfg.label}</span>
                <span className={`text-sm font-normal ${difficulty === key ? 'text-blue-100' : 'text-gray-400'}`}>{cfg.desc}</span>
              </button>
            ))}
          </div>
          <p className="text-gray-400 text-sm mb-5">
            Найдите все спрятанные слова — они могут идти в любом направлении.
          </p>
          <button
            onClick={() => startGame(difficulty)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Начать
          </button>
        </div>
      </div>
    );
  }

  // Playing screen
  return (
    <div className="animate-fade-in flex flex-col gap-4" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between glass rounded-2xl px-5 py-3 shadow-sm flex-shrink-0">
        <div>
          <span className="text-gray-500 text-sm">Найдено: </span>
          <span className="font-bold text-blue-600">{foundWords.size}/{placed.length}</span>
        </div>
        <div className="font-mono text-xl font-bold text-gray-700">{formatTime(elapsed)}</div>
        <button onClick={backToSettings} className="px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all active:scale-95">
          Настройки
        </button>
      </div>

      {/* Main area: grid left, words right */}
      <div className="flex gap-4 flex-1 min-h-0 items-start">
        {/* Grid */}
        <div
          className="glass rounded-2xl p-2 shadow-sm flex-shrink-0"
          style={{ width: 'min(75%, calc(100vh - 180px))', aspectRatio: '1 / 1' }}
        >
          <div
            className="grid gap-0.5 h-full"
            style={{
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              gridTemplateRows: `repeat(${size}, 1fr)`,
            }}
          >
            {grid.map((row, r) =>
              row.map((ch, c) => (
                <button
                  key={`${r}-${c}`}
                  className={`rounded-md font-bold transition-all duration-100 select-none flex items-center justify-center ${
                    size >= 18 ? 'text-xs' : size >= 14 ? 'text-sm' : 'text-base'
                  } ${getCellBg(r, c)}`}
                  onClick={() => handleCellClick(r, c)}
                  onMouseEnter={() => setHoverCell({ r, c })}
                  onMouseLeave={() => setHoverCell(null)}
                >
                  {ch}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Word list */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="glass rounded-2xl p-4 shadow-sm flex-1 min-h-0 overflow-auto">
            <h3 className="font-semibold text-gray-600 text-sm mb-3 uppercase tracking-wide">Слова для поиска</h3>
            <div className={`grid gap-2 ${placed.length <= 5 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {placed.map(w => (
                <div
                  key={w}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${foundWords.has(w) ? 'bg-green-100 text-green-700 line-through' : 'bg-white/60 text-gray-700'}`}
                >
                  {foundWords.has(w) ? '✓ ' : '○ '}{w}
                </div>
              ))}
            </div>
          </div>
          <p className="text-gray-400 text-xs glass rounded-xl px-3 py-2 flex-shrink-0">
            Кликните первую и последнюю буквы слова
          </p>
        </div>
      </div>

      {win && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass rounded-3xl p-10 text-center shadow-2xl animate-scale-in max-w-sm mx-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Все слова найдены!</h2>
            <div className="glass rounded-2xl p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Время:</span>
                <span className="text-2xl font-bold text-blue-600">{formatTime(elapsed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Слов найдено:</span>
                <span className="font-bold text-gray-800">{placed.length} ({DIFFICULTIES[difficulty].label.toLowerCase()})</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={backToSettings} className="flex-1 py-3 rounded-xl glass text-gray-700 font-semibold hover:bg-white/80 transition-all active:scale-95">Настройки</button>
              <button onClick={() => startGame(difficulty)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">
                Ещё раз
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
