'use client'

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
    if (splineApp && splineApp.canvas) {
      splineApp.canvas.style.setProperty('cursor', 'default', 'important')
      splineApp.canvas.style.setProperty('touch-action', 'pan-y', 'important')
      splineApp.canvas.style.setProperty('pointer-events', 'none', 'important')
    }
    if (onLoad) {
      onLoad(splineApp)
    }
  }

  return (
    <div className="w-full h-full relative pointer-events-none select-none">
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
          style={{ cursor: 'default', touchAction: 'pan-y', pointerEvents: 'none', ...style }}
          onLoad={handleLoad}
        />
      </Suspense>
    </div>
  )
}


