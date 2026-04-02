export interface Example {
  chinese: string;
  pinyin: string;
  english: string;
}

export interface Word {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  traditional?: string;
  category?: string;
  example?: Example;
}

export { hsk1Words } from './hsk1';
export { hsk2Words } from './hsk2';
export { hsk3Words } from './hsk3';
export { hsk4Words } from './hsk4';
export { hsk5Words } from './hsk5';
export { hsk6Words } from './hsk6';

import { hsk1Words } from './hsk1';
import { hsk2Words } from './hsk2';
import { hsk3Words } from './hsk3';
import { hsk4Words } from './hsk4';
import { hsk5Words } from './hsk5';
import { hsk6Words } from './hsk6';

export const vocabulary: Word[] = [
  ...hsk1Words, ...hsk2Words, ...hsk3Words,
  ...hsk4Words, ...hsk5Words, ...hsk6Words,
];

export function getWordById(id: string): Word | undefined {
  return vocabulary.find((w) => w.id === id);
}
