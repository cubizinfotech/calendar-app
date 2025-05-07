
import React from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BookedEventsTableProps {
  events: any[];
  eventDate: Date | undefined;
  selectedBuilding: string;
  selectedAmenity: string;
  buildings: any[];
  amenities: any[];
  eventTypes: any[];
}

const BookedEventsTable = ({
  events,
  eventDate,
  selectedBuilding,
  selectedAmenity,
  buildings,
  amenities,
  eventTypes
}: BookedEventsTableProps) => {
  if (!selectedBuilding || !eventDate || events.length === 0) return null;
  
  // Get building name
  const buildingName = buildings.find(b => 
    b.id?.toString() === selectedBuilding || b.building_id?.toString() === selectedBuilding
  )?.name || buildings.find(b => 
    b.id?.toString() === selectedBuilding || b.building_id?.toString() === selectedBuilding
  )?.building_name || 'Selected Building';
  
  // Get event type information
  const getEventTypeName = (eventTypeId: number) => {
    const eventType = eventTypes.find(et => et.id === eventTypeId || et.event_type_id === eventTypeId);
    return eventType?.name || eventType?.event_type_name || 'Unknown';
  };

  const getEventTypeColor = (eventTypeId: number) => {
    const eventType = eventTypes.find(et => et.id === eventTypeId || et.event_type_id === eventTypeId);
    return eventType?.colorCode || eventType?.color_code || 'bg-gray-400';
  };
  
  // Get amenity name
  const getAmenityName = (amenityId: number) => {
    return amenities.find(a => 
      a.id === amenityId || a.amenity_id === amenityId
    )?.name || amenities.find(a => 
      a.id === amenityId || a.amenity_id === amenityId
    )?.amenity_name || 'Unknown';
  };
  
  return (
    <Card className="mt-8 border-2 border-muted">
      <CardHeader className="pb-2 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="h-5 w-5" />
          Events on {eventDate ? format(eventDate, 'PPP') : ''} at {buildingName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>List of events scheduled for this date and building.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amenity</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map((event) => (
              <TableRow 
                key={event.id} 
                className={event.amenityId === parseInt(selectedAmenity) ? "bg-amber-50" : ""}
              >
                <TableCell className="font-medium">
                  {event.startTime} - {event.endTime}
                </TableCell>
                <TableCell>{event.title}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div 
                      className={`w-3 h-3 rounded-full mr-2 ${getEventTypeColor(event.eventTypeId)}`}
                    ></div>
                    {getEventTypeName(event.eventTypeId)}
                  </div>
                </TableCell>
                <TableCell>
                  {getAmenityName(event.amenityId)}
                </TableCell>
                <TableCell>${event.cost}</TableCell>
                <TableCell>{event.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default BookedEventsTable;
