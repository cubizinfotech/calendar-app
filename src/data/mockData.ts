export interface Region {
  id: number;
  name: string;
  buildings: number;
  portfolioPercentage: number;
  topAmenities: string[];
}

export interface Building {
  id: number;
  name: string;
  regionId: number;
}

export interface Amenity {
  id: number;
  name: string;
  count: number;
  buildingId: number;
  floor: number;
}

export interface EventType {
  id: number;
  name: string;
  colorCode: string;
  count: number;
}

export interface Event {
  id: number;
  title: string;
  buildingId: number;
  amenityId: number;
  startTime: string;
  endTime: string;
  eventTypeId: number;
  isRecurring: boolean;
  recurringPattern?: string;
  notes?: string;
  cost?: number;
  attachment?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: string;
}

// Mock Data
export const regions: Region[] = [
  {
    id: 1,
    name: "North West",
    buildings: 12,
    portfolioPercentage: 30,
    topAmenities: ["Conference Room", "Fitness Center", "Rooftop"]
  },
  {
    id: 2,
    name: "North East",
    buildings: 15,
    portfolioPercentage: 35,
    topAmenities: ["Auditorium", "Cafeteria", "Lounge"]
  },
  {
    id: 3,
    name: "South West",
    buildings: 8,
    portfolioPercentage: 15,
    topAmenities: ["Game Room", "Terrace", "Theater"]
  },
  {
    id: 4,
    name: "South East",
    buildings: 10,
    portfolioPercentage: 20,
    topAmenities: ["Meeting Room", "Garden", "Library"]
  }
];

export const buildings: Building[] = [
  { id: 1, name: "Marston Tower", regionId: 1 },
  { id: 2, name: "Riverfront Plaza", regionId: 1 },
  { id: 3, name: "Sunrise Complex", regionId: 2 },
  { id: 4, name: "Oakwood Center", regionId: 2 },
  { id: 5, name: "Sunset Heights", regionId: 3 },
  { id: 6, name: "Valley View", regionId: 3 },
  { id: 7, name: "Seaside Place", regionId: 4 },
  { id: 8, name: "Mountain View", regionId: 4 }
];

export const amenities: Amenity[] = [
  { id: 1, name: "Conference Room A", count: 24, buildingId: 1, floor: 1 },
  { id: 2, name: "Rooftop Garden", count: 18, buildingId: 1, floor: 20 },
  { id: 3, name: "Auditorium", count: 15, buildingId: 2, floor: 1 },
  { id: 4, name: "Fitness Center", count: 20, buildingId: 2, floor: 3 },
  { id: 5, name: "Cafeteria", count: 22, buildingId: 3, floor: 1 },
  { id: 6, name: "Meeting Room 101", count: 25, buildingId: 3, floor: 10 },
  { id: 7, name: "Lounge", count: 16, buildingId: 4, floor: 5 },
  { id: 8, name: "Game Room", count: 12, buildingId: 5, floor: 2 },
  { id: 9, name: "Theater", count: 14, buildingId: 6, floor: 1 },
  { id: 10, name: "Terrace", count: 17, buildingId: 7, floor: 15 }
];

export const eventTypes: EventType[] = [
  { id: 1, name: "Tenant-Led", colorCode: "event-tenant", count: 45 },
  { id: 2, name: "Agency", colorCode: "event-agency", count: 30 },
  { id: 3, name: "Internal", colorCode: "event-internal", count: 25 },
  { id: 4, name: "Priority", colorCode: "event-priority", count: 15 },
  { id: 5, name: "Other", colorCode: "event-other", count: 10 }
];

// Generate dates for the current month
const generateDatesForCurrentMonth = () => {
  // Use a fixed date to ensure consistent results
  const fixedDate = new Date(2025, 3, 26); // April 26, 2025
  const year = fixedDate.getFullYear();
  const month = fixedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dates = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(new Date(year, month, i));
  }
  return dates;
};

const dates = generateDatesForCurrentMonth();

