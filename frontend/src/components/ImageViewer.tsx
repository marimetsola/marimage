import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'

interface ImageViewerProps {
  src: string
  alt: string
  onClose: () => void
}

interface Point {
  x: number
  y: number
}

interface DragStart {
  x: number
  y: number
  offsetX: number
  offsetY: number
}

interface PinchStart {
  distance: number
  scale: number
  centerX: number
  centerY: number
  offsetX: number
  offsetY: number
}

const MIN_SCALE = 1
const MAX_SCALE = 5

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

function getDistance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 })

  const viewportRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const scaleRef = useRef(1)
  const positionRef = useRef<Point>({ x: 0, y: 0 })

  const pointersRef = useRef(new Map<number, Point>())
  const dragStartRef = useRef<DragStart | null>(null)
  const pinchStartRef = useRef<PinchStart | null>(null)

  function updatePosition(nextPosition: Point) {
    positionRef.current = nextPosition
    setPosition(nextPosition)
  }

  function clampPosition(
    x: number,
    y: number,
    currentScale: number,
  ): Point {
    const viewport = viewportRef.current
    const image = imageRef.current

    if (!viewport || !image) {
      return { x, y }
    }

    const maxX = Math.max(
      0,
      (image.offsetWidth * currentScale - viewport.clientWidth) / 2,
    )

    const maxY = Math.max(
      0,
      (image.offsetHeight * currentScale - viewport.clientHeight) / 2,
    )

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    }
  }

  function getCenteredPoint(clientX: number, clientY: number): Point {
    const rect = viewportRef.current?.getBoundingClientRect()

    if (!rect) {
      return { x: 0, y: 0 }
    }

    return {
      x: clientX - (rect.left + rect.width / 2),
      y: clientY - (rect.top + rect.height / 2),
    }
  }

  function zoomTo(
    requestedScale: number,
    anchorX = 0,
    anchorY = 0,
  ) {
    const oldScale = scaleRef.current
    const nextScale = clampScale(requestedScale)

    if (nextScale === MIN_SCALE) {
      scaleRef.current = MIN_SCALE
      setScale(MIN_SCALE)
      updatePosition({ x: 0, y: 0 })
      return
    }

    const ratio = nextScale / oldScale
    const currentPosition = positionRef.current

    const nextX =
      anchorX - (anchorX - currentPosition.x) * ratio
    const nextY =
      anchorY - (anchorY - currentPosition.y) * ratio

    scaleRef.current = nextScale
    setScale(nextScale)

    updatePosition(
      clampPosition(nextX, nextY, nextScale),
    )
  }

  function resetZoom() {
    scaleRef.current = 1
    setScale(1)
    updatePosition({ x: 0, y: 0 })
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    // Use Ctrl + mouse wheel to zoom. Ordinary wheel gestures do not zoom.
    if (!event.ctrlKey) {
      return
    }

    event.preventDefault()

    const anchor = getCenteredPoint(event.clientX, event.clientY)
    const factor = Math.exp(-event.deltaY * 0.002)

    zoomTo(scaleRef.current * factor, anchor.x, anchor.y)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    const pointers = Array.from(pointersRef.current.values())

    if (pointers.length === 1) {
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        offsetX: positionRef.current.x,
        offsetY: positionRef.current.y,
      }

      pinchStartRef.current = null
    } else if (pointers.length === 2) {
      const [a, b] = pointers
      const center = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      }

      const centered = getCenteredPoint(center.x, center.y)

      pinchStartRef.current = {
        distance: getDistance(a, b),
        scale: scaleRef.current,
        centerX: centered.x,
        centerY: centered.y,
        offsetX: positionRef.current.x,
        offsetY: positionRef.current.y,
      }

      dragStartRef.current = null
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) {
      return
    }

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    const pointers = Array.from(pointersRef.current.values())

    if (pointers.length >= 2 && pinchStartRef.current) {
      const [a, b] = pointers
      const start = pinchStartRef.current
      const distance = getDistance(a, b)

      if (start.distance === 0) {
        return
      }

      const nextScale = clampScale(
        start.scale * (distance / start.distance),
      )

      const center = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      }

      const centered = getCenteredPoint(center.x, center.y)

      const ratio = nextScale / start.scale
      const nextX =
        centered.x - (start.centerX - start.offsetX) * ratio
      const nextY =
        centered.y - (start.centerY - start.offsetY) * ratio

      scaleRef.current = nextScale
      setScale(nextScale)

      if (nextScale === MIN_SCALE) {
        updatePosition({ x: 0, y: 0 })
      } else {
        updatePosition(
          clampPosition(nextX, nextY, nextScale),
        )
      }

      return
    }

    const start = dragStartRef.current

    if (pointers.length === 1 && start && scaleRef.current > 1) {
      const nextX =
        start.offsetX + event.clientX - start.x
      const nextY =
        start.offsetY + event.clientY - start.y

      updatePosition(
        clampPosition(nextX, nextY, scaleRef.current),
      )
    }
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId)

    const remaining = Array.from(pointersRef.current.values())

    pinchStartRef.current = null

    if (remaining.length === 1) {
      const pointer = remaining[0]

      dragStartRef.current = {
        x: pointer.x,
        y: pointer.y,
        offsetX: positionRef.current.x,
        offsetY: positionRef.current.y,
      }
    } else {
      dragStartRef.current = null
    }
  }

  function handleViewportClick(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    const image = imageRef.current

    if (!image) {
      return
    }

    const rect = image.getBoundingClientRect()

    const clickedOutsideImage =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom

    if (clickedOutsideImage) {
      onClose()
    }
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="image-viewer-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="image-viewer-toolbar">
        <p className="image-viewer-title" title={alt}>
          {alt}
        </p>

        <button
          ref={closeButtonRef}
          className="image-viewer-close"
          type="button"
          onClick={onClose}
          aria-label="Close image viewer"
        >
          ×
        </button>
      </div>

      <div
        ref={viewportRef}
        className="image-viewer-viewport"
        onClick={handleViewportClick}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
      >
        <img
          ref={imageRef}
          className="image-viewer-image"
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
          }}
        />
      </div>

      <div className="image-viewer-controls" aria-label="Image zoom controls">
        <button
          type="button"
          onClick={() => zoomTo(scaleRef.current / 1.25)}
          disabled={scale <= MIN_SCALE}
          aria-label="Zoom out"
        >
          −
        </button>

        <button
          type="button"
          onClick={resetZoom}
          aria-label="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          type="button"
          onClick={() => zoomTo(scaleRef.current * 1.25)}
          disabled={scale >= MAX_SCALE}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default ImageViewer
