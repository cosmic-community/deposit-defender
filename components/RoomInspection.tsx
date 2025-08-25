'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Check, X, Upload, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { Room, InspectionItem, Photo, ConditionSeverity } from '@/types'
import { DatabaseService } from '@/lib/database'
import { ImageUtils } from '@/lib/imageUtils'

interface RoomInspectionProps {
  roomId: string
}

export default function RoomInspection({ roomId }: RoomInspectionProps) {
  const [room, setRoom] = useState<Room | null>(null)
  const [items, setItems] = useState<InspectionItem[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadRoomData()
  }, [roomId])

  const loadRoomData = async () => {
    try {
      const [roomData, itemsData, photosData] = await Promise.all([
        DatabaseService.db.rooms.get(roomId),
        DatabaseService.getItemsByRoom(roomId),
        DatabaseService.getPhotosByRoom(roomId)
      ])
      
      if (!roomData) {
        router.push('/')
        return
      }
      
      setRoom(roomData)
      setItems(itemsData)
      setPhotos(photosData)
    } catch (error) {
      console.error('Error loading room data:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleItemUpdate = async (itemId: string, updates: Partial<InspectionItem>) => {
    try {
      await DatabaseService.updateInspectionItem(itemId, {
        ...updates,
        checkedAt: new Date().toISOString()
      })
      
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, ...updates, checkedAt: new Date().toISOString() }
          : item
      ))
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handlePhotoCapture = async (file: File, severity: ConditionSeverity) => {
    setUploadingPhoto(true)
    try {
      // Compress and watermark image
      const compressed = await ImageUtils.compressAndWatermark(file, severity)
      
      // Save photo to database
      await DatabaseService.savePhoto({
        itemId: selectedItem || undefined,
        roomId,
        inspectionId: room!.inspectionId,
        filename: file.name,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        takenAt: new Date().toISOString(),
        blob: compressed.blob,
        thumbnail: compressed.thumbnail
      })
      
      // Reload photos
      const updatedPhotos = await DatabaseService.getPhotosByRoom(roomId)
      setPhotos(updatedPhotos)
      
    } catch (error) {
      console.error('Error saving photo:', error)
      alert('Failed to save photo. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleCameraCapture = async (severity: ConditionSeverity) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera not available on this device.')
      return
    }

    setIsCapturing(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      
      // Create video element for preview
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.addEventListener('loadedmetadata', resolve)
      })
      
      // Create capture canvas
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        
        // Convert to blob and create file
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
            await handlePhotoCapture(file, severity)
          }
        }, 'image/jpeg', 0.9)
      }
      
      // Stop camera stream
      stream.getTracks().forEach(track => track.stop())
      
    } catch (error) {
      console.error('Error capturing photo:', error)
      alert('Failed to capture photo. Please check camera permissions.')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleFileUpload = (severity: ConditionSeverity) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          handlePhotoCapture(file, severity)
        }
      }
      fileInputRef.current.click()
    }
  }

  const getConditionColor = (condition: ConditionSeverity) => {
    switch (condition) {
      case 'good': return 'text-success-600 bg-success-100'
      case 'fair': return 'text-warning-600 bg-warning-100'
      case 'poor': return 'text-danger-600 bg-danger-100'
      case 'damaged': return 'text-red-100 bg-red-900'
    }
  }

  const getProgress = () => {
    if (items.length === 0) return 0
    const checkedItems = items.filter(item => item.checkedAt).length
    return Math.round((checkedItems / items.length) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen-mobile flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen-mobile flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Room not found</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const progress = getProgress()

  return (
    <div className="min-h-screen-mobile bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push(`/inspection/${room.inspectionId}`)}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{room.name}</h1>
                <p className="text-sm text-gray-600">{room.type.replace('-', ' ').toUpperCase()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{progress}%</div>
              <div className="text-xs text-gray-600">Complete</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progress === 100 ? 'bg-success-600' : 'bg-primary-600'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Room Notes */}
        {room.notes && (
          <div className="card mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Room Notes</h3>
            <p className="text-gray-600">{room.notes}</p>
          </div>
        )}

        {/* Inspection Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium text-gray-900 flex-1">{item.name}</h3>
                {item.checkedAt && (
                  <Check className="w-5 h-5 text-success-600 ml-2 flex-shrink-0" />
                )}
              </div>

              {/* Condition Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {(['good', 'fair', 'poor', 'damaged'] as ConditionSeverity[]).map((condition) => (
                  <button
                    key={condition}
                    onClick={() => handleItemUpdate(item.id, { condition })}
                    className={`p-3 text-sm font-medium rounded-lg border transition-colors duration-200 ${
                      item.condition === condition
                        ? `${getConditionColor(condition)} border-current`
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {condition.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Photo Actions */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setSelectedItem(item.id)
                    handleCameraCapture(item.condition)
                  }}
                  disabled={isCapturing || uploadingPhoto}
                  className="btn-primary flex items-center gap-2 flex-1"
                >
                  <Camera className="w-4 h-4" />
                  {isCapturing && selectedItem === item.id ? 'Capturing...' : 'Take Photo'}
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(item.id)
                    handleFileUpload(item.condition)
                  }}
                  disabled={isCapturing || uploadingPhoto}
                  className="btn-secondary flex items-center gap-2 flex-1"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
              </div>

              {/* Item Notes */}
              <textarea
                value={item.notes || ''}
                onChange={(e) => handleItemUpdate(item.id, { notes: e.target.value })}
                placeholder="Add notes about this item's condition..."
                className="textarea"
                rows={2}
              />

              {/* Item Photos */}
              {photos.filter(p => p.itemId === item.id).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Photos ({photos.filter(p => p.itemId === item.id).length})
                  </h4>
                  <div className="photo-grid">
                    {photos
                      .filter(p => p.itemId === item.id)
                      .map((photo) => (
                        <div key={photo.id} className="relative aspect-square">
                          <img
                            src={ImageUtils.createBlobUrl(photo.blob)}
                            alt={photo.filename}
                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-75 text-white text-xs p-1 rounded text-center">
                            {new Date(photo.takenAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {item.checkedAt && (
                <div className="mt-2 text-xs text-gray-500">
                  Checked at {new Date(item.checkedAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Room Photos (not tied to specific items) */}
        {photos.filter(p => !p.itemId).length > 0 && (
          <div className="card mt-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              General Room Photos ({photos.filter(p => !p.itemId).length})
            </h3>
            <div className="photo-grid">
              {photos
                .filter(p => !p.itemId)
                .map((photo) => (
                  <div key={photo.id} className="relative aspect-square">
                    <img
                      src={ImageUtils.createBlobUrl(photo.blob)}
                      alt={photo.filename}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-75 text-white text-xs p-1 rounded text-center">
                      {new Date(photo.takenAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Completion Status */}
        {progress === 100 && (
          <div className="card mt-6 bg-success-50 border-success-200">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-success-600" />
              <div>
                <h3 className="font-medium text-success-900">Room Inspection Complete!</h3>
                <p className="text-success-700">
                  All items have been checked. You can return to the inspection overview.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Loading overlay */}
      {(uploadingPhoto || isCapturing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="loading-spinner w-6 h-6"></div>
            <span>{uploadingPhoto ? 'Processing photo...' : 'Preparing camera...'}</span>
          </div>
        </div>
      )}

      {/* Mobile spacing */}
      <div className="h-20 safe-bottom"></div>
    </div>
  )
}