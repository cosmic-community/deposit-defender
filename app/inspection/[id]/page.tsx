import { Metadata } from 'next'
import InspectionDetails from '@/components/InspectionDetails'

export const metadata: Metadata = {
  title: 'Inspection Details - DepositDefender',
  description: 'View and manage your move-out inspection details',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InspectionPage({ params }: PageProps) {
  const { id } = await params
  
  return (
    <div className="min-h-screen-mobile">
      <InspectionDetails inspectionId={id} />
    </div>
  )
}