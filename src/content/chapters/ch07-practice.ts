import type { Chapter } from '@/types/content'
import { metaOf } from '../meta'

const chapter: Chapter = {
  ...metaOf('practice'),
  goals: [],
  sections: [],
  quiz: [],
  exercises: [],
}

export default chapter
