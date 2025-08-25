// Base inspection types
export interface Inspection {
  id: string;
  propertyAddress: string;
  inspectionDate: string;
  createdAt: string;
  updatedAt: string;
  rooms: Room[];
  status: InspectionStatus;
  notes?: string;
}

export interface Room {
  id: string;
  inspectionId: string;
  name: string;
  type: RoomType;
  items: InspectionItem[];
  photos: Photo[];
  notes?: string;
  completedAt?: string;
}

export interface InspectionItem {
  id: string;
  roomId: string;
  name: string;
  condition: ConditionSeverity;
  notes?: string;
  photos: Photo[];
  checkedAt?: string;
}

export interface Photo {
  id: string;
  itemId?: string;
  roomId?: string;
  inspectionId: string;
  filename: string;
  originalSize: number;
  compressedSize: number;
  takenAt: string;
  blob: Blob;
  thumbnail?: Blob;
}

// Enum types
export type InspectionStatus = 'draft' | 'in-progress' | 'completed' | 'shared';

export type RoomType = 
  | 'bedroom'
  | 'bathroom' 
  | 'kitchen'
  | 'living-room'
  | 'dining-room'
  | 'laundry-room'
  | 'basement'
  | 'garage'
  | 'hallway'
  | 'closet'
  | 'balcony'
  | 'other';

export type ConditionSeverity = 'good' | 'fair' | 'poor' | 'damaged';

// PDF Report types
export interface PDFReport {
  id: string;
  inspectionId: string;
  filename: string;
  generatedAt: string;
  blob: Blob;
  shareToken?: string;
  shareExpiresAt?: string;
}

// Sharing types
export interface ShareLink {
  token: string;
  inspectionId: string;
  createdAt: string;
  expiresAt: string;
  accessed: boolean;
  accessCount: number;
}

// Database schema
export interface InspectionDB {
  inspections: Inspection;
  rooms: Room;
  inspectionItems: InspectionItem;
  photos: Photo;
  reports: PDFReport;
  shareLinks: ShareLink;
}

// UI State types
export interface CameraState {
  isActive: boolean;
  hasPermission: boolean;
  stream?: MediaStream;
  error?: string;
}

export interface AppState {
  currentInspection?: string;
  currentRoom?: string;
  camera: CameraState;
  isGeneratingPDF: boolean;
  isOffline: boolean;
}

// Room templates with default items
export interface RoomTemplate {
  type: RoomType;
  name: string;
  icon: string;
  defaultItems: string[];
}

// Utility types
export type CreateInspectionData = Omit<Inspection, 'id' | 'createdAt' | 'updatedAt' | 'rooms'>;
export type CreateRoomData = Omit<Room, 'id' | 'items' | 'photos'>;
export type CreateItemData = Omit<InspectionItem, 'id' | 'photos'>;