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
    // scrolls the page naturally across all OS/browsers without Spline hijacking zoom
    const handleWheel = (e: WheelEvent) => {
      // Prevent Spline runtime from capturing wheel and zooming the camera
      e.stopPropagation()
      e.stopImmediatePropagation()

      let deltaY = e.deltaY

      // Normalize deltaMode: 0 = pixels, 1 = lines (common on Windows mouse wheel), 2 = pages
      if (e.deltaMode === 1) {
        deltaY *= 33
      } else if (e.deltaMode === 2) {
        deltaY *= window.innerHeight
      }

      window.scrollBy({
        top: deltaY,
        left: 0,
        behavior: 'auto',
      })
    }

    // Attach wheel listener with capture: true & passive: false to override Spline camera zoom
    container.addEventListener('wheel', handleWheel, { capture: true, passive: false })

    const attachCanvasEvents = () => {
      const canvas = container.querySelector('canvas')
      if (canvas) {
        canvas.style.setProperty('touch-action', 'pan-y', 'important')
        canvas.addEventListener('wheel', handleWheel, { capture: true, passive: false })
      }
    }

    attachCanvasEvents()

    const observer = new MutationObserver(() => {
      attachCanvasEvents()
    })
    observer.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      container.removeEventListener('wheel', handleWheel, { capture: true })
      const canvas = container.querySelector('canvas')
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel, { capture: true })
      }
    }
  }, [])

  const handleLoad = (splineApp: any) => {
    if (splineApp) {
      const canvas = splineApp.canvas || containerRef.current?.querySelector('canvas')
      if (canvas) {
        canvas.style.setProperty('cursor', 'grab', 'important')
        canvas.style.setProperty('touch-action', 'pan-y', 'important')
        canvas.style.setProperty('pointer-events', 'auto', 'important')

        const handleWheel = (e: WheelEvent) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
          let deltaY = e.deltaY
          if (e.deltaMode === 1) {
            deltaY *= 33
          } else if (e.deltaMode === 2) {
            deltaY *= window.innerHeight
          }
          window.scrollBy({
            top: deltaY,
            left: 0,
            behavior: 'auto',
          })
        }
        canvas.addEventListener('wheel', handleWheel, { capture: true, passive: false })
      }
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


