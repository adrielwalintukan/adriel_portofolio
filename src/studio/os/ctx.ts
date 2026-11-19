import type { AppId, FsFolder } from './fs'
import type { Win, WinArg } from './windows'

/** What every app gets from the desktop: the file system and a few ways to act on the desktop. */
export type DesktopCtx = {
  fs: FsFolder
  /** opens an app (media reuses its one window so only one video plays) */
  open: (app: AppId, title: string, arg?: WinArg) => void
  /** re-points the app's own window, e.g. the Explorer entering a folder */
  retarget: (id: number, title: string, arg?: WinArg) => void
  close: (id: number) => void
  /** project details (the gallery modal) */
  details: (projectId: string) => void
  touch: boolean
}
export type AppProps = { win: Win; ctx: DesktopCtx }
