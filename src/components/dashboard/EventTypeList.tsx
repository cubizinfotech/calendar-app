
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { eventTypes } from '@/data/mockData';
import { fetchEventTypes } from '@/utils/databaseService';
import { useEffect, useState } from 'react';

interface EventTypeListProps {
  eventTypeCounts: Record<number, number>;
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

// Standard event type colors - matching the Calendar page
const EVENT_TYPE_COLORS = {
  "Internal": "bg-green-100 text-green-800",
  "Agency": "bg-yellow-100 text-yellow-800",
  "Tenant-led": "bg-pink-100 text-pink-800",
  "Priority": "bg-purple-100 text-purple-800",
  "Other": "bg-gray-100 text-gray-800",
};

const EventTypeList = ({ eventTypeCounts }: EventTypeListProps) => {
  const [types, setTypes] = useState<any[]>([]);

  useEffect(() => {
    const loadEventTypes = async () => {
      try {
        const data = await fetchEventTypes();
        // Ensure we have valid data
        setTypes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching event types:", error);
        // Fall back to mock data if needed
        setTypes(Array.isArray(eventTypes) ? eventTypes : []);
      }
    };
    
    loadEventTypes();
  }, []);

  // Get color for event type based on name or id
  const getEventTypeColor = (type: any, index: number) => {
    // Try to get color by name first (from our standard colors)
    if (type?.name && EVENT_TYPE_COLORS[type.name]) {
      return EVENT_TYPE_COLORS[type.name];
    }
    
    // Then try the colorCode if it exists
    if (type?.colorCode) {
      return type.colorCode;
    }
    
    // Fall back to our fallback colors
    return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-2xl font-medium text-slate-600">Event Types</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {types.map((type, index) => {
            const colorClasses = getEventTypeColor(type, index);
            const count = type?.id && eventTypeCounts[type.id] || 0;
            
            return (
              <li key={`type-${type?.id || 'unknown'}`} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge 
                    className={`${colorClasses} mr-2 h-6`} 
                    variant="outline"
                  >
                    {type?.name || 'Unknown'}
                  </Badge>
                </div>
                <span className="text-sm font-medium">{count}</span>
              </li>
            );
          })}
          {types.length === 0 && (
            <li className="text-center text-gray-500">No event types available</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
};

export default EventTypeList;
