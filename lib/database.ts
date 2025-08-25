import Dexie, { Table } from 'dexie';
import { Inspection, Room, InspectionItem, Photo, PDFReport, ShareLink, InspectionDB } from '@/types';

export class InspectionDatabase extends Dexie {
  inspections!: Table<Inspection>;
  rooms!: Table<Room>;
  inspectionItems!: Table<InspectionItem>;
  photos!: Table<Photo>;
  reports!: Table<PDFReport>;
  shareLinks!: Table<ShareLink>;

  constructor() {
    super('InspectionDatabase');
    
    this.version(1).stores({
      inspections: 'id, propertyAddress, inspectionDate, createdAt, status',
      rooms: 'id, inspectionId, name, type, completedAt',
      inspectionItems: 'id, roomId, name, condition, checkedAt',
      photos: 'id, itemId, roomId, inspectionId, filename, takenAt',
      reports: 'id, inspectionId, filename, generatedAt, shareToken',
      shareLinks: 'token, inspectionId, createdAt, expiresAt, accessed'
    });
  }
}

export const db = new InspectionDatabase();

// Database service functions
export class DatabaseService {
  // Inspection operations
  static async createInspection(data: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const inspection: Inspection = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.inspections.add(inspection);
    return inspection.id;
  }

  static async getInspection(id: string): Promise<Inspection | undefined> {
    return await db.inspections.get(id);
  }

  static async updateInspection(id: string, updates: Partial<Inspection>): Promise<void> {
    await db.inspections.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  static async getAllInspections(): Promise<Inspection[]> {
    return await db.inspections.orderBy('createdAt').reverse().toArray();
  }

  static async deleteInspection(id: string): Promise<void> {
    // Delete all related data
    await db.transaction('rw', [db.inspections, db.rooms, db.inspectionItems, db.photos, db.reports, db.shareLinks], async () => {
      const rooms = await db.rooms.where('inspectionId').equals(id).toArray();
      const roomIds = rooms.map(r => r.id);
      
      // Delete photos
      await db.photos.where('inspectionId').equals(id).delete();
      
      // Delete inspection items
      for (const roomId of roomIds) {
        await db.inspectionItems.where('roomId').equals(roomId).delete();
      }
      
      // Delete rooms
      await db.rooms.where('inspectionId').equals(id).delete();
      
      // Delete reports and share links
      await db.reports.where('inspectionId').equals(id).delete();
      await db.shareLinks.where('inspectionId').equals(id).delete();
      
      // Delete inspection
      await db.inspections.delete(id);
    });
  }

  // Room operations
  static async createRoom(data: Omit<Room, 'id'>): Promise<string> {
    const room: Room = {
      ...data,
      id: crypto.randomUUID(),
    };
    
    await db.rooms.add(room);
    return room.id;
  }

  static async getRoomsByInspection(inspectionId: string): Promise<Room[]> {
    return await db.rooms.where('inspectionId').equals(inspectionId).toArray();
  }

  static async updateRoom(id: string, updates: Partial<Room>): Promise<void> {
    await db.rooms.update(id, updates);
  }

  // Inspection item operations
  static async createInspectionItem(data: Omit<InspectionItem, 'id'>): Promise<string> {
    const item: InspectionItem = {
      ...data,
      id: crypto.randomUUID(),
    };
    
    await db.inspectionItems.add(item);
    return item.id;
  }

  static async getItemsByRoom(roomId: string): Promise<InspectionItem[]> {
    return await db.inspectionItems.where('roomId').equals(roomId).toArray();
  }

  static async updateInspectionItem(id: string, updates: Partial<InspectionItem>): Promise<void> {
    await db.inspectionItems.update(id, updates);
  }

  // Photo operations
  static async savePhoto(data: Omit<Photo, 'id'>): Promise<string> {
    const photo: Photo = {
      ...data,
      id: crypto.randomUUID(),
    };
    
    await db.photos.add(photo);
    return photo.id;
  }

  static async getPhotosByInspection(inspectionId: string): Promise<Photo[]> {
    return await db.photos.where('inspectionId').equals(inspectionId).toArray();
  }

  static async getPhotosByRoom(roomId: string): Promise<Photo[]> {
    return await db.photos.where('roomId').equals(roomId).toArray();
  }

  static async getPhotosByItem(itemId: string): Promise<Photo[]> {
    return await db.photos.where('itemId').equals(itemId).toArray();
  }

  // PDF Report operations
  static async saveReport(data: Omit<PDFReport, 'id'>): Promise<string> {
    const report: PDFReport = {
      ...data,
      id: crypto.randomUUID(),
    };
    
    await db.reports.add(report);
    return report.id;
  }

  static async getReportsByInspection(inspectionId: string): Promise<PDFReport[]> {
    return await db.reports.where('inspectionId').equals(inspectionId).toArray();
  }

  // Share link operations
  static async createShareLink(data: Omit<ShareLink, 'accessed' | 'accessCount'>): Promise<void> {
    const shareLink: ShareLink = {
      ...data,
      accessed: false,
      accessCount: 0,
    };
    
    await db.shareLinks.add(shareLink);
  }

  static async getShareLink(token: string): Promise<ShareLink | undefined> {
    return await db.shareLinks.get(token);
  }

  static async updateShareLink(token: string, updates: Partial<ShareLink>): Promise<void> {
    await db.shareLinks.update(token, updates);
  }

  // Cleanup expired share links
  static async cleanupExpiredShareLinks(): Promise<void> {
    const now = new Date().toISOString();
    await db.shareLinks.where('expiresAt').below(now).delete();
  }
}