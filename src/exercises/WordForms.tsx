import { useState, useMemo } from 'react';
import ChoiceQuiz, { type QuizItem } from './ChoiceQuiz';

interface Props {
  onBack: () => void;
}

interface Item {
  base: string;
  hint?: string;
  correct: string;
  wrong: string;
}

const ITEMS: Item[] = [
  { base: 'БУХГАЛТЕР', correct: 'бухгалтеры', wrong: 'бухгалтера' },
  { base: 'ПЛЕЕР', correct: 'плееры', wrong: 'плеера' },
  { base: 'ВОЗРАСТ', correct: 'возрасты', wrong: 'возраста' },
  { base: 'ВЫГОВОР', correct: 'выговоры', wrong: 'выговора' },
  { base: 'ПОРТ', correct: 'порты', wrong: 'порта' },
  { base: 'ГРИФЕЛЬ', correct: 'грифели', wrong: 'грифеля' },
  { base: 'РЕДАКТОР', correct: 'редакторы', wrong: 'редактора' },
  { base: 'ДИСПЕТЧЕР', correct: 'диспетчеры', wrong: 'диспетчера' },
  { base: 'РЕКТОР', correct: 'ректоры', wrong: 'ректора' },
  { base: 'ДОГОВОР', correct: 'договоры', wrong: 'договора' },
  { base: 'СКЛАД', correct: 'склады', wrong: 'склада' },
  { base: 'ДРАЙВЕР', correct: 'драйверы', wrong: 'драйвера' },
  { base: 'СЛЕСАРЬ', correct: 'слесари', wrong: 'слесаря' },
  { base: 'ИНЖЕНЕР', correct: 'инженеры', wrong: 'инженера' },
  { base: 'СЛОГ', correct: 'слоги', wrong: 'слога' },
  { base: 'ИНСТРУКТОР', correct: 'инструкторы', wrong: 'инструктора' },
  { base: 'СНАЙПЕР', correct: 'снайперы', wrong: 'снайпера' },
  { base: 'ИНСПЕКТОР', correct: 'инспекторы', wrong: 'инспектора' },
  { base: 'СТОЛЯР', correct: 'столяры', wrong: 'столяра' },
  { base: 'КОМПРЕССОР', correct: 'компрессоры', wrong: 'компрессора' },
  { base: 'ТОРТ', correct: 'торты', wrong: 'торта' },
  { base: 'КОНСТРУКТОР', correct: 'конструкторы', wrong: 'конструктора' },
  { base: 'ТРЕНЕР', correct: 'тренеры', wrong: 'тренера' },
  { base: 'КОНТЕЙНЕР', correct: 'контейнеры', wrong: 'контейнера' },
  { base: 'ФРОНТ', correct: 'фронты', wrong: 'фронта' },
  { base: 'МЕСЯЦ', correct: 'месяцы', wrong: 'месяца' },
  { base: 'ШОФЁР', correct: 'шофёры', wrong: 'шофера' },
  { base: 'АДРЕС', correct: 'адреса', wrong: 'адресы' },
  { base: 'ПАСПОРТ', correct: 'паспорта', wrong: 'паспорты' },
  { base: 'ВОРОХ', correct: 'вороха', wrong: 'ворохи' },
  { base: 'ПОВАР', correct: 'повара', wrong: 'повары' },
  { base: 'ДИРЕКТОР', correct: 'директора', wrong: 'директоры' },
  { base: 'ПОГРЕБ', correct: 'погреба', wrong: 'погребы' },
  { base: 'ДОКТОР', correct: 'доктора', wrong: 'докторы' },
  { base: 'ПОЯС', correct: 'пояса', wrong: 'поясы' },
  { base: 'КАТЕР', correct: 'катера', wrong: 'катеры' },
  { base: 'ПРОФЕССОР', correct: 'профессора', wrong: 'профессоры' },
  { base: 'КОЛОКОЛ', correct: 'колокола', wrong: 'колоколы' },
  { base: 'СОРТ', correct: 'сорта', wrong: 'сорты' },
  { base: 'КУПОЛ', correct: 'купола', wrong: 'куполы' },
  { base: 'СТОГ', correct: 'стога', wrong: 'стоги' },
  { base: 'КУЧЕР', correct: 'кучера', wrong: 'кучеры' },
  { base: 'СТОРОЖ', correct: 'сторожа', wrong: 'сторожи' },
  { base: 'ОКОРОК', correct: 'окорока', wrong: 'окороки' },
  { base: 'ТЕРЕМ', correct: 'терема', wrong: 'теремы' },
  { base: 'ОКРУГ', correct: 'округа', wrong: 'округи' },
  { base: 'ХУТОР', correct: 'хутора', wrong: 'хуторы' },
  { base: 'ОРДЕР', hint: 'письменное распоряжение', correct: 'ордера', wrong: 'ордеры' },
  { base: 'ЯКОРЬ', correct: 'якоря', wrong: 'якори' },
  { base: 'КУРИЦА', correct: 'куры', wrong: 'курицы' },
  { base: 'ДНО', correct: 'донья', wrong: 'дна' },
  { base: 'ШИЛО', correct: 'шилья', wrong: 'шилы' },
  { base: 'ПОЛЕНО', correct: 'поленья', wrong: 'полена' },
  { base: 'КОРПУС', hint: 'туловища', correct: 'корпусы', wrong: 'корпуса' },
  { base: 'КОРПУС', hint: 'здания', correct: 'корпуса', wrong: 'корпусы' },
  { base: 'ЛАГЕРЬ', hint: 'политические', correct: 'лагери', wrong: 'лагеря' },
  { base: 'ЛАГЕРЬ', hint: 'туристические', correct: 'лагеря', wrong: 'лагери' },
  { base: 'МУЖ', hint: 'государственные', correct: 'мужи', wrong: 'мужья' },
  { base: 'МУЖ', hint: 'в семьях', correct: 'мужья', wrong: 'мужи' },
  { base: 'ЗУБ', hint: 'у человека', correct: 'зубы', wrong: 'зубья' },
  { base: 'ЗУБ', hint: 'у пилы', correct: 'зубья', wrong: 'зубы' },
  { base: 'ПРОПУСК', hint: 'пробелы', correct: 'пропуски', wrong: 'пропуска' },
  { base: 'ПРОПУСК', hint: 'документы', correct: 'пропуска', wrong: 'пропуски' },
  { base: 'ОРДЕН', hint: 'рыцарские', correct: 'ордены', wrong: 'ордена' },
  { base: 'ОРДЕН', hint: 'награды', correct: 'ордена', wrong: 'ордены' },
  { base: 'ОБРАЗ', hint: 'художественные', correct: 'образы', wrong: 'образа' },
  { base: 'ОБРАЗ', hint: 'иконы', correct: 'образа', wrong: 'образы' },
  { base: 'ТОН', hint: 'звуки', correct: 'тоны', wrong: 'тона' },
  { base: 'ТОН', hint: 'оттенки цвета', correct: 'тона', wrong: 'тоны' },
  { base: 'ХЛЕБ', hint: 'пищевые продукты', correct: 'хлебы', wrong: 'хлеба' },
  { base: 'ХЛЕБ', hint: 'злаки', correct: 'хлеба', wrong: 'хлебы' },
  { base: 'БАСНЯ', correct: 'басен', wrong: 'басней' },
  { base: 'КУХНЯ', correct: 'кухонь', wrong: 'кухней' },
  { base: 'СЕРЬГА', correct: 'серёг', wrong: 'серьгей' },
  { base: 'БАШНЯ', correct: 'башен', wrong: 'башней' },
  { base: 'МАКАРОНЫ', correct: 'макарон', wrong: 'макаронов' },
  { base: 'СПЛЕТНЯ', correct: 'сплетен', wrong: 'сплетней' },
  { base: 'БРЫЗГИ', correct: 'брызг', wrong: 'брызгов' },
  { base: 'МАНЖЕТА', correct: 'манжет', wrong: 'манжетов' },
  { base: 'ТУФЛИ', correct: 'туфель', wrong: 'туфлей' },
  { base: 'ВАФЛЯ', correct: 'вафель', wrong: 'вафлей' },
  { base: 'НЯНЯ', correct: 'нянь', wrong: 'няней' },
  { base: 'ЦАПЛЯ', correct: 'цапель', wrong: 'цаплей' },
  { base: 'ДЕЛО', correct: 'дел', wrong: 'делов' },
  { base: 'ПЕТЛЯ', correct: 'петель', wrong: 'петлей' },
  { base: 'ЯБЛОНЯ', correct: 'яблонь', wrong: 'яблоней' },
  { base: 'КОЧЕРГА', correct: 'кочерёг', wrong: 'кочерег' },
  { base: 'САБЛЯ', correct: 'сабель', wrong: 'саблей' },
  { base: 'БРОНХИ', correct: 'бронхов', wrong: 'бронх' },
  { base: 'ЗАМОРОЗКИ', correct: 'заморозков', wrong: 'заморозок' },
  { base: 'НЕРВЫ', correct: 'нервов', wrong: 'нерв' },
  { base: 'ДЕБАТЫ', correct: 'дебатов', wrong: 'дебат' },
  { base: 'КОНСЕРВЫ', correct: 'консервов', wrong: 'консерв' },
  { base: 'КОММЕНТАРИИ', correct: 'комментариев', wrong: 'комментарий' },
  { base: 'СУМЕРКИ', correct: 'сумерек', wrong: 'сумерков' },
  { base: 'ВИШНЯ', correct: 'вишен', wrong: 'вишней' },
  { base: 'СОСИСКИ', correct: 'сосисок', wrong: 'сосисков' },
  { base: 'КОНЮШНЯ', correct: 'конюшен', wrong: 'конюшней' },
  { base: 'КОФЕЙНЯ', correct: 'кофеен', wrong: 'кофейней' },
  { base: 'ЧЕРЕШНЯ', correct: 'черешен', wrong: 'черешней' },
];

export default function WordForms({ onBack }: Props) {
  const [count, setCount] = useState(10);

  const pool = useMemo<QuizItem[]>(
    () =>
      ITEMS.map((it) => ({
        display: it.base,
        hint: it.hint ? `(${it.hint})` : undefined,
        correct: it.correct,
        wrong: it.wrong,
      })),
    [],
  );

  return (
    <ChoiceQuiz
      pool={pool}
      resultKey="word-forms"
      title="Формы слова"
      emoji="📚"
      subtitle="Выберите правильную форму множественного числа"
      count={count}
      onCountChange={setCount}
      onBack={onBack}
    />
  );
}
