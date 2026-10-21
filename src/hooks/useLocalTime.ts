import { useEffect, useState } from 'react'

/**
 * Live HH:MM:SS clock for a given IANA time zone, ticking every second.
 */
export function useLocalTime(timeZone: string): string {
  const [formatter] = useState(
    () =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
  )
  const [time, setTime] = useState(() => formatter.format(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(formatter.format(new Date())), 1000)
    return () => clearInterval(id)
  }, [formatter])

  return time
}
