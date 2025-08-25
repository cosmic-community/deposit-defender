import { Metadata } from 'next'
import InspectionDashboard from '@/components/InspectionDashboard'

export const metadata: Metadata = {
  title: 'DepositDefender - Move-Out Inspection App',
  description: 'Document your property condition with room-by-room checklists and professional PDF reports',
}

export default function HomePage() {
  return (
    <div className="min-h-screen-mobile">
      <InspectionDashboard />
    </div>
  )
}