'use client'

import { useState } from 'react'
import { X, Home, FileText } from 'lucide-react'
import { RoomType } from '@/types'
import { roomTemplates } from '@/lib/roomTemplates'

interface AddRoomModalProps {
  onClose: () => void
  onAdd: (data: { name: string; type: RoomType; notes?: string }) => void
}

export default function AddRoomModal({ onClose, onAdd }: AddRoomModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'bedroom' as RoomType,
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onAdd({
        name: formData.name.trim(),
        type: formData.type,
        notes: formData.notes.trim() || undefined
      })
    } catch (error) {
      console.error('Error adding room:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-fill name based on room type selection
    if (field === 'type' && !formData.name) {
      const template = roomTemplates.find(t => t.type === value)
      if (template) {
        setFormData(prev => ({ ...prev, name: template.name }))
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Room</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Room Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              <Home className="w-4 h-4 inline mr-2" />
              Room Type *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as RoomType)}
              className="select"
              required
              disabled={isSubmitting}
            >
              {roomTemplates.map((template) => (
                <option key={template.type} value={template.type}>
                  {template.icon} {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Room Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Master Bedroom, Guest Bathroom"
              className="input"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              This helps you identify the room in your report
            </p>
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
              placeholder="Add any specific notes about this room..."
              className="textarea"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Preview of default checklist items */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Default Checklist Items
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              These items will be automatically added to your room inspection:
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {roomTemplates
                .find(t => t.type === formData.type)
                ?.defaultItems.slice(0, 5)
                .map((item, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {item}
                  </div>
                ))}
              {(roomTemplates.find(t => t.type === formData.type)?.defaultItems.length || 0) > 5 && (
                <div className="text-xs text-gray-500 italic">
                  ...and {(roomTemplates.find(t => t.type === formData.type)?.defaultItems.length || 0) - 5} more items
                </div>
              )}
            </div>
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
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  Adding...
                </>
              ) : (
                'Add Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}