'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Calendar, MapPin, FileText, Download, Share2, Eye, CheckCircle } from 'lucide-react'
import { Inspection, Room } from '@/types'
import { DatabaseService } from '@/lib/database'
import { PDFGenerator } from '@/lib/pdfGenerator'
import { ShareService } from '@/lib/shareService'
import { getRoomTemplate } from '@/lib/roomTemplates'
import AddRoomModal from './AddRoomModal'

interface InspectionDetailsProps {
  inspectionId: string
}

export default function InspectionDetails({ inspectionId }: InspectionDetailsProps) {
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [sharing, setSharing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadInspectionData()
  }, [inspectionId])

  const loadInspectionData = async () => {
    try {
      const [inspectionData, roomsData] = await Promise.all([
        DatabaseService.getInspection(inspectionId),
        DatabaseService.getRoomsByInspection(inspectionId)
      ])
      
      if (!inspectionData) {
        router.push('/')
        return
      }
      
      setInspection(inspectionData)
      setRooms(roomsData || [])
    } catch (error) {
      console.error('Error loading inspection data:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRoom = async (roomData: { name: string; type: any; notes?: string }) => {
    try {
      const roomId = await DatabaseService.createRoom({
        ...roomData,
        inspectionId
      })
      
      // Add default items for this room type
      const template = getRoomTemplate(roomData.type)
      if (template?.defaultItems) {
        for (const itemName of template.defaultItems) {
          await DatabaseService.createInspectionItem({
            roomId,
            name: itemName,
            condition: 'good'
          })
        }
      }
      
      setShowAddRoom(false)
      loadInspectionData()
    } catch (error) {
      console.error('Error adding room:', error)
    }
  }

  const handleGeneratePDF = async () => {
    if (!inspection) return
    
    setGeneratingPDF(true)
    try {
      const pdfBlob = await PDFGenerator.generateReport(inspectionId)
      
      // Save report to database
      await DatabaseService.saveReport({
        inspectionId,
        filename: `inspection-report-${Date.now()}.pdf`,
        generatedAt: new Date().toISOString(),
        blob: pdfBlob
      })
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Move-Out-Inspection-${inspection.propertyAddress.replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Update inspection status
      await DatabaseService.updateInspection(inspectionId, { status: 'completed' })
      setInspection(prev => prev ? { ...prev, status: 'completed' } : null)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF report. Please try again.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleShare = async () => {
    if (!inspection) return
    
    setSharing(true)
    try {
      // Generate PDF if not already done
      let reportBlob: Blob
      const existingReports = await DatabaseService.getReportsByInspection(inspectionId)
      
      if (existingReports && existingReports.length > 0) {
        reportBlob = existingReports[0].blob
      } else {
        reportBlob = await PDFGenerator.generateReport(inspectionId)
        await DatabaseService.saveReport({
          inspectionId,
          filename: `inspection-report-${Date.now()}.pdf`,
          generatedAt: new Date().toISOString(),
          blob: reportBlob
        })
      }
      
      // Create share link
      const reports = await DatabaseService.getReportsByInspection(inspectionId)
      const report = reports && reports.length > 0 ? reports[0] : null
      if (!report) throw new Error('Report not found')
      
      const shareUrl = await ShareService.createShareLink(inspectionId, report.id)
      
      // Share using Web Share API or clipboard
      const shared = await ShareService.shareReport(shareUrl)
      
      if (shared) {
        await DatabaseService.updateInspection(inspectionId, { status: 'shared' })
        setInspection(prev => prev ? { ...prev, status: 'shared' } : null)
        alert('Report shared successfully!')
      } else {
        alert('Failed to share report. Please try again.')
      }
      
    } catch (error) {
      console.error('Error sharing report:', error)
      alert('Failed to create shareable link. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  const getRoomProgress = async (roomId: string): Promise<number> => {
    try {
      const items = await DatabaseService.getItemsByRoom(roomId)
      if (!items || items.length === 0) return 0
      const completedItems = items.filter(item => item.checkedAt).length
      return Math.round((completedItems / items.length) * 100)
    } catch (error) {
      console.error('Error getting room progress:', error)
      return 0
    }
  }

  const getOverallProgress = async (): Promise<number> => {
    if (!rooms || rooms.length === 0) return 0
    
    try {
      const progressPromises = rooms.map(room => getRoomProgress(room.id))
      const progressValues = await Promise.all(progressPromises)
      const totalProgress = progressValues.reduce((sum, progress) => sum + progress, 0)
      return Math.round(totalProgress / rooms.length)
    } catch (error) {
      console.error('Error calculating overall progress:', error)
      return 0
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen-mobile flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="min-h-screen-mobile flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Inspection not found</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen-mobile bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                Inspection Details
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGeneratePDF}
                disabled={generatingPDF || !rooms || rooms.length === 0}
                className="btn-primary flex items-center gap-2"
              >
                {generatingPDF ? (
                  <>
                    <div className="loading-spinner w-4 h-4"></div>
                    <span className="hidden sm:inline">Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF Report</span>
                  </>
                )}
              </button>
              {inspection.status === 'completed' && (
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="btn-secondary flex items-center gap-2"
                >
                  {sharing ? (
                    <div className="loading-spinner w-4 h-4"></div>
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Inspection Info */}
        <InspectionInfo inspection={inspection} rooms={rooms} />

        {/* Rooms Section */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Rooms</h3>
          <button
            onClick={() => setShowAddRoom(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>

        {!rooms || rooms.length === 0 ? (
          <div className="text-center py-12 card">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms added yet</h3>
            <p className="text-gray-600 mb-6">
              Start by adding rooms to your inspection.
            </p>
            <button
              onClick={() => setShowAddRoom(true)}
              className="btn-primary"
            >
              Add Your First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                onViewRoom={() => router.push(`/room/${room.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Room Modal */}
      {showAddRoom && (
        <AddRoomModal
          onClose={() => setShowAddRoom(false)}
          onAdd={handleAddRoom}
        />
      )}

      {/* Mobile spacing */}
      <div className="h-20 safe-bottom"></div>
    </div>
  )
}

// Separate component for inspection info
function InspectionInfo({ inspection, rooms }: { inspection: Inspection; rooms: Room[] }) {
  const [overallProgress, setOverallProgress] = useState(0)

  useEffect(() => {
    const calculateProgress = async () => {
      if (!rooms || rooms.length === 0) {
        setOverallProgress(0)
        return
      }
      
      try {
        const progressPromises = rooms.map(async (room) => {
          const items = await DatabaseService.getItemsByRoom(room.id)
          if (!items || items.length === 0) return 0
          const completedItems = items.filter(item => item.checkedAt).length
          return Math.round((completedItems / items.length) * 100)
        })
        
        const progressValues = await Promise.all(progressPromises)
        const totalProgress = progressValues.reduce((sum, progress) => sum + progress, 0)
        setOverallProgress(Math.round(totalProgress / rooms.length))
      } catch (error) {
        console.error('Error calculating progress:', error)
        setOverallProgress(0)
      }
    }

    calculateProgress()
  }, [rooms])

  return (
    <div className="card mb-8">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {inspection.propertyAddress}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(inspection.inspectionDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {rooms?.length || 0} room{(rooms?.length || 0) !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            inspection.status === 'completed'
              ? 'bg-success-100 text-success-800'
              : inspection.status === 'in-progress'
              ? 'bg-warning-100 text-warning-800'
              : inspection.status === 'shared'
              ? 'bg-primary-100 text-primary-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {inspection.status.replace('-', ' ').toUpperCase()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {inspection.notes && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
          <p className="text-gray-600">{inspection.notes}</p>
        </div>
      )}
    </div>
  )
}

// Separate component for room card
function RoomCard({ room, onViewRoom }: { room: Room; onViewRoom: () => void }) {
  const [progress, setProgress] = useState(0)
  const [itemCount, setItemCount] = useState(0)
  const [photoCount, setPhotoCount] = useState(0)

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const [items, photos] = await Promise.all([
          DatabaseService.getItemsByRoom(room.id),
          DatabaseService.getPhotosByRoom(room.id)
        ])
        
        setItemCount(items?.length || 0)
        setPhotoCount(photos?.length || 0)
        
        if (items && items.length > 0) {
          const completedItems = items.filter(item => item.checkedAt).length
          setProgress(Math.round((completedItems / items.length) * 100))
        } else {
          setProgress(0)
        }
      } catch (error) {
        console.error('Error loading room data:', error)
        setProgress(0)
        setItemCount(0)
        setPhotoCount(0)
      }
    }

    loadRoomData()
  }, [room.id])

  const template = getRoomTemplate(room.type)
  
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{template?.icon || '📦'}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{room.name}</h4>
            <p className="text-sm text-gray-600">
              {room.type.replace('-', ' ').toUpperCase()}
            </p>
          </div>
        </div>
        {progress === 100 && (
          <CheckCircle className="w-5 h-5 text-success-600" />
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progress === 100 ? 'bg-success-600' : 'bg-primary-600'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {itemCount} inspection items
        {photoCount > 0 && ` • ${photoCount} photos`}
      </div>

      {room.notes && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {room.notes}
        </p>
      )}

      <button
        onClick={onViewRoom}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Eye className="w-4 h-4" />
        {progress > 0 ? 'Continue' : 'Start'} Inspection
      </button>
    </div>
  )
}