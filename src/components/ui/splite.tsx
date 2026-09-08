import { Suspense, lazy, CSSProperties } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
  style?: CSSProperties
  onLoad?: (splineApp: any) => void
}

export function SplineScene({ scene, className, style, onLoad }: SplineSceneProps) {
  const isWebViewerUrl = scene.includes('my.spline.design')

  if (isWebViewerUrl) {
    return (
      <div className={`w-full h-full relative select-none overflow-hidden ${className || ''}`}>
        <iframe
          src={scene}
          className="w-full h-full border-0 overflow-hidden"
          title="3D Spline Robot Model"
          allow="autoplay; fullscreen"
          style={{
            pointerEvents: 'auto',
            background: 'transparent',
            ...style,
          }}
        />
        <div className="absolute inset-0 pointer-events-none z-10" />
      </div>
    )
  }
  const handleLoad = (splineApp: any) => {
    if (splineApp) {
      const canvas = splineApp.canvas
      if (canvas) {
        canvas.style.setProperty('pointer-events', 'auto', 'important')
        canvas.style.setProperty('touch-action', 'pan-y', 'important')
        canvas.style.setProperty('cursor', 'grab', 'important')
        canvas.style.setProperty('background-color', 'transparent', 'important')
        canvas.style.setProperty('background', 'transparent', 'important')

        const handleWheel = (e: WheelEvent) => {
          if (e.deltaY) {
            window.scrollBy({
              top: e.deltaY,
              behavior: 'auto',
            })
          }
        }
        canvas.addEventListener('wheel', handleWheel, { capture: true, passive: true })
      }
      try {
        if (splineApp._renderer) {
          splineApp._renderer.setClearColor(0x000000, 0);
        }
        if (splineApp._scene) {
          splineApp._scene.background = null;
        }
      } catch (e) {}
    }
    if (onLoad) {
      onLoad(splineApp)
    }
  }

  return (
    <div className="w-full h-full relative select-none pointer-events-auto">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <span className="loader text-xs font-mono text-emerald-400">Loading 3D Scene...</span>
          </div>
        }
      >
        <Spline
          scene={scene}
          className={className}
          style={{
            pointerEvents: 'auto',
            touchAction: 'pan-y',
            cursor: 'grab',
            ...style,
          }}
          onLoad={handleLoad}
        />
      </Suspense>
    </div>
  )
}
