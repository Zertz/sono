export type Locale = 'en' | 'fr' | 'es' | 'de' | 'pt' | 'zh'

export interface Translations {
  // Header
  githubLabel: string
  contributeOnGitHub: string
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
  idlePromptLine1: string
  idlePromptLine2: string
  duration: string
  durationNone: string
  durationMinutes: (n: number) => string
  timeRemaining: (mmss: string) => string
  stopTimer: string
  sessionEnded: string
  // Volume meter — settings card
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
    contributeOnGitHub: 'Contribute on GitHub',
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
    idlePromptLine1: 'Press Start to begin.',
    idlePromptLine2: "You'll be asked for microphone access.",
    duration: 'Duration',
    durationNone: 'No limit',
    durationMinutes: (n) => `${n} min`,
    timeRemaining: (mmss) => mmss,
    stopTimer: 'Stop timer',
    sessionEnded: "Time's up!",
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
    contributeOnGitHub: 'Contribuer sur GitHub',
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
    idlePromptLine1: 'Appuyez sur Démarrer pour commencer.',
    idlePromptLine2: "L'accès au microphone sera demandé.",
    duration: 'Durée',
    durationNone: 'Sans limite',
    durationMinutes: (n) => `${n} min`,
    timeRemaining: (mmss) => mmss,
    stopTimer: 'Arrêter le minuteur',
    sessionEnded: 'Temps \u00e9coul\u00e9\u00a0!',
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
    contributeOnGitHub: 'Contribuir en GitHub',
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
    idlePromptLine1: 'Pulsa Iniciar para comenzar.',
    idlePromptLine2: 'Se solicitará acceso al micrófono.',
    duration: 'Duración',
    durationNone: 'Sin límite',
    durationMinutes: (n) => `${n} min`,
    timeRemaining: (mmss) => mmss,
    stopTimer: 'Detener temporizador',
    sessionEnded: '¡Tiempo!',
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

  de: {
    githubLabel: 'Sono auf GitHub ansehen',
    contributeOnGitHub: 'Auf GitHub beitragen',
    help: 'Hilfe',
    helpIosTitle: 'iOS — Mikrofonzugriff',
    helpIosSafariTitle: 'Safari',
    helpIosSafariSteps: [
      'Einstellungen öffnen',
      'Nach unten scrollen und Safari → Mikrofon tippen',
      'Fragen auswählen',
      'Zu Sono zurückkehren und die Seite neu laden',
    ],
    helpIosChromeTitle: 'Andere iOS-Browser',
    helpIosChromeSteps: [
      'Einstellungen öffnen',
      'Nach unten scrollen und Chrome, Edge oder Firefox tippen',
      'Mikrofon antippen und aktivieren',
      'Zu Sono zurückkehren und die Seite neu laden',
    ],
    tooLoud: 'Zu laut!',
    volumeAboveThreshold: 'Die Lautstärke liegt über deinem Schwellenwert',
    volumeLevel: 'Lautstärkepegel',
    dbUnit: 'dB',
    start: 'Start',
    stop: 'Stopp',
    calibratingMessage:
      'Umgebungsgeräusch wird gemessen… bitte kurz ruhig bleiben',
    micDenied:
      'Der Zugriff auf das Mikrofon wurde verweigert. Bitte Mikrofonzugriff erlauben und erneut versuchen.',
    idlePromptLine1: 'Drücke Start, um zu beginnen.',
    idlePromptLine2: 'Du wirst nach Mikrofonzugriff gefragt.',
    duration: 'Dauer',
    durationNone: 'Kein Limit',
    durationMinutes: (n) => `${n} Min`,
    timeRemaining: (mmss) => mmss,
    stopTimer: 'Timer stoppen',
    sessionEnded: 'Zeit abgelaufen!',
    settings: 'Einstellungen',
    adjust: 'Anpassen',
    alertThreshold: 'Warnschwelle',
    thresholdValue: (n) => `+${n} dB über Basiswert`,
    moreSensitive: 'Leiser',
    lessSensitive: 'Lauter',
    language: 'Sprache',
    theme: 'Design',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeAuto: 'Auto',
    baselineTitle: 'Grundrauschpegel',
    baselineSubtitle: 'Kalibrierung der Umgebungslautstärke',
    recalibrate: 'Neu kalibrieren',
  },

