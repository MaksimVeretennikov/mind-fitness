import { EXERCISES, RUSSIAN_EXERCISES, GEOGRAPHY_EXERCISES } from '../exercises';

const ALL_EXERCISES = [...EXERCISES, ...RUSSIAN_EXERCISES, ...GEOGRAPHY_EXERCISES];
import type { ExerciseId } from '../types';

interface Props {
  id: ExerciseId;
  onBack: () => void;
  children: React.ReactNode;
}

export default function ExerciseShell({ id, onBack, children }: Props) {
  const ex = ALL_EXERCISES.find((e) => e.id === id)!;

  const wideIds: ExerciseId[] = ['philwords', 'geography-map', 'geography-capitals', 'schulte', 'munsterberg'];
  const isWide = wideIds.includes(id);
  const containerCls = isWide ? 'max-w-[1400px]' : 'max-w-6xl';

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="glass sticky top-0 z-40 px-4 py-3 shadow-sm">
        <div className={`${containerCls} mx-auto flex items-center gap-4`}>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/80 transition-all text-gray-700 font-medium text-sm active:scale-95"
          >
            <span className="text-base">←</span>
            <span>Назад</span>
          </button>
          <div className="hidden sm:flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ex.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}
            >
              <span className="text-lg">{ex.icon}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-gray-800 font-semibold text-base leading-none truncate">
                {ex.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${containerCls} mx-auto px-6 py-5 animate-slide-up`}>
        {children}
      </div>
    </div>
  );
}