// Generate events with deterministic randomness
export const events = [];
let id = 1;
const seedRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Use deterministic randomness based on date
dates.forEach((date, index) => {
  // Use fixed seed for eventsPerDay to ensure consistency
  const seed = date.getDate() + (date.getMonth() * 31);
  const eventsPerDay = Math.floor(seedRandom(seed) * 4); // 0-3 events per day
  
  for (let i = 0; i < eventsPerDay; i++) {
    const seedForEvent = seed + (i * 0.1);
    const buildingId = Math.floor(seedRandom(seedForEvent * 1.1) * buildings.length) + 1;
    
    const buildingAmenities = amenities.filter(a => a.buildingId === buildingId);
    const amenityId = buildingAmenities.length > 0 
      ? buildingAmenities[Math.floor(seedRandom(seedForEvent * 1.2) * buildingAmenities.length)].id 
      : Math.floor(seedRandom(seedForEvent * 1.3) * amenities.length) + 1;
    
    const eventTypeId = Math.floor(seedRandom(seedForEvent * 1.4) * eventTypes.length) + 1;
    const isRecurring = seedRandom(seedForEvent * 1.5) > 0.7;
    
    const hours = Math.floor(seedRandom(seedForEvent * 1.6) * 12) + 8; // 8 AM to 8 PM
    const minutesOptions = [0, 15, 30, 45];
    const minutes = minutesOptions[Math.floor(seedRandom(seedForEvent * 1.7) * 4)];
    
    const startTime = new Date(date);
    startTime.setHours(hours, minutes);
    
    const durationHours = Math.floor(seedRandom(seedForEvent * 1.8) * 3) + 1; // 1-3 hours
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + durationHours);
    
    events.push({
      id: id++,
      title: `Event ${id}`,
      buildingId,
      amenityId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      eventTypeId,
      isRecurring,
      recurringPattern: isRecurring ? ["Weekly", "Bi-weekly", "Monthly"][Math.floor(seedRandom(seedForEvent * 1.9) * 3)] : undefined,
      notes: `Notes for event ${id}`,
      cost: Math.floor(seedRandom(seedForEvent * 2.0) * 1000),
      attachment: seedRandom(seedForEvent * 2.1) > 0.7 ? `attachment_${id}.pdf` : undefined,
      contactPhone: "555-123-4567",
      contactEmail: "contact@example.com",
      createdAt: new Date(date.getFullYear(), date.getMonth(), date.getDate() - Math.floor(seedRandom(seedForEvent * 2.2) * 30)).toISOString()
    });
  }
});

// Helper functions
export const getBuildingById = (id: number) => {
  return buildings.find(building => building.id === id);
};

export const getRegionById = (id: number) => {
  return regions.find(region => region.id === id);
};

export const getAmenityById = (id: number) => {
  return amenities.find(amenity => amenity.id === id);
};

export const getEventTypeById = (id: number) => {
  return eventTypes.find(eventType => eventType.id === id);
};

export const getBuildingsByRegion = (regionId: number) => {
  return buildings.filter(building => building.regionId === regionId);
};

export const getAmenitiesByBuilding = (buildingId: number) => {
  return amenities.filter(amenity => amenity.buildingId === buildingId);
};

export const getTotalEvents = () => {
  return events.length;
};

export const getOneTimeEvents = () => {
  return events.filter(event => !event.isRecurring).length;
};

export const getRecurringEvents = () => {
  return events.filter(event => event.isRecurring).length;
};

export const getTotalBuildings = () => {
  return buildings.length;
};

export const getTotalAmenities = () => {
  return amenities.length;
};

export const getTotalRegions = () => {
  return regions.length;
};

export const getEventsByMonth = (year: number, month: number) => {
  return events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });
};

export const getUpcomingEvents = (limit: number = 5) => {
  const now = new Date();
  return events
    .filter(event => new Date(event.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, limit);
};

export const getTopAmenities = (limit: number = 5) => {
  return [...amenities]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export const getEventsByAmenity = (filter: {
  region: string;
  building: string;
  quarter: string;
  eventType: string;
  amenity: string;
  year: string;
}) => {
  // Filter events based on the quarter and year
  const quarterMap: { [key: string]: number[] } = {
    Q1: [0, 1, 2],     // Jan, Feb, Mar
    Q2: [3, 4, 5],     // Apr, May, Jun
    Q3: [6, 7, 8],     // Jul, Aug, Sep
    Q4: [9, 10, 11],   // Oct, Nov, Dec
  };
  
  const yearNumber = parseInt(filter.year);
  const months = quarterMap[filter.quarter] || [];
  
  // Filter by quarter and year
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventYear = eventDate.getFullYear();
    const eventMonth = eventDate.getMonth();
    
    return eventYear === yearNumber && months.includes(eventMonth);
  });
  
  // Further filter by region, building, and event type if specified
  const furtherFilteredEvents = filteredEvents.filter(event => {
    if (filter.region !== 'all') {
      const building = buildings.find(b => b.id === event.buildingId);
      if (!building || building.regionId.toString() !== filter.region) {
        return false;
      }
    }
    
    if (filter.building !== 'all' && event.buildingId.toString() !== filter.building) {
      return false;
    }
    
    if (filter.eventType !== 'all' && event.eventTypeId.toString() !== filter.eventType) {
      return false;
    }
    
    // Apply amenity filter at the event level if specified
    if (filter.amenity !== 'all' && event.amenityId.toString() !== filter.amenity) {
      return false;
    }
    
    return true;
  });
  
  // Group events by amenity (regardless of whether a specific amenity was selected)
  const amenityGroups = amenities.map(amenity => {
    const amenityEvents = furtherFilteredEvents.filter(
      event => event.amenityId === amenity.id
    );
    
    // Calculate total hours booked
    const totalHours = amenityEvents.reduce((total, event) => {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return total + durationHours;
    }, 0);
    
    // Add event types to events
    const eventsWithTypes = amenityEvents.map(event => ({
      ...event,
      eventType: eventTypes.find(type => type.id === event.eventTypeId),
    }));
    
    return {
      amenityId: amenity.id,
      amenityName: amenity.name,
      totalHours: parseFloat(totalHours.toFixed(1)),
      events: eventsWithTypes,
    };
  }).filter(group => group.events.length > 0); // Only include amenities with events
  
  return amenityGroups;
};
