'use client'

import { useState } from 'react'
import { X, Calendar, MapPin, FileText } from 'lucide-react'

interface CreateInspectionModalProps {
  onClose: () => void
  onCreate: (data: { propertyAddress: string; inspectionDate: string; notes?: string }) => void
}

export default function CreateInspectionModal({ onClose, onCreate }: CreateInspectionModalProps) {
  const [formData, setFormData] = useState({
    propertyAddress: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.propertyAddress.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onCreate({
        propertyAddress: formData.propertyAddress.trim(),
        inspectionDate: formData.inspectionDate,
        notes: formData.notes.trim() || undefined
      })
    } catch (error) {
      console.error('Error creating inspection:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Inspection</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Property Address */}
          <div>
            <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Property Address *
            </label>
            <input
              type="text"
              id="propertyAddress"
              value={formData.propertyAddress}
              onChange={(e) => handleChange('propertyAddress', e.target.value)}
              placeholder="Enter the property address"
              className="input"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Inspection Date */}
          <div>
            <label htmlFor="inspectionDate" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Inspection Date *
            </label>
            <input
              type="date"
              id="inspectionDate"
              value={formData.inspectionDate}
              onChange={(e) => handleChange('inspectionDate', e.target.value)}
              className="input"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any additional notes about this inspection..."
              className="textarea"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={isSubmitting || !formData.propertyAddress.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  Creating...
                </>
              ) : (
                'Create Inspection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}