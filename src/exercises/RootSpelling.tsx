import TextInputExercise, { type TextItem } from './TextInputExercise';

const ITEMS: TextItem[] = [
  { display: 'с_стем_тизировать',          answer: 'систематизировать' },
  { display: 'укр_щать',                   answer: 'укрощать' },
  { display: 'ум_лять значение',           answer: 'умалять' },
  { display: 'разр_дить морковь',          answer: 'разредить' },
  { display: 'ц_лл_фановый',              answer: 'целлофановый' },
  { display: 'непост_жимый',              answer: 'непостижимый' },
  { display: 'п_л_садник',               answer: 'палисадник' },
  { display: 'к_рдинальный',             answer: 'кардинальный' },
  { display: 'пр_стижный',               answer: 'престижный' },
  { display: 'страшное прив_дение',       answer: 'привидение' },
  { display: 'п_р_ферия',                answer: 'периферия' },
  { display: 'м_ц_нат',                  answer: 'меценат' },
  { display: 'д_р_ктива',                answer: 'директива' },
  { display: 'спл_титься',               answer: 'сплотиться' },
  { display: 'обр_мление',               answer: 'обрамление' },
  { display: 'московский ст_рожил',      answer: 'старожил' },
  { display: 'д_л_катес',               answer: 'деликатес' },
  { display: 'д_л_гированный',          answer: 'делегированный' },
  { display: 'аб_туриент',              answer: 'абитуриент' },
  { display: 'нав_вать воспоминания',   answer: 'навевать' },
  { display: 'р_гламент',               answer: 'регламент' },
  { display: 'просв_щение',             answer: 'просвещение' },
  { display: 'посв_щение',              answer: 'посвящение' },
  { display: 'ап_лляция',               answer: 'апелляция' },
  { display: 'претв_рить в жизнь',      answer: 'претворить' },
  { display: 'эт_кетка',                answer: 'этикетка' },
  { display: 'прет_ндовать',            answer: 'претендовать' },
  { display: 'обог_щение',              answer: 'обогащение' },
  { display: 'к_нфорка',               answer: 'конфорка' },
  { display: 'в_рсистый',              answer: 'ворсистый' },
  { display: 'одр_хлевший',            answer: 'одряхлевший' },
  { display: 'асп_рантура',            answer: 'аспирантура' },
  { display: 'аф_ристичный',           answer: 'афористичный' },
  { display: 'ав_нтюра',               answer: 'авантюра' },
  { display: 'ор_нжерея',              answer: 'оранжерея' },
  { display: 'разр_дить обстановку',   answer: 'разрядить' },
  { display: 'аккл_матизация',         answer: 'акклиматизация' },
  { display: 'от_ждествление',         answer: 'отождествление' },
  { display: 'проп_ганда',             answer: 'пропаганда' },
  { display: 'энц_клопедист',          answer: 'энциклопедист' },
  { display: 'ур_вновешенный',         answer: 'уравновешенный' },
  { display: 'ув_дание',               answer: 'увядание' },
  { display: 'г_потетический',         answer: 'гипотетический' },
  { display: 'инт_лл_ктуальный',      answer: 'интеллектуальный' },
  { display: 'к_рифей',               answer: 'корифей' },
  { display: 'дельфин к_сатка',        answer: 'косатка' },
  { display: 'птица к_сатка',          answer: 'касатка' },
  { display: 'п_сс_мист',             answer: 'пессимист' },
  { display: 'п_р_доксальный',        answer: 'парадоксальный' },
  { display: 'пр_ц_дент',             answer: 'прецедент' },
  { display: 'сув_р_нитет',           answer: 'суверенитет' },
  { display: 'эст_када',              answer: 'эстакада' },
];

interface Props {
  onBack: () => void;
}

export default function RootSpelling({ onBack }: Props) {
  return (
    <TextInputExercise
      items={ITEMS}
      resultKey="root-spelling"
      title="Правописание корней"
      emoji="🔠"
      subtitle="Впишите слово с пропуском целиком"
      onBack={onBack}
    />
  );
}
