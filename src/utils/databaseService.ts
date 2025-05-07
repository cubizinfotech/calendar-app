// Database service for fetching application data from Supabase
import { supabase } from '@/integrations/supabase/client';

// Types from mockData but will come from database
interface Event {
  id: number;
  title: string;
  buildingId: number;
  amenityId: number;
  startTime: string;
  endTime: string;
  eventTypeId: number;
  isRecurring: boolean;
  oneTimeDate?: string;
  recurringStartDate?: string;
  recurringEndDate?: string;
  recurringPatternData?: string;
  deletedOccurrences?: string;
  notes?: string;
  cost?: number;
  contactPhone?: number;
  contactEmail?: number;
  attachmentUrl?: number;
}

interface EventTypeData {
  id: number;
  name: string;
  colorCode: string;
  count: number;
}

// Dashboard data structure
export interface DashboardData {
  events: Event[];
  totalEvents: number;
  oneTimeEvents: number;
  recurringEvents: number;
  buildingsCount: number;
  amenitiesCount: number;
  buildingAmenitiesCount: number;
  regionsCount: number;
  eventTypeCounts: Record<number, number>;
}

// Fetch dashboard data from Supabase
export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    // Fetch counts from database
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*');
    
    if (eventsError) throw eventsError;

    // Fetch buildings count
    const { count: buildingsCount, error: buildingsError } = await supabase
      .from('buildings')
      .select('*', { count: 'exact', head: true });

    if (buildingsError) throw buildingsError;

    // Fetch amenities count
    const { count: amenitiesCount, error: amenitiesError } = await supabase
      .from('amenities')
      .select('*', { count: 'exact', head: true });

    if (amenitiesError) throw amenitiesError;

    // Fetch building_amenities count
    const { count: buildingAmenitiesCount, error: buildingAmenitiesError } = await supabase
      .from('building_amenities')
      .select('*', { count: 'exact', head: true });

    if (buildingAmenitiesError) throw buildingAmenitiesError;

    // Fetch regions count
    const { count: regionsCount, error: regionsError } = await supabase
      .from('regions')
      .select('*', { count: 'exact', head: true });

    if (regionsError) throw regionsError;
    
    // Fetch deleted occurrences
    const deletedOccurrences = await fetchDeletedOccurrences();

    // Fetch recurring occurrences
    const recurringOccurrences = await fetchRecurringOccurrences();
    
    // Calculate event counts by type
    const eventTypeCounts: Record<number, number> = {};
    const typeCounts = events.reduce((acc: Record<number, number>, event: any) => {
      const typeId = event.event_type_id;
      acc[typeId] = (acc[typeId] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate one-time vs recurring events
    const oneTimeEvents = events.filter((event: any) => !event.is_recurring).length;
    const recurringEvents = events.filter((event: any) => event.is_recurring).length;

    return {
      events: events.map((event: any) => ({
        id: event.event_id,
        title: event.event_title,
        buildingId: event.building_id,
        amenityId: event.amenity_id,
        startTime: event.start_time,
        endTime: event.end_time,
        eventTypeId: event.event_type_id,
        isRecurring: event.is_recurring || false,
        oneTimeDate: event.one_time_date,
        recurringStartDate: event.recurring_start_date,
        recurringEndDate: event.recurring_end_date,
        recurringPatternData: event.is_recurring ? recurringOccurrences[event.recurring_pattern_id][0] || [] : [],
        deletedOccurrences: event.is_recurring ? deletedOccurrences[event.event_id] || [] : [],
        notes: event.notes,
        cost: event.cost,
        contactPhone: event.contact_phone,
        contactEmail: event.contact_email,
        attachmentUrl: event.attachment_url
      })),
      totalEvents: events.length,
      oneTimeEvents,
      recurringEvents,
      buildingsCount: buildingsCount || 0,
      amenitiesCount: amenitiesCount || 0,
      buildingAmenitiesCount: buildingAmenitiesCount || 0,
      regionsCount: regionsCount || 0,
      eventTypeCounts: typeCounts
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return fallback values in case of error
    return {
      events: [],
      totalEvents: 0,
      oneTimeEvents: 0,
      recurringEvents: 0,
      buildingsCount: 0,
      amenitiesCount: 0,
      buildingAmenitiesCount: 0,
      regionsCount: 0,
      eventTypeCounts: {}
    };
  }
}

// Fetch event types with their counts
export async function fetchEventTypes(): Promise<EventTypeData[]> {
  try {
    // Fetch event types
    const { data: eventTypes, error: typesError } = await supabase
      .from('event_types')
      .select('*');
    
    if (typesError) throw typesError;

    // Fetch events to calculate counts
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('event_type_id');

    if (eventsError) throw eventsError;

    // Count events by type
    const typeCounts: Record<number, number> = {};
    events.forEach((event: any) => {
      const typeId = event.event_type_id;
      typeCounts[typeId] = (typeCounts[typeId] || 0) + 1;
    });

    return eventTypes.map((type: any) => ({
      id: type.event_type_id,
      name: type.event_type_name,
      colorCode: type.color_code || 'event-other',
      count: typeCounts[type.event_type_id] || 0
    }));
  } catch (error) {
    console.error("Error fetching event types:", error);
    // Fallback to empty array
    return [];
  }
}

// Fetch upcoming events
export async function fetchUpcomingEvents(limit: number = 5): Promise<Event[]> {
  try {
    const date = new Date();

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours();
    const minutes = date.getMinutes();
  
    var now = `${year}-${month}-${day} ${hours}:${minutes}:00`;

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        event_id,
        event_title,
        building_id,
        amenity_id,
        event_type_id,
        start_time,
        end_time,
        is_recurring,
        buildings:building_id(building_id, building_name),
        event_types:event_type_id(event_type_id, event_type_name, color_code)
      `)
      .gt('start_time', now) // Only get future events
      .order('start_time', { ascending: true })
      .limit(limit);
      
    if (error) throw error;
    
    return events.map((event: any) => ({
      id: event.event_id,
      title: event.event_title,
      buildingId: event.building_id,
      amenityId: event.amenity_id,
      startTime: event.start_time,
      endTime: event.end_time,
      eventTypeId: event.event_type_id,
      isRecurring: event.is_recurring || false,
      buildingName: event.buildings?.building_name,
      eventTypeName: event.event_types?.event_type_name,
      eventTypeColor: event.event_types?.color_code
    }));
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }
}

// Fetch regions data with real counts
export async function fetchRegionsData() {
  try {
    // Get regions
    const { data: regions, error: regionsError } = await supabase
      .from('regions')
      .select('*');
      
    if (regionsError) throw regionsError;
    
    // Get buildings
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('building_id, region_id');
      
    if (buildingsError) throw buildingsError;
    
    // Get total building count
    const totalBuildings = buildings.length;
    
    // Get amenities used in events
    const { data: eventAmenities, error: amenitiesError } = await supabase
      .from('events')
      .select(`
        event_id, 
        building_id, 
        amenity_id,
        amenities:amenity_id(amenity_id, amenity_name)
      `);
      
    if (amenitiesError) throw amenitiesError;
    
    return regions.map((region: any) => {
      // Count buildings for this region
      const regionBuildings = buildings.filter((b: any) => b.region_id === region.region_id);
      const buildingCount = regionBuildings.length;
      
      // Calculate portfolio percentage
      const portfolioPercentage = totalBuildings > 0 
        ? Math.round((buildingCount / totalBuildings) * 100) 
        : 0;
      
      // Get building IDs in this region
      const regionBuildingIds = regionBuildings.map((b: any) => b.building_id);
      
      // Get amenities used in this region
      const regionAmenities = eventAmenities
        .filter((event: any) => regionBuildingIds.includes(event.building_id))
        .map((event: any) => event.amenities?.amenity_name)
        .filter(Boolean);
      
      // Count amenity occurrences
      const amenityCounts: Record<string, number> = {};
      regionAmenities.forEach((name: string) => {
        if (name) {
          amenityCounts[name] = (amenityCounts[name] || 0) + 1;
        }
      });
      
      // Get top 3 amenities
      const topAmenities = Object.entries(amenityCounts)
        .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
        .slice(0, 3)
        .map(([name]) => name);
      
      return {
        id: region.region_id,
        name: region.region_name,
        buildings: buildingCount,
        portfolioPercentage,
        topAmenities: topAmenities.length > 0 
          ? topAmenities 
          : ["No amenities used"]
      };
    });
  } catch (error) {
    console.error("Error fetching regions data:", error);
    return [];
  }
}

// Fetch top amenities based on building associations rather than event usage
export async function fetchTopAmenities(limit: number = 15) {
  try {
    // Get all building-amenity associations with amenity info
    const { data: buildingAmenities, error } = await supabase
      .from('building_amenities')
      .select(`
        amenity_id,
        building_id,
        amenities:amenity_id(amenity_id, amenity_name)
      `);
      
    if (error) throw error;
    
    // Count amenity usage by buildings
    const amenityCounts: Record<number, { id: number, name: string, count: number }> = {};
    
    buildingAmenities.forEach((association: any) => {
      if (association.amenity_id && association.amenities) {
        const amenityId = association.amenity_id;
        const amenityName = association.amenities.amenity_name;
        
        if (!amenityCounts[amenityId]) {
          amenityCounts[amenityId] = {
            id: amenityId,
            name: amenityName,
            count: 0
          };
        }
        
        amenityCounts[amenityId].count++;
      }
    });
    
    // Convert to array, filter out zero counts, and sort by count
    const sortedAmenities = Object.values(amenityCounts)
      .filter(amenity => amenity.count > 0) // Only include amenities with count > 0
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    console.log('Top amenities by building count:', sortedAmenities);
    return sortedAmenities;
  } catch (error) {
    console.error("Error fetching top amenities:", error);
    return [];
  }
}

// Helper function to fetch deleted occurrences
export async function fetchDeletedOccurrences(): Promise<Record<number, string[]>> {
  try {
    const { data, error } = await supabase
      .from('deleted_events')
      .select('event_id, excluded_date');
    
    if (error) throw error;
    
    // Group by event_id
    const deletedMap: Record<number, string[]> = {};
    
    if (data) {
      data.forEach((item) => {
        if (!deletedMap[item.event_id]) {
          deletedMap[item.event_id] = [];
        }
        deletedMap[item.event_id].push(item.excluded_date);
      });
    }
    
    return deletedMap;
  } catch (error) {
    console.error("Error fetching deleted occurrences:", error);
    return {};
  }
}

// Helper function to fetch recurring occurrences
type RecurringData = {
  patternName: string;
  frequency: string;
  days: string;
};
export async function fetchRecurringOccurrences(): Promise<Record<number, RecurringData[]>> {
  try {
    const { data, error } = await supabase
      .from('recurring_patterns')
      .select('pattern_id, pattern_name, frequency, days');

    if (error) throw error;

    const occurrencesMap: Record<number, RecurringData[]> = {};

    if (data) {
      data.forEach((item) => {
        if (!occurrencesMap[item.pattern_id]) {
          occurrencesMap[item.pattern_id] = [];
        }

        occurrencesMap[item.pattern_id].push({
          patternName: item.pattern_name,
          frequency: item.frequency,
          days: item.days
        });
      });
    }

    return occurrencesMap;
  } catch (error) {
    console.error("Error fetching recurring occurrences:", error);
    return {};
  }
}

// Fetch amenity usage report data
export async function fetchAmenityUsageReport(filter: {
  region: string;
  building: string;
  quarter: string;
  eventType: string;
  amenity: string;
  year: string;
}) {
  try {
    console.log("fetchAmenityUsageReport called with filters:", filter);
    
    // Parse filter parameters
    const quarterMap: { [key: string]: number[] } = {
      Q1: [0, 1, 2],     // Jan, Feb, Mar
      Q2: [3, 4, 5],     // Apr, May, Jun
      Q3: [6, 7, 8],     // Jul, Aug, Sep
      Q4: [9, 10, 11],   // Oct, Nov, Dec
    };
    
    const yearNumber = parseInt(filter.year || '2025');
    const months = quarterMap[filter.quarter] || quarterMap.Q2;
    const startDate = new Date(yearNumber, months[0], 1).toISOString();
    const endDate = new Date(yearNumber, months[2] + 1, 0, 23, 59, 59).toISOString();
    
    console.log("Date range:", { startDate, endDate });
    
    // Base query to get all events in the time range
    let query = supabase
      .from('events')
      .select(`
        event_id,
        event_title,
        building_id,
        amenity_id,
        event_type_id,
        start_time,
        end_time,
        is_recurring,
        buildings:building_id(building_id, building_name, region_id),
        amenities:amenity_id(amenity_id, amenity_name),
        event_types:event_type_id(event_type_id, event_type_name, color_code)
      `, { count: 'exact' })
      .gte('start_time', startDate)
      .lte('end_time', endDate);
    
    // Apply additional filters if specified
    if (filter.building !== 'all') {
      try {
        const buildingId = parseInt(filter.building);
        query = query.eq('building_id', buildingId);
      } catch (e) {
        console.warn("Invalid building ID:", filter.building);
      }
    }
    
    if (filter.eventType !== 'all') {
      try {
        const eventTypeId = parseInt(filter.eventType);
        query = query.eq('event_type_id', eventTypeId);
      } catch (e) {
        console.warn("Invalid event type ID:", filter.eventType);
      }
    }
    
    if (filter.amenity !== 'all') {
      try {
        const amenityId = parseInt(filter.amenity);
        query = query.eq('amenity_id', amenityId);
      } catch (e) {
        console.warn("Invalid amenity ID:", filter.amenity);
      }
    }
    
    const { data: events, error, count } = await query;
    
    if (error) {
      console.error("Error in Supabase query:", error);
      throw error;
    }
    
    console.log(`Query returned ${count} events`);
    
    // Filter by region if needed (since we can't do this directly in the query)
    let filteredEvents = events || [];
    if (filter.region !== 'all' && Array.isArray(events)) {
      filteredEvents = events.filter(event => 
        event.buildings && event.buildings.region_id?.toString() === filter.region
      );
      console.log(`Filtered to ${filteredEvents.length} events by region`);
    }
    
    // Group events by amenity
    const amenityGroups: Record<number, any> = {};
    
    filteredEvents.forEach(event => {
      const amenityId = event.amenity_id;
      if (!amenityGroups[amenityId]) {
        amenityGroups[amenityId] = {
          amenityId: amenityId,
          amenityName: event.amenities?.amenity_name || 'Unknown Amenity',
          totalHours: 0,
          events: []
        };
      }
      
      // Calculate duration in hours
      const startTime = new Date(event.start_time);
      const endTime = new Date(event.end_time);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      amenityGroups[amenityId].totalHours += durationHours;
      
      // Add the event with enhanced data
      amenityGroups[amenityId].events.push({
        id: event.event_id,
        title: event.event_title,
        buildingId: event.building_id,
        amenityId: event.amenity_id,
        startTime: event.start_time,
        endTime: event.end_time,
        eventTypeId: event.event_type_id,
        isRecurring: event.is_recurring,
        buildingName: event.buildings?.building_name || 'Unknown Building',
        amenityName: event.amenities?.amenity_name || 'Unknown Amenity',
        eventType: {
          id: event.event_types?.event_type_id,
          name: event.event_types?.event_type_name || 'Unknown Type',
          colorCode: event.event_types?.color_code || 'bg-gray-300'
        }
      });
    });
    
    // Convert to array and round total hours to 1 decimal place
    const result = Object.values(amenityGroups).map(group => ({
      ...group,
      totalHours: parseFloat(group.totalHours.toFixed(1))
    }));
    
    console.log(`Returning ${result.length} amenity groups`);
    return result;
  } catch (error) {
    console.error("Error fetching amenity usage report:", error);
    return [];
  }
}

// Fetch event type report data
export async function fetchEventTypeReport(filter: {
  region: string;
  building: string;
  quarter: string;
  eventType: string;
  year: string;
}) {
  try {
    console.log("fetchEventTypeReport called with filters:", filter);
    
    // Get event types with counts
    const eventTypes = await fetchEventTypes();
    console.log(`Loaded ${eventTypes.length} event types`);
    
    // Get the date range for the selected quarter
    const quarterMap: { [key: string]: number[] } = {
      Q1: [0, 1, 2],
      Q2: [3, 4, 5],
      Q3: [6, 7, 8],
      Q4: [9, 10, 11],
    };
    
    const yearNumber = parseInt(filter.year || '2025');
    const months = quarterMap[filter.quarter] || quarterMap.Q2;
    const startDate = new Date(yearNumber, months[0], 1).toISOString();
    const endDate = new Date(yearNumber, months[2] + 1, 0, 23, 59, 59).toISOString();
    
    console.log("Date range:", { startDate, endDate });
    
    // Get filtered events
    let query = supabase
      .from('events')
      .select(`
        event_id,
        event_type_id,
        buildings:building_id(building_id, region_id)
      `, { count: 'exact' })
      .gte('start_time', startDate)
      .lte('end_time', endDate);
    
    if (filter.building !== 'all') {
      try {
        const buildingId = parseInt(filter.building);
        query = query.eq('building_id', buildingId);
      } catch (e) {
        console.warn("Invalid building ID:", filter.building);
      }
    }
    
    if (filter.eventType !== 'all') {
      try {
        const eventTypeId = parseInt(filter.eventType);
        query = query.eq('event_type_id', eventTypeId);
      } catch (e) {
        console.warn("Invalid event type ID:", filter.eventType);
      }
    }
    
    const { data: events, error, count } = await query;
    
    if (error) {
      console.error("Error in Supabase query:", error);
      throw error;
    }
    
    console.log(`Query returned ${count} events`);
    
    // Filter by region if needed
    let filteredEvents = events || [];
    if (filter.region !== 'all' && Array.isArray(events)) {
      filteredEvents = events.filter(event => 
        event.buildings && event.buildings.region_id?.toString() === filter.region
      );
      console.log(`Filtered to ${filteredEvents.length} events by region`);
    }
    
    // Count events by type
    const typeCounts: Record<number, number> = {};
    filteredEvents.forEach(event => {
      const typeId = event.event_type_id;
      typeCounts[typeId] = (typeCounts[typeId] || 0) + 1;
    });
    
    // Update the counts in the event types
    const reportEventTypes = eventTypes.map(type => ({
      ...type,
      count: typeCounts[type.id] || 0
    }));
    
    console.log("Returning event type counts:", 
      reportEventTypes.map(t => `${t.name}: ${t.count}`).join(', ')
    );
    
    return {
      totalEvents: filteredEvents.length,
      eventTypes: reportEventTypes
    };
  } catch (error) {
    console.error("Error fetching event type report:", error);
    return {
      totalEvents: 0,
      eventTypes: []
    };
  }
}

// Fetch all data needed for reports page
export async function fetchReportsData() {
  try {
    // Fetch regions
    const { data: regionsData, error: regionsError } = await supabase
      .from('regions')
      .select('*');
    
    if (regionsError) throw regionsError;
    
    const regions = regionsData.map(region => ({
      id: region.region_id,
      name: region.region_name
    }));
    
    // Fetch buildings
    const { data: buildingsData, error: buildingsError } = await supabase
      .from('buildings')
      .select('*');
    
    if (buildingsError) throw buildingsError;
    
    const buildings = buildingsData.map(building => ({
      id: building.building_id,
      name: building.building_name,
      regionId: building.region_id
    }));
    
    // Fetch amenities without building_id which doesn't exist in the schema
    const { data: amenitiesData, error: amenitiesError } = await supabase
      .from('amenities')
      .select('amenity_id, amenity_name');
    
    if (amenitiesError) throw amenitiesError;
    
    const amenities = amenitiesData.map(amenity => ({
      id: amenity.amenity_id,
      name: amenity.amenity_name
    }));
    
    // Fetch event types
    const eventTypes = await fetchEventTypes();
    
    return {
      regions,
      buildings,
      amenities,
      eventTypes
    };
  } catch (error) {
    console.error("Error fetching reports data:", error);
    return {
      regions: [],
      buildings: [],
      amenities: [],
      eventTypes: []
    };
  }
}
