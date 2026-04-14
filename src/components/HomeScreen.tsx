import { EXERCISES, RUSSIAN_EXERCISES } from '../exercises';
import type { ExerciseId } from '../types';

interface Props {
  onSelect: (id: ExerciseId) => void;
}

export default function HomeScreen({ onSelect }: Props) {
  return (
    <div className="min-h-screen px-4 py-10 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg mb-4 animate-float">
            <span className="text-3xl">🧘</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Mind Fitness
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            Тренажёры для развития когнитивных навыков: памяти, внимания, скорости реакции
          </p>
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXERCISES.map((ex, i) => (
            <div
              key={ex.id}
              className="glass rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => onSelect(ex.id)}
            >
              {/* Icon bubble */}
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${ex.gradient} shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <span className="text-2xl">{ex.icon}</span>
              </div>

              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {ex.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-1">
                {ex.description}
              </p>

              <button
                className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${ex.gradient} shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200 active:scale-95 mt-auto`}
                onClick={(e) => { e.stopPropagation(); onSelect(ex.id); }}
              >
                Начать
              </button>
            </div>
          ))}
        </div>

        {/* Russian Language Section */}
        <div className="mt-14">
          {/* Section separator */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-xl font-bold text-gray-700">Русский язык</h2>
              <p className="text-gray-400 text-sm text-center">Подготовка к экзаменам и развитие грамотности</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
          </div>

          {/* Russian exercises grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {RUSSIAN_EXERCISES.map((ex, i) => (
              <div
                key={ex.id}
                className="glass rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
                style={{ animationDelay: `${(EXERCISES.length + i) * 60}ms` }}
                onClick={() => onSelect(ex.id)}
              >
                {/* Icon bubble */}
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${ex.gradient} shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-2xl">{ex.icon}</span>
                </div>

                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  {ex.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-1">
                  {ex.description}
                </p>

                <button
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${ex.gradient} shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-200 active:scale-95 mt-auto`}
                  onClick={(e) => { e.stopPropagation(); onSelect(ex.id); }}
                >
                  Начать
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-10">
          Нажмите на упражнение или кнопку «Начать», чтобы приступить
        </p>
      </div>
    </div>
  );
}
