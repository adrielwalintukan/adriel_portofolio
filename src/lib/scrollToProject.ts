/** Fired when a scroll target sits inside the collapsed "More projects" list. */
export const PROJECTS_EXPAND_EVENT = 'projects:expand'

/**
 * Scroll a project card into view, opening the collapsed list first when the project lives there.
 * A window event instead of shared state: the two sections don't otherwise know each other.
 */
export function scrollToProject(id: string) {
  const target = () => document.getElementById(`project-${id}`)
  const go = (el: HTMLElement) => {
    // a stacked card is sticky, so its rect is already shifted once it sticks: measure where it sits in the flow
    const pin = parseFloat(getComputedStyle(el).top) || 96 // its sticky `top`, else the navbar clearance
    const position = el.style.position
    el.style.position = 'static'
    const flowTop = el.getBoundingClientRect().top + window.scrollY
    el.style.position = position
    window.scrollTo({
      top: Math.max(0, flowTop - pin),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  const el = target()
  if (el) return go(el)

  window.dispatchEvent(new Event(PROJECTS_EXPAND_EVENT))
  // the list animates open (0.5s); scrolling before it settles lands on the wrong offset
  window.setTimeout(() => {
    const late = target()
    if (late) go(late)
  }, 550)
}