  pt: {
    githubLabel: 'Ver Sono no GitHub',
    contributeOnGitHub: 'Contribuir no GitHub',
    help: 'Ajuda',
    helpIosTitle: 'iOS — Acesso ao microfone',
    helpIosSafariTitle: 'Safari',
    helpIosSafariSteps: [
      'Abra o app Ajustes',
      'Role para baixo e toque em Safari → Microfone',
      'Selecione Perguntar',
      'Volte ao Sono e recarregue a página',
    ],
    helpIosChromeTitle: 'Outros navegadores iOS',
    helpIosChromeSteps: [
      'Abra o app Ajustes',
      'Role para baixo e toque em Chrome, Edge ou Firefox',
      'Toque em Microfone e ative',
      'Volte ao Sono e recarregue a página',
    ],
    tooLoud: 'Muito alto!',
    volumeAboveThreshold: 'O volume está acima do seu limite',
    volumeLevel: 'Nível de volume',
    dbUnit: 'dB',
    start: 'Iniciar',
    stop: 'Parar',
    calibratingMessage:
      'Medindo o ruído ambiente… fique em silêncio por um momento',
    micDenied:
      'O acesso ao microfone foi negado. Permita o acesso ao microfone e tente novamente.',
    idlePromptLine1: 'Pressione Iniciar para começar.',
    idlePromptLine2: 'Você será solicitado a permitir acesso ao microfone.',
    duration: 'Duração',
    durationNone: 'Sem limite',
    durationMinutes: (n) => `${n} min`,
    timeRemaining: (mmss) => mmss,
    stopTimer: 'Parar temporizador',
    sessionEnded: 'Tempo esgotado!',
    settings: 'Configurações',
    adjust: 'Ajustar',
    alertThreshold: 'Limite de alerta',
    thresholdValue: (n) => `+${n} dB acima da base`,
    moreSensitive: 'Mais silencioso',
    lessSensitive: 'Mais alto',
    language: 'Idioma',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    themeAuto: 'Auto',
    baselineTitle: 'Nível base de ruído',
    baselineSubtitle: 'Calibração do ambiente',
    recalibrate: 'Recalibrar',
  },

  zh: {
    githubLabel: '在 GitHub 查看 Sono',
    contributeOnGitHub: '在 GitHub 参与贡献',
    help: '帮助',
    helpIosTitle: 'iOS — 麦克风权限',
    helpIosSafariTitle: 'Safari',
    helpIosSafariSteps: [
      '打开“设置”应用',
      '下滑并点击 Safari → 麦克风',
      '选择“询问”',
      '返回 Sono 并刷新页面',
    ],
    helpIosChromeTitle: '其他 iOS 浏览器',
    helpIosChromeSteps: [
      '打开“设置”应用',
      '下滑并点击 Chrome、Edge 或 Firefox',
      '点击“麦克风”并开启权限',
      '返回 Sono 并刷新页面',
    ],
    tooLoud: '太吵了！',
    volumeAboveThreshold: '音量超过了你的阈值',
    volumeLevel: '音量等级',
    dbUnit: 'dB',
    start: '开始',
    stop: '停止',
    calibratingMessage: '正在测量环境噪音… 请保持安静片刻',
    micDenied: '麦克风访问被拒绝。请允许麦克风权限后重试。',
    idlePromptLine1: '按“开始”以启动。',
    idlePromptLine2: '系统将请求麦克风访问权限。',
    duration: '时长',
    durationNone: '不限时',
    durationMinutes: (n) => `${n} 分钟`,
    timeRemaining: (mmss) => mmss,
    stopTimer: '停止计时',
    sessionEnded: '时间到！',
    settings: '设置',
    adjust: '调整',
    alertThreshold: '警报阈值',
    thresholdValue: (n) => `高于基线 +${n} dB`,
    moreSensitive: '更安静',
    lessSensitive: '更响',
    language: '语言',
    theme: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    themeAuto: '自动',
    baselineTitle: '基线噪音水平',
    baselineSubtitle: '环境校准',
    recalibrate: '重新校准',
  },
}
