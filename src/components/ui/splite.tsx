import { Suspense, lazy, CSSProperties } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
  style?: CSSProperties
  onLoad?: (splineApp: any) => void
}

export function SplineScene({ scene, className, style, onLoad }: SplineSceneProps) {
  const handleLoad = (splineApp: any) => {
    if (splineApp) {
      const canvas = splineApp.canvas
      if (canvas) {
        canvas.style.setProperty('pointer-events', 'none', 'important')
        canvas.style.setProperty('touch-action', 'auto', 'important')
        canvas.style.setProperty('cursor', 'default', 'important')
      }
    }
    if (onLoad) {
      onLoad(splineApp)
    }
  }

  return (
    <div className="w-full h-full relative select-none pointer-events-none">
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
            pointerEvents: 'none',
            touchAction: 'auto',
            cursor: 'default',
            ...style,
          }}
          onLoad={handleLoad}
        />
      </Suspense>
    </div>
  )
}
