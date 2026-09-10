import React, { Component, ReactNode, Suspense, lazy, CSSProperties, useRef, useState, useEffect } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
  style?: CSSProperties
  onLoad?: (splineApp: any) => void
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class SplineErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: any) {
    console.warn('Spline 3D Scene encountered a render/WebGPU error, fallback activated:', error);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full flex items-center justify-center bg-transparent">
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                ⚡
              </div>
              <span className="text-xs font-mono text-zinc-500">3D Scene Loading</span>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export function SplineScene({ scene, className, style, onLoad }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasValidDimensions, setHasValidDimensions] = useState(false)
  const isWebViewerUrl = scene.includes('my.spline.design')

  useEffect(() => {
    if (isWebViewerUrl) {
      setHasValidDimensions(true)
      return
    }

    const el = containerRef.current
    if (!el) return

    const checkDimensions = (width: number, height: number) => {
      // Prevent WebGPU / Three.js from initializing with zero-size Extent3D textures
      return width >= 50 && height >= 50
    }

    const rect = el.getBoundingClientRect()
    if (checkDimensions(rect.width, rect.height)) {
      setHasValidDimensions(true)
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const valid = checkDimensions(width, height)
        setHasValidDimensions(valid)
      }
    })

    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [isWebViewerUrl])

  if (isWebViewerUrl) {
    return (
      <div ref={containerRef} className={`w-full h-full relative select-none overflow-hidden ${className || ''}`}>
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
          splineApp._renderer.setClearColor(0x000000, 0)
        }
        if (splineApp._scene) {
          splineApp._scene.background = null
        }
      } catch (e) {}
    }
    if (onLoad) {
      onLoad(splineApp)
    }
  }

  return (
    <div ref={containerRef} className={`w-full h-full relative select-none pointer-events-auto ${className || ''}`}>
      <SplineErrorBoundary>
        {hasValidDimensions ? (
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs font-mono text-emerald-400/80">Loading 3D Scene...</span>
              </div>
            }
          >
            <Spline
              scene={scene}
              className="w-full h-full"
              style={{
                pointerEvents: 'auto',
                touchAction: 'pan-y',
                cursor: 'grab',
                ...style,
              }}
              onLoad={handleLoad}
            />
          </Suspense>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-600">Initializing canvas...</span>
          </div>
        )}
      </SplineErrorBoundary>
    </div>
  )
}

