import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  CalendarEvent,
  Building,
  Amenity,
  Region,
  EventType
} from '../types/CalendarTypes';

export const useCalendarData = (initialEvents: CalendarEvent[] = []) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [modifiedEvents, setModifiedEvents] = useState<Map<string, CalendarEvent>>(new Map());
  const [deletedEvents, setDeletedEvents] = useState<Set<string>>(new Set());

  // Monitor initialEvents changes
  useEffect(() => {
    console.log("useCalendarData: initialEvents update received, count:", initialEvents?.length);
    if (initialEvents && initialEvents.length > 0) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  // Function to fetch events from Supabase
  const fetchEvents = useCallback(async () => {
    try {
      console.log("useCalendarData: Refreshing events from Supabase");
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*');
      
      if (eventsError) throw eventsError;
      
      console.log("useCalendarData: Events fetched from Supabase:", eventsData?.length);

      // Fetch deleted occurrences
      const deletedOccurrences = await fetchDeletedOccurrences();
  
      // Fetch recurring occurrences
      const recurringOccurrences = await fetchRecurringOccurrences();
      
      if (eventsData && Array.isArray(eventsData)) {
        // Transform event data keys from snake_case to camelCase
        let formattedEvents = eventsData.map(event => ({
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
          notes: event.notes,
          cost: event.cost,
          deletedOccurrences: event.is_recurring ? deletedOccurrences[event.event_id] || [] : [],
          contactPhone: event.contact_phone,
          contactEmail: event.contact_email,
          attachmentUrl: event.attachment_url
        }));
        
        // Now fetch any modifications from modified_events table
        const { data: modifiedEventsData, error: modifiedEventsError } = await supabase
          .from('modified_events')
          .select('*');
          
        if (modifiedEventsError) throw modifiedEventsError;
        
        console.log("useCalendarData: Modified events fetched:", modifiedEventsData?.length);
        
        // Now fetch any deleted events
        const { data: deletedEventsData, error: deletedEventsError } = await supabase
          .from('deleted_events')
          .select('*');
        if (deletedEventsError) throw deletedEventsError;
        
        // Create maps to track modifications and deletions
        const modificationMap = new Map<string, CalendarEvent>();
        const deletedEventsSet = new Set<string>();
        
        // Process modified events if any exist
        if (modifiedEventsData && Array.isArray(modifiedEventsData) && modifiedEventsData.length > 0) {
          modifiedEventsData.forEach(mod => {
            const key = `${mod.event_id}-${mod.modified_date}`;
            modificationMap.set(key, {
              id: key as unknown as number,
              title: mod.event_title,
              buildingId: mod.building_id,
              amenityId: mod.amenity_id,
              startTime: mod.start_time,
              endTime: mod.end_time,
              eventTypeId: mod.event_type_id,
              isRecurring: true, // These are always recurring event modifications
              notes: mod.notes,
              cost: mod.cost,
              contactPhone: mod.contact_phone,
              contactEmail: mod.contact_email,
              originalEventId: mod.event_id,
              modifiedDate: mod.modified_date
            });
          });
          
          console.log("useCalendarData: Modification map created with", modificationMap.size, "entries");
          setModifiedEvents(modificationMap);
        } else {
          setModifiedEvents(new Map());
        }
        
        // Process deleted events if any exist
        if (deletedEventsData && Array.isArray(deletedEventsData)) {
          deletedEventsData.forEach(del => {
            deletedEventsSet.add(`${del.event_id}-${del.excluded_date}`);
          });
          console.log("useCalendarData: Deleted events set created with", deletedEventsSet.size, "entries");
          setDeletedEvents(deletedEventsSet);
        } else {
          setDeletedEvents(new Set());
        }
        
        // Set the events
        setEvents(formattedEvents);
        console.log("useCalendarData: Events updated successfully");
      } else {
        console.warn("useCalendarData: No valid events data received");
        setEvents([]);
        setModifiedEvents(new Map());
        setDeletedEvents(new Set());
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setModifiedEvents(new Map());
      setDeletedEvents(new Set());
    }
  }, []);

  // Fetch reference data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log("useCalendarData: Fetching reference data from Supabase");
        
        // Fetch all reference data in parallel
        const [
          buildingsResponse, 
          amenitiesResponse, 
          regionsResponse, 
          eventTypesResponse
        ] = await Promise.all([
          supabase.from('buildings').select('*'),
          supabase.from('amenities').select('*'),
          supabase.from('regions').select('*'),
          supabase.from('event_types').select('*')
        ]);
        
        // Check for errors and set data safely with null checks
        if (buildingsResponse.error) throw buildingsResponse.error;
        if (amenitiesResponse.error) throw amenitiesResponse.error;
        if (regionsResponse.error) throw regionsResponse.error;
        if (eventTypesResponse.error) throw eventTypesResponse.error;
        
        setBuildings(buildingsResponse.data || []);
        setAmenities(amenitiesResponse.data || []);
        setRegions(regionsResponse.data || []);
        setEventTypes(eventTypesResponse.data || []);
        
        console.log("useCalendarData: Reference data loaded successfully");
        
        // Fetch events if not provided by parent
        if (!initialEvents || initialEvents.length === 0) {
          await fetchEvents();
        }
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        // Set empty arrays for all data on error
        setBuildings([]);
        setAmenities([]);
        setRegions([]);
        setEventTypes([]);
        if (!initialEvents || initialEvents.length === 0) {
          setEvents([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [initialEvents, fetchEvents]);

  return {
    isLoading,
    events,
    buildings,
    amenities,
    regions,
    eventTypes,
    modifiedEvents,
    deletedEvents,
    setEvents,
    fetchEvents
  };
};

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
