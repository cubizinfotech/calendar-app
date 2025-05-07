
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatTimeToAmPm, formatUtcDatetimeToAmPm } from '@/utils/calendarUtils';

export const useEventDataFetching = (
  selectedRegion: string, 
  selectedBuilding: string,
  selectedAmenity: string,
  eventDate?: Date
) => {
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [filteredEventsList, setFilteredEventsList] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<any[]>([]);
  const [filteredBuildings, setFilteredBuildings] = useState<any[]>([]);
  const [filteredAmenities, setFilteredAmenities] = useState<any[]>([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState<boolean>(false);

  // Fetch regions, buildings and amenities on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch regions
        const { data: regionsData, error: regionsError } = await supabase
          .from('regions')
          .select('*')
          .order('region_name', { ascending: true });
        
        if (regionsError) throw regionsError;
        
        const formattedRegions = regionsData?.map(region => ({
          id: region.region_id,
          name: region.region_name
        })) || [];
        
        setRegions(formattedRegions);
        
        // Fetch buildings
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('*');
        
        if (buildingsError) throw buildingsError;
        
        const formattedBuildings = buildingsData?.map(building => ({
          id: building.building_id,
          name: building.building_name,
          regionId: building.region_id
        })) || [];
        
        setBuildings(formattedBuildings);
        
        // Fetch amenities
        const { data: amenitiesData, error: amenitiesError } = await supabase
          .from('amenities')
          .select('*');
        
        if (amenitiesError) throw amenitiesError;
        
        // Fetch building-amenity relationships to get buildingId for each amenity
        const { data: buildingAmenitiesData, error: buildingAmenitiesError } = await supabase
          .from('building_amenities')
          .select('*');
        
        if (buildingAmenitiesError) throw buildingAmenitiesError;
        
        // Create a map of amenity IDs to their buildings
        const amenityBuildingMap = buildingAmenitiesData?.reduce((map, item) => {
          map[item.amenity_id] = item.building_id;
          return map;
        }, {}) || {};
        
        const formattedAmenities = amenitiesData?.map(amenity => ({
          id: amenity.amenity_id,
          name: amenity.amenity_name,
          buildingId: amenityBuildingMap[amenity.amenity_id] || null
        })) || [];
        
        setAmenities(formattedAmenities);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Fetch event types on mount
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('event_types')
          .select('*');
        
        if (error) throw error;
        
        const formattedEventTypes = data?.map(eventType => ({
          id: eventType.event_type_id,
          name: eventType.event_type_name,
          colorCode: eventType.color_code || 'bg-gray-100'
        })) || [];
        
        setEventTypes(formattedEventTypes);
      } catch (error) {
        console.error('Error fetching event types:', error);
      }
    };

    fetchEventTypes();
  }, []);

  // Fetch recurring patterns on mount
  useEffect(() => {
    const fetchRecurringPatterns = async () => {
      try {
        const { data, error } = await supabase
          .from('recurring_patterns')
          .select('*')
          .order('pattern_name', { ascending: true });
        
        if (error) throw error;
        
        setRecurringPatterns(data || []);
      } catch (error) {
        console.error('Error fetching recurring patterns:', error);
      }
    };

    fetchRecurringPatterns();
  }, []);

  // Fetch existing events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            event_id,
            event_title,
            building_id,
            amenity_id,
            start_time,
            end_time,
            one_time_date,
            event_type_id
          `);
        
        if (error) throw error;
        
        const events = data?.map(event => ({
          id: event.event_id,
          title: event.event_title,
          buildingId: event.building_id,
          amenityId: event.amenity_id,
          startTime: event.start_time,
          endTime: event.end_time,
          oneTimeDate: event.one_time_date,
          eventTypeId: event.event_type_id
        })) || [];
        
        setEventsList(events);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  // Filter buildings when region changes
  useEffect(() => {
    if (selectedRegion) {
      const regionId = parseInt(selectedRegion);
      const regionBuildings = buildings.filter(b => b.regionId === regionId);
      setFilteredBuildings(regionBuildings);
    } else {
      setFilteredBuildings([]);
    }
  }, [selectedRegion, buildings]);

  // Filter amenities when building changes
  useEffect(() => {
    if (selectedBuilding) {
      setIsLoadingAmenities(true);
      const buildingId = parseInt(selectedBuilding);

      const fetchAmenitiesForBuilding = async (buildingId: number) => {
        const { data: buildingAmenitiesData, error: buildingAmenitiesError } = await supabase
          .from('building_amenities')
          .select('amenity_id')
          .eq('building_id', buildingId);
      
      if (buildingAmenitiesError) throw buildingAmenitiesError;
      
      // If no amenities are found for this building
      if (!buildingAmenitiesData || buildingAmenitiesData.length === 0) {
        console.log(`No amenities found for building ${buildingId}`);
        setFilteredAmenities([]);
        return;
      } else {
        // Extract amenity IDs
        const amenityIds = buildingAmenitiesData.map(item => item.amenity_id);
        console.log(`Found ${amenityIds.length} amenity IDs for building ${buildingId}:`, amenityIds);
        
        // Then fetch the full amenity details
        const { data: amenitiesData, error: amenitiesError } = await supabase
          .from('amenities')
          .select('*')
          .in('amenity_id', amenityIds);
        
        if (amenitiesError) throw amenitiesError;
        
        console.log(`Successfully fetched ${amenitiesData?.length || 0} amenities for building ${buildingId}`);
        
        setFilteredAmenities(amenitiesData || []);
        setIsLoadingAmenities(false);
      }
    };
    
    fetchAmenitiesForBuilding(buildingId);      
    } else {
      setFilteredAmenities([]);
    }
  }, [selectedBuilding]);

  // Update filtered events list when date or building changes
  useEffect(() => {
    const filteredEvents = async (eventDate, selectedBuilding) => {
      if (eventDate && selectedBuilding) {

        const yyyy = eventDate.getFullYear();
        const MM = String(eventDate.getMonth() + 1).padStart(2, '0');
        const dd = String(eventDate.getDate()).padStart(2, '0');
        const date = `${yyyy}-${MM}-${dd}`;

        const { data: existingEvent, error: eventQueryError } = await supabase.rpc('find_events_by_building', {
          b_id: selectedBuilding,
          target_date: date,
        });

        if (eventQueryError) {
          console.error('Error querying event:', eventQueryError);
          throw eventQueryError;
        }

        const events = existingEvent?.map(event => ({
          // return {
            id: event.event_id,
            title: event.event_title,
            buildingId: event.building_id,
            amenityId: event.amenity_id,
            startTime: formatTimeToAmPm(event.start_time),
            endTime: formatTimeToAmPm(event.end_time),
            oneTimeDate: event.one_time_date,
            eventTypeId: event.event_type_id,
            notes: event.notes,
            cost: event.cost
          // };

        })) || [];

        console.log("events ::: ", events);
        console.log(`Found ${existingEvent.length} events for building ${selectedBuilding} on date ${date}`);
        setFilteredEventsList(events);
      } else {
        setFilteredEventsList([]);
      }
    };

    filteredEvents(eventDate, selectedBuilding);
  }, [eventDate, selectedBuilding]);

  return {
    events: eventsList,
    buildings,
    amenities,
    regions,
    eventTypes,
    recurringPatterns,
    filteredBuildings,
    filteredAmenities,
    filteredEventsList,
    isLoadingAmenities,
  };
};
