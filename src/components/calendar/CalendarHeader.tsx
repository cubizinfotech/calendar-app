import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarSearch, List, CalendarDays, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

interface CalendarHeaderProps {
  filters: {
    region: string;
    building: string;
    amenity: string;
    eventType: string[];
  };
  onFilterChange: (filters: any) => void;
  activeView: string;
  onViewChange: (view: string) => void;
  buildings: any[];
  regions: any[];
  amenities: any[];
  eventTypes: any[];
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  filters,
  onFilterChange,
  activeView,
  onViewChange,
  buildings = [],
  regions = [],
  amenities = [],
  eventTypes = []
}) => {
  // State for managing the event types filter popover
  const [open, setOpen] = useState(false);

  // Handler to toggle event type selection
  const handleEventTypeChange = (eventTypeId: string) => {
    let updatedEventTypes = [...filters.eventType];
    
    // If "all" is being selected, clear other selections
    if (eventTypeId === 'all') {
      // If "all" is already selected, do nothing
      if (updatedEventTypes.includes('all')) {
        return;
      }
      updatedEventTypes = ['all'];
    } else {
      // If selecting a specific type while "all" is selected, 
      // clear "all" and just select this type
      if (updatedEventTypes.includes('all')) {
        updatedEventTypes = [eventTypeId];
      } else {
        // Toggle the selected type
        if (updatedEventTypes.includes(eventTypeId)) {
          updatedEventTypes = updatedEventTypes.filter(id => id !== eventTypeId);
        } else {
          updatedEventTypes.push(eventTypeId);
        }
        
        // If nothing is selected, default back to 'all'
        if (updatedEventTypes.length === 0) {
          updatedEventTypes = ['all'];
        }
      }
    }
    
    onFilterChange({
      ...filters,
      eventType: updatedEventTypes
    });
  };

  // Get event type color based on ID
  const getEventTypeColor = (eventTypeId: string | number) => {
    // Make sure eventTypes is an array
    const safeEventTypes = Array.isArray(eventTypes) ? eventTypes : [];
    const id = typeof eventTypeId === 'string' ? parseInt(eventTypeId) : eventTypeId;
    const eventType = safeEventTypes.find(type => 
      (type?.id === id || type?.event_type_id === id)
    );
    
    if (eventType?.colorCode) {
      return eventType.colorCode;
    }
    
    // Use a consistent color based on event type ID
    return FALLBACK_COLORS[id % FALLBACK_COLORS.length];
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 border rounded-lg shadow-sm">
      <div className="flex flex-wrap gap-2 flex-1">
        {/* Region Filter */}
        <Select 
          value={filters.region}
          onValueChange={(value) => onFilterChange({ ...filters, region: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {Array.isArray(regions) && regions.map(region => (
              <SelectItem key={region?.region_id || 'unknown'} value={(region?.region_id || 'unknown').toString()}>
                {region?.region_name || 'Unknown Region'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Building Filter */}
        <Select 
          value={filters.building}
          onValueChange={(value) => onFilterChange({ ...filters, building: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Building" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buildings</SelectItem>
            {Array.isArray(buildings) && buildings.map(building => (
              <SelectItem key={building?.building_id || 'unknown'} value={(building?.building_id || 'unknown').toString()}>
                {building?.building_name || 'Unknown Building'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Amenity Filter - New */}
        <Select 
          value={filters.amenity || 'all'}
          onValueChange={(value) => onFilterChange({ ...filters, amenity: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Amenity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Amenities</SelectItem>
            {Array.isArray(amenities) && amenities.map(amenity => (
              <SelectItem key={amenity?.amenity_id || 'unknown'} value={(amenity?.amenity_id || 'unknown').toString()}>
                {amenity?.amenity_name || 'Unknown Amenity'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Event Type Filter */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Event Types
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-4" align="start">
            <div className="space-y-4">
              <div className="text-sm font-medium mb-2">
                {filters.eventType.includes('all') ? 
                  "Select a specific event type to filter" : 
                  "Select one or more event types to filter"}
              </div>
              
              <div 
                className="flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => handleEventTypeChange('all')}
              >
                <Checkbox
                  id="event-type-all"
                  checked={filters.eventType.includes('all')}
                  className="mr-2"
                  onCheckedChange={() => handleEventTypeChange('all')}
                />
                <label
                  htmlFor="event-type-all"
                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                >
                  All Event Types
                </label>
              </div>
              
              <div className="border-t pt-2 mt-2 space-y-1">
                {Array.isArray(eventTypes) && eventTypes.map(type => {
                  const typeId = (type?.event_type_id || type?.id || 'unknown').toString();
                  const colorClass = getEventTypeColor(typeId);
                  const isChecked = filters.eventType.includes(typeId);
                  
                  return (
                    <div 
                      key={typeId} 
                      className={`flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer ${isChecked ? 'bg-gray-50' : ''}`}
                      onClick={() => handleEventTypeChange(typeId)}
                    >
                      <Checkbox
                        id={`event-type-${typeId}`}
                        checked={isChecked}
                        className="mr-2 border-0"
                        onCheckedChange={() => handleEventTypeChange(typeId)}
                      />
                      <div className={`w-4 h-4 rounded mr-2 ${colorClass.split(' ')[0]}`}></div>
                      <label
                        htmlFor={`event-type-${typeId}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {type?.event_type_name || type?.name || 'Unknown Event Type'}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* View Toggle */}
      <div className="flex gap-2 self-end md:self-auto">
        <Button
          variant={activeView === "calendar" ? "default" : "outline"}
          className="flex items-center gap-2"
          onClick={() => onViewChange("calendar")}
        >
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline">Calendar</span>
        </Button>
        <Button
          variant={activeView === "list" ? "default" : "outline"}
          className="flex items-center gap-2"
          onClick={() => onViewChange("list")}
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">List</span>
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
