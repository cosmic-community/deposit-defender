import { Metadata } from 'next'
import SharedReport from '@/components/SharedReport'

export const metadata: Metadata = {
  title: 'Shared Inspection Report - DepositDefender',
  description: 'View shared move-out inspection report',
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params
  
  return (
    <div className="min-h-screen-mobile bg-white">
      <SharedReport token={token} />
    </div>
  )
}