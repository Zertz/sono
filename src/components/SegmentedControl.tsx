interface Option<T> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string | number | null> {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export default function SegmentedControl<T extends string | number | null>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex w-full items-center justify-between">
      <span className="hidden sm:inline text-sm font-semibold text-[var(--sea-ink)]">{label}</span>
      <div className="flex items-center rounded-full border border-[var(--line)] bg-[var(--chip-bg)] p-0.5">
        {options.map((option) => (
          <button
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              value === option.value
                ? 'bg-[var(--lagoon-deep)] text-white shadow-sm'
                : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
