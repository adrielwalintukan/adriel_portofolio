import { CERTIFICATES_DATA, CONTACT_INFO, EXPERIENCE_TIMELINE, SKILLS_DATA } from '@/lib/constants'
import { DESK_PROJECTS, type ViewId } from './data'

/** How long the guided tour rests on each stop. */
export const TOUR_STEP_MS = 6000

const latest = EXPERIENCE_TIMELINE[0]

/** The guided tour: every station once, with a caption built only from the portfolio's own data. */
export const TOUR: { view: ViewId; caption: string }[] = [
  { view: 'room', caption: `Adriel's studio in ${CONTACT_INFO.city}. A quick look around.` },
  { view: 'projects', caption: `The computer runs AdrielOS: double-click Explorer to browse all ${DESK_PROJECTS.length} projects.` },
  { view: 'terminal', caption: 'The left screen is a real terminal. Type help, or hint to find its secrets.' },
  { view: 'experience', caption: `Now: ${latest.title} at ${latest.role}. The whole timeline is on the whiteboard.` },
  { view: 'skills', caption: `The stack: ${SKILLS_DATA.map((s) => s.category).join(' · ')}.` },
  { view: 'certificates', caption: `${CERTIFICATES_DATA.length} certificates. Click a frame on the wall to open it.` },
  { view: 'about', caption: `${CONTACT_INFO.availability}.` },
  { view: 'room', caption: 'That is the tour. Drag around and click anything.' },
]
