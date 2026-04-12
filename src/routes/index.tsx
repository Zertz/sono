import { createFileRoute } from '@tanstack/react-router'
import VolumeMeter from '../components/VolumeMeter'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <VolumeMeter />
    </main>
  )
}
