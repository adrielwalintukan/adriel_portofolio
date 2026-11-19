import type { AppProps } from '../ctx'

/** One demo video: a local file with controls, or a YouTube embed. Black behind it while it loads. */
export function MediaPlayer({ win }: AppProps) {
  const { src, kind } = win.arg ?? {}
  if (!src) return <div className="h-full bg-black" />
  return (
    <div className="h-full bg-black">
      {kind === 'youtube' ? (
        <iframe
          key={src}
          src={`https://www.youtube-nocookie.com/embed/${src}?autoplay=1&rel=0&modestbranding=1`}
          title={win.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full border-0"
        />
      ) : (
        <video key={src} src={src} controls autoPlay playsInline className="h-full w-full bg-black object-contain" />
      )}
    </div>
  )
}
