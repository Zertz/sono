import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createContext, useCallback, useContext, useState } from 'react'
import Header from '../components/Header'
import { I18nProvider } from '../i18n/context'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

// ---------------------------------------------------------------------------
// Settings overlay context — shared between Header (trigger) and VolumeMeter (panel)
// ---------------------------------------------------------------------------
interface SettingsContextValue {
  settingsOpen: boolean
  toggleSettings: () => void
  closeSettings: () => void
}

export const SettingsContext = createContext<SettingsContextValue>({
  settingsOpen: false,
  toggleSettings: () => {},
  closeSettings: () => {},
})

export function useSettings() {
  return useContext(SettingsContext)
}

// ---------------------------------------------------------------------------
// Help overlay context — shared between Header (trigger) and VolumeMeter (panel)
// ---------------------------------------------------------------------------
interface HelpContextValue {
  helpOpen: boolean
  toggleHelp: () => void
  closeHelp: () => void
}

export const HelpContext = createContext<HelpContextValue>({
  helpOpen: false,
  toggleHelp: () => {},
  closeHelp: () => {},
})

export function useHelp() {
  return useContext(HelpContext)
}

// ---------------------------------------------------------------------------

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Sono — Volume Meter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const toggleSettings = useCallback(() => {
    setSettingsOpen((o) => {
      if (!o) setHelpOpen(false)
      return !o
    })
  }, [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  const toggleHelp = useCallback(() => {
    setHelpOpen((o) => {
      if (!o) setSettingsOpen(false)
      return !o
    })
  }, [])
  const closeHelp = useCallback(() => setHelpOpen(false), [])

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="flex h-full flex-col font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <I18nProvider>
          <SettingsContext value={{ settingsOpen, toggleSettings, closeSettings }}>
            <HelpContext value={{ helpOpen, toggleHelp, closeHelp }}>
              <Header />
              {children}
            </HelpContext>
          </SettingsContext>
        </I18nProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
