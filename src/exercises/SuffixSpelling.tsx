import LetterInputExercise, { type TextItem } from './LetterInputExercise';

const ITEMS: TextItem[] = [
  { display: 'бел_зна',                  answer: 'белизна' },
  { display: 'камыш_вый',               answer: 'камышовый' },
  { display: 'ноздр_ватый',             answer: 'ноздреватый' },
  { display: 'претерп_вая',             answer: 'претерпевая' },
  { display: 'застра_вать',             answer: 'застраивать' },
  { display: 'завлад_вать',             answer: 'завладевать' },
  { display: 'нищ_та',                  answer: 'нищета' },
  { display: 'варень_це',               answer: 'вареньице' },
  { display: 'груш_вый',                answer: 'грушевый' },
  { display: 'въедл_вый',               answer: 'въедливый' },
  { display: 'завид_вать',              answer: 'завидовать' },
  { display: 'команд_вать',             answer: 'командовать' },
  { display: 'завед_вать',              answer: 'заведовать' },
  { display: 'запот_вавший',            answer: 'запотевавший' },
  { display: 'окольц_вав',              answer: 'окольцевав' },
  { display: 'одол_вать',               answer: 'одолевать' },
  { display: 'син_ватый',               answer: 'синеватый' },
  { display: 'замш_вый',               answer: 'замшевый' },
  { display: 'размеж_ваться',           answer: 'размежеваться' },
  { display: 'марл_вая',               answer: 'марлевая' },
  { display: 'сызнов_',                 answer: 'сызнова' },
  { display: 'повизг_вать',             answer: 'повизгивать' },
  { display: 'солом_нка',               answer: 'соломинка' },
  { display: 'привередл_вый',           answer: 'привередливый' },
  { display: 'затм_вать',               answer: 'затмевать' },
  { display: 'засветл_',               answer: 'засветло' },
  { display: 'нож_вка',                answer: 'ножовка' },
  { display: 'присва_вать',             answer: 'присваивать' },
  { display: 'покашл_вать',             answer: 'покашливать' },
  { display: 'недоум_вать',             answer: 'недоумевать' },
  { display: 'миндал_вый',              answer: 'миндалевый' },
  { display: 'проста_вая',              answer: 'простаивая' },
  { display: 'ножич_к',                answer: 'ножичек' },
  { display: 'обур_вают чувства',       answer: 'обуревают' },
  { display: 'натри_вый',              answer: 'натриевый' },
  { display: 'нищ_нский',              answer: 'нищенский' },
  { display: 'фасол_вый',              answer: 'фасолевый' },
  { display: 'кресл_це',              answer: 'креслице' },
  { display: 'милост_вый',             answer: 'милостивый' },
  { display: 'кашл_ть',               answer: 'кашлять' },
  { display: 'лед_нить душу',           answer: 'леденить' },
  { display: 'масл_ные краски',         answer: 'масляные' },
  { display: 'масл_ный блин',           answer: 'масленый' },
  { display: 'вкрадч_вый',             answer: 'вкрадчивый' },
  { display: 'масл_це',               answer: 'маслице' },
  { display: 'улицы обезлюд_ли',       answer: 'обезлюдели' },
  { display: 'вити_ватый',             answer: 'витиеватый' },
  { display: 'распар_вать швы',        answer: 'распарывать' },
  { display: 'горноста_вый',           answer: 'горностаевый' },
  { display: 'дымч_тый',              answer: 'дымчатый' },
  { display: 'удва_вающий',            answer: 'удваивающий' },
  { display: 'обескров_ть врага',       answer: 'обескровить' },
  { display: 'обур_вавший',            answer: 'обуревавший' },
  { display: 'отверд_вать',            answer: 'отвердевать' },
  { display: 'обла_вать',              answer: 'облаивать' },
  { display: 'вороч_ться',             answer: 'ворочаться' },
  { display: 'затверд_вать',           answer: 'затвердевать' },
  { display: 'запот_вать',             answer: 'запотевать' },
  { display: 'врем_чко',              answer: 'времечко' },
  { display: 'взрывч_тый',            answer: 'взрывчатый' },
  { display: 'попроб_вать',            answer: 'попробовать' },
  { display: 'раскра_вать',            answer: 'раскраивать' },
];

interface Props {
  onBack: () => void;
}

export default function SuffixSpelling({ onBack }: Props) {
  return (
    <LetterInputExercise
      items={ITEMS}
      resultKey="suffix-spelling"
      title="Правописание суффиксов"
      emoji="📖"
      subtitle="Введите пропущенные буквы"
      onBack={onBack}
    />
  );
}
