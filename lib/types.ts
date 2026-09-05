export type Flashcard = {
  id: string;
  word: string;
  translation: string;
  example: string;
  known: boolean;
  createdAt: number;
  dueAt: number;
  intervalDays: number;
  repetitions: number;
  ease: number;
};
