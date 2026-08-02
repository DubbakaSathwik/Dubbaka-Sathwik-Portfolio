'use client'

import { Suspense, lazy, CSSProperties, useRef, useEffect } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
  style?: CSSProperties
  onLoad?: (splineApp: any) => void
}

export function SplineScene({ scene, className, style, onLoad }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Stop wheel & touchmove event propagation on capture phase
    // so Spline cannot hijack/prevent standard page scrolling
    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation()
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.stopPropagation()
    }

    container.addEventListener('wheel', handleWheel, { capture: true, passive: true })
    container.addEventListener('touchmove', handleTouchMove, { capture: true, passive: true })

    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true })
      container.removeEventListener('touchmove', handleTouchMove, { capture: true })
    }
  }, [])

  const handleLoad = (splineApp: any) => {
    if (splineApp && splineApp.canvas) {
      splineApp.canvas.style.setProperty('cursor', 'default', 'important')
      splineApp.canvas.style.setProperty('touch-action', 'pan-y', 'important')
    }
    if (onLoad) {
      onLoad(splineApp)
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
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
          style={{ cursor: 'default', touchAction: 'pan-y', ...style }}
          onLoad={handleLoad}
        />
      </Suspense>
    </div>
  )
}


