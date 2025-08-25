import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Inspection, Room, InspectionItem, Photo } from '@/types';
import { DatabaseService } from './database';
import { ImageUtils } from './imageUtils';

export class PDFGenerator {
  private static readonly PAGE_MARGIN = 20;
  private static readonly CONTENT_WIDTH = 170; // A4 width minus margins

  static async generateReport(inspectionId: string): Promise<Blob> {
    const inspection = await DatabaseService.getInspection(inspectionId);
    if (!inspection) {
      throw new Error('Inspection not found');
    }

    const rooms = await DatabaseService.getRoomsByInspection(inspectionId);
    const allPhotos = await DatabaseService.getPhotosByInspection(inspectionId);

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add header
    await this.addHeader(pdf, inspection);
    
    // Add summary
    await this.addSummary(pdf, inspection, rooms || []);
    
    // Add room details
    if (rooms) {
      for (const room of rooms) {
        const items = await DatabaseService.getItemsByRoom(room.id);
        const roomPhotos = allPhotos?.filter(p => p.roomId === room.id) || [];
        await this.addRoomDetails(pdf, room, items || [], roomPhotos);
      }
    }
    
    // Add footer
    this.addFooter(pdf);
    
    return pdf.output('blob');
  }

  private static async addHeader(pdf: jsPDF, inspection: Inspection): Promise<void> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MOVE-OUT INSPECTION REPORT', pageWidth / 2, 30, { align: 'center' });
    
    // Subtitle
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('DepositDefender Documentation', pageWidth / 2, 40, { align: 'center' });
    
