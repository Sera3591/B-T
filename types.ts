export interface Entry {
  date: string;
  content: string;
  updatedAt: number;
}
export interface FutureNote {
  id: string;
  sourceDate: string;
  targetMonth: string;
  text: string;
  createdAt: number;
}
