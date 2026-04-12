import type React from 'react'

export type Locale = 'en' | 'fr' | 'es'

export interface Translations {
  // Header
  githubLabel: string
  // Help overlay
  help: string
  helpIosTitle: string
  helpIosSafariTitle: string
  helpIosSafariSteps: string[]
  helpIosChromeTitle: string
  helpIosChromeSteps: string[]
  // Volume meter — warning banner
  tooLoud: string
  volumeAboveThreshold: string
  // Volume meter — meter card
  volumeLevel: string
  dbUnit: string
  start: string
  stop: string
  calibratingMessage: string
  micDenied: string
  idlePrompt: (startLabel: React.ReactNode) => React.ReactNode
  // Volume meter — settings card
  settings: string
  adjust: string
  alertThreshold: string
  thresholdValue: (n: number) => string
  moreSensitive: string
  lessSensitive: string
  language: string
  theme: string
  themeLight: string
  themeDark: string
  themeAuto: string
  baselineTitle: string
  baselineSubtitle: string
  recalibrate: string
}

export const translations: Record<Locale, Translations> = {
  en: {
    githubLabel: 'View Sono on GitHub',
    help: 'Help',
    helpIosTitle: 'iOS — Microphone Access',
    helpIosSafariTitle: 'Safari',
    helpIosSafariSteps: [
      'Open the Settings app',
      'Scroll down and tap Safari → tap Microphone',
      'Select Ask',
      'Return to Sono and reload the page',
    ],
    helpIosChromeTitle: 'Other iOS browsers',
    helpIosChromeSteps: [
      'Open the Settings app',
      'Scroll down and tap Chrome, Edge, or Firefox',
      'Tap Microphone and toggle it on',
      'Return to Sono and reload the page',
    ],
    tooLoud: 'Too loud!',
    volumeAboveThreshold: 'Volume is above your threshold',
    volumeLevel: 'Volume Level',
    dbUnit: 'dB',
    start: 'Start',
    stop: 'Stop',

    calibratingMessage: 'Measuring ambient noise… stay quiet for a moment',
    micDenied:
      'Microphone access was denied. Please allow microphone permissions and try again.',
    idlePrompt: (startLabel) => (
      <>Press {startLabel} to begin monitoring. You'll be asked for microphone access.</>
    ),
    settings: 'Settings',
    adjust: 'Adjust',
    alertThreshold: 'Alert threshold',
    thresholdValue: (n) => `+${n} dB above baseline`,
    moreSensitive: 'Quieter',
    lessSensitive: 'Louder',
    language: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeAuto: 'Auto',
    baselineTitle: 'Baseline noise level',
    baselineSubtitle: 'Ambient environment calibration',
    recalibrate: 'Recalibrate',
  },

  fr: {
    githubLabel: 'Voir Sono sur GitHub',
    help: 'Aide',
    helpIosTitle: 'iOS — Accès au microphone',
    helpIosSafariTitle: 'Safari',
    helpIosSafariSteps: [
      "Ouvrir l'application Réglages",
      "Faire défiler jusqu\u2019à Safari \u2192 appuyer sur Microphone",
      'Sélectionner Demander',
      'Revenir sur Sono et recharger la page',
    ],
    helpIosChromeTitle: 'Autres navigateurs iOS',
    helpIosChromeSteps: [
      "Ouvrir l'application Réglages",
      "Faire défiler jusqu\u2019à Chrome, Edge ou Firefox",
      "Appuyer sur Microphone et activer l\u2019accès",
      'Revenir sur Sono et recharger la page',
    ],
    tooLoud: 'Trop fort\u00a0!',
    volumeAboveThreshold: 'Le volume dépasse votre seuil',
    volumeLevel: 'Niveau sonore',
    dbUnit: 'dB',
    start: 'Démarrer',
    stop: 'Arrêter',

    calibratingMessage:
      'Mesure du bruit ambiant… restez silencieux un instant',
    micDenied:
      "L'accès au microphone a été refusé. Veuillez autoriser le microphone et réessayer.",
    idlePrompt: (startLabel) => (
      <>Appuyez sur {startLabel} pour commencer. L'accès au microphone sera demandé.</>
    ),
    settings: 'Paramètres',
    adjust: 'Ajuster',
    alertThreshold: "Seuil d'alerte",
    thresholdValue: (n) => `+${n} dB au-dessus de la base`,
    moreSensitive: 'Plus calme',
    lessSensitive: 'Plus fort',
    language: 'Langue',
    theme: 'Thème',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    themeAuto: 'Auto',
    baselineTitle: 'Niveau de base',
    baselineSubtitle: "Calibration de l'environnement ambiant",
    recalibrate: 'Recalibrer',
  },

  es: {
    githubLabel: 'Ver Sono en GitHub',
    help: 'Ayuda',
    helpIosTitle: 'iOS — Acceso al micrófono',
    helpIosSafariTitle: 'Safari',
    helpIosSafariSteps: [
      'Abrir la aplicación Ajustes',
      'Desplazarse hasta Safari → pulsar Micrófono',
      'Seleccionar Preguntar',
      'Volver a Sono y recargar la página',
    ],
    helpIosChromeTitle: 'Otros navegadores iOS',
    helpIosChromeSteps: [
      'Abrir la aplicación Ajustes',
      'Desplazarse hasta Chrome, Edge o Firefox',
      'Pulsar Micrófono y activarlo',
      'Volver a Sono y recargar la página',
    ],
    tooLoud: '¡Demasiado alto!',
    volumeAboveThreshold: 'El volumen supera tu umbral',
    volumeLevel: 'Nivel de volumen',
    dbUnit: 'dB',
    start: 'Iniciar',
    stop: 'Detener',

    calibratingMessage:
      'Midiendo el ruido ambiental… quédate en silencio un momento',
    micDenied:
      'Se denegó el acceso al micrófono. Permite el acceso al micrófono e inténtalo de nuevo.',
    idlePrompt: (startLabel) => (
      <>Pulsa {startLabel} para comenzar. Se solicitará acceso al micrófono.</>
    ),
    settings: 'Ajustes',
    adjust: 'Ajustar',
    alertThreshold: 'Umbral de alerta',
    thresholdValue: (n) => `+${n} dB sobre la base`,
    moreSensitive: 'Más silencioso',
    lessSensitive: 'Más fuerte',
    language: 'Idioma',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeAuto: 'Auto',
    baselineTitle: 'Nivel de ruido base',
    baselineSubtitle: 'Calibración del entorno ambiental',
    recalibrate: 'Recalibrar',
  },
}
