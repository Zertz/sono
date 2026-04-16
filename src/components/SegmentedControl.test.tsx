// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SegmentedControl from './SegmentedControl'

afterEach(() => {
  cleanup()
})

describe('SegmentedControl', () => {
  it('renders the label, options, and selected state', () => {
    render(
      <SegmentedControl
        label="Duration"
        options={[
          { value: null, label: 'No limit' },
          { value: 5, label: '5m' },
          { value: 10, label: '10m' },
        ]}
        value={5}
        onChange={() => {}}
      />,
    )

    expect(screen.getByText('Duration')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'No limit' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: '5m' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '10m' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('calls onChange with the selected option value', () => {
    const onChange = vi.fn()

    render(
      <SegmentedControl
        label="Duration"
        options={[
          { value: null, label: 'No limit' },
          { value: 5, label: '5m' },
        ]}
        value={5}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'No limit' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
