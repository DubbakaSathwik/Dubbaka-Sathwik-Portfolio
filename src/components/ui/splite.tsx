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

    // Allow mouse interaction (hover, look, click), but ensure mouse wheel
    // scrolls the page at the exact same static speed without zooming the 3D scene
    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation()
      window.scrollBy({
        top: e.deltaY,
        left: e.deltaX,
        behavior: 'auto',
      })
    }

    container.addEventListener('wheel', handleWheel, { capture: true, passive: true })

    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true })
    }
  }, [])

  const handleLoad = (splineApp: any) => {
    if (splineApp && splineApp.canvas) {
      splineApp.canvas.style.setProperty('cursor', 'grab', 'important')
      splineApp.canvas.style.setProperty('touch-action', 'pan-y', 'important')
      splineApp.canvas.style.setProperty('pointer-events', 'auto', 'important')
    }
    if (onLoad) {
      onLoad(splineApp)
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full relative select-none">
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
          style={{ cursor: 'grab', touchAction: 'pan-y', pointerEvents: 'auto', ...style }}
          onLoad={handleLoad}
        />
      </Suspense>
    </div>
  )
}


