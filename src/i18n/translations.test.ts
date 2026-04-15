import { describe, expect, it } from 'vitest'
import { translations } from './translations'

describe('idle prompt translations', () => {
  it('uses the updated two-line English copy', () => {
    expect(translations.en.idlePromptLine1).toBe('Press Start to begin.')
    expect(translations.en.idlePromptLine2).toBe("You'll be asked for microphone access.")
  })

  it('provides both idle prompt lines for each locale', () => {
    for (const locale of Object.keys(translations) as Array<keyof typeof translations>) {
      expect(translations[locale].idlePromptLine1.trim().length).toBeGreaterThan(0)
      expect(translations[locale].idlePromptLine2.trim().length).toBeGreaterThan(0)
    }
  })
})
