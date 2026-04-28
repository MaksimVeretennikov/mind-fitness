import TextInputExercise, { type TextItem } from './TextInputExercise';

const ITEMS: TextItem[] = [
  { display: 'ссор_щиеся ребята',               answer: 'ссорящиеся' },
  { display: 'дорогосто_щее',                    answer: 'дорогостоящее' },
  { display: 'самокле_щиеся',                    answer: 'самоклеящиеся' },
  { display: 'бор_щийся',                        answer: 'борющийся' },
  { display: 'они кол_т',                        answer: 'колют' },
  { display: 'зерна перемел_тся',                answer: 'перемелются' },
  { display: 'постигн_шь умом',                  answer: 'постигнешь' },
  { display: 'бре_шься',                         answer: 'бреешься' },
  { display: 'предвид_вший',                     answer: 'предвидевший' },
  { display: 'неприемл_мый',                     answer: 'неприемлемый' },
  { display: 'незыбл_мый',                       answer: 'незыблемый' },
  { display: 'увенч_нный',                       answer: 'увенчанный' },
  { display: 'леле_шь',                          answer: 'лелеешь' },
  { display: 'се_щий',                           answer: 'сеющий' },
  { display: 'пол_щий грядку',                   answer: 'полющий' },
  { display: 'непререка_мый',                    answer: 'непререкаемый' },
  { display: 'клянч_щий конфету',                answer: 'клянчащий' },
  { display: 'в колыш_щейся ржи',               answer: 'колышущейся' },
  { display: 'защебеч_т птицы',                  answer: 'защебечут' },
  { display: 'лесорубы пил_т',                   answer: 'пилят' },
  { display: 'маляры бел_т',                     answer: 'белят' },
  { display: 'лепеч_шь',                         answer: 'лепечешь' },
  { display: 'волки рыщ_т',                      answer: 'рыщут' },
  { display: 'рокоч_щий мотор',                  answer: 'рокочущий' },
  { display: 'ножи точ_тся',                     answer: 'точатся' },
  { display: 'ветры разве_т',                    answer: 'развеют' },
  { display: 'фермеры се_т',                     answer: 'сеют' },
  { display: 'беспоко_щийся',                    answer: 'беспокоящийся' },
  { display: 'подстрел_нный хищник',             answer: 'подстреленный' },
  { display: 'стел_тся туман',                   answer: 'стелется' },
  { display: 'травы колебл_тся',                 answer: 'колеблются' },
  { display: 'ка_щийся',                         answer: 'кающийся' },
  { display: 'курлыч_щие',                       answer: 'курлычущие' },
  { display: 'подта_вший',                       answer: 'подтаявший' },
  { display: 'дремл_шь',                         answer: 'дремлешь' },
  { display: 'снега присыпл_т',                  answer: 'присыплют' },
  { display: 'они посел_тся',                    answer: 'поселятся' },
  { display: 'обид_вшийся на всех',              answer: 'обидевшийся' },
  { display: 'трепещ_щий от страха',             answer: 'трепещущий' },
  { display: 'выкач_нный из гаража автомобиль',  answer: 'выкаченный' },
  { display: 'ягнята забле_т',                   answer: 'заблеют' },
  { display: 'снега припорош_т',                 answer: 'припорошат' },
  { display: 'пчелы ужал_т',                     answer: 'ужалят' },
  { display: 'подкле_нный',                      answer: 'подклеенный' },
  { display: 'скач_нный файл',                   answer: 'скачанный' },
  { display: 'они плещ_тся',                     answer: 'плещутся' },
  { display: 'родители тревож_тся',              answer: 'тревожатся' },
  { display: 'кузнечики стрекоч_т',              answer: 'стрекочут' },
  { display: 'колебл_шься',                      answer: 'колеблешься' },
  { display: 'рассе_нный',                       answer: 'рассеянный' },
  { display: 'пастухи гон_т овец',               answer: 'гонят' },
  { display: 'ненавид_мый',                      answer: 'ненавидимый' },
  { display: 'собаки чу_т',                      answer: 'чуют' },
  { display: 'щур_щийся',                        answer: 'щурящийся' },
  { display: 'животрепещ_щий',                   answer: 'животрепещущий' },
  { display: 'скач_щий на коне',                 answer: 'скачущий' },
  { display: 'завис_шь',                         answer: 'зависишь' },
  { display: 'ре_щий стяг',                      answer: 'реющий' },
  { display: 'планы руш_тся',                    answer: 'рушатся' },
  { display: 'предвид_мый',                      answer: 'предвидимый' },
  { display: 'кулинары замес_т',                 answer: 'замесят' },
  { display: 'потер_нный',                       answer: 'потерянный' },
  { display: 'повенч_нный',                      answer: 'повенчанный' },
  { display: 'знач_мый',                         answer: 'значимый' },
];

interface Props {
  onBack: () => void;
}

export default function VerbSuffixes({ onBack }: Props) {
  return (
    <TextInputExercise
      items={ITEMS}
      resultKey="verb-suffixes"
      title="Суффиксы глаголов и причастий"
      emoji="🖊️"
      subtitle="Впишите слово с пропуском целиком"
      onBack={onBack}
    />
  );
}
