import { useState, useCallback, useEffect, useRef } from 'react';

const WORD_BANK = [
  'КОТ', 'ДОМ', 'ЛЕС', 'МИР', 'СОН',
  'СТОЛ', 'ОКНО', 'ВОДА', 'НЕБО', 'КУСТ',
  'КНИГА', 'ВЕТЕР', 'ГОРОД', 'ГОЛОС', 'ШКОЛА',
  'КАМЕНЬ', 'СОЛНЦЕ', 'ДЕРЕВО', 'ПОЛЕ', 'РЕКА',
  'ЛИСТ', 'ГОРА', 'МОСТ', 'ПАРК', 'ЗИМА',
  'ЛЕТО', 'ОСЕНЬ', 'ВЕСНА', 'СНЕГ', 'ДОЖДЬ',
];

const SIZE = 14;
type Grid = string[][];
type Direction = [number, number];
const DIRECTIONS: Direction[] = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
  [0, -1], [-1, 0], [-1, -1], [1, -1],
];
const LETTERS = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЬЭЮЯ';

function buildGrid(words: string[]): { grid: Grid; placed: string[] } {
  const grid: Grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
  const placed: string[] = [];

  for (const word of words) {
    let ok = false;
    for (let attempt = 0; attempt < 200 && !ok; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const rStart = Math.floor(Math.random() * SIZE);
      const cStart = Math.floor(Math.random() * SIZE);
      const rEnd = rStart + dr * (word.length - 1);
      const cEnd = cStart + dc * (word.length - 1);
      if (rEnd < 0 || rEnd >= SIZE || cEnd < 0 || cEnd >= SIZE) continue;
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

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    }
  }

  return { grid, placed };
}

function generateGame() {
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5).slice(0, 14);
  return buildGrid(shuffled);
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

export default function Philwords() {
  const [{ grid, placed }, setGame] = useState(() => generateGame());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [selStart, setSelStart] = useState<CellPos | null>(null);
  const [hoverCell, setHoverCell] = useState<CellPos | null>(null);
  const [flash, setFlash] = useState<{ cells: string[]; ok: boolean } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [win, setWin] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [started, setStarted] = useState(false);

  const startNew = useCallback(() => {
    setGame(generateGame());
    setFoundWords(new Set());
    setFoundCells(new Set());
    setSelStart(null);
    setHoverCell(null);
    setFlash(null);
    setElapsed(0);
    setWin(false);
    setStarted(false);
  }, []);

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
    if (!started) setStarted(true);
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

  return (
    <div className="animate-fade-in flex flex-col gap-4" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between glass rounded-2xl px-5 py-3 shadow-sm flex-shrink-0">
        <div>
          <span className="text-gray-500 text-sm">Найдено: </span>
          <span className="font-bold text-blue-600">{foundWords.size}/{placed.length}</span>
        </div>
        <div className="font-mono text-xl font-bold text-gray-700">{formatTime(elapsed)}</div>
        <button onClick={startNew} className="px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all active:scale-95">
          Новая игра
        </button>
      </div>

      {/* Main area: grid left, words right */}
      <div className="flex gap-4 flex-1 min-h-0 items-start">
        {/* Grid — width-driven square, max 68% of container */}
        <div
          className="glass rounded-2xl p-2 shadow-sm flex-shrink-0"
          style={{ width: 'min(68%, 680px)', aspectRatio: '1 / 1' }}
        >
          <div
            className="grid gap-0.5 h-full"
            style={{
              gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${SIZE}, 1fr)`,
            }}
          >
            {grid.map((row, r) =>
              row.map((ch, c) => (
                <button
                  key={`${r}-${c}`}
                  className={`rounded-md font-bold text-sm transition-all duration-100 select-none flex items-center justify-center ${getCellBg(r, c)}`}
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

        {/* Word list — takes remaining horizontal space */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="glass rounded-2xl p-4 shadow-sm flex-1 min-h-0 overflow-auto">
            <h3 className="font-semibold text-gray-600 text-sm mb-3 uppercase tracking-wide">Слова для поиска</h3>
            <div className="grid grid-cols-2 gap-2">
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
            Кликните первую и последнюю букву слова
          </p>
        </div>
      </div>

      {win && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass rounded-3xl p-10 text-center shadow-2xl animate-scale-in max-w-sm mx-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Все слова найдены!</h2>
            <p className="text-gray-500 mb-1">Время</p>
            <p className="text-3xl font-bold text-blue-600 mb-6">{formatTime(elapsed)}</p>
            <button onClick={startNew} className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:opacity-90 transition-all active:scale-95">
              Играть снова
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
