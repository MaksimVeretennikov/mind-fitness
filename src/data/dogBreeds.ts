export type BreedCategory =
  | 'retriever'
  | 'herding'
  | 'spitz'
  | 'hound'
  | 'toy'
  | 'working'
  | 'bulldog'
  | 'sporting'
  | 'terrier'
  | 'large';

export interface DogBreed {
  id: string;
  nameRu: string;
  category: BreedCategory;
  apiPath: string; // Dog CEO API breed path, e.g. 'labrador' or 'retriever/golden'
}

export const DOG_BREEDS: DogBreed[] = [
  { id: 'labrador', nameRu: 'Лабрадор-ретривер', category: 'retriever', apiPath: 'labrador' },
  { id: 'golden-retriever', nameRu: 'Золотистый ретривер', category: 'retriever', apiPath: 'retriever/golden' },
  { id: 'german-shepherd', nameRu: 'Немецкая овчарка', category: 'herding', apiPath: 'german/shepherd' },
  { id: 'husky', nameRu: 'Сибирский хаски', category: 'spitz', apiPath: 'husky' },
  { id: 'dachshund', nameRu: 'Такса', category: 'hound', apiPath: 'dachshund' },
  { id: 'beagle', nameRu: 'Бигль', category: 'hound', apiPath: 'beagle' },
  { id: 'french-bulldog', nameRu: 'Французский бульдог', category: 'bulldog', apiPath: 'bulldog/french' },
  { id: 'english-bulldog', nameRu: 'Английский бульдог', category: 'bulldog', apiPath: 'bulldog/english' },
  { id: 'rottweiler', nameRu: 'Ротвейлер', category: 'working', apiPath: 'rottweiler' },
  { id: 'boxer', nameRu: 'Боксер', category: 'working', apiPath: 'boxer' },
  { id: 'dalmatian', nameRu: 'Далматинец', category: 'sporting', apiPath: 'dalmatian' },
  { id: 'poodle', nameRu: 'Пудель', category: 'sporting', apiPath: 'poodle/standard' },
  { id: 'corgi', nameRu: 'Корги', category: 'herding', apiPath: 'pembroke' },
  { id: 'doberman', nameRu: 'Доберман', category: 'working', apiPath: 'doberman' },
  { id: 'samoyed', nameRu: 'Самоед', category: 'spitz', apiPath: 'samoyed' },
  { id: 'pomeranian', nameRu: 'Шпиц', category: 'spitz', apiPath: 'pomeranian' },
  { id: 'chihuahua', nameRu: 'Чихуахуа', category: 'toy', apiPath: 'chihuahua' },
  { id: 'yorkshire-terrier', nameRu: 'Йоркширский терьер', category: 'toy', apiPath: 'terrier/yorkshire' },
  { id: 'chow-chow', nameRu: 'Чау-чау', category: 'spitz', apiPath: 'chow' },
  { id: 'akita', nameRu: 'Акита-ину', category: 'spitz', apiPath: 'akita' },
  { id: 'shiba-inu', nameRu: 'Сиба-ину', category: 'spitz', apiPath: 'shiba' },
  { id: 'malamute', nameRu: 'Аляскинский маламут', category: 'spitz', apiPath: 'malamute' },
  { id: 'border-collie', nameRu: 'Бордер-колли', category: 'herding', apiPath: 'collie/border' },
  { id: 'sheltie', nameRu: 'Шелти', category: 'herding', apiPath: 'sheepdog/shetland' },
  { id: 'cocker-spaniel', nameRu: 'Кокер-спаниель', category: 'sporting', apiPath: 'spaniel/cocker' },
  { id: 'irish-setter', nameRu: 'Ирландский сеттер', category: 'sporting', apiPath: 'setter/irish' },
  { id: 'saint-bernard', nameRu: 'Сен-Бернар', category: 'large', apiPath: 'stbernard' },
  { id: 'maltese', nameRu: 'Мальтийская болонка', category: 'toy', apiPath: 'maltese' },
  { id: 'miniature-schnauzer', nameRu: 'Цвергшнауцер', category: 'terrier', apiPath: 'schnauzer/miniature' },
  { id: 'borzoi', nameRu: 'Борзая', category: 'hound', apiPath: 'borzoi' },
  { id: 'malinois', nameRu: 'Малиноис', category: 'herding', apiPath: 'malinois' },
  { id: 'great-dane', nameRu: 'Немецкий дог', category: 'large', apiPath: 'dane/great' },
  { id: 'pug', nameRu: 'Мопс', category: 'toy', apiPath: 'pug' },
  { id: 'weimaraner', nameRu: 'Веймаранер', category: 'sporting', apiPath: 'weimaraner' },
  { id: 'rhodesian-ridgeback', nameRu: 'Родезийский риджбек', category: 'hound', apiPath: 'ridgeback/rhodesian' },
];

export function getBreedPhotoUrl(id: string): string {
  return `/dogs/${id}.jpg`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickDistractors(correct: DogBreed, pool: DogBreed[], count = 3): DogBreed[] {
  const sameCategory = shuffle(pool.filter(b => b.category === correct.category && b.id !== correct.id));
  const result = sameCategory.slice(0, Math.min(count, sameCategory.length));

  if (result.length < count) {
    const usedIds = new Set([correct.id, ...result.map(b => b.id)]);
    const others = shuffle(pool.filter(b => !usedIds.has(b.id)));
    result.push(...others.slice(0, count - result.length));
  }

  return result;
}
