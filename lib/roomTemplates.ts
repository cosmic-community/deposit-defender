import { RoomTemplate, RoomType } from '@/types';

export const roomTemplates: RoomTemplate[] = [
  {
    type: 'bedroom',
    name: 'Bedroom',
    icon: '🛏️',
    defaultItems: [
      'Walls and paint condition',
      'Window and window sill',
      'Flooring condition',
      'Ceiling condition',
      'Light fixtures and switches',
      'Electrical outlets',
      'Closet interior',
      'Door and door frame',
      'Baseboards and trim',
      'Any nail holes or marks'
    ]
  },
  {
    type: 'bathroom',
    name: 'Bathroom',
    icon: '🚿',
    defaultItems: [
      'Toilet condition and functionality',
      'Sink and faucet condition',
      'Bathtub/shower condition',
      'Tile and grout condition',
      'Mirror condition',
      'Light fixtures',
      'Exhaust fan functionality',
      'Flooring condition',
      'Walls and paint condition',
      'Towel bars and hooks',
      'Medicine cabinet',
      'Plumbing fixtures'
    ]
  },
  {
    type: 'kitchen',
    name: 'Kitchen',
    icon: '🍳',
    defaultItems: [
      'Refrigerator interior and exterior',
      'Oven and stovetop condition',
      'Dishwasher interior and exterior',
      'Garbage disposal functionality',
      'Kitchen sink and faucet',
      'Countertops condition',
      'Cabinet doors and drawers',
      'Cabinet interior cleanliness',
      'Backsplash condition',
      'Flooring condition',
      'Light fixtures',
      'Electrical outlets',
      'Walls and paint condition'
    ]
  },
  {
    type: 'living-room',
    name: 'Living Room',
    icon: '🛋️',
    defaultItems: [
      'Walls and paint condition',
      'Windows and window sills',
      'Flooring condition',
      'Ceiling condition',
      'Light fixtures and switches',
      'Electrical outlets',
      'Fireplace condition (if applicable)',
      'Built-in shelving or cabinets',
      'Door and door frame',
      'Baseboards and trim',
      'Any furniture marks or damage'
    ]
  },
  {
    type: 'dining-room',
    name: 'Dining Room',
    icon: '🍽️',
    defaultItems: [
      'Walls and paint condition',
      'Windows and window sills',
      'Flooring condition',
      'Ceiling condition',
      'Light fixtures (including chandelier)',
      'Electrical outlets',
      'Built-in china cabinet (if applicable)',
      'Door and door frame',
      'Baseboards and trim',
      'Any scuff marks or damage'
    ]
  },
  {
    type: 'laundry-room',
    name: 'Laundry Room',
    icon: '👕',
    defaultItems: [
      'Washer and dryer connections',
      'Utility sink condition',
      'Flooring condition',
      'Walls and paint condition',
      'Ventilation system',
      'Electrical outlets',
      'Light fixtures',
      'Storage shelves or cabinets',
      'Door and door frame',
      'Water shut-off valves'
    ]
  },
  {
    type: 'basement',
    name: 'Basement',
    icon: '🏠',
    defaultItems: [
      'Foundation walls condition',
      'Flooring condition',
      'Ceiling condition',
      'Light fixtures',
      'Electrical panel and outlets',
      'Plumbing exposed pipes',
      'HVAC system components',
      'Sump pump (if applicable)',
      'Storage areas',
      'Stairs and railings',
      'Any signs of moisture or mold'
    ]
  },
  {
    type: 'garage',
    name: 'Garage',
    icon: '🚗',
    defaultItems: [
      'Garage door functionality',
      'Garage door opener',
      'Flooring condition',
      'Wall condition',
      'Electrical outlets',
      'Light fixtures',
      'Storage systems',
      'Workbench or built-ins',
      'Windows condition',
      'Any oil stains or damage'
    ]
  },
  {
    type: 'hallway',
    name: 'Hallway',
    icon: '🚪',
    defaultItems: [
      'Walls and paint condition',
      'Flooring condition',
      'Ceiling condition',
      'Light fixtures and switches',
      'Electrical outlets',
      'Linen closet interior',
      'Baseboards and trim',
      'Any scuff marks or damage'
    ]
  },
  {
    type: 'closet',
    name: 'Closet',
    icon: '👔',
    defaultItems: [
      'Interior walls condition',
      'Flooring condition',
      'Ceiling condition',
      'Light fixture',
      'Closet rod condition',
      'Shelving condition',
      'Door and door frame',
      'Any hooks or organizers'
    ]
  },
  {
    type: 'balcony',
    name: 'Balcony/Patio',
    icon: '🌿',
    defaultItems: [
      'Flooring/decking condition',
      'Railing condition and safety',
      'Door leading to balcony',
      'Light fixtures',
      'Electrical outlets (if any)',
      'Drainage condition',
      'Any furniture marks or stains',
      'Screen door (if applicable)'
    ]
  },
  {
    type: 'other',
    name: 'Other Room',
    icon: '📦',
    defaultItems: [
      'Walls and paint condition',
      'Flooring condition',
      'Ceiling condition',
      'Light fixtures',
      'Electrical outlets',
      'Door and door frame',
      'Windows (if any)',
      'Any specific features'
    ]
  }
];

export function getRoomTemplate(type: RoomType): RoomTemplate | undefined {
  return roomTemplates.find(template => template.type === type);
}

export function getAllRoomTypes(): RoomType[] {
  return roomTemplates.map(template => template.type);
}