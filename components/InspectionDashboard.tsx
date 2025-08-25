'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Calendar, MapPin, Share2, Trash2, Eye } from 'lucide-react'
import { Inspection } from '@/types'
import { DatabaseService } from '@/lib/database'
import CreateInspectionModal from './CreateInspectionModal'
import { useRouter } from 'next/navigation'

export default function InspectionDashboard() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadInspections()
  }, [])

  const loadInspections = async () => {
    try {
      const data = await DatabaseService.getAllInspections()
      setInspections(data)
    } catch (error) {
      console.error('Error loading inspections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInspection = async (data: { propertyAddress: string; inspectionDate: string; notes?: string }) => {
    try {
      const inspectionId = await DatabaseService.createInspection({
        propertyAddress: data.propertyAddress,
        inspectionDate: data.inspectionDate,
        rooms: [],
        status: 'draft',
        notes: data.notes
      })
      
      setShowCreateModal(false)
      router.push(`/inspection/${inspectionId}`)
    } catch (error) {
      console.error('Error creating inspection:', error)
    }
  }

  const handleDeleteInspection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this inspection? This action cannot be undone.')) {
      return
    }

    try {
      await DatabaseService.deleteInspection(id)
      setInspections(prev => prev.filter(inspection => inspection.id !== id))
    } catch (error) {
      console.error('Error deleting inspection:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800'
      case 'in-progress':
        return 'bg-warning-100 text-warning-800'
      case 'shared':
        return 'bg-primary-100 text-primary-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen-mobile flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
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
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">DepositDefender</h1>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Inspection</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Move-Out Inspections</h2>
          <p className="text-gray-600">
            Document your property condition systematically to protect your security deposit.
          </p>
        </div>

        {/* Inspections Grid */}
        {inspections.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inspections yet</h3>
            <p className="text-gray-600 mb-6">
              Start your first move-out inspection to protect your security deposit.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Inspection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inspections.map((inspection) => (
              <div key={inspection.id} className="card hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}
                  >
                    {inspection.status.replace('-', ' ').toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/inspection/${inspection.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteInspection(inspection.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                      title="Delete inspection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {inspection.propertyAddress}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(inspection.inspectionDate).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {inspection.rooms.length} room{inspection.rooms.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {inspection.notes && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {inspection.notes}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/inspection/${inspection.id}`)}
                    className="btn-primary flex-1 text-sm py-2"
                  >
                    Continue Inspection
                  </button>
                  
                  {inspection.status === 'completed' && (
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      title="Share report"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Updated {new Date(inspection.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Inspection Modal */}
      {showCreateModal && (
        <CreateInspectionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateInspection}
        />
      )}

      {/* Mobile spacing for safe area */}
      <div className="h-20 safe-bottom"></div>
    </div>
  )
}