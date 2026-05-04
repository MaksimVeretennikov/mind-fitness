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
  | 'stress'
  | 'abbreviations'
  | 'geography-map'
  | 'geography-capitals'
  | 'pleonasms'
  | 'verb-suffixes'
  | 'root-spelling'
  | 'suffix-spelling'
  | 'intro-words'
  | 'ne-ni'
  | 'dog-breeds'
  | 'smart-count'
  | 'mirror-drawing'
  | 'memory-cipher'
  | 'letter-strikeout';

export interface Exercise {
  id: ExerciseId;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}
