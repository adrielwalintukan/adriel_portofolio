/** The desktop's icons, in order. Room.tsx paints the same set on the monitor when seen from the room. */
export type DesktopIconId = 'explorer' | 'photos' | 'projects' | 'about' | 'terminal' | 'bin'
export const DESKTOP_ICONS: { id: DesktopIconId; label: string }[] = [
  { id: 'explorer', label: 'File Explorer' },
  { id: 'photos', label: 'Photos' },
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'about-me.txt' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'bin', label: 'Recycle Bin' },
]
