'use client'

import { useEffect, useRef } from 'react'

// ---------------------------------------------------------------------------
// Volume states
// ---------------------------------------------------------------------------
// 0  calm     barPercent  0–20   sleepy / content
// 1  aware    barPercent 20–45   awake, watching
// 2  nervous  barPercent 45–65   antsy
// 3  alarmed  barPercent 65–85   scared
// 4  panicked barPercent 85–100  screaming

function getState(barPercent: number, active: boolean): number {
  if (!active) return 0
  if (barPercent < 20) return 0
  if (barPercent < 45) return 1
  if (barPercent < 65) return 2
  if (barPercent < 85) return 3
  return 4
}

// Body fill colors per state
const BODY_COLORS = [
  '#4fb8b2', // calm   — teal
  '#38a89d', // aware  — slightly deeper teal
  '#8fc94a', // nervous — yellow-green
  '#f59e0b', // alarmed — amber
  '#ef4444', // panicked — red
]

// Body shadow/glow per state
const BODY_GLOWS = [
  'rgba(79,184,178,0.25)',
  'rgba(56,168,157,0.28)',
  'rgba(143,201,74,0.30)',
  'rgba(245,158,11,0.35)',
  'rgba(239,68,68,0.40)',
]

// ---------------------------------------------------------------------------
// Mouth paths per state (viewBox coordinate space 0 0 160 180)
// ---------------------------------------------------------------------------
// calm:     small content smile
// aware:    relaxed slight smile, mouth slightly open
// nervous:  flattened "o", small gap
// alarmed:  wide open oval
// panicked: huge screaming mouth

const MOUTHS = [
  // 0 calm — thin smile, closed
  <path key="m0" d="M62 112 Q80 122 98 112" stroke="#173a40" strokeWidth="3.5" strokeLinecap="round" fill="none" />,
  // 1 aware — gentle open smile
  <path key="m1" d="M58 112 Q80 126 102 112" stroke="#173a40" strokeWidth="3" strokeLinecap="round" fill="none" />,
  // 2 nervous — worried straight line with slight downward corners
  <path key="m2" d="M62 116 Q80 114 98 116" stroke="#173a40" strokeWidth="3.5" strokeLinecap="round" fill="none" />,
  // 3 alarmed — open "o" mouth
  <g key="m3">
    <ellipse cx="80" cy="116" rx="14" ry="9" fill="#173a40" />
    <ellipse cx="80" cy="116" rx="10" ry="6" fill="#7f1d1d" />
  </g>,
  // 4 panicked — wide screaming mouth
  <g key="m4">
    <ellipse cx="80" cy="118" rx="22" ry="14" fill="#173a40" />
    <ellipse cx="80" cy="119" rx="17" ry="10" fill="#7f1d1d" />
    {/* teeth */}
    <rect x="68" y="108" width="8" height="6" rx="2" fill="white" />
    <rect x="80" y="108" width="8" height="6" rx="2" fill="white" />
  </g>,
]

// Eye openness per state: [scaleY of eyelid cover, pupil scale]
// eyelid: 1 = fully open eye visible, 0 = closed
const EYE_CONFIGS = [
  { lidOpen: 0.30, pupilScale: 0.85 }, // calm   — heavy lidded
  { lidOpen: 0.95, pupilScale: 0.90 }, // aware  — fully open
  { lidOpen: 1.00, pupilScale: 0.75 }, // nervous — wide, small pupils
  { lidOpen: 1.00, pupilScale: 0.60 }, // alarmed — very wide, tiny pupils
  { lidOpen: 1.00, pupilScale: 0.45 }, // panicked — max wide, dot pupils
]

// ---------------------------------------------------------------------------
// Creature component
// ---------------------------------------------------------------------------

interface CreatureProps {
  barPercent: number
  active: boolean
}

