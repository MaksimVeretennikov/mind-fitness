export type ExerciseId =
  | 'munsterberg'
  | 'philwords'
  | 'schulte'
  | 'sequence'
  | 'pairs'
  | 'balls'
  | 'reaction';

export interface Exercise {
  id: ExerciseId;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}
