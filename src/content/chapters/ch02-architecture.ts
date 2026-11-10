import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'

const chapter: Chapter = {
  ...metaOf('architecture'),
  goals: [],
  sections: [],
  quiz: [],
  exercises: [],
}

export default chapter
