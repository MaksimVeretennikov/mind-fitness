import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { saveResult } from '../lib/auth';

/* ─── Word Bank ─────────────────────────────────────────────────────────────── */

interface AdverbItem {
  display: string;   // neutral form shown to user (always with spaces)
  answer: 'слитно' | 'раздельно';
  correct: string;   // correctly spelled form shown in mistakes/reveal
}

const ADVERBS: AdverbItem[] = [
  // В (слитно)
  { display: "в близи",       answer: "слитно",    correct: "вблизи" },
  { display: "в бок",         answer: "слитно",    correct: "вбок" },
  { display: "в брод",        answer: "слитно",    correct: "вброд" },
  { display: "в верх",        answer: "слитно",    correct: "вверх" },
  { display: "в глубь",       answer: "слитно",    correct: "вглубь" },
  { display: "в далеке",      answer: "слитно",    correct: "вдалеке" },
  { display: "в дали",        answer: "слитно",    correct: "вдали" },
  { display: "в даль",        answer: "слитно",    correct: "вдаль" },
  { display: "в двое",        answer: "слитно",    correct: "вдвое" },
  { display: "в двоём",       answer: "слитно",    correct: "вдвоём" },
  { display: "в заперти",     answer: "слитно",    correct: "взаперти" },
  { display: "в конец",       answer: "слитно",    correct: "вконец" },
  { display: "в лево",        answer: "слитно",    correct: "влево" },
  { display: "в месте",       answer: "слитно",    correct: "вместе" },
  { display: "в миг",         answer: "слитно",    correct: "вмиг" },
  { display: "в начале",      answer: "слитно",    correct: "вначале" },
  { display: "в низ",         answer: "слитно",    correct: "вниз" },
  { display: "в низу",        answer: "слитно",    correct: "внизу" },
  { display: "в ничью",       answer: "слитно",    correct: "вничью" },
  { display: "в нутри",       answer: "слитно",    correct: "внутри" },
  { display: "в нутрь",       answer: "слитно",    correct: "внутрь" },
  { display: "во время",      answer: "слитно",    correct: "вовремя" },
  { display: "во всю",        answer: "слитно",    correct: "вовсю" },
  { display: "во едино",      answer: "слитно",    correct: "воедино" },
  { display: "во круг",       answer: "слитно",    correct: "вокруг" },
  { display: "во обще",       answer: "слитно",    correct: "вообще" },
  { display: "в первые",      answer: "слитно",    correct: "впервые" },
  { display: "в переди",      answer: "слитно",    correct: "впереди" },
  { display: "в перемешку",   answer: "слитно",    correct: "вперемешку" },
  { display: "в перёд",       answer: "слитно",    correct: "вперёд" },
  { display: "в плотную",     answer: "слитно",    correct: "вплотную" },
  { display: "в пол голоса",  answer: "слитно",    correct: "вполголоса" },
  { display: "в пол оборота", answer: "слитно",    correct: "вполоборота" },
  { display: "в пол силы",    answer: "слитно",    correct: "вполсилы" },
  { display: "в последствии", answer: "слитно",    correct: "впоследствии" },
  { display: "в потьмах",     answer: "слитно",    correct: "впотьмах" },
  { display: "в правду",      answer: "слитно",    correct: "вправду" },
  { display: "в праве",       answer: "слитно",    correct: "вправе" },
  { display: "в право",       answer: "слитно",    correct: "вправо" },
  { display: "в прочем",      answer: "слитно",    correct: "впрочем" },
  { display: "в рассыпную",   answer: "слитно",    correct: "врассыпную" },
  { display: "в растяжку",    answer: "слитно",    correct: "врастяжку" },
  { display: "все рьёз",      answer: "слитно",    correct: "всерьёз" },
  { display: "все цело",      answer: "слитно",    correct: "всецело" },
  { display: "в скользь",     answer: "слитно",    correct: "вскользь" },
  { display: "в скоре",       answer: "слитно",    correct: "вскоре" },
  { display: "в след",        answer: "слитно",    correct: "вслед" },
  { display: "в слепую",      answer: "слитно",    correct: "вслепую" },
  { display: "в сплошную",    answer: "слитно",    correct: "всплошную" },
  { display: "в тайне",       answer: "слитно",    correct: "втайне" },
  { display: "в трое",        answer: "слитно",    correct: "втрое" },
  { display: "в троём",       answer: "слитно",    correct: "втроём" },
  { display: "в ширь",        answer: "слитно",    correct: "вширь" },
  // Д (слитно)
  { display: "до бела",       answer: "слитно",    correct: "добела" },
  { display: "до верху",      answer: "слитно",    correct: "доверху" },
  { display: "до нельзя",     answer: "слитно",    correct: "донельзя" },
  { display: "до суха",       answer: "слитно",    correct: "досуха" },
  { display: "до сыта",       answer: "слитно",    correct: "досыта" },
  { display: "до чиста",      answer: "слитно",    correct: "дочиста" },
  // З (слитно)
  { display: "за муж",        answer: "слитно",    correct: "замуж" },
  { display: "за одно",       answer: "слитно",    correct: "заодно" },
  { display: "за тем",        answer: "слитно",    correct: "затем" },
  { display: "за частую",     answer: "слитно",    correct: "зачастую" },
  { display: "за чем",        answer: "слитно",    correct: "зачем" },
  // И (слитно)
  { display: "из давна",      answer: "слитно",    correct: "издавна" },
  { display: "из далека",     answer: "слитно",    correct: "издалека" },
  { display: "из нутри",      answer: "слитно",    correct: "изнутри" },
  { display: "и так",         answer: "слитно",    correct: "итак" },
  // К (слитно)
  { display: "к верху",       answer: "слитно",    correct: "кверху" },
  { display: "к ряду",        answer: "слитно",    correct: "кряду" },
  { display: "к стати",       answer: "слитно",    correct: "кстати" },
  // Н (слитно)
  { display: "на бок",        answer: "слитно",    correct: "набок" },
  { display: "на век",        answer: "слитно",    correct: "навек" },
  { display: "на верх",       answer: "слитно",    correct: "наверх" },
  { display: "на верху",      answer: "слитно",    correct: "наверху" },
  { display: "на взничь",     answer: "слитно",    correct: "навзничь" },
  { display: "на всегда",     answer: "слитно",    correct: "навсегда" },
  { display: "на встречу",    answer: "слитно",    correct: "навстречу" },
  { display: "на двое",       answer: "слитно",    correct: "надвое" },
  { display: "на едине",      answer: "слитно",    correct: "наедине" },
  { display: "на завтра",     answer: "слитно",    correct: "назавтра" },
  { display: "на зад",        answer: "слитно",    correct: "назад" },
  { display: "на зло",        answer: "слитно",    correct: "назло" },
  { display: "на зубок",      answer: "слитно",    correct: "назубок" },
  { display: "на изусть",     answer: "слитно",    correct: "наизусть" },
  { display: "на кануне",     answer: "слитно",    correct: "накануне" },
  { display: "на конец",      answer: "слитно",    correct: "наконец" },
  { display: "на лево",       answer: "слитно",    correct: "налево" },
  { display: "на оборот",     answer: "слитно",    correct: "наоборот" },
  { display: "на перегонки",  answer: "слитно",    correct: "наперегонки" },
  { display: "на перекор",    answer: "слитно",    correct: "наперекор" },
  { display: "на перёд",      answer: "слитно",    correct: "наперёд" },
  { display: "на показ",      answer: "слитно",    correct: "напоказ" },
  { display: "на половину",   answer: "слитно",    correct: "наполовину" },
  { display: "на право",      answer: "слитно",    correct: "направо" },
  { display: "на против",     answer: "слитно",    correct: "напротив" },
  { display: "на прямую",     answer: "слитно",    correct: "напрямую" },
  { display: "на равне",      answer: "слитно",    correct: "наравне" },
  { display: "на распашку",   answer: "слитно",    correct: "нараспашку" },
  { display: "на ружу",       answer: "слитно",    correct: "наружу" },
  { display: "на сквозь",     answer: "слитно",    correct: "насквозь" },
  { display: "на сколько",    answer: "слитно",    correct: "насколько" },
  { display: "на смерть",     answer: "слитно",    correct: "насмерть" },
  { display: "на совсем",     answer: "слитно",    correct: "насовсем" },
  { display: "на спех",       answer: "слитно",    correct: "наспех" },
  { display: "на стежь",      answer: "слитно",    correct: "настежь" },
  { display: "на столько",    answer: "слитно",    correct: "настолько" },
  { display: "на трое",       answer: "слитно",    correct: "натрое" },
  { display: "на угад",       answer: "слитно",    correct: "наугад" },
  { display: "на утёк",       answer: "слитно",    correct: "наутёк" },
  { display: "на утро",       answer: "слитно",    correct: "наутро" },
  // О (слитно)
  { display: "от куда",       answer: "слитно",    correct: "откуда" },
  { display: "от сюда",       answer: "слитно",    correct: "отсюда" },
  { display: "от того",       answer: "слитно",    correct: "оттого" },
  { display: "от туда",       answer: "слитно",    correct: "оттуда" },
  { display: "от части",      answer: "слитно",    correct: "отчасти" },
  { display: "от чего",       answer: "слитно",    correct: "отчего" },
  // П (слитно)
  { display: "по ближе",      answer: "слитно",    correct: "поближе" },
  { display: "по больше",     answer: "слитно",    correct: "побольше" },
  { display: "по быстрее",    answer: "слитно",    correct: "побыстрее" },
  { display: "по верху",      answer: "слитно",    correct: "поверху" },
  { display: "по всюду",      answer: "слитно",    correct: "повсюду" },
  { display: "по зади",       answer: "слитно",    correct: "позади" },
  { display: "по истине",     answer: "слитно",    correct: "поистине" },
  { display: "по меньше",     answer: "слитно",    correct: "поменьше" },
  { display: "по мимо",       answer: "слитно",    correct: "помимо" },
  { display: "по началу",     answer: "слитно",    correct: "поначалу" },
  { display: "по неволе",     answer: "слитно",    correct: "поневоле" },
  { display: "по немногу",    answer: "слитно",    correct: "понемногу" },
  { display: "по одиночке",   answer: "слитно",    correct: "поодиночке" },
  { display: "по ровну",      answer: "слитно",    correct: "поровну" },
  { display: "по просту",     answer: "слитно",    correct: "попросту" },
  { display: "по скорее",     answer: "слитно",    correct: "поскорее" },
  { display: "по среди",      answer: "слитно",    correct: "посреди" },
  { display: "по средине",    answer: "слитно",    correct: "посредине" },
  { display: "по тому",       answer: "слитно",    correct: "потому" },
  { display: "по очерёдно",   answer: "слитно",    correct: "поочерёдно" },
  { display: "по чему",       answer: "слитно",    correct: "почему" },
  { display: "по этому",      answer: "слитно",    correct: "поэтому" },
  // С (слитно)
  { display: "с боку",        answer: "слитно",    correct: "сбоку" },
  { display: "с верху",       answer: "слитно",    correct: "сверху" },
  { display: "се йчас",       answer: "слитно",    correct: "сейчас" },
  { display: "с зади",        answer: "слитно",    correct: "сзади" },
  { display: "с лева",        answer: "слитно",    correct: "слева" },
  { display: "с наружи",      answer: "слитно",    correct: "снаружи" },
  { display: "с начала",      answer: "слитно",    correct: "сначала" },
  { display: "с низу",        answer: "слитно",    correct: "снизу" },
  { display: "с нова",        answer: "слитно",    correct: "снова" },
  { display: "со всем",       answer: "слитно",    correct: "совсем" },
  { display: "с разу",        answer: "слитно",    correct: "сразу" },
  { display: "с плеча",       answer: "слитно",    correct: "сплеча" },
  { display: "с права",       answer: "слитно",    correct: "справа" },
  // Т (слитно)
  { display: "тот час",       answer: "слитно",    correct: "тотчас" },

  // РАЗДЕЛЬНО
  { display: "без оглядки",    answer: "раздельно", correct: "без оглядки" },
  { display: "без разбору",    answer: "раздельно", correct: "без разбору" },
  { display: "без спросу",     answer: "раздельно", correct: "без спросу" },
  { display: "без толку",      answer: "раздельно", correct: "без толку" },
  { display: "без умолку",     answer: "раздельно", correct: "без умолку" },
  { display: "бок о бок",      answer: "раздельно", correct: "бок о бок" },
  { display: "в виде",         answer: "раздельно", correct: "в виде" },
  { display: "в глаза",        answer: "раздельно", correct: "в глаза" },
  { display: "в заключение",   answer: "раздельно", correct: "в заключение" },
  { display: "в конце концов", answer: "раздельно", correct: "в конце концов" },
  { display: "вне зависимости",answer: "раздельно", correct: "вне зависимости" },
  { display: "в обнимку",      answer: "раздельно", correct: "в обнимку" },
  { display: "в обтяжку",      answer: "раздельно", correct: "в обтяжку" },
  { display: "в общем",        answer: "раздельно", correct: "в общем" },
  { display: "во власти",      answer: "раздельно", correct: "во власти" },
  { display: "в одиночку",     answer: "раздельно", correct: "в одиночку" },
  { display: "во избежание",   answer: "раздельно", correct: "во избежание" },
  { display: "в открытую",     answer: "раздельно", correct: "в открытую" },
  { display: "в потёмках",     answer: "раздельно", correct: "в потёмках" },
  { display: "в розницу",      answer: "раздельно", correct: "в розницу" },
  { display: "в сердцах",      answer: "раздельно", correct: "в сердцах" },
  { display: "всё равно",      answer: "раздельно", correct: "всё равно" },
  { display: "в ходу",         answer: "раздельно", correct: "в ходу" },
  { display: "в упор",         answer: "раздельно", correct: "в упор" },
  { display: "в целом",        answer: "раздельно", correct: "в целом" },
  { display: "до сих пор",     answer: "раздельно", correct: "до сих пор" },
  { display: "до завтра",      answer: "раздельно", correct: "до завтра" },
  { display: "до конца",       answer: "раздельно", correct: "до конца" },
  { display: "за глаза",       answer: "раздельно", correct: "за глаза" },
  { display: "за границей",    answer: "раздельно", correct: "за границей" },
  { display: "за границу",     answer: "раздельно", correct: "за границу" },
  { display: "как раз",        answer: "раздельно", correct: "как раз" },
  { display: "как только",     answer: "раздельно", correct: "как только" },
  { display: "к вечеру",       answer: "раздельно", correct: "к вечеру" },
  { display: "к утру",         answer: "раздельно", correct: "к утру" },
  { display: "на бегу",        answer: "раздельно", correct: "на бегу" },
  { display: "на вид",         answer: "раздельно", correct: "на вид" },
  { display: "на виду",        answer: "раздельно", correct: "на виду" },
  { display: "на глаз",        answer: "раздельно", correct: "на глаз" },
  { display: "на глазок",      answer: "раздельно", correct: "на глазок" },
  { display: "на днях",        answer: "раздельно", correct: "на днях" },
  { display: "на лету",        answer: "раздельно", correct: "на лету" },
  { display: "на миг",         answer: "раздельно", correct: "на миг" },
  { display: "на ощупь",       answer: "раздельно", correct: "на ощупь" },
  { display: "на радостях",    answer: "раздельно", correct: "на радостях" },
  { display: "на редкость",    answer: "раздельно", correct: "на редкость" },
  { display: "на совесть",     answer: "раздельно", correct: "на совесть" },
  { display: "на убыль",       answer: "раздельно", correct: "на убыль" },
  { display: "на ходу",        answer: "раздельно", correct: "на ходу" },
  { display: "по временам",    answer: "раздельно", correct: "по временам" },
  { display: "по двое",        answer: "раздельно", correct: "по двое" },
  { display: "по крайней мере",answer: "раздельно", correct: "по крайней мере" },
  { display: "по мере",        answer: "раздельно", correct: "по мере" },
  { display: "по одному",      answer: "раздельно", correct: "по одному" },
  { display: "по очереди",     answer: "раздельно", correct: "по очереди" },
  { display: "по памяти",      answer: "раздельно", correct: "по памяти" },
  { display: "по праву",       answer: "раздельно", correct: "по праву" },
  { display: "по совести",     answer: "раздельно", correct: "по совести" },
  { display: "по ходу",        answer: "раздельно", correct: "по ходу" },
  { display: "по трое",        answer: "раздельно", correct: "по трое" },
  { display: "про себя",       answer: "раздельно", correct: "про себя" },
  { display: "с виду",         answer: "раздельно", correct: "с виду" },
  { display: "след в след",    answer: "раздельно", correct: "след в след" },
  { display: "со временем",    answer: "раздельно", correct: "со временем" },
  { display: "с полуслова",    answer: "раздельно", correct: "с полуслова" },
  { display: "с разбегу",      answer: "раздельно", correct: "с разбегу" },
  { display: "с размаху",      answer: "раздельно", correct: "с размаху" },
  { display: "с ходу",         answer: "раздельно", correct: "с ходу" },
];

