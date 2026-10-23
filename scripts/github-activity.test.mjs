// Run with: npm test
// Guards the GitHub calendar parser in api/github-activity.ts, which depends on github.com markup.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseContributions } from '../api/github-activity.ts'

const html = `
<td tabindex="0" data-ix="0" style="width: 11px" data-date="2025-10-26" id="contribution-day-component-0-1" data-level="0" role="gridcell" class="ContributionCalendar-day"></td>
<td tabindex="0" data-ix="0" style="width: 11px" data-date="2025-10-19" id="contribution-day-component-0-0" data-level="3" role="gridcell" class="ContributionCalendar-day"></td>
<td class="ContributionCalendar-label"><span>Mon</span></td>
<tool-tip id="t1" for="contribution-day-component-0-0" popover="manual" class="sr-only">1,204 contributions on October 19th.</tool-tip>
<tool-tip id="t2" for="contribution-day-component-0-1" popover="manual" class="sr-only">No contributions on October 26th.</tool-tip>
`

test('reads days, levels and counts in date order, skipping label cells', () => {
  assert.deepEqual(parseContributions(html), [
    { date: '2025-10-19', level: 3, count: 1204 },
    { date: '2025-10-26', level: 0, count: 0 },
  ])
})

test('returns nothing for markup without a calendar', () => {
  assert.deepEqual(parseContributions('<html><body>rate limited</body></html>'), [])
})
