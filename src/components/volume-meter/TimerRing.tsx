'use client'

import { useEffect, useState, type RefObject } from 'react'

function roundedRectPerimeter(w: number, h: number, r: number): number {
  return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r
}

function ringColor(ratio: number): string {
  if (ratio > 0.25) return 'var(--lagoon)'
  if (ratio > 0.10) return '#f59e0b'
  return '#ef4444'
}

interface TimerRingProps {
  timeLeft: number | null
  totalSeconds: number | null
  containerRef: RefObject<HTMLDivElement | null>
}

export default function TimerRing({ timeLeft, totalSeconds, containerRef }: TimerRingProps) {
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // Use borderBoxSize so padding is included in the measurement
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0]
      if (box) {
        setDims({ w: box.inlineSize, h: box.blockSize })
      } else {
        setDims({ w: el.offsetWidth, h: el.offsetHeight })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef])

  const active = timeLeft !== null && totalSeconds !== null && totalSeconds > 0
  const ratio = timeLeft !== null && totalSeconds !== null && totalSeconds > 0 ? timeLeft / totalSeconds : 1

  // SVG fills the wrapper exactly. The rect is inset by half the stroke width
  // so the stroke renders fully inside the SVG bounds.
  // The card's rounded-2xl = 16px; wrapper p-[6px] adds 6px → ring rx = 22px.
  const sw = 4
  const half = sw / 2
  const rx = 22
  const svgW = dims.w
  const svgH = dims.h
  const rectW = svgW - sw
  const rectH = svgH - sw
  const perimeter = dims.w > 0 ? roundedRectPerimeter(rectW, rectH, rx) : 0
  const offset = perimeter * (1 - ratio)

  return (
    <div className="absolute inset-0 pointer-events-none">
      {dims.w > 0 && (
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* Both rects share the same group so they're co-registered. */}
          <g>
            {/* Faint track — always shown when a duration is active */}
            {active && (
              <rect
                x={half} y={half}
                width={rectW} height={rectH}
                rx={rx} ry={rx}
                fill="none"
                stroke="currentColor"
                strokeWidth={sw}
                strokeOpacity={0.12}
              />
            )}
            {/* Progress stroke — drains clockwise from top-centre */}
            <rect
              x={half} y={half}
              width={rectW} height={rectH}
              rx={rx} ry={rx}
              fill="none"
              stroke={ringColor(ratio)}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={perimeter}
              strokeDashoffset={offset}
              style={{
                opacity: active ? 1 : 0,
                transition: 'stroke-dashoffset 1s linear, stroke 1s ease, opacity 400ms ease',
              }}
            />
          </g>
        </svg>
      )}
    </div>
  )
}
