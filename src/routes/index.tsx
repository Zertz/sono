import { createFileRoute } from '@tanstack/react-router'
import VolumeMeter from '../components/VolumeMeter'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="flex flex-1 flex-col items-center p-4">
      <VolumeMeter />
    </main>
  )
}
