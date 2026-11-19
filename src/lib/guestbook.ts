/**
 * Guest book rules, shared by the API (api/guestbook.ts) and the studio form. Notes go live at
 * once, so everything that reaches storage passes through `clean` first.
 */
export type Note = { name: string; message: string; at: number }

export const NAME_MAX = 24
export const MESSAGE_MAX = 80

// whole words only, so "anjingnya" (the studio has a dog) or "assessment" never trip it;
// "babi" is left out on purpose: around Manado it is mostly food (babi rica)
const BLOCKED = [
  // Indonesian
  'bangsat', 'bajingan', 'kontol', 'memek', 'ngentot', 'entot', 'jancok', 'jancuk', 'goblok', 'goblog', 'tolol',
  'kampret', 'tai', 'asu', 'pepek', 'perek', 'lonte', 'keparat', 'bego', 'pantek', 'puki',
  // English
  'fuck', 'fucking', 'fucker', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 'nigger', 'nigga',
  'faggot', 'whore', 'slut', 'porn', 'retard',
]
const BLOCKED_RE = new RegExp(`\\b(?:${BLOCKED.join('|')})\\b`, 'i')
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', $: 's', '7': 't' }

// zero-width and bidi control characters: they hide blocked words and can flip the text on the board
const INVISIBLE = /[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g
const tidy = (v: unknown) => (typeof v === 'string' ? v.replace(INVISIBLE, '').replace(/\s+/g, ' ').trim() : null)
const rude = (text: string) =>
  BLOCKED_RE.test(text) || BLOCKED_RE.test(text.toLowerCase().replace(/[0134@5$7]/g, (c) => LEET[c]))

export const clean = (
  input: unknown
): { ok: true; note: Omit<Note, 'at'> } | { ok: false; error: string } => {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Send a name and a message.' }
  const body = input as Record<string, unknown>
  // a hidden field people never see; bots fill every field they find
  if (body.website) return { ok: false, error: 'Could not post that.' }
  const name = tidy(body.name)
  const message = tidy(body.message)
  if (!name || name.length > NAME_MAX) return { ok: false, error: `Name: 1 to ${NAME_MAX} characters.` }
  if (!message || message.length > MESSAGE_MAX) return { ok: false, error: `Message: 1 to ${MESSAGE_MAX} characters.` }
  if (rude(name) || rude(message)) return { ok: false, error: 'Please keep it friendly.' }
  return { ok: true, note: { name, message } }
}
