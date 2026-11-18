/** One line on the terminal screen: its text and colour. */
export type TermLine = [string, string]

export interface TermData {
  name: string
  about: string
  city: string
  email: string
  availability: string
  projects: string[]
  skills: { category: string; names: string[] }[]
}

export const TERM_COLORS = { prompt: '#3fb0b7', out: '#cdd9dd', dim: '#8fa0ad', ok: '#7fd6b8', err: '#e08a7a' }
export const PROMPT = 'adriel@studio:~$ '

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Runs one command typed into the studio terminal. Pure: it returns the lines to print and, for
 * `open`, which project the computer should open; the page applies both.
 */
export const runCommand = (input: string, data: TermData): { lines: TermLine[]; clear?: boolean; open?: number } => {
  const echo: TermLine = [PROMPT + input, TERM_COLORS.prompt]
  const [cmd = '', ...rest] = input.trim().split(/\s+/)
  const arg = rest.join(' ')
  const out = (...texts: string[]) => texts.map((t): TermLine => [t, TERM_COLORS.out])

  switch (cmd.toLowerCase()) {
    case '':
      return { lines: [echo] }
    case 'clear':
      return { lines: [], clear: true }
    case 'help':
      return {
        lines: [
          echo,
          ...out(
            'help          this list',
            'whoami        who works here',
            'projects, ls  the project folders',
            'open <n>      open a project on the main screen',
            'skills        the stack',
            'contact       how to reach me',
            'date          local time in Manado',
            'echo <text>   print text',
            'clear         clear the screen'
          ),
        ],
      }
    case 'whoami':
      return { lines: [echo, ...out(data.name, data.about, data.city)] }
    case 'projects':
    case 'ls':
      return { lines: [echo, ...out(...data.projects.map((p, i) => `${pad(i + 1)}  ${p}`)), ['type open <n> to play one', TERM_COLORS.dim]] }
    case 'open': {
      const byNumber = Number(arg) - 1
      const index = Number.isInteger(byNumber) && data.projects[byNumber] ? byNumber : data.projects.findIndex((p) => arg && p.toLowerCase().includes(arg.toLowerCase()))
      if (index < 0) return { lines: [echo, [`no project matches "${arg}". try: projects`, TERM_COLORS.err]] }
      return { lines: [echo, [`opening ${data.projects[index]} on the main screen...`, TERM_COLORS.ok]], open: index }
    }
    case 'skills':
      return { lines: [echo, ...out(...data.skills.map((s) => `${s.category}: ${s.names.join(', ')}`))] }
    case 'contact':
      return { lines: [echo, ...out(data.email, data.city, data.availability)] }
    case 'date':
      return {
        lines: [echo, ...out(`${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Makassar', dateStyle: 'medium', timeStyle: 'short' })} WITA`)],
      }
    case 'echo':
      return { lines: [echo, ...out(arg)] }
    default:
      return { lines: [echo, [`command not found: ${cmd}. type help`, TERM_COLORS.err]] }
  }
}
