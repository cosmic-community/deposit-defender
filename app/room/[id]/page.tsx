import { Metadata } from 'next'
import RoomInspection from '@/components/RoomInspection'

export const metadata: Metadata = {
  title: 'Room Inspection - DepositDefender',
  description: 'Conduct detailed room inspection with photo documentation',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RoomPage({ params }: PageProps) {
  const { id } = await params
  
  return (
    <div className="min-h-screen-mobile">
      <RoomInspection roomId={id} />
    </div>
  )
}