export type Region = 'europe' | 'asia' | 'africa' | 'americas' | 'oceania';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Country {
  code: string;       // ISO 3166-1 alpha-2
  name: string;       // Русское название страны
  capital: string;    // Русское название столицы
  flag: string;       // Emoji флага
  region: Region;
  difficulty: Difficulty;
  lat: number;        // Широта центра страны
  lng: number;        // Долгота центра страны
}

export const COUNTRIES: Country[] = [
  // ─── EUROPE ────────────────────────────────────────────────────────────────
  { code: 'RU', name: 'Россия',            capital: 'Москва',         flag: '🇷🇺', region: 'europe', difficulty: 'easy',   lat: 61.524, lng: 105.319 },
  { code: 'DE', name: 'Германия',          capital: 'Берлин',         flag: '🇩🇪', region: 'europe', difficulty: 'easy',   lat: 51.166, lng: 10.452 },
  { code: 'FR', name: 'Франция',           capital: 'Париж',          flag: '🇫🇷', region: 'europe', difficulty: 'easy',   lat: 46.228, lng: 2.214 },
  { code: 'GB', name: 'Великобритания',    capital: 'Лондон',         flag: '🇬🇧', region: 'europe', difficulty: 'easy',   lat: 55.378, lng: -3.436 },
  { code: 'IT', name: 'Италия',            capital: 'Рим',            flag: '🇮🇹', region: 'europe', difficulty: 'easy',   lat: 41.872, lng: 12.568 },
  { code: 'ES', name: 'Испания',           capital: 'Мадрид',         flag: '🇪🇸', region: 'europe', difficulty: 'easy',   lat: 40.464, lng: -3.749 },
  { code: 'PL', name: 'Польша',            capital: 'Варшава',        flag: '🇵🇱', region: 'europe', difficulty: 'easy',   lat: 51.919, lng: 19.145 },
  { code: 'UA', name: 'Украина',           capital: 'Киев',           flag: '🇺🇦', region: 'europe', difficulty: 'easy',   lat: 48.380, lng: 31.166 },
  { code: 'NL', name: 'Нидерланды',        capital: 'Амстердам',      flag: '🇳🇱', region: 'europe', difficulty: 'easy',   lat: 52.133, lng: 5.291 },
  { code: 'GR', name: 'Греция',            capital: 'Афины',          flag: '🇬🇷', region: 'europe', difficulty: 'easy',   lat: 39.074, lng: 21.824 },
  { code: 'SE', name: 'Швеция',            capital: 'Стокгольм',      flag: '🇸🇪', region: 'europe', difficulty: 'easy',   lat: 60.128, lng: 18.644 },
  { code: 'NO', name: 'Норвегия',          capital: 'Осло',           flag: '🇳🇴', region: 'europe', difficulty: 'easy',   lat: 60.472, lng: 8.469 },
  { code: 'FI', name: 'Финляндия',         capital: 'Хельсинки',      flag: '🇫🇮', region: 'europe', difficulty: 'easy',   lat: 61.924, lng: 25.748 },
  { code: 'PT', name: 'Португалия',        capital: 'Лиссабон',       flag: '🇵🇹', region: 'europe', difficulty: 'easy',   lat: 39.400, lng: -8.224 },
  { code: 'CH', name: 'Швейцария',         capital: 'Берн',           flag: '🇨🇭', region: 'europe', difficulty: 'easy',   lat: 46.818, lng: 8.228 },
  { code: 'AT', name: 'Австрия',           capital: 'Вена',           flag: '🇦🇹', region: 'europe', difficulty: 'easy',   lat: 47.516, lng: 14.550 },
  { code: 'BE', name: 'Бельгия',           capital: 'Брюссель',       flag: '🇧🇪', region: 'europe', difficulty: 'easy',   lat: 50.503, lng: 4.470 },
  { code: 'IE', name: 'Ирландия',          capital: 'Дублин',         flag: '🇮🇪', region: 'europe', difficulty: 'easy',   lat: 53.413, lng: -8.244 },
  { code: 'DK', name: 'Дания',             capital: 'Копенгаген',     flag: '🇩🇰', region: 'europe', difficulty: 'easy',   lat: 56.263, lng: 9.502 },
  { code: 'CZ', name: 'Чехия',             capital: 'Прага',          flag: '🇨🇿', region: 'europe', difficulty: 'easy',   lat: 49.818, lng: 15.473 },
  { code: 'HU', name: 'Венгрия',           capital: 'Будапешт',       flag: '🇭🇺', region: 'europe', difficulty: 'medium', lat: 47.162, lng: 19.503 },
  { code: 'RO', name: 'Румыния',           capital: 'Бухарест',       flag: '🇷🇴', region: 'europe', difficulty: 'medium', lat: 45.943, lng: 24.967 },
  { code: 'RS', name: 'Сербия',            capital: 'Белград',        flag: '🇷🇸', region: 'europe', difficulty: 'medium', lat: 44.017, lng: 21.006 },
  { code: 'HR', name: 'Хорватия',          capital: 'Загреб',         flag: '🇭🇷', region: 'europe', difficulty: 'medium', lat: 45.100, lng: 15.200 },
  { code: 'BG', name: 'Болгария',          capital: 'София',          flag: '🇧🇬', region: 'europe', difficulty: 'medium', lat: 42.734, lng: 25.486 },
  { code: 'SK', name: 'Словакия',          capital: 'Братислава',     flag: '🇸🇰', region: 'europe', difficulty: 'medium', lat: 48.669, lng: 19.699 },
  { code: 'SI', name: 'Словения',          capital: 'Любляна',        flag: '🇸🇮', region: 'europe', difficulty: 'medium', lat: 46.151, lng: 14.995 },
  { code: 'LT', name: 'Литва',             capital: 'Вильнюс',        flag: '🇱🇹', region: 'europe', difficulty: 'medium', lat: 55.169, lng: 23.881 },
  { code: 'LV', name: 'Латвия',            capital: 'Рига',           flag: '🇱🇻', region: 'europe', difficulty: 'medium', lat: 56.880, lng: 24.603 },
  { code: 'EE', name: 'Эстония',           capital: 'Таллин',         flag: '🇪🇪', region: 'europe', difficulty: 'medium', lat: 58.595, lng: 25.013 },
  { code: 'BY', name: 'Беларусь',          capital: 'Минск',          flag: '🇧🇾', region: 'europe', difficulty: 'medium', lat: 53.709, lng: 27.953 },
  { code: 'MD', name: 'Молдова',           capital: 'Кишинёв',        flag: '🇲🇩', region: 'europe', difficulty: 'medium', lat: 47.412, lng: 28.370 },
  { code: 'AL', name: 'Албания',           capital: 'Тирана',         flag: '🇦🇱', region: 'europe', difficulty: 'medium', lat: 41.153, lng: 20.168 },
  { code: 'MK', name: 'Северная Македония',capital: 'Скопье',         flag: '🇲🇰', region: 'europe', difficulty: 'medium', lat: 41.608, lng: 21.745 },
  { code: 'BA', name: 'Босния и Герцеговина', capital: 'Сараево',     flag: '🇧🇦', region: 'europe', difficulty: 'medium', lat: 43.916, lng: 17.679 },
  { code: 'IS', name: 'Исландия',          capital: 'Рейкьявик',      flag: '🇮🇸', region: 'europe', difficulty: 'medium', lat: 64.963, lng: -19.021 },
  { code: 'LU', name: 'Люксембург',        capital: 'Люксембург',     flag: '🇱🇺', region: 'europe', difficulty: 'medium', lat: 49.815, lng: 6.130 },
  { code: 'CY', name: 'Кипр',              capital: 'Никосия',        flag: '🇨🇾', region: 'europe', difficulty: 'medium', lat: 35.126, lng: 33.429 },
  { code: 'MT', name: 'Мальта',            capital: 'Валлетта',       flag: '🇲🇹', region: 'europe', difficulty: 'medium', lat: 35.938, lng: 14.376 },
  { code: 'ME', name: 'Черногория',        capital: 'Подгорица',      flag: '🇲🇪', region: 'europe', difficulty: 'medium', lat: 42.709, lng: 19.374 },
  { code: 'XK', name: 'Косово',            capital: 'Приштина',       flag: '🇽🇰', region: 'europe', difficulty: 'hard',   lat: 42.602, lng: 20.903 },
  { code: 'AD', name: 'Андорра',           capital: 'Андорра-ла-Велья', flag: '🇦🇩', region: 'europe', difficulty: 'hard', lat: 42.506, lng: 1.522 },
  { code: 'LI', name: 'Лихтенштейн',       capital: 'Вадуц',          flag: '🇱🇮', region: 'europe', difficulty: 'hard',   lat: 47.166, lng: 9.555 },
  { code: 'MC', name: 'Монако',            capital: 'Монако',         flag: '🇲🇨', region: 'europe', difficulty: 'hard',   lat: 43.750, lng: 7.412 },
  { code: 'SM', name: 'Сан-Марино',        capital: 'Сан-Марино',     flag: '🇸🇲', region: 'europe', difficulty: 'hard',   lat: 43.942, lng: 12.458 },
  { code: 'VA', name: 'Ватикан',           capital: 'Ватикан',        flag: '🇻🇦', region: 'europe', difficulty: 'hard',   lat: 41.903, lng: 12.453 },

  // ─── ASIA ──────────────────────────────────────────────────────────────────
  { code: 'CN', name: 'Китай',             capital: 'Пекин',          flag: '🇨🇳', region: 'asia', difficulty: 'easy',   lat: 35.861, lng: 104.195 },
  { code: 'JP', name: 'Япония',            capital: 'Токио',          flag: '🇯🇵', region: 'asia', difficulty: 'easy',   lat: 36.204, lng: 138.252 },
  { code: 'IN', name: 'Индия',             capital: 'Нью-Дели',       flag: '🇮🇳', region: 'asia', difficulty: 'easy',   lat: 20.593, lng: 78.962 },
  { code: 'KR', name: 'Южная Корея',       capital: 'Сеул',           flag: '🇰🇷', region: 'asia', difficulty: 'easy',   lat: 35.907, lng: 127.766 },
  { code: 'TR', name: 'Турция',            capital: 'Анкара',         flag: '🇹🇷', region: 'asia', difficulty: 'easy',   lat: 38.963, lng: 35.243 },
  { code: 'SA', name: 'Саудовская Аравия', capital: 'Эр-Рияд',        flag: '🇸🇦', region: 'asia', difficulty: 'easy',   lat: 23.885, lng: 45.079 },
  { code: 'IR', name: 'Иран',              capital: 'Тегеран',        flag: '🇮🇷', region: 'asia', difficulty: 'easy',   lat: 32.428, lng: 53.688 },
  { code: 'IL', name: 'Израиль',           capital: 'Иерусалим',      flag: '🇮🇱', region: 'asia', difficulty: 'easy',   lat: 31.046, lng: 34.852 },
  { code: 'TH', name: 'Таиланд',           capital: 'Бангкок',        flag: '🇹🇭', region: 'asia', difficulty: 'easy',   lat: 15.870, lng: 100.993 },
  { code: 'VN', name: 'Вьетнам',           capital: 'Ханой',          flag: '🇻🇳', region: 'asia', difficulty: 'easy',   lat: 14.058, lng: 108.277 },
  { code: 'ID', name: 'Индонезия',         capital: 'Джакарта',       flag: '🇮🇩', region: 'asia', difficulty: 'easy',   lat: -0.789, lng: 113.921 },
  { code: 'PH', name: 'Филиппины',         capital: 'Манила',         flag: '🇵🇭', region: 'asia', difficulty: 'easy',   lat: 12.879, lng: 121.774 },
  { code: 'PK', name: 'Пакистан',          capital: 'Исламабад',      flag: '🇵🇰', region: 'asia', difficulty: 'easy',   lat: 30.375, lng: 69.345 },
  { code: 'KZ', name: 'Казахстан',         capital: 'Астана',         flag: '🇰🇿', region: 'asia', difficulty: 'easy',   lat: 48.020, lng: 66.924 },
  { code: 'AE', name: 'ОАЭ',               capital: 'Абу-Даби',       flag: '🇦🇪', region: 'asia', difficulty: 'easy',   lat: 23.424, lng: 53.848 },
  { code: 'KP', name: 'Северная Корея',    capital: 'Пхеньян',        flag: '🇰🇵', region: 'asia', difficulty: 'medium', lat: 40.340, lng: 127.510 },
  { code: 'BD', name: 'Бангладеш',         capital: 'Дакка',          flag: '🇧🇩', region: 'asia', difficulty: 'medium', lat: 23.685, lng: 90.356 },
  { code: 'MY', name: 'Малайзия',          capital: 'Куала-Лумпур',   flag: '🇲🇾', region: 'asia', difficulty: 'medium', lat: 4.211, lng: 101.976 },
  { code: 'SG', name: 'Сингапур',          capital: 'Сингапур',       flag: '🇸🇬', region: 'asia', difficulty: 'medium', lat: 1.353, lng: 103.820 },
  { code: 'AF', name: 'Афганистан',        capital: 'Кабул',          flag: '🇦🇫', region: 'asia', difficulty: 'medium', lat: 33.939, lng: 67.710 },
  { code: 'IQ', name: 'Ирак',              capital: 'Багдад',         flag: '🇮🇶', region: 'asia', difficulty: 'medium', lat: 33.223, lng: 43.679 },
  { code: 'SY', name: 'Сирия',             capital: 'Дамаск',         flag: '🇸🇾', region: 'asia', difficulty: 'medium', lat: 34.802, lng: 38.997 },
  { code: 'JO', name: 'Иордания',          capital: 'Амман',          flag: '🇯🇴', region: 'asia', difficulty: 'medium', lat: 30.585, lng: 36.238 },
  { code: 'LB', name: 'Ливан',             capital: 'Бейрут',         flag: '🇱🇧', region: 'asia', difficulty: 'medium', lat: 33.855, lng: 35.862 },
  { code: 'GE', name: 'Грузия',            capital: 'Тбилиси',        flag: '🇬🇪', region: 'asia', difficulty: 'medium', lat: 42.315, lng: 43.357 },
  { code: 'AM', name: 'Армения',           capital: 'Ереван',         flag: '🇦🇲', region: 'asia', difficulty: 'medium', lat: 40.069, lng: 45.038 },
  { code: 'AZ', name: 'Азербайджан',       capital: 'Баку',           flag: '🇦🇿', region: 'asia', difficulty: 'medium', lat: 40.143, lng: 47.577 },
  { code: 'UZ', name: 'Узбекистан',        capital: 'Ташкент',        flag: '🇺🇿', region: 'asia', difficulty: 'medium', lat: 41.377, lng: 64.585 },
  { code: 'NP', name: 'Непал',             capital: 'Катманду',       flag: '🇳🇵', region: 'asia', difficulty: 'medium', lat: 28.394, lng: 84.124 },
  { code: 'LK', name: 'Шри-Ланка',         capital: 'Коломбо',        flag: '🇱🇰', region: 'asia', difficulty: 'medium', lat: 7.874, lng: 80.772 },
  { code: 'MM', name: 'Мьянма',            capital: 'Нейпьидо',       flag: '🇲🇲', region: 'asia', difficulty: 'medium', lat: 21.914, lng: 95.956 },
  { code: 'KH', name: 'Камбоджа',          capital: 'Пномпень',       flag: '🇰🇭', region: 'asia', difficulty: 'medium', lat: 12.565, lng: 104.991 },
  { code: 'LA', name: 'Лаос',              capital: 'Вьентьян',       flag: '🇱🇦', region: 'asia', difficulty: 'medium', lat: 19.856, lng: 102.495 },
  { code: 'MN', name: 'Монголия',          capital: 'Улан-Батор',     flag: '🇲🇳', region: 'asia', difficulty: 'medium', lat: 46.862, lng: 103.847 },
  { code: 'KG', name: 'Кыргызстан',        capital: 'Бишкек',         flag: '🇰🇬', region: 'asia', difficulty: 'medium', lat: 41.204, lng: 74.766 },
  { code: 'TJ', name: 'Таджикистан',       capital: 'Душанбе',        flag: '🇹🇯', region: 'asia', difficulty: 'medium', lat: 38.861, lng: 71.276 },
  { code: 'TM', name: 'Туркменистан',      capital: 'Ашхабад',        flag: '🇹🇲', region: 'asia', difficulty: 'medium', lat: 38.970, lng: 59.556 },
  { code: 'QA', name: 'Катар',             capital: 'Доха',           flag: '🇶🇦', region: 'asia', difficulty: 'medium', lat: 25.355, lng: 51.184 },
  { code: 'KW', name: 'Кувейт',            capital: 'Эль-Кувейт',     flag: '🇰🇼', region: 'asia', difficulty: 'medium', lat: 29.312, lng: 47.482 },
  { code: 'OM', name: 'Оман',              capital: 'Маскат',         flag: '🇴🇲', region: 'asia', difficulty: 'medium', lat: 21.474, lng: 55.975 },
  { code: 'YE', name: 'Йемен',             capital: 'Сана',           flag: '🇾🇪', region: 'asia', difficulty: 'medium', lat: 15.552, lng: 48.516 },
  { code: 'BH', name: 'Бахрейн',           capital: 'Манама',         flag: '🇧🇭', region: 'asia', difficulty: 'hard',   lat: 25.930, lng: 50.637 },
  { code: 'BN', name: 'Бруней',            capital: 'Бандар-Сери-Бегаван', flag: '🇧🇳', region: 'asia', difficulty: 'hard', lat: 4.535, lng: 114.727 },
  { code: 'BT', name: 'Бутан',             capital: 'Тхимпху',        flag: '🇧🇹', region: 'asia', difficulty: 'hard',   lat: 27.514, lng: 90.433 },
  { code: 'MV', name: 'Мальдивы',          capital: 'Мале',           flag: '🇲🇻', region: 'asia', difficulty: 'hard',   lat: 3.202, lng: 73.220 },
  { code: 'TL', name: 'Восточный Тимор',   capital: 'Дили',           flag: '🇹🇱', region: 'asia', difficulty: 'hard',   lat: -8.874, lng: 125.727 },
  { code: 'PS', name: 'Палестина',         capital: 'Рамалла',        flag: '🇵🇸', region: 'asia', difficulty: 'hard',   lat: 31.952, lng: 35.233 },

  // ─── AFRICA ────────────────────────────────────────────────────────────────
  { code: 'EG', name: 'Египет',            capital: 'Каир',           flag: '🇪🇬', region: 'africa', difficulty: 'easy',   lat: 26.821, lng: 30.803 },
  { code: 'ZA', name: 'ЮАР',               capital: 'Претория',       flag: '🇿🇦', region: 'africa', difficulty: 'easy',   lat: -30.559, lng: 22.938 },
  { code: 'MA', name: 'Марокко',           capital: 'Рабат',          flag: '🇲🇦', region: 'africa', difficulty: 'easy',   lat: 31.792, lng: -7.093 },
  { code: 'NG', name: 'Нигерия',           capital: 'Абуджа',         flag: '🇳🇬', region: 'africa', difficulty: 'easy',   lat: 9.082, lng: 8.675 },
  { code: 'KE', name: 'Кения',             capital: 'Найроби',        flag: '🇰🇪', region: 'africa', difficulty: 'easy',   lat: -0.024, lng: 37.906 },
  { code: 'ET', name: 'Эфиопия',           capital: 'Аддис-Абеба',    flag: '🇪🇹', region: 'africa', difficulty: 'easy',   lat: 9.145, lng: 40.490 },
  { code: 'DZ', name: 'Алжир',             capital: 'Алжир',          flag: '🇩🇿', region: 'africa', difficulty: 'easy',   lat: 28.034, lng: 1.660 },
  { code: 'TN', name: 'Тунис',             capital: 'Тунис',          flag: '🇹🇳', region: 'africa', difficulty: 'easy',   lat: 33.887, lng: 9.537 },
  { code: 'LY', name: 'Ливия',             capital: 'Триполи',        flag: '🇱🇾', region: 'africa', difficulty: 'easy',   lat: 26.335, lng: 17.229 },
  { code: 'SD', name: 'Судан',             capital: 'Хартум',         flag: '🇸🇩', region: 'africa', difficulty: 'easy',   lat: 12.863, lng: 30.218 },
  { code: 'GH', name: 'Гана',              capital: 'Аккра',          flag: '🇬🇭', region: 'africa', difficulty: 'medium', lat: 7.946, lng: -1.024 },
  { code: 'TZ', name: 'Танзания',          capital: 'Додома',         flag: '🇹🇿', region: 'africa', difficulty: 'medium', lat: -6.369, lng: 34.889 },
  { code: 'UG', name: 'Уганда',            capital: 'Кампала',        flag: '🇺🇬', region: 'africa', difficulty: 'medium', lat: 1.374, lng: 32.290 },
  { code: 'ZW', name: 'Зимбабве',          capital: 'Хараре',         flag: '🇿🇼', region: 'africa', difficulty: 'medium', lat: -19.015, lng: 29.154 },
  { code: 'ZM', name: 'Замбия',            capital: 'Лусака',         flag: '🇿🇲', region: 'africa', difficulty: 'medium', lat: -13.134, lng: 27.849 },
  { code: 'AO', name: 'Ангола',            capital: 'Луанда',         flag: '🇦🇴', region: 'africa', difficulty: 'medium', lat: -11.203, lng: 17.874 },
  { code: 'MZ', name: 'Мозамбик',          capital: 'Мапуту',         flag: '🇲🇿', region: 'africa', difficulty: 'medium', lat: -18.666, lng: 35.530 },
  { code: 'NA', name: 'Намибия',           capital: 'Виндхук',        flag: '🇳🇦', region: 'africa', difficulty: 'medium', lat: -22.958, lng: 18.490 },
  { code: 'BW', name: 'Ботсвана',          capital: 'Габороне',       flag: '🇧🇼', region: 'africa', difficulty: 'medium', lat: -22.329, lng: 24.685 },
  { code: 'SN', name: 'Сенегал',           capital: 'Дакар',          flag: '🇸🇳', region: 'africa', difficulty: 'medium', lat: 14.497, lng: -14.452 },
  { code: 'MG', name: 'Мадагаскар',        capital: 'Антананариву',   flag: '🇲🇬', region: 'africa', difficulty: 'medium', lat: -18.767, lng: 46.869 },
  { code: 'CM', name: 'Камерун',           capital: 'Яунде',          flag: '🇨🇲', region: 'africa', difficulty: 'medium', lat: 7.370, lng: 12.355 },
  { code: 'CI', name: 'Кот-д’Ивуар',       capital: 'Ямусукро',       flag: '🇨🇮', region: 'africa', difficulty: 'medium', lat: 7.540, lng: -5.547 },
  { code: 'ML', name: 'Мали',              capital: 'Бамако',         flag: '🇲🇱', region: 'africa', difficulty: 'medium', lat: 17.571, lng: -3.996 },
  { code: 'CD', name: 'ДР Конго',          capital: 'Киншаса',        flag: '🇨🇩', region: 'africa', difficulty: 'medium', lat: -4.038, lng: 21.759 },
  { code: 'CG', name: 'Конго',             capital: 'Браззавиль',     flag: '🇨🇬', region: 'africa', difficulty: 'medium', lat: -0.228, lng: 15.828 },
  { code: 'RW', name: 'Руанда',            capital: 'Кигали',         flag: '🇷🇼', region: 'africa', difficulty: 'medium', lat: -1.940, lng: 29.874 },
  { code: 'BI', name: 'Бурунди',           capital: 'Гитега',         flag: '🇧🇮', region: 'africa', difficulty: 'medium', lat: -3.373, lng: 29.918 },
  { code: 'SO', name: 'Сомали',            capital: 'Могадишо',       flag: '🇸🇴', region: 'africa', difficulty: 'medium', lat: 5.152, lng: 46.199 },
  { code: 'SS', name: 'Южный Судан',       capital: 'Джуба',          flag: '🇸🇸', region: 'africa', difficulty: 'medium', lat: 6.877, lng: 31.307 },
  { code: 'TD', name: 'Чад',               capital: 'Нджамена',       flag: '🇹🇩', region: 'africa', difficulty: 'medium', lat: 15.454, lng: 18.732 },
  { code: 'NE', name: 'Нигер',             capital: 'Ниамей',         flag: '🇳🇪', region: 'africa', difficulty: 'medium', lat: 17.607, lng: 8.081 },
  { code: 'MR', name: 'Мавритания',        capital: 'Нуакшот',        flag: '🇲🇷', region: 'africa', difficulty: 'medium', lat: 21.008, lng: -10.940 },
  { code: 'BF', name: 'Буркина-Фасо',      capital: 'Уагадугу',       flag: '🇧🇫', region: 'africa', difficulty: 'hard',   lat: 12.239, lng: -1.562 },
  { code: 'BJ', name: 'Бенин',             capital: 'Порто-Ново',     flag: '🇧🇯', region: 'africa', difficulty: 'hard',   lat: 9.307, lng: 2.315 },
  { code: 'TG', name: 'Того',              capital: 'Ломе',           flag: '🇹🇬', region: 'africa', difficulty: 'hard',   lat: 8.619, lng: 0.825 },
  { code: 'GN', name: 'Гвинея',            capital: 'Конакри',        flag: '🇬🇳', region: 'africa', difficulty: 'hard',   lat: 9.946, lng: -9.696 },
  { code: 'GW', name: 'Гвинея-Бисау',      capital: 'Бисау',          flag: '🇬🇼', region: 'africa', difficulty: 'hard',   lat: 11.803, lng: -15.180 },
  { code: 'SL', name: 'Сьерра-Леоне',      capital: 'Фритаун',        flag: '🇸🇱', region: 'africa', difficulty: 'hard',   lat: 8.460, lng: -11.780 },
  { code: 'LR', name: 'Либерия',           capital: 'Монровия',       flag: '🇱🇷', region: 'africa', difficulty: 'hard',   lat: 6.428, lng: -9.429 },
  { code: 'GA', name: 'Габон',             capital: 'Либревиль',      flag: '🇬🇦', region: 'africa', difficulty: 'hard',   lat: -0.804, lng: 11.609 },
  { code: 'GQ', name: 'Экваториальная Гвинея', capital: 'Малабо',     flag: '🇬🇶', region: 'africa', difficulty: 'hard',   lat: 1.651, lng: 10.268 },
  { code: 'ST', name: 'Сан-Томе и Принсипи', capital: 'Сан-Томе',     flag: '🇸🇹', region: 'africa', difficulty: 'hard',   lat: 0.186, lng: 6.613 },
  { code: 'CV', name: 'Кабо-Верде',        capital: 'Прая',           flag: '🇨🇻', region: 'africa', difficulty: 'hard',   lat: 16.002, lng: -24.014 },
  { code: 'GM', name: 'Гамбия',            capital: 'Банжул',         flag: '🇬🇲', region: 'africa', difficulty: 'hard',   lat: 13.443, lng: -15.311 },
  { code: 'MW', name: 'Малави',            capital: 'Лилонгве',       flag: '🇲🇼', region: 'africa', difficulty: 'hard',   lat: -13.254, lng: 34.301 },
  { code: 'LS', name: 'Лесото',            capital: 'Масеру',         flag: '🇱🇸', region: 'africa', difficulty: 'hard',   lat: -29.610, lng: 28.234 },
  { code: 'SZ', name: 'Эсватини',          capital: 'Мбабане',        flag: '🇸🇿', region: 'africa', difficulty: 'hard',   lat: -26.523, lng: 31.466 },
  { code: 'KM', name: 'Коморы',            capital: 'Морони',         flag: '🇰🇲', region: 'africa', difficulty: 'hard',   lat: -11.875, lng: 43.872 },
  { code: 'SC', name: 'Сейшельские Острова', capital: 'Виктория',     flag: '🇸🇨', region: 'africa', difficulty: 'hard',   lat: -4.680, lng: 55.492 },
  { code: 'MU', name: 'Маврикий',          capital: 'Порт-Луи',       flag: '🇲🇺', region: 'africa', difficulty: 'hard',   lat: -20.348, lng: 57.552 },
  { code: 'DJ', name: 'Джибути',           capital: 'Джибути',        flag: '🇩🇯', region: 'africa', difficulty: 'hard',   lat: 11.825, lng: 42.590 },
  { code: 'ER', name: 'Эритрея',           capital: 'Асмэра',         flag: '🇪🇷', region: 'africa', difficulty: 'hard',   lat: 15.179, lng: 39.782 },
  { code: 'CF', name: 'ЦАР',               capital: 'Банги',          flag: '🇨🇫', region: 'africa', difficulty: 'hard',   lat: 6.611, lng: 20.940 },

  // ─── AMERICAS ──────────────────────────────────────────────────────────────
  { code: 'US', name: 'США',               capital: 'Вашингтон',      flag: '🇺🇸', region: 'americas', difficulty: 'easy',   lat: 37.091, lng: -95.713 },
  { code: 'CA', name: 'Канада',            capital: 'Оттава',         flag: '🇨🇦', region: 'americas', difficulty: 'easy',   lat: 56.130, lng: -106.347 },
  { code: 'MX', name: 'Мексика',           capital: 'Мехико',         flag: '🇲🇽', region: 'americas', difficulty: 'easy',   lat: 23.635, lng: -102.553 },
  { code: 'BR', name: 'Бразилия',          capital: 'Бразилиа',       flag: '🇧🇷', region: 'americas', difficulty: 'easy',   lat: -14.235, lng: -51.925 },
  { code: 'AR', name: 'Аргентина',         capital: 'Буэнос-Айрес',   flag: '🇦🇷', region: 'americas', difficulty: 'easy',   lat: -38.416, lng: -63.617 },
  { code: 'CL', name: 'Чили',              capital: 'Сантьяго',       flag: '🇨🇱', region: 'americas', difficulty: 'easy',   lat: -35.676, lng: -71.543 },
  { code: 'PE', name: 'Перу',              capital: 'Лима',           flag: '🇵🇪', region: 'americas', difficulty: 'easy',   lat: -9.190, lng: -75.015 },
  { code: 'CO', name: 'Колумбия',          capital: 'Богота',         flag: '🇨🇴', region: 'americas', difficulty: 'easy',   lat: 4.571, lng: -74.298 },
  { code: 'VE', name: 'Венесуэла',         capital: 'Каракас',        flag: '🇻🇪', region: 'americas', difficulty: 'easy',   lat: 6.424, lng: -66.590 },
  { code: 'CU', name: 'Куба',              capital: 'Гавана',         flag: '🇨🇺', region: 'americas', difficulty: 'easy',   lat: 21.522, lng: -77.781 },
  { code: 'EC', name: 'Эквадор',           capital: 'Кито',           flag: '🇪🇨', region: 'americas', difficulty: 'medium', lat: -1.831, lng: -78.184 },
  { code: 'BO', name: 'Боливия',           capital: 'Сукре',          flag: '🇧🇴', region: 'americas', difficulty: 'medium', lat: -16.291, lng: -63.589 },
  { code: 'PY', name: 'Парагвай',          capital: 'Асунсьон',       flag: '🇵🇾', region: 'americas', difficulty: 'medium', lat: -23.442, lng: -58.444 },
  { code: 'UY', name: 'Уругвай',           capital: 'Монтевидео',     flag: '🇺🇾', region: 'americas', difficulty: 'medium', lat: -32.523, lng: -55.766 },
  { code: 'PA', name: 'Панама',            capital: 'Панама',         flag: '🇵🇦', region: 'americas', difficulty: 'medium', lat: 8.538, lng: -80.783 },
  { code: 'CR', name: 'Коста-Рика',        capital: 'Сан-Хосе',       flag: '🇨🇷', region: 'americas', difficulty: 'medium', lat: 9.749, lng: -83.754 },
  { code: 'GT', name: 'Гватемала',         capital: 'Гватемала',      flag: '🇬🇹', region: 'americas', difficulty: 'medium', lat: 15.784, lng: -90.231 },
  { code: 'DO', name: 'Доминиканская Республика', capital: 'Санто-Доминго', flag: '🇩🇴', region: 'americas', difficulty: 'medium', lat: 18.736, lng: -70.163 },
  { code: 'JM', name: 'Ямайка',            capital: 'Кингстон',       flag: '🇯🇲', region: 'americas', difficulty: 'medium', lat: 18.109, lng: -77.298 },
  { code: 'HN', name: 'Гондурас',          capital: 'Тегусигальпа',   flag: '🇭🇳', region: 'americas', difficulty: 'medium', lat: 15.200, lng: -86.242 },
  { code: 'NI', name: 'Никарагуа',         capital: 'Манагуа',        flag: '🇳🇮', region: 'americas', difficulty: 'medium', lat: 12.865, lng: -85.207 },
  { code: 'SV', name: 'Сальвадор',         capital: 'Сан-Сальвадор',  flag: '🇸🇻', region: 'americas', difficulty: 'medium', lat: 13.794, lng: -88.897 },
  { code: 'HT', name: 'Гаити',             capital: 'Порт-о-Пренс',   flag: '🇭🇹', region: 'americas', difficulty: 'medium', lat: 18.971, lng: -72.286 },
  { code: 'BS', name: 'Багамы',            capital: 'Нассау',         flag: '🇧🇸', region: 'americas', difficulty: 'medium', lat: 25.034, lng: -77.396 },
  { code: 'TT', name: 'Тринидад и Тобаго', capital: 'Порт-оф-Спейн',  flag: '🇹🇹', region: 'americas', difficulty: 'medium', lat: 10.692, lng: -61.223 },
  { code: 'BZ', name: 'Белиз',             capital: 'Бельмопан',      flag: '🇧🇿', region: 'americas', difficulty: 'hard',   lat: 17.190, lng: -88.498 },
  { code: 'GY', name: 'Гайана',            capital: 'Джорджтаун',     flag: '🇬🇾', region: 'americas', difficulty: 'hard',   lat: 4.861, lng: -58.930 },
  { code: 'SR', name: 'Суринам',           capital: 'Парамарибо',     flag: '🇸🇷', region: 'americas', difficulty: 'hard',   lat: 3.919, lng: -56.028 },
  { code: 'BB', name: 'Барбадос',          capital: 'Бриджтаун',      flag: '🇧🇧', region: 'americas', difficulty: 'hard',   lat: 13.194, lng: -59.543 },
  { code: 'AG', name: 'Антигуа и Барбуда', capital: 'Сент-Джонс',     flag: '🇦🇬', region: 'americas', difficulty: 'hard',   lat: 17.061, lng: -61.796 },
  { code: 'DM', name: 'Доминика',          capital: 'Розо',           flag: '🇩🇲', region: 'americas', difficulty: 'hard',   lat: 15.415, lng: -61.371 },
  { code: 'GD', name: 'Гренада',           capital: 'Сент-Джорджес',  flag: '🇬🇩', region: 'americas', difficulty: 'hard',   lat: 12.263, lng: -61.604 },
  { code: 'LC', name: 'Сент-Люсия',        capital: 'Кастри',         flag: '🇱🇨', region: 'americas', difficulty: 'hard',   lat: 13.909, lng: -60.979 },
  { code: 'VC', name: 'Сент-Винсент и Гренадины', capital: 'Кингстаун', flag: '🇻🇨', region: 'americas', difficulty: 'hard', lat: 12.984, lng: -61.288 },
  { code: 'KN', name: 'Сент-Китс и Невис', capital: 'Бастер',         flag: '🇰🇳', region: 'americas', difficulty: 'hard',   lat: 17.357, lng: -62.783 },

  // ─── OCEANIA ───────────────────────────────────────────────────────────────
  { code: 'AU', name: 'Австралия',         capital: 'Канберра',       flag: '🇦🇺', region: 'oceania', difficulty: 'easy',   lat: -25.274, lng: 133.776 },
  { code: 'NZ', name: 'Новая Зеландия',    capital: 'Веллингтон',     flag: '🇳🇿', region: 'oceania', difficulty: 'easy',   lat: -40.900, lng: 174.886 },
  { code: 'PG', name: 'Папуа — Новая Гвинея', capital: 'Порт-Морсби', flag: '🇵🇬', region: 'oceania', difficulty: 'medium', lat: -6.314, lng: 143.956 },
  { code: 'FJ', name: 'Фиджи',             capital: 'Сува',           flag: '🇫🇯', region: 'oceania', difficulty: 'medium', lat: -16.578, lng: 179.414 },
  { code: 'WS', name: 'Самоа',             capital: 'Апиа',           flag: '🇼🇸', region: 'oceania', difficulty: 'medium', lat: -13.759, lng: -172.105 },
  { code: 'TO', name: 'Тонга',             capital: 'Нукуалофа',      flag: '🇹🇴', region: 'oceania', difficulty: 'medium', lat: -21.179, lng: -175.198 },
  { code: 'VU', name: 'Вануату',           capital: 'Порт-Вила',      flag: '🇻🇺', region: 'oceania', difficulty: 'hard',   lat: -15.377, lng: 166.959 },
  { code: 'SB', name: 'Соломоновы Острова',capital: 'Хониара',        flag: '🇸🇧', region: 'oceania', difficulty: 'hard',   lat: -9.646, lng: 160.156 },
  { code: 'FM', name: 'Микронезия',        capital: 'Паликир',        flag: '🇫🇲', region: 'oceania', difficulty: 'hard',   lat: 7.426, lng: 150.551 },
  { code: 'PW', name: 'Палау',             capital: 'Нгерулмуд',      flag: '🇵🇼', region: 'oceania', difficulty: 'hard',   lat: 7.515, lng: 134.583 },
  { code: 'NR', name: 'Науру',             capital: 'Ярен',           flag: '🇳🇷', region: 'oceania', difficulty: 'hard',   lat: -0.523, lng: 166.932 },
  { code: 'KI', name: 'Кирибати',          capital: 'Южная Тарава',   flag: '🇰🇮', region: 'oceania', difficulty: 'hard',   lat: -3.370, lng: -168.734 },
  { code: 'TV', name: 'Тувалу',            capital: 'Фунафути',       flag: '🇹🇻', region: 'oceania', difficulty: 'hard',   lat: -7.109, lng: 177.649 },
  { code: 'MH', name: 'Маршалловы Острова',capital: 'Маджуро',        flag: '🇲🇭', region: 'oceania', difficulty: 'hard',   lat: 7.131, lng: 171.184 },
];

export const REGIONS: { id: Region | 'all'; label: string; emoji: string }[] = [
  { id: 'all',      label: 'Весь мир', emoji: '🌍' },
  { id: 'europe',   label: 'Европа',   emoji: '🏰' },
  { id: 'asia',     label: 'Азия',     emoji: '🏯' },
  { id: 'africa',   label: 'Африка',   emoji: '🦁' },
  { id: 'americas', label: 'Америки',  emoji: '🗽' },
  { id: 'oceania',  label: 'Океания',  emoji: '🏝️' },
];

export function filterCountries(region: Region | 'all', difficulty: Difficulty | 'mixed'): Country[] {
  return COUNTRIES.filter(c => {
    if (region !== 'all' && c.region !== region) return false;
    if (difficulty !== 'mixed' && c.difficulty !== difficulty) return false;
    return true;
  });
}

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

// Haversine distance in km
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}
