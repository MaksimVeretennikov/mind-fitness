import { EXERCISES, RUSSIAN_EXERCISES } from '../exercises';

const ALL_EXERCISES = [...EXERCISES, ...RUSSIAN_EXERCISES];
import type { ExerciseId } from '../types';

interface Props {
  id: ExerciseId;
  onBack: () => void;
  children: React.ReactNode;
}

export default function ExerciseShell({ id, onBack, children }: Props) {
  const ex = ALL_EXERCISES.find((e) => e.id === id)!;

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="glass sticky top-0 z-40 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/80 transition-all text-gray-700 font-medium text-sm active:scale-95"
          >
            <span className="text-base">←</span>
            <span>Назад</span>
          </button>
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ex.gradient} flex items-center justify-center shadow-sm`}
            >
              <span className="text-lg">{ex.icon}</span>
            </div>
            <div>
              <h1 className="text-gray-800 font-semibold text-base leading-none">
                {ex.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-5 animate-slide-up">
        {children}
      </div>
    </div>
  );
}
