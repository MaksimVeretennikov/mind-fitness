// Weekly nature photos from Unsplash (direct CDN URLs, no API key).
// 7 days × 4 daytime periods = 28 unique nature landscapes.
// Each photo was visually verified to match its period's lighting & mood, and to
// be a real nature landscape (no objects/animals-only, no studio shots).
// Evening & night use procedural gradients (see DynamicBackground) and are day-independent.

export type DayPeriod = 'dawn' | 'morning' | 'afternoon' | 'sunset';
// JS getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1920&q=80&auto=format&fit=crop`;

// Palette intent:
//   dawn      — soft pastels, pre-sunrise blues/purples/pinks
//   morning   — bright daylight, cool & fresh greens/blues
//   afternoon — saturated midday blues/greens, clear skies
//   sunset    — warm golds/oranges/reds
export const WEEKLY_PHOTOS: Record<DayIndex, Record<DayPeriod, string>> = {
  // Sunday
  0: {
    dawn:      U('1419242902214-272b3f66ee7a'), // purple pre-dawn starry horizon
    morning:   U('1441974231531-c6227db76b6e'), // forest light rays
    afternoon: U('1426604966848-d7adac402bff'), // Yosemite El Capitan
    sunset:    U('1506815444479-bfdb1e96c566'), // pink cloud sky
  },
  // Monday
  1: {
    dawn:      U('1469474968028-56623f02e42e'), // misty mountain valley dawn
    morning:   U('1501785888041-af3ef285b470'), // alpine turquoise lake
    afternoon: U('1506260408121-e353d10b87c7'), // green hills with dramatic sky
    sunset:    U('1495616811223-4d98c6e9c869'), // orange sunset over lake dock
  },
  // Tuesday
  2: {
    dawn:      U('1542273917363-3b1817f69a2d'), // foggy forest morning
    morning:   U('1464822759023-fed622ff2c3b'), // snowy mountain valley
    afternoon: U('1470770841072-f978cf4d019e'), // mountain lake with cabin
    sunset:    U('1510784722466-f2aa9c52fff6'), // sunset through branches
  },
  // Wednesday
  3: {
    dawn:      U('1500534314209-a25ddb2bd429'), // pastel mountain layers
    morning:   U('1502082553048-f009c37129b9'), // sunlit tree in bright field
    afternoon: U('1433086966358-54859d0ed716'), // cascading waterfall in forest
    sunset:    U('1472214103451-9374bd1c798e'), // golden hour stone circle valley
  },
  // Thursday
  4: {
    dawn:      U('1506905925346-21bda4d32df4'), // pastel peaks above clouds
    morning:   U('1454496522488-7a8e488e8606'), // snowy peaks under bright sky
    afternoon: U('1431631927486-6603c868ce5e'), // mountain meadow with cabin
    sunset:    U('1500964757637-c85e8a162699'), // layered mountains golden sunset
  },
  // Friday
  5: {
    dawn:      U('1475924156734-496f6cac6ec1'), // cool purple dawn beach
    morning:   U('1497436072909-60f360e1d4b1'), // aerial turquoise lake & forest
    afternoon: U('1518837695005-2083093ee35b'), // ocean wave close-up
    sunset:    U('1483728642387-6c3bdd6c93e5'), // dusky mountain silhouette
  },
  // Saturday
  6: {
    dawn:      U('1519681393784-d120267933ba'), // starry pre-dawn mountain silhouette
    morning:   U('1470071459604-3b5ec3a7fe05'), // mountain sunrise with clouds
    afternoon: U('1472396961693-142e6e269027'), // Yosemite meadow with deer
    sunset:    U('1444090542259-0af8fa96557e'), // orange clouds over mountains
  },
};

export const DAY_LABELS_RU: Record<DayIndex, string> = {
  1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 0: 'Вс',
};

export function getPhotoFor(day: DayIndex, period: DayPeriod): string {
  return WEEKLY_PHOTOS[day][period];
}