    // Property information
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Property Address:', this.PAGE_MARGIN, 60);
    pdf.setFont('helvetica', 'normal');
    pdf.text(inspection.propertyAddress, this.PAGE_MARGIN + 40, 60);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Inspection Date:', this.PAGE_MARGIN, 70);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date(inspection.inspectionDate).toLocaleDateString(), this.PAGE_MARGIN + 40, 70);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Report Generated:', this.PAGE_MARGIN, 80);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date().toLocaleString(), this.PAGE_MARGIN + 40, 80);
    
    // Separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(this.PAGE_MARGIN, 90, pageWidth - this.PAGE_MARGIN, 90);
  }

  private static async addSummary(pdf: jsPDF, inspection: Inspection, rooms: Room[]): Promise<void> {
    let yPosition = 110;
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INSPECTION SUMMARY', this.PAGE_MARGIN, yPosition);
    
    yPosition += 15;
    
    // Summary table
    const summaryData = [
      ['Total Rooms Inspected', rooms.length.toString()],
      ['Inspection Status', inspection.status.toUpperCase()],
      ['Total Photos Taken', 'Calculated per room'],
    ];

    if (inspection.notes) {
      summaryData.push(['General Notes', inspection.notes]);
    }

    autoTable(pdf, {
      startY: yPosition,
      head: [['Category', 'Details']],
      body: summaryData,
      margin: { left: this.PAGE_MARGIN, right: this.PAGE_MARGIN },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    });

    // Room summary table
    yPosition = (pdf as any).lastAutoTable.finalY + 20;
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ROOM SUMMARY', this.PAGE_MARGIN, yPosition);
    
    yPosition += 10;
    
    const roomSummaryData = await Promise.all(
      rooms.map(async (room) => {
        const items = await DatabaseService.getItemsByRoom(room.id);
        const photos = await DatabaseService.getPhotosByRoom(room.id);
        
        const conditionCounts = (items || []).reduce((acc, item) => {
          acc[item.condition] = (acc[item.condition] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return [
          room.name,
          room.type.replace('-', ' ').toUpperCase(),
          (items?.length || 0).toString(),
          (photos?.length || 0).toString(),
          Object.entries(conditionCounts)
            .map(([condition, count]) => `${condition.toUpperCase()}: ${count}`)
            .join(', ') || 'N/A'
        ];
      })
    );

    autoTable(pdf, {
      startY: yPosition,
      head: [['Room Name', 'Type', 'Items', 'Photos', 'Conditions']],
      body: roomSummaryData,
      margin: { left: this.PAGE_MARGIN, right: this.PAGE_MARGIN },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      columnStyles: {
        4: { cellWidth: 50 } // Wider column for conditions
      }
    });
  }

  private static async addRoomDetails(
    pdf: jsPDF,
    room: Room,
    items: InspectionItem[],
    photos: Photo[]
  ): Promise<void> {
    // Start new page for each room
    pdf.addPage();
    
    let yPosition = 30;
    
    // Room header
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${room.name} (${room.type.replace('-', ' ').toUpperCase()})`, this.PAGE_MARGIN, yPosition);
    
    yPosition += 20;
    
    if (room.notes) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Room Notes:', this.PAGE_MARGIN, yPosition);
      yPosition += 10;
      
      const splitNotes = pdf.splitTextToSize(room.notes, this.CONTENT_WIDTH);
      pdf.text(splitNotes, this.PAGE_MARGIN, yPosition);
      yPosition += splitNotes.length * 5 + 10;
    }
    
    // Items table
    if (items.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INSPECTION ITEMS', this.PAGE_MARGIN, yPosition);
      yPosition += 10;
      
      const itemsData = items.map(item => [
        item.name,
        item.condition.toUpperCase(),
        item.notes || 'No notes',
        item.checkedAt ? new Date(item.checkedAt).toLocaleString() : 'Not checked'
      ]);

      autoTable(pdf, {
        startY: yPosition,
        head: [['Item', 'Condition', 'Notes', 'Checked At']],
        body: itemsData,
        margin: { left: this.PAGE_MARGIN, right: this.PAGE_MARGIN },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: {
          1: { 
            cellWidth: 25,
            didParseCell: function(data: any) {
              const condition = data.cell.text[0]?.toLowerCase();
              switch(condition) {
                case 'good': 
                  data.cell.styles.fillColor = [22, 163, 74];
                  data.cell.styles.textColor = 255;
                  break;
                case 'fair': 
                  data.cell.styles.fillColor = [217, 119, 6];
                  data.cell.styles.textColor = 255;
                  break;
                case 'poor': 
                  data.cell.styles.fillColor = [220, 38, 38];
                  data.cell.styles.textColor = 255;
                  break;
                case 'damaged': 
                  data.cell.styles.fillColor = [124, 45, 18];
                  data.cell.styles.textColor = 255;
                  break;
              }
            }
          }
        }
      });
      
      yPosition = (pdf as any).lastAutoTable.finalY + 20;
    }
    
    // Photos section
    if (photos.length > 0) {
      await this.addPhotosToPage(pdf, photos, yPosition);
    }
  }

  private static async addPhotosToPage(pdf: jsPDF, photos: Photo[], startY: number): Promise<void> {
    let yPosition = startY;
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PHOTOS', this.PAGE_MARGIN, yPosition);
    yPosition += 15;
    
    const photosPerRow = 2;
    const photoWidth = (this.CONTENT_WIDTH - 10) / photosPerRow;
    const photoHeight = photoWidth * 0.75; // 4:3 aspect ratio
    
    for (let i = 0; i < photos.length; i += photosPerRow) {
      // Check if we need a new page
      if (yPosition + photoHeight + 30 > pdf.internal.pageSize.getHeight() - this.PAGE_MARGIN) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Add photos in current row
      for (let j = 0; j < photosPerRow && i + j < photos.length; j++) {
        const photo = photos[i + j];
        const xPosition = this.PAGE_MARGIN + j * (photoWidth + 10);
        
        try {
          // Convert blob to base64 for PDF
          const base64 = await this.blobToBase64(photo.blob);
          pdf.addImage(base64, 'JPEG', xPosition, yPosition, photoWidth, photoHeight);
          
          // Add photo caption
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          const caption = `${photo.filename}\n${new Date(photo.takenAt).toLocaleString()}`;
          pdf.text(caption, xPosition, yPosition + photoHeight + 5);
        } catch (error) {
          console.error('Error adding photo to PDF:', error);
          // Add placeholder for failed photo
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(xPosition, yPosition, photoWidth, photoHeight);
          pdf.text('Photo unavailable', xPosition + 5, yPosition + 10);
        }
      }
      
      yPosition += photoHeight + 25;
    }
  }

  private static addFooter(pdf: jsPDF): void {
    const pageCount = pdf.internal.pages.length - 1; // Subtract 1 for the first empty page
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Footer line
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setDrawColor(200, 200, 200);
      pdf.line(this.PAGE_MARGIN, pageHeight - 20, pageWidth - this.PAGE_MARGIN, pageHeight - 20);
      
      // Footer text
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Generated by DepositDefender - Page ${i} of ${pageCount}`, 
        this.PAGE_MARGIN, 
        pageHeight - 10
      );
      
      pdf.text(
        new Date().toLocaleString(),
        pageWidth - this.PAGE_MARGIN,
        pageHeight - 10,
        { align: 'right' }
      );
    }
  }

  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}