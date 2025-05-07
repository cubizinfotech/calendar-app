
import React from 'react';
import { format, isSameMonth, isSameYear } from 'date-fns';
import { filterEvents, formatUtcTimeToAmPm, formatUtcDate } from '@/utils/calendarUtils';
import { Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Define interfaces for component props
interface EventsListProps {
  year: number;
  month: number;
  filters: {
    region: string;
    building: string;
    amenity: string;
    eventType: string[];
  };
  events: any[];
  buildings: any[];
  amenities: any[];
  eventTypes: any[];
  regions?: any[];
  onEventClick: (event: any) => void;
  printView?: boolean;
  showBelow?: boolean;
}

// Fallback colors for event types when colorCode is not available
const FALLBACK_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-red-100 text-red-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
  "bg-gray-100 text-gray-800",
];

const EventsList: React.FC<EventsListProps> = ({
  year,
  month,
  filters,
  events = [],
  buildings = [],
  amenities = [],
  eventTypes = [],
  regions = [],
  onEventClick,
  printView = false,
  showBelow = false
}) => {
  console.log("EventsList: Rendering with", events?.length || 0, "events for", year, month+1);
  
  // Get events filtered by building and region
  const safeEvents = Array.isArray(events) ? events : [];
  const safeBuildings = Array.isArray(buildings) ? buildings : [];
  const filteredEvents = filterEvents(safeEvents, filters, safeBuildings);
  
  // Filter events to only include those from the current month and year
  const currentMonthEvents = filteredEvents.filter(event => {
    try {
      if (!event) return false;
      
      // Get event date from either startTime or oneTimeDate
      const eventDate = event.startTime ? new Date(formatUtcDate(event.startTime)) : 
                        event.oneTimeDate ? new Date(formatUtcDate(event.oneTimeDate)) : null;
      
      // Skip if no valid date
      if (!eventDate) return false;
      
      // Check if event is in the current month and year
      return isSameMonth(eventDate, new Date(year, month)) && 
             isSameYear(eventDate, new Date(year, month));
    } catch (error) {
      console.error("Error filtering event by month:", error, event);
      return false;
    }
  });
  
  console.log("EventsList: Filtered events by month:", currentMonthEvents?.length || 0);

  // Get event type color based on ID
  const getEventTypeColor = (eventTypeId: number) => {
    // Make sure eventTypes is an array
    const safeEventTypes = Array.isArray(eventTypes) ? eventTypes : [];
    const eventType = safeEventTypes.find(type => type && (type.id === eventTypeId || type.event_type_id === eventTypeId));
    return eventType?.colorCode || FALLBACK_COLORS[eventTypeId % FALLBACK_COLORS.length];
  };
  
  // Sort events by date and time - Add null checks to prevent errors
  const sortedEvents = [...(currentMonthEvents || [])].sort((a, b) => {
    // Skip null or undefined events in sorting
    if (!a || !b) return 0;
    
    // Get date values with fallbacks
    const dateA = a?.startTime || a?.oneTimeDate ? new Date(a.startTime || a.oneTimeDate) : new Date();
    const dateB = b?.startTime || b?.oneTimeDate ? new Date(b.startTime || b.oneTimeDate) : new Date();
    
    return dateA.getTime() - dateB.getTime();
  }).filter(event => event !== null && event !== undefined); // Filter out null events
  
  // Get event information
  const getEventInfo = (event: any) => {
    if (!event) return { buildingName: 'Unknown', amenityName: 'Unknown', eventTypeName: 'Unknown', regionName: 'Unknown' };
    
    const building = safeBuildings.find(b => b && event && (b.building_id === event.buildingId || b.id === event.buildingId));
    const buildingName = building?.building_name || 'Unknown';
    const amenityName = amenities?.find(a => a && event && (a.amenity_id === event.amenityId || a.id === event.amenityId))?.amenity_name || 'Unknown';
    const eventType = eventTypes?.find(t => t && event && (t.event_type_id === event.eventTypeId || t.id === event.eventTypeId));
    const eventTypeName = eventType?.event_type_name || eventType?.name || 'Unknown';
    
    // Get region name if available
    const regionId = building?.region_id;
    const regionName = regions?.find(r => r && (r.region_id === regionId || r.id === regionId))?.region_name || 'Unknown';
    
    return { buildingName, amenityName, eventTypeName, regionName };
  };
  
  // If no events are found
  if (!sortedEvents || sortedEvents.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No events found for the selected filters in {format(new Date(year, month), 'MMMM yyyy')}.
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${printView ? 'print-events-list' : ''}`}>
      {showBelow && !printView && (
        <h2 className="text-xl font-semibold mt-6 mb-2">Events for {format(new Date(year, month), 'MMMM yyyy')}</h2>
      )}
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Notes</TableHead>
            {!printView && <TableHead className="w-10"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEvents.map(event => {
            if (!event) return null;
            
            const { buildingName, amenityName, eventTypeName, regionName } = getEventInfo(event);
            const eventDate = event.startTime || event.oneTimeDate || null;
            const eventTypeColor = getEventTypeColor(event.eventTypeId || 0);
            
            return (
              <TableRow 
                key={event.id || `event-${Math.random()}`}
                className={printView ? '' : 'cursor-pointer hover:bg-gray-50'}
                onClick={printView ? undefined : () => onEventClick(event)}
              >
                <TableCell>
                  {eventDate ? format(new Date(formatUtcDate(eventDate)), 'MMM d, yyyy') : 'Unknown date'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{event.title || 'Untitled Event'}</span>
                    {event.isRecurring && (
                      <Repeat className="h-3 w-3" aria-label="Recurring Event" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {event.startTime ? formatUtcTimeToAmPm(event.startTime) : 'TBD'} - {event.endTime ? formatUtcTimeToAmPm(event.endTime) : 'TBD'}
                </TableCell>
                <TableCell>
                  {regionName}
                </TableCell>
                <TableCell>
                  <div>{buildingName}</div>
                  <div className="text-xs text-gray-500">{amenityName}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={eventTypeColor}>{eventTypeName}</Badge>
                </TableCell>
                <TableCell>
                  {event.cost > 0 && (
                    <div className="text-green-700">${event.cost}</div>
                  )}
                  {(!event.cost || event.cost <= 0) && (
                    <div className="text-gray-500">-</div>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="truncate text-sm text-gray-600">
                    {event.notes || '-'}
                  </div>
                </TableCell>
                {!printView && <TableCell className="text-right"></TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default EventsList;