export default function Creature({ barPercent, active }: CreatureProps) {
  const state = getState(barPercent, active)

  // Smooth barPercent for the creature so it doesn't react too twitchily
  const smoothRef = useRef(barPercent)
  const svgRef = useRef<SVGSVGElement>(null)
  const rafRef = useRef<number | null>(null)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Pupil wander — smooth random drift in calm/aware states
  const pupilOffsetRef = useRef({ lx: 0, ly: 0, rx: 0, ry: 0 })
  const pupilTargetRef = useRef({ lx: 0, ly: 0, rx: 0, ry: 0 })
  const pupilTimerRef = useRef(0)

  const lPupilRef = useRef<SVGCircleElement>(null)
  const rPupilRef = useRef<SVGCircleElement>(null)
  const lLidRef = useRef<SVGRectElement>(null)
  const rLidRef = useRef<SVGRectElement>(null)
  const bodyRef = useRef<SVGEllipseElement>(null)
  const bodyGlowRef = useRef<SVGEllipseElement>(null)

  useEffect(() => {
    let lastTime = performance.now()

    function animate(now: number) {
      const dt = Math.min(now - lastTime, 64) // cap at ~15fps worth of dt
      lastTime = now

      const s = stateRef.current
      const eyeCfg = EYE_CONFIGS[s]

      // ── Smooth barPercent ──────────────────────────────────────────
      const target = active ? barPercent : 0
      smoothRef.current += (target - smoothRef.current) * (1 - Math.exp(-dt / 120))

      // ── Body color ─────────────────────────────────────────────────
      if (bodyRef.current) {
        bodyRef.current.style.fill = BODY_COLORS[s]
      }
      if (bodyGlowRef.current) {
        bodyGlowRef.current.style.fill = BODY_GLOWS[s]
      }

      // ── Eyelid ─────────────────────────────────────────────────────
      // Lid is a rect covering the top of the eye circle.
      // lidOpen=1 → lid at top (eye fully visible); lidOpen=0 → lid covers eye
      const EYE_R = 18
      const lidTarget = EYE_R * 2 * (1 - eyeCfg.lidOpen) // how many px of lid drop
      if (lLidRef.current) lLidRef.current.style.transform = `translateY(${lidTarget - EYE_R}px)`
      if (rLidRef.current) rLidRef.current.style.transform = `translateY(${lidTarget - EYE_R}px)`

      // ── Pupil wander ───────────────────────────────────────────────
      pupilTimerRef.current -= dt
      if (pupilTimerRef.current <= 0) {
        // Pick new wander targets — range tightens when scared (pupils contract to center)
        const range = s <= 1 ? 6 : 2
        pupilTargetRef.current = {
          lx: (Math.random() * 2 - 1) * range,
          ly: (Math.random() * 2 - 1) * range,
          rx: (Math.random() * 2 - 1) * range,
          ry: (Math.random() * 2 - 1) * range,
        }
        pupilTimerRef.current = s <= 1 ? 900 + Math.random() * 1200 : 200 + Math.random() * 300
      }
      const wanderSpeed = 1 - Math.exp(-dt / 180)
      pupilOffsetRef.current.lx += (pupilTargetRef.current.lx - pupilOffsetRef.current.lx) * wanderSpeed
      pupilOffsetRef.current.ly += (pupilTargetRef.current.ly - pupilOffsetRef.current.ly) * wanderSpeed
      pupilOffsetRef.current.rx += (pupilTargetRef.current.rx - pupilOffsetRef.current.rx) * wanderSpeed
      pupilOffsetRef.current.ry += (pupilTargetRef.current.ry - pupilOffsetRef.current.ry) * wanderSpeed

      const ps = eyeCfg.pupilScale * 8 // pupil radius
      if (lPupilRef.current) {
        lPupilRef.current.setAttribute('cx', String(52 + pupilOffsetRef.current.lx))
        lPupilRef.current.setAttribute('cy', String(76 + pupilOffsetRef.current.ly))
        lPupilRef.current.setAttribute('r', String(ps))
      }
      if (rPupilRef.current) {
        rPupilRef.current.setAttribute('cx', String(108 + pupilOffsetRef.current.rx))
        rPupilRef.current.setAttribute('cy', String(76 + pupilOffsetRef.current.ry))
        rPupilRef.current.setAttribute('r', String(ps))
      }

      // ── Body shake / bounce ────────────────────────────────────────
      let shakeX = 0
      let shakeY = 0
      if (s >= 2 && active) {
        const intensity = s === 2 ? 1.5 : s === 3 ? 3 : 6
        shakeX = (Math.random() * 2 - 1) * intensity
        shakeY = (Math.random() * 2 - 1) * intensity * 0.5
      }
      // Calm breathing — gentle vertical pulse
      const breathe = s <= 1 ? Math.sin(now / 1400) * 3 : 0
      if (svgRef.current) {
        svgRef.current.style.transform = `translate(${shakeX}px, ${shakeY + breathe}px)`
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Re-sync barPercent into a ref so the RAF closure reads it without stale closure
  const barPercentRef = useRef(barPercent)
  useEffect(() => { barPercentRef.current = barPercent }, [barPercent])

  const eyeCfg = EYE_CONFIGS[state]
  const EYE_R = 18
  const lidDrop = EYE_R * 2 * (1 - eyeCfg.lidOpen) - EYE_R

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 flex items-end justify-center overflow-hidden"
      style={{ paddingBottom: 0 }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 160 180"
        width="340"
        height="382"
        style={{
          marginBottom: '-80px',
          opacity: 0.92,
          willChange: 'transform',
          transition: 'filter 600ms ease',
          filter: state >= 3 ? `drop-shadow(0 0 24px ${BODY_GLOWS[state]})` : 'none',
        }}
      >
        {/* ── Antennae ──────────────────────────────────────────── */}
        <line x1="58" y1="22" x2="44" y2="4" stroke={BODY_COLORS[state]} strokeWidth="4" strokeLinecap="round"
          style={{ transition: 'stroke 600ms ease' }} />
        <circle cx="44" cy="4" r="5" fill={BODY_COLORS[state]}
          style={{ transition: 'fill 600ms ease' }} />
        <line x1="102" y1="22" x2="116" y2="4" stroke={BODY_COLORS[state]} strokeWidth="4" strokeLinecap="round"
          style={{ transition: 'stroke 600ms ease' }} />
        <circle cx="116" cy="4" r="5" fill={BODY_COLORS[state]}
          style={{ transition: 'fill 600ms ease' }} />

        {/* ── Body glow (soft, larger ellipse behind) ───────────── */}
        <ellipse
          ref={bodyGlowRef}
          cx="80" cy="115" rx="72" ry="68"
          style={{ fill: BODY_GLOWS[state], transition: 'fill 600ms ease', opacity: 0.5 }}
        />

        {/* ── Body ─────────────────────────────────────────────── */}
        <ellipse
          ref={bodyRef}
          cx="80" cy="112" rx="62" ry="58"
          style={{ fill: BODY_COLORS[state], transition: 'fill 600ms ease' }}
        />

        {/* ── Belly spot ───────────────────────────────────────── */}
        <ellipse cx="80" cy="128" rx="28" ry="22"
          fill="white" opacity="0.18" />

        {/* ── Left eye ─────────────────────────────────────────── */}
        <g>
          <circle cx="52" cy="76" r={EYE_R} fill="white" />
          {/* pupil */}
          <circle ref={lPupilRef} cx="52" cy="76" r={eyeCfg.pupilScale * 8} fill="#173a40" />
          {/* pupil shine */}
          <circle cx="56" cy="71" r="3" fill="white" opacity="0.7" />
          {/* eyelid — clip from top */}
          <rect
            ref={lLidRef}
            x="34" y="58"
            width={EYE_R * 2} height={EYE_R * 2}
            rx={EYE_R}
            fill={BODY_COLORS[state]}
            style={{
              transform: `translateY(${lidDrop}px)`,
              transition: 'transform 300ms ease, fill 600ms ease',
            }}
          />
        </g>

        {/* ── Right eye ────────────────────────────────────────── */}
        <g>
          <circle cx="108" cy="76" r={EYE_R} fill="white" />
          <circle ref={rPupilRef} cx="108" cy="76" r={eyeCfg.pupilScale * 8} fill="#173a40" />
          <circle cx="112" cy="71" r="3" fill="white" opacity="0.7" />
          <rect
            ref={rLidRef}
            x="90" y="58"
            width={EYE_R * 2} height={EYE_R * 2}
            rx={EYE_R}
            fill={BODY_COLORS[state]}
            style={{
              transform: `translateY(${lidDrop}px)`,
              transition: 'transform 300ms ease, fill 600ms ease',
            }}
          />
        </g>

        {/* ── Mouth (state-driven) ─────────────────────────────── */}
        {MOUTHS[state]}

        {/* ── Small bumps / horns on top of body ───────────────── */}
        <ellipse cx="56" cy="56" rx="9" ry="7" fill={BODY_COLORS[state]}
          style={{ transition: 'fill 600ms ease' }} />
        <ellipse cx="104" cy="56" rx="9" ry="7" fill={BODY_COLORS[state]}
          style={{ transition: 'fill 600ms ease' }} />
      </svg>
    </div>
  )
}
