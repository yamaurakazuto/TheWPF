import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'

const chapter: Chapter = {
  ...metaOf('foundation'),
  goals: [],
  sections: [],
  quiz: [],
  exercises: [],
}

export default chapter
