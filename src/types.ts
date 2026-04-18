export type ExerciseId =
  | 'munsterberg'
  | 'philwords'
  | 'schulte'
  | 'sequence'
  | 'pairs'
  | 'balls'
  | 'reaction'
  | 'adverbs'
  | 'prefixes'
  | 'spelling-nn'
  | 'word-forms'
  | 'stress';

export interface Exercise {
  id: ExerciseId;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}
