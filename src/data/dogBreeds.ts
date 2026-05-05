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

export type BreedSize = 'small' | 'medium' | 'large';

export interface DogBreed {
  id: string;
  nameRu: string;
  category: BreedCategory;
  size: BreedSize;
  apiPath: string;
  /**
   * Optional Wikipedia/Wikimedia photo URL. When set, the photo is loaded
   * via the images.weserv.nl proxy (Cloudflare-fronted, reachable from RU
   * without VPN) instead of the local /public/dogs/ folder.
   */
  remote?: string;
}

export const DOG_BREEDS: DogBreed[] = [
  { id: 'labrador', nameRu: 'Лабрадор-ретривер', category: 'retriever', size: 'large', apiPath: 'labrador' },
  { id: 'golden-retriever', nameRu: 'Золотистый ретривер', category: 'retriever', size: 'large', apiPath: 'retriever/golden' },
  { id: 'german-shepherd', nameRu: 'Немецкая овчарка', category: 'herding', size: 'large', apiPath: 'german/shepherd' },
  { id: 'husky', nameRu: 'Сибирский хаски', category: 'spitz', size: 'large', apiPath: 'husky' },
  { id: 'dachshund', nameRu: 'Такса', category: 'hound', size: 'small', apiPath: 'dachshund' },
  { id: 'beagle', nameRu: 'Бигль', category: 'hound', size: 'medium', apiPath: 'beagle' },
  { id: 'french-bulldog', nameRu: 'Французский бульдог', category: 'bulldog', size: 'small', apiPath: 'bulldog/french' },
  { id: 'english-bulldog', nameRu: 'Английский бульдог', category: 'bulldog', size: 'medium', apiPath: 'bulldog/english' },
  { id: 'rottweiler', nameRu: 'Ротвейлер', category: 'working', size: 'large', apiPath: 'rottweiler' },
  { id: 'boxer', nameRu: 'Боксер', category: 'working', size: 'large', apiPath: 'boxer' },
  { id: 'dalmatian', nameRu: 'Далматинец', category: 'sporting', size: 'large', apiPath: 'dalmatian' },
  { id: 'poodle', nameRu: 'Пудель', category: 'sporting', size: 'medium', apiPath: 'poodle/standard' },
  { id: 'corgi', nameRu: 'Корги', category: 'herding', size: 'small', apiPath: 'pembroke' },
  { id: 'doberman', nameRu: 'Доберман', category: 'working', size: 'large', apiPath: 'doberman' },
  { id: 'samoyed', nameRu: 'Самоед', category: 'spitz', size: 'large', apiPath: 'samoyed' },
  { id: 'pomeranian', nameRu: 'Шпиц', category: 'spitz', size: 'small', apiPath: 'pomeranian' },
  { id: 'chihuahua', nameRu: 'Чихуахуа', category: 'toy', size: 'small', apiPath: 'chihuahua' },
  { id: 'yorkshire-terrier', nameRu: 'Йоркширский терьер', category: 'toy', size: 'small', apiPath: 'terrier/yorkshire' },
  { id: 'chow-chow', nameRu: 'Чау-чау', category: 'spitz', size: 'large', apiPath: 'chow' },
  { id: 'akita', nameRu: 'Акита-ину', category: 'spitz', size: 'large', apiPath: 'akita' },
  { id: 'shiba-inu', nameRu: 'Сиба-ину', category: 'spitz', size: 'medium', apiPath: 'shiba' },
  { id: 'malamute', nameRu: 'Аляскинский маламут', category: 'spitz', size: 'large', apiPath: 'malamute' },
  { id: 'border-collie', nameRu: 'Бордер-колли', category: 'herding', size: 'medium', apiPath: 'collie/border' },
  { id: 'sheltie', nameRu: 'Шелти', category: 'herding', size: 'small', apiPath: 'sheepdog/shetland' },
  { id: 'cocker-spaniel', nameRu: 'Кокер-спаниель', category: 'sporting', size: 'medium', apiPath: 'spaniel/cocker' },
  { id: 'irish-setter', nameRu: 'Ирландский сеттер', category: 'sporting', size: 'large', apiPath: 'setter/irish' },
  { id: 'saint-bernard', nameRu: 'Сен-Бернар', category: 'large', size: 'large', apiPath: 'stbernard' },
  { id: 'maltese', nameRu: 'Мальтийская болонка', category: 'toy', size: 'small', apiPath: 'maltese' },
  { id: 'miniature-schnauzer', nameRu: 'Цвергшнауцер', category: 'terrier', size: 'small', apiPath: 'schnauzer/miniature' },
  { id: 'borzoi', nameRu: 'Борзая', category: 'hound', size: 'large', apiPath: 'borzoi' },
  { id: 'malinois', nameRu: 'Малиноис', category: 'herding', size: 'large', apiPath: 'malinois' },
  { id: 'great-dane', nameRu: 'Немецкий дог', category: 'large', size: 'large', apiPath: 'dane/great' },
  { id: 'pug', nameRu: 'Мопс', category: 'toy', size: 'small', apiPath: 'pug' },
  { id: 'weimaraner', nameRu: 'Веймаранер', category: 'sporting', size: 'large', apiPath: 'weimaraner' },
  { id: 'rhodesian-ridgeback', nameRu: 'Родезийский риджбек', category: 'hound', size: 'large', apiPath: 'ridgeback/rhodesian' },

  // ─── Породы с фото из Wikimedia (через images.weserv.nl) ─────────────────
  { id: 'bernese-mountain', nameRu: 'Бернский зенненхунд', category: 'large', size: 'large', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/thumb/c/cc/3-BerneseMountainDogInGrass.jpg/900px-3-BerneseMountainDogInGrass.jpg' },
  { id: 'basset-hound', nameRu: 'Бассет-хаунд', category: 'hound', size: 'medium', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/c/cf/BassetHound_profil.jpg' },
  { id: 'basenji', nameRu: 'Басенджи', category: 'hound', size: 'medium', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/c/c5/Basenji_Profile_%28loosercrop%29.jpg' },
  { id: 'shih-tzu', nameRu: 'Ши-тцу', category: 'toy', size: 'small', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/d/df/Shihtzu_%28cropped%29.jpg' },
  { id: 'bichon-frise', nameRu: 'Бишон фризе', category: 'toy', size: 'small', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/9/93/Bichon_Fris%C3%A9_-_studdogbichon.jpg' },
  { id: 'cavalier-king-charles', nameRu: 'Кавалер-кинг-чарльз-спаниель', category: 'toy', size: 'small', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/5/5f/CarterBIS.Tiki.13.6.09.jpg' },
  { id: 'cane-corso', nameRu: 'Кане-корсо', category: 'working', size: 'large', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/0/03/Cane_corso_temi_1_1024x768x24_%28cropped%29.png' },
  { id: 'newfoundland', nameRu: 'Ньюфаундленд', category: 'large', size: 'large', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/a/a5/Newfoundland_dog_Smoky.jpg' },
  { id: 'old-english-sheepdog', nameRu: 'Бобтейл', category: 'herding', size: 'large', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/e/ed/Old_English_Sheepdog_%28side%29.jpg' },
  { id: 'bull-terrier', nameRu: 'Бультерьер', category: 'terrier', size: 'medium', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/4/4c/Bullterrier-3453301920.jpg' },
  { id: 'greyhound', nameRu: 'Грейхаунд', category: 'hound', size: 'large', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/e/ef/GraceTheGreyhound.jpg' },
  { id: 'vizsla', nameRu: 'Венгерская выжла', category: 'sporting', size: 'medium', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/2/2d/Wy%C5%BCe%C5%82_w%C4%99gierski_g%C5%82adkow%C5%82osy_500.jpg' },
  { id: 'australian-shepherd', nameRu: 'Австралийская овчарка', category: 'herding', size: 'medium', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/thumb/8/80/Australian_Shepherd_red_bi.JPG/900px-Australian_Shepherd_red_bi.JPG' },
  { id: 'boston-terrier', nameRu: 'Бостон-терьер', category: 'terrier', size: 'small', apiPath: '',
    remote: 'upload.wikimedia.org/wikipedia/commons/d/d7/Boston-terrier-carlos-de.JPG' },
];

/**
 * Returns the photo URL for a breed. Local photos live in /public/dogs/{id}.jpg;
 * breeds that ship with a Wikimedia URL are routed through the images.weserv.nl
 * proxy so they load from Russia without a VPN.
 */
export function getBreedPhotoUrl(breed: DogBreed | string): string {
  const b = typeof breed === 'string' ? DOG_BREEDS.find(x => x.id === breed) : breed;
  if (b?.remote) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(b.remote)}&w=900&output=jpg`;
  }
  const id = typeof breed === 'string' ? breed : breed.id;
  return `/dogs/${id}.jpg`;
}

function sizeDistance(a: BreedSize, b: BreedSize): number {
  const order: Record<BreedSize, number> = { small: 0, medium: 1, large: 2 };
  return Math.abs(order[a] - order[b]);
}

/**
 * Pick distractors that look plausible next to `correct`:
 * 1) prefer same size (so chihuahua never appears next to a Labrador)
 * 2) prefer same category as a tiebreaker
 * 3) avoid breeds that have been used as distractors recently in this session
 */
export function pickDistractors(
  correct: DogBreed,
  pool: DogBreed[],
  count = 3,
  recentlyUsed: Set<string> = new Set(),
): DogBreed[] {
  const candidates = pool.filter(b => b.id !== correct.id);

  const scored = candidates.map(b => {
    const sd = sizeDistance(b.size, correct.size); // 0..2
    const cat = b.category === correct.category ? 0 : 1;
    const recent = recentlyUsed.has(b.id) ? 1 : 0;
    // sort key: size first, then category, then recency, then random
    return { b, key: sd * 1000 + cat * 100 + recent * 10 + Math.random() };
  });

  scored.sort((x, y) => x.key - y.key);

  // From the top of the sorted list, additionally hard-filter: never use a
  // distractor whose size differs by more than 1 step from the correct breed
  // (small ↔ large is jarring — exactly the chihuahua-vs-labrador case).
  const filtered = scored.filter(({ b }) => sizeDistance(b.size, correct.size) <= 1);

  const ranked = (filtered.length >= count ? filtered : scored).map(s => s.b);
  return ranked.slice(0, count);
}
