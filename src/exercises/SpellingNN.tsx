import { useState, useMemo } from 'react';
import ChoiceQuiz, { type QuizItem } from './ChoiceQuiz';

interface Props {
  onBack: () => void;
}

interface Item {
  /** Word with н/нн omitted, e.g. "жева_ый" */
  display: string;
  /** Word with single Н */
  single: string;
  /** Word with double НН */
  double: string;
  /** Which one is correct */
  answer: 'single' | 'double';
  /** Optional context note shown under the prompt */
  hint?: string;
}

const ITEMS: Item[] = [
  // Single Н
  { display: 'бессребре_ик', single: 'бессребреник', double: 'бессребренник', answer: 'single' },
  { display: 'ветре_ик', single: 'ветреник', double: 'ветренник', answer: 'single' },
  { display: 'вое_ачальник', single: 'военачальник', double: 'военначальник', answer: 'single' },
  { display: 'крупе_ик', single: 'крупеник', double: 'крупенник', answer: 'single' },
  { display: 'прида_ое', single: 'приданое', double: 'приданное', answer: 'single' },
  { display: 'пря_ик', single: 'пряник', double: 'прянник', answer: 'single' },
  { display: 'пудре_ица', single: 'пудреница', double: 'пудренница', answer: 'single' },
  { display: 'смышлё_ость', single: 'смышлёность', double: 'смышлённость', answer: 'single' },
  { display: 'труже_ик', single: 'труженик', double: 'труженник', answer: 'single' },
  { display: 'ю_ость', single: 'юность', double: 'юнность', answer: 'single' },
  { display: 'стира_ый-перестираный', single: 'стираный-перестираный', double: 'стиранный-перестиранный', answer: 'single' },
  { display: 'глаже_ый-переглаженый', single: 'глаженый-переглаженый', double: 'глаженный-переглаженный', answer: 'single' },
  { display: 'ране_ый солдат', single: 'раненый солдат', double: 'раненный солдат', answer: 'single', hint: 'без зависимых слов' },
  { display: 'домотка_ый', single: 'домотканый', double: 'домотканный', answer: 'single' },
  { display: 'пестротка_ый', single: 'пестротканый', double: 'пестротканный', answer: 'single' },
  { display: 'верче_ый парень', single: 'верченый парень', double: 'верченный парень', answer: 'single' },
  { display: 'конче_ый человек', single: 'конченый человек', double: 'конченный человек', answer: 'single' },
  { display: 'писа_ая красавица', single: 'писаная красавица', double: 'писанная красавица', answer: 'single' },
  { display: 'назва_ый брат', single: 'названый брат', double: 'названный брат', answer: 'single' },
  { display: 'посажё_ый отец', single: 'посажёный отец', double: 'посажённый отец', answer: 'single' },
  { display: 'смышлё_ый мальчик', single: 'смышлёный мальчик', double: 'смышлённый мальчик', answer: 'single' },
  { display: 'тяжелоране_ый', single: 'тяжелораненый', double: 'тяжелораненный', answer: 'single' },
  { display: 'лата_ая шуба', single: 'латаная шуба', double: 'латанная шуба', answer: 'single' },
  { display: 'кова_ый', single: 'кованый', double: 'кованный', answer: 'single' },
  { display: 'жёва_ый', single: 'жёваный', double: 'жёванный', answer: 'single' },
  { display: 'клёва_ый', single: 'клёваный', double: 'клёванный', answer: 'single' },

  // Double НН
  { display: 'ране_ый в руку солдат', single: 'раненый в руку солдат', double: 'раненный в руку солдат', answer: 'double', hint: 'есть зависимое слово' },
  { display: 'будучи ране_ым', single: 'будучи раненым', double: 'будучи раненным', answer: 'double' },
  { display: 'коло_ада', single: 'колонада', double: 'колоннада', answer: 'double' },
  { display: 'ставле_ик', single: 'ставленик', double: 'ставленник', answer: 'double' },
  { display: 'трезве_ик', single: 'трезвеник', double: 'трезвенник', answer: 'double' },
  { display: 'венча_ый', single: 'венчаный', double: 'венчанный', answer: 'double' },
  { display: 'неслыха_ый', single: 'неслыханый', double: 'неслыханный', answer: 'double' },
  { display: 'недрема_ое око', single: 'недреманое око', double: 'недреманное око', answer: 'double' },
  { display: 'невида_ый', single: 'невиданый', double: 'невиданный', answer: 'double' },
  { display: 'лелея_ый', single: 'лелеяный', double: 'лелеянный', answer: 'double' },
  { display: 'неожида_ый', single: 'неожиданый', double: 'неожиданный', answer: 'double' },
  { display: 'медле_ый', single: 'медленый', double: 'медленный', answer: 'double' },
  { display: 'нежда_ый', single: 'нежданый', double: 'нежданный', answer: 'double' },
  { display: 'окая_ый', single: 'окаяный', double: 'окаянный', answer: 'double' },
  { display: 'негада_ый', single: 'негаданый', double: 'негаданный', answer: 'double' },
  { display: 'пеклева_ый хлеб', single: 'пеклеваный хлеб', double: 'пеклеванный хлеб', answer: 'double' },
  { display: 'свяще_ый', single: 'священый', double: 'священный', answer: 'double' },
  { display: 'нечая_ый', single: 'нечаяный', double: 'нечаянный', answer: 'double' },
  { display: 'чва_ый', single: 'чваный', double: 'чванный', answer: 'double' },
  { display: 'доморощё_ый', single: 'доморощёный', double: 'доморощённый', answer: 'double' },
  { display: 'чека_ый', single: 'чеканый', double: 'чеканный', answer: 'double' },
  { display: 'жела_ый', single: 'желаный', double: 'желанный', answer: 'double' },
  { display: 'жема_ый', single: 'жеманый', double: 'жеманный', answer: 'double' },
  { display: 'Прощё_ое воскресенье', single: 'Прощёное воскресенье', double: 'Прощённое воскресенье', answer: 'single' },
];

export default function SpellingNN({ onBack }: Props) {
  const [count, setCount] = useState(10);

  const pool = useMemo<QuizItem[]>(
    () =>
      ITEMS.map((it) => {
        const correct = it.answer === 'single' ? it.single : it.double;
        const wrong = it.answer === 'single' ? it.double : it.single;
        return {
          display: it.display,
          correct,
          wrong,
          hint: it.hint,
        };
      }),
    [],
  );

  return (
    <ChoiceQuiz
      pool={pool}
      resultKey="spelling-nn"
      title="Правописание Н и НН"
      emoji="✏️"
      subtitle="Сколько Н нужно вставить на месте пропуска?"
      count={count}
      onCountChange={setCount}
      onBack={onBack}
    />
  );
}
