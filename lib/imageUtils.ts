import { ConditionSeverity } from '@/types';

export interface CompressedImageResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  thumbnail?: Blob;
}

export class ImageUtils {
  // Compress image with watermark
  static async compressAndWatermark(
    file: File | Blob,
    severity: ConditionSeverity,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8
  ): Promise<CompressedImageResult> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(img.width, img.height, maxWidth, maxHeight);
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Add watermark
          this.addWatermark(ctx, width, height, severity);
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create compressed image'));
                return;
              }
              
              // Create thumbnail
              this.createThumbnail(canvas, ctx)
                .then(thumbnail => {
                  resolve({
                    blob,
                    originalSize: file.size,
                    compressedSize: blob.size,
                    thumbnail
                  });
                })
                .catch(() => {
                  // Proceed without thumbnail if it fails
                  resolve({
                    blob,
                    originalSize: file.size,
                    compressedSize: blob.size
                  });
                });
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate optimal dimensions
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  // Add watermark to canvas
  private static addWatermark(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    severity: ConditionSeverity
  ): void {
    const timestamp = new Date().toLocaleString();
    const severityColors = {
      good: '#16a34a',
      fair: '#d97706', 
      poor: '#dc2626',
      damaged: '#7c2d12'
    };

    // Semi-transparent overlay for text background
    const padding = 20;
    const textHeight = 60;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, height - textHeight, width, textHeight);
    
    // Timestamp
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(timestamp, padding, height - textHeight + 25);
    
    // Severity indicator
    ctx.fillStyle = severityColors[severity];
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(`Condition: ${severity.toUpperCase()}`, padding, height - textHeight + 45);
    
    // App watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('DepositDefender', width - padding, height - textHeight + 25);
    
    // Reset text align
    ctx.textAlign = 'left';
  }

  // Create thumbnail
  private static createThumbnail(
    sourceCanvas: HTMLCanvasElement,
    sourceCtx: CanvasRenderingContext2D,
    size = 150
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailCtx = thumbnailCanvas.getContext('2d');
      
      if (!thumbnailCtx) {
        reject(new Error('Thumbnail canvas context not available'));
        return;
      }
      
      thumbnailCanvas.width = size;
      thumbnailCanvas.height = size;
      
      // Calculate crop dimensions for square thumbnail
      const sourceSize = Math.min(sourceCanvas.width, sourceCanvas.height);
      const sourceX = (sourceCanvas.width - sourceSize) / 2;
      const sourceY = (sourceCanvas.height - sourceSize) / 2;
      
      thumbnailCtx.drawImage(
        sourceCanvas,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size
      );
      
      thumbnailCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        'image/jpeg',
        0.7
      );
    });
  }

  // Capture from camera
  static async captureFromCamera(): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        reject(new Error('Camera not available'));
        return;
      }

      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      .then(stream => {
        video.srcObject = stream;
        video.play();
        
        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Capture frame
          ctx.drawImage(video, 0, 0);
          
          // Stop stream
          stream.getTracks().forEach(track => track.stop());
          
          // Convert to file
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
              resolve(file);
            } else {
              reject(new Error('Failed to capture photo'));
            }
          }, 'image/jpeg', 0.9);
        });
      })
      .catch(reject);
    });
  }

  // Create blob URL for display
  static createBlobUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  // Revoke blob URL to free memory
  static revokeBlobUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}