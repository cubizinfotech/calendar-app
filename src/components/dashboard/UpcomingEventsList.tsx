import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { fetchUpcomingEvents } from '@/utils/databaseService';
import { formatUtcDate, formatUtcTimeToAmPm } from '@/utils/calendarUtils';

// Fallback colors when colorCode is not available
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

// Standard event type colors - matching the Calendar page
const EVENT_TYPE_COLORS = {
  "Internal": "bg-green-100 text-green-800",
  "Agency": "bg-yellow-100 text-yellow-800",
  "Tenant-led": "bg-pink-100 text-pink-800",
  "Priority": "bg-purple-100 text-purple-800",
  "Other": "bg-gray-100 text-gray-800",
};

const UpcomingEventsList = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadUpcomingEvents = async () => {
      try {
        setLoading(true);
        const events = await fetchUpcomingEvents();
        setUpcomingEvents(Array.isArray(events) ? events : []);
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadUpcomingEvents();
  }, []);
  
  // Get event type color based on name or colorCode
  const getEventTypeColor = (eventTypeName: string, eventTypeId: number) => {
    // Try to get color by name first (from our standard colors)
    if (eventTypeName && EVENT_TYPE_COLORS[eventTypeName]) {
      return EVENT_TYPE_COLORS[eventTypeName];
    }
    
    // Otherwise use fallback colors based on eventTypeId
    return FALLBACK_COLORS[eventTypeId % FALLBACK_COLORS.length || 0];
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-2xl font-medium text-slate-600">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading events...</div>
        ) : (
          <ul className="space-y-4">
            {upcomingEvents.length > 0 ? upcomingEvents.map(event => {
              // Ensure we have a valid date object
              const eventDate = event?.startTime ? event.startTime : new Date();
              const safeId = event?.id ? event.id.toString() : `event-${Math.random()}`; 
              
              // Get appropriate event type color
              const eventTypeColor = getEventTypeColor(event?.eventTypeName, event?.eventTypeId || 0);
              
              return (
                <li key={safeId} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{event?.title || 'Untitled Event'}</div>
                    {event?.isRecurring && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        <span className="text-xs">Recurring</span>
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {event?.buildingName || 'Unknown Building'}
                  </div>
                  <div className="flex justify-between mt-1">
                    <div className="text-sm">
                      {formatUtcDate(eventDate)} {formatUtcTimeToAmPm(eventDate)}
                    </div>
                    <Badge variant="outline" className={eventTypeColor}>
                      {event?.eventTypeName || 'Unknown Type'}
                    </Badge>
                  </div>
                </li>
              );
            }) : <li className="text-center text-gray-500">No upcoming events</li>}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEventsList;