/* ─── Types ─────────────────────────────────────────────────────────────────── */

type Phase = 'setup' | 'playing' | 'result';

interface Mistake {
  display: string;
  correct: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── Component ─────────────────────────────────────────────────────────────── */

interface Props {
  onBack: () => void;
}

export default function Adverbs({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(10);
  const [words, setWords] = useState<AdverbItem[]>([]);
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [locked, setLocked] = useState(false);
  const [cardBg, setCardBg] = useState('rgba(255,255,255,0.85)');
  const [revealText, setRevealText] = useState('');
  const [shaking, setShaking] = useState(false);
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const cardKey = useRef(0);
  const savedRef = useRef(false);
  const controls = useAnimation();
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (phase !== 'playing') return;
    controls.set({ x: 0, y: 40, opacity: 0, scale: 0.96 });
    controls.start({ y: 0, opacity: 1, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } });
  }, [renderKey, phase]);

  function startGame() {
    const selected = shuffle(ADVERBS).slice(0, count);
    setWords(selected);
    setIndex(0);
    setMistakes([]);
    setLocked(false);
    setCardBg('rgba(255,255,255,0.85)');
    setRevealText('');
    setShaking(false);
    savedRef.current = false;
    cardKey.current = 0;
    setPhase('playing');
    setRenderKey(k => k + 1);
  }

  async function handleAnswer(answer: 'слитно' | 'раздельно') {
    if (locked) return;
    setLocked(true);

    const current = words[index];
    const isCorrect = answer === current.answer;

    if (isCorrect) {
      setCardBg('rgba(134, 239, 172, 0.55)');
      await controls.start({
        x: 380,
        opacity: 0,
        scale: 0.88,
        transition: { duration: 0.38, ease: 'easeIn' },
      });
      advanceTo(index + 1, mistakes);
    } else {
      const newMistakes = [
        ...mistakes,
        { display: current.display, correct: current.correct },
      ];
      setMistakes(newMistakes);

      // Red shake
      setCardBg('rgba(252, 165, 165, 0.55)');
      setShaking(true);
      await new Promise<void>(r => setTimeout(r, 520));
      setShaking(false);

      // Reveal correct spelling
      setRevealText(current.correct);
      setCardBg('rgba(134, 239, 172, 0.45)');
      await new Promise<void>(r => setTimeout(r, 1500));

      // Slide down
      await controls.start({
        y: 70,
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeIn' },
      });
      advanceTo(index + 1, newMistakes);
    }
  }

  function advanceTo(nextIndex: number, currentMistakes: Mistake[]) {
    const correct = nextIndex - currentMistakes.length;
    const total = words.length;

    if (nextIndex >= total) {
      const score = Math.round((correct / total) * 100);
      if (!savedRef.current) {
        savedRef.current = true;
        saveResult('adverbs', score, { correct, total, errors: currentMistakes.length });
      }
      setFinalCorrect(correct);
      setFinalTotal(total);
      setPhase('result');
      return;
    }

    setIndex(nextIndex);
    setCardBg('rgba(255,255,255,0.85)');
    setRevealText('');
    controls.set({ x: 0, y: 0, opacity: 1, scale: 1 });
    cardKey.current += 1;
    setRenderKey(k => k + 1);
    setLocked(false);
  }

  /* ─── Setup Screen ──────────────────────────────────────────────────────── */
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">📝</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Правописание наречий</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Слитно или раздельно? Выберите количество слов
          </p>
        </div>

        <div className="glass rounded-2xl p-8 w-full max-w-sm shadow-sm flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
              Количество слов
            </p>
            <div className="flex gap-2 justify-center">
              {[10, 20, 30].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    count === n
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md'
                      : 'glass text-gray-600 hover:bg-white/80 border border-white/60'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200 active:scale-95"
          >
            Начать
          </button>
        </div>
      </div>
    );
  }

  /* ─── Result Screen ─────────────────────────────────────────────────────── */
  if (phase === 'result') {
    const pct = finalTotal > 0 ? finalCorrect / finalTotal : 0;
    const scoreColor =
      pct >= 0.8 ? 'text-emerald-600' : pct >= 0.5 ? 'text-amber-500' : 'text-red-500';
    const label =
      pct >= 0.8 ? '🎉 Отлично!' : pct >= 0.5 ? '👍 Неплохо!' : '📚 Нужно потренироваться';

    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fade-in max-w-lg mx-auto">
        <div className="text-center">
          <div className={`text-7xl font-bold mb-2 ${scoreColor}`}>
            {finalCorrect} / {finalTotal}
          </div>
          <p className="text-gray-500 text-xl">{label}</p>
        </div>

        {mistakes.length > 0 && (
          <div className="glass rounded-2xl p-6 w-full shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">
              Ошибки ({mistakes.length})
            </h3>
            <div className="flex flex-col gap-1.5">
              {mistakes.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-500">{m.display}</span>
                  <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">
                    {m.correct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={startGame}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Ещё раз
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 glass hover:bg-white/80 transition-all active:scale-95"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  /* ─── Playing Screen ────────────────────────────────────────────────────── */
  const currentWord = words[index];
  const progressPct = (index / words.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
          <span>{index + 1} / {words.length}</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-2 bg-white/50 rounded-full overflow-hidden border border-white/40">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <motion.div
        animate={controls}
        className={`w-full max-w-md rounded-2xl p-10 shadow-md border border-white/60 flex flex-col items-center gap-4 backdrop-blur-md transition-colors duration-200 ${
          shaking ? 'adverb-shake' : ''
        }`}
        style={{ backgroundColor: cardBg }}
      >
        <p className="text-4xl font-bold text-gray-800 text-center leading-tight">
          {currentWord.display}
        </p>

        {revealText && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Правильно
            </span>
            <span className="text-xl font-bold text-emerald-600">{revealText}</span>
          </div>
        )}
      </motion.div>

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={() => handleAnswer('слитно')}
          disabled={locked}
          className="flex-1 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          СЛИТНО
        </button>
        <button
          onClick={() => handleAnswer('раздельно')}
          disabled={locked}
          className="flex-1 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          РАЗДЕЛЬНО
        </button>
      </div>
    </div>
  );
}
