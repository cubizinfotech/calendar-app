import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, CircleX, Search, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown, Loader2 } from 'lucide-react';
import EventDetailsDialog from '../calendar/EventDetailsDialog';
import EventEditForm from '../calendar/EventEditForm';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { formatUtcTimeToAmPm, formatUtcDate } from '@/utils/calendarUtils';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

// Define types based on database structure
interface Building {
  building_id: number;
  building_name: string;
  region_id: number;
  created_at?: string;
}

interface Amenity {
  amenity_id: number;
  amenity_name: string;
  building_id?: number;
  floor?: number;
  created_at?: string;
}

interface EventType {
  event_type_id: number;
  event_type_name?: string;
  type_name?: string;
  color_code: string;
  created_at?: string;
}

interface Region {
  region_id: number;
  region_name: string;
}

interface Event {
  event_id: number;
  event_title: string;
  building_id: number;
  amenity_id: number;
  start_time: string;
  end_time: string;
  event_type_id: number;
  is_recurring: boolean;
  recurring_pattern_id?: number;
  notes?: string;
  cost?: number;
  attachment_url?: string;
  contact_phone?: string;
  contact_email?: string;
  one_time_date: string;
  recurring_start_date?: string;
  recurring_end_date?: string;
  created_at: string;
}

// Advanced pagination component
const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} events
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          Page {currentPage} of {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const MockEventsTab = () => {
  // State for events and related data
  const [events, setEvents] = useState<Event[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<any[]>([]);
  
  // Loading states
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
  
  // Dialog states
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [recurringFilter, setRecurringFilter] = useState('all');
  const [amenityFilter, setAmenityFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Fetch all dropdown data (buildings, amenities, event types, regions)
  const fetchDropdownData = async () => {
    setIsLoadingDropdowns(true);
    try {
      // Fetch buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*');
      
      if (buildingsError) {
        throw buildingsError;
      }
      
      // Fetch amenities
      const { data: amenitiesData, error: amenitiesError } = await supabase
        .from('amenities')
        .select('*');
      
      if (amenitiesError) {
        throw amenitiesError;
      }
      
      // Fetch event types
      const { data: eventTypesData, error: eventTypesError } = await supabase
        .from('event_types')
        .select('*');
      
      if (eventTypesError) {
        throw eventTypesError;
      }
      
      // Fetch regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('*');
      
      if (regionsError) {
        throw regionsError;
      }
      
      // Also fetch recurring patterns
      const { data: patternsData, error: patternsError } = await supabase
        .from('recurring_patterns')
        .select('*');
      
      if (patternsError) {
        throw patternsError;
      }
      
      // Update state with fetched data
      setBuildings(buildingsData || []);
      setAmenities(amenitiesData || []);
      setEventTypes(eventTypesData?.map(type => ({
        event_type_id: type.event_type_id,
        type_name: type.event_type_name,
        color_code: type.color_code
      })) || []);
      setRegions(regionsData || []);
      setRecurringPatterns(patternsData || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown data');
    } finally {
      setIsLoadingDropdowns(false);
    }
  };
  
  // Fetch events from database
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoadingEvents(false);
    }
  };
  
  // Initial data load
  useEffect(() => {
    fetchEvents();
    fetchDropdownData();
  }, []);
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, buildingFilter, eventTypeFilter, recurringFilter, amenityFilter]);

  // Helper functions to get related data
  const getBuildingById = (id: number) => {
    return buildings.find(building => building.building_id === id);
  };
  
  const getAmenityById = (id: number) => {
    return amenities.find(amenity => amenity.amenity_id === id);
  };
  
  const getEventTypeById = (id: number) => {
    return eventTypes.find(type => type.event_type_id === id);
  };
  
  const getRegionById = (id: number) => {
    return regions.find(region => region.region_id === id);
  };

  // Sort and filter events
  const filteredAndSortedEvents = useMemo(() => {
    // Filter events based on search term and filters
    let filtered = [...events];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        (event.event_title?.toLowerCase().includes(search)) ||
        (getBuildingById(event.building_id)?.building_name.toLowerCase().includes(search)) ||
        (getEventTypeById(event.event_type_id)?.type_name?.toLowerCase().includes(search) || getEventTypeById(event.event_type_id)?.event_type_name?.toLowerCase().includes(search)) ||
        (getAmenityById(event.amenity_id)?.amenity_name.toLowerCase().includes(search))
      );
    }
    
    if (buildingFilter !== 'all') {
      filtered = filtered.filter(event => event.building_id === parseInt(buildingFilter));
    }
    
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.event_type_id === parseInt(eventTypeFilter));
    }
    
    if (recurringFilter !== 'all') {
      filtered = filtered.filter(event => 
        recurringFilter === 'recurring' ? event.is_recurring : !event.is_recurring
      );
    }
    
    if (amenityFilter !== 'all') {
      filtered = filtered.filter(event => event.amenity_id === parseInt(amenityFilter));
    }
    
    // Sort events if sort config is set
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'title':
            aValue = a.event_title || '';
            bValue = b.event_title || '';
            break;
          case 'building':
            aValue = getBuildingById(a.building_id)?.building_name || '';
            bValue = getBuildingById(b.building_id)?.building_name || '';
            break;
          case 'amenity':
            aValue = getAmenityById(a.amenity_id)?.amenity_name || '';
            bValue = getAmenityById(b.amenity_id)?.amenity_name || '';
            break;
          case 'date':
            aValue = new Date(a.one_time_date).toDateString();
            bValue = new Date(b.one_time_date).toDateString();
            break;
          case 'startTime':
            aValue = new Date(a.start_time).getTime();
            bValue = new Date(b.start_time).getTime();
            break;
          case 'endTime':
            aValue = new Date(a.end_time).getTime();
            bValue = new Date(b.end_time).getTime();
            break;
          case 'eventType':
            aValue = getEventTypeById(a.event_type_id)?.type_name || getEventTypeById(a.event_type_id)?.event_type_name || '';
            bValue = getEventTypeById(b.event_type_id)?.type_name || getEventTypeById(b.event_type_id)?.event_type_name || '';
            break;
          case 'recurring':
            aValue = a.is_recurring ? 1 : 0;
            bValue = b.is_recurring ? 1 : 0;
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [events, searchTerm, buildingFilter, eventTypeFilter, recurringFilter, amenityFilter, sortConfig, buildings, amenities, eventTypes]);
  
  // Calculate pagination
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedEvents, currentPage, itemsPerPage]);

  const confirmDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const handleDelete = async () => {
    if (selectedEvent) {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('event_id', selectedEvent.event_id);
        
        if (error) throw error;
        
        // Refresh events after deletion
        await fetchEvents();
        toast.success('Event deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      } finally {
        setIsLoading(false);
        setShowDeleteConfirmation(false);
        setSelectedEvent(null);
      }
    }
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      // This is dangerous and would require additional confirmation in production
      // Here we're just deleting all mock data for testing purposes
      const { error } = await supabase
        .from('events')
        .delete()
        .not('event_id', 'is', null);
      
      if (error) throw error;
      
      await fetchEvents();
      toast.success('All events cleared successfully!');
    } catch (error) {
      console.error('Error clearing events:', error);
      toast.error('Failed to clear events');
    } finally {
      setIsLoading(false);
      setIsClearAllDialogOpen(false);
    }
  };

  // Add a function to monitor the loading state and retry loading data if needed
  useEffect(() => {
    // If we're trying to edit an event but the data isn't loaded yet
    if (isEditDialogOpen && (buildings.length === 0 || eventTypes.length === 0)) {
      // Try to refresh the data
      fetchDropdownData();
    }
  }, [isEditDialogOpen]);

  // Add a function to check if data is ready before submitting the form
  const ensureDataLoaded = async () => {
    // If data is not loaded, try to fetch it again
    if (buildings.length === 0 || eventTypes.length === 0 || amenities.length === 0) {
      setIsLoadingDropdowns(true);
      await fetchDropdownData();
      setIsLoadingDropdowns(false);
      
      // Check if data is now loaded
      if (buildings.length === 0 || eventTypes.length === 0) {
        toast.error("Couldn't load required data. Please try again.");
        return false;
      }
    }
    return true;
  };

  // Update the edit event handler to use this function
  const handleEditEvent = async (event: Event) => {
    // Check if dropdown data is loaded
    if (isLoadingDropdowns) {
      toast.error("Loading data, please try again in a moment");
      return;
    }
    
    // Try to ensure data is loaded
    const dataReady = await ensureDataLoaded();
    if (!dataReady) return;
    
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleEventUpdate = async (updatedEvent: Event) => {
    setIsLoading(true);
    try {
      console.log('Updating event with data:', updatedEvent);
      
      const { error } = await supabase
        .from('events')
        .update({
          event_title: updatedEvent.event_title,
          building_id: updatedEvent.building_id,
          amenity_id: updatedEvent.amenity_id,
          start_time: updatedEvent.start_time,
          end_time: updatedEvent.end_time,
          event_type_id: updatedEvent.event_type_id,
          is_recurring: updatedEvent.is_recurring,
          recurring_pattern_id: updatedEvent.recurring_pattern_id,
          notes: updatedEvent.notes,
          cost: updatedEvent.cost,
          contact_phone: updatedEvent.contact_phone,
          contact_email: updatedEvent.contact_email,
          one_time_date: updatedEvent.one_time_date,
          recurring_start_date: updatedEvent.recurring_start_date,
          recurring_end_date: updatedEvent.recurring_end_date
        })
        .eq('event_id', updatedEvent.event_id);
      
      if (error) throw error;
      
      await fetchEvents();
      toast.success('Event updated successfully!');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setIsLoading(false);
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  // Define delete function for the details dialog
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      confirmDelete();
      setIsDetailsDialogOpen(false);
    }
  };
  
  // Handle sort request
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };
  
  // Get sort direction indicator
  const getSortDirectionIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };
  
  // Refresh data
  const refreshData = async () => {
    await Promise.all([fetchEvents(), fetchDropdownData()]);
    toast.success('Data refreshed successfully!');
  };
  
  // Show event details
  const showEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsDialogOpen(true);
  };

  // First, let's add a debugging helper to check what's passed to the form
  // In the EditForm section, log the mapped data structures
  console.log('Event Types before mapping:', eventTypes);
                  
  // Make sure event types have a stable structure and unique identifiers
  const mappedEventTypes = eventTypes.map(t => {
    // Create a stable, consistent object structure with guaranteed non-empty values
    return {
      id: t.event_type_id || 0, // Default to 0 instead of undefined
      name: t.type_name || t.event_type_name || 'Unknown',
      colorCode: t.color_code || 'bg-gray-300',
      key: `event-type-${t.event_type_id || 'unknown'}`
    };
  });

  console.log('Mapped Event Types:', mappedEventTypes);

  // Fix the other dropdown data structures as well to avoid empty values
  const mappedBuildings = buildings.map(b => {
    return { 
      id: b.building_id || 0, // Default to 0 instead of undefined
      name: b.building_name || 'Unknown Building',
      regionId: b.region_id || 0,
      key: `building-${b.building_id || 'unknown'}`
    };
  });

  const mappedAmenities = amenities.map(a => {
    return { 
      id: a.amenity_id || 0, // Default to 0 instead of undefined
      name: a.amenity_name || 'Unknown Amenity',
      buildingId: a.building_id || 0,
      floor: a.floor || 0,
      key: `amenity-${a.amenity_id || 'unknown'}`
    };
  });

  const mappedRegions = regions.map(r => {
    return { 
      id: r.region_id || 0, // Default to 0 instead of undefined
      name: r.region_name || 'Unknown Region',
      key: `region-${r.region_id || 'unknown'}`
    };
  });

  // Loading indicator
  if (isLoadingEvents && isLoadingDropdowns) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium">Loading event data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Events</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData} disabled={isLoadingEvents || isLoadingDropdowns}>
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingEvents || isLoadingDropdowns) ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Dialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={isLoadingEvents || events.length === 0}>
                <CircleX className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear All Events</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                Are you sure you want to clear all events? This action cannot be undone.
              </DialogDescription>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsClearAllDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleClearAll} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Clear All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => window.location.href = '/new-event'}>
            Add New Event
          </Button>
        </div>
      </div>

      {/* Search and filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={buildingFilter} onValueChange={setBuildingFilter} disabled={isLoadingDropdowns}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by building" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buildings</SelectItem>
            {buildings.length > 0 ? buildings.map((building) => (
              <SelectItem 
                key={`building-${building.building_id || 'unknown'}`} 
                value={building.building_id ? building.building_id.toString() : "unknown"}
              >
                {building.building_name || 'Unknown Building'}
              </SelectItem>
            )) : (
              <SelectItem value="loading">Loading buildings...</SelectItem>
            )}
          </SelectContent>
        </Select>
        
        <Select value={amenityFilter} onValueChange={setAmenityFilter} disabled={isLoadingDropdowns}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by amenity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Amenities</SelectItem>
            {amenities.length > 0 ? amenities.map((amenity) => (
              <SelectItem 
                key={`amenity-${amenity.amenity_id || 'unknown'}`} 
                value={amenity.amenity_id ? amenity.amenity_id.toString() : "unknown"}
              >
                {amenity.amenity_name || 'Unknown Amenity'}
              </SelectItem>
            )) : (
              <SelectItem value="loading">Loading amenities...</SelectItem>
            )}
          </SelectContent>
        </Select>
        
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter} disabled={isLoadingDropdowns}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Event Types</SelectItem>
            {mappedEventTypes.length > 0 ? mappedEventTypes.map((type) => (
              <SelectItem 
                key={type.key} 
                value={type.id ? type.id.toString() : "0"}
              >
                {type.name}
              </SelectItem>
            )) : (
              <SelectItem value="loading">Loading event types...</SelectItem>
            )}
          </SelectContent>
        </Select>
        
        <Select value={recurringFilter} onValueChange={setRecurringFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by recurrence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="recurring">Recurring Only</SelectItem>
            <SelectItem value="non-recurring">Non-recurring Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => requestSort('title')}>
                Title
                <ArrowUpDown className="h-4 w-4 inline-block ml-1" />
                {getSortDirectionIndicator('title')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('building')}>
                Building
                <ArrowUpDown className="h-4 w-4 inline-block ml-1" />
                {getSortDirectionIndicator('building')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('amenity')}>
                Amenity
                <ArrowUpDown className="h-4 w-4 inline-block ml-1" />
                {getSortDirectionIndicator('amenity')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('date')}>
                Date
                <ArrowUpDown className="h-4 w-4 inline-block ml-1" />
                {getSortDirectionIndicator('date')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('startTime')}>
                Start Time
                <ArrowUpDown className="h-4 w-4 inline-block ml-1" />
                {getSortDirectionIndicator('startTime')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('endTime')}>
                End Time
                <ArrowUpDown className="h-4 w-4 inline-block ml-1" />
                {getSortDirectionIndicator('endTime')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('eventType')}>
                Event Type
                <ArrowUpDown className="h-4 w-4 inline-block ml-1" />
                {getSortDirectionIndicator('eventType')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('recurring')}>
                Recurring
                <ArrowUpDown className="h-4 w-4 inline-block ml-1" />
                {getSortDirectionIndicator('recurring')}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingEvents ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                    <p>Loading events...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedEvents.length > 0 ? (
              paginatedEvents.map((event) => {
                const building = event.building_id ? getBuildingById(event.building_id) : null;
                const amenity = event.amenity_id ? getAmenityById(event.amenity_id) : null;
                const eventType = event.event_type_id ? getEventTypeById(event.event_type_id) : null;
                
                return (
                  <TableRow 
                    key={event.event_id ? event.event_id.toString() : 'undefined-event'}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => showEventDetails(event)}
                  >
                    <TableCell>{event.event_title || 'Untitled Event'}</TableCell>
                    <TableCell>{building?.building_name || 'Unknown'}</TableCell>
                    <TableCell>{amenity?.amenity_name || 'Unknown'}</TableCell>
                    <TableCell>{formatUtcDate(event.one_time_date)}</TableCell>
                    <TableCell>{formatUtcTimeToAmPm(event.start_time)}</TableCell>
                    <TableCell>{formatUtcTimeToAmPm(event.end_time)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span 
                          className={`w-3 h-3 rounded-full mr-2 ${eventType?.color_code ? `bg-${eventType.color_code}` : 'bg-gray-300'}`}
                        ></span>
                        {eventType ? (eventType.type_name || eventType.event_type_name || 'Unknown Type') : 'Unknown Type'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.is_recurring ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Recurring
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          One-time
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {/* <Button 
                          variant="outline" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button> */}

                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            confirmDelete();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  {events.length === 0 ? 'No events found' : 'No matching events found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
        
        <Pagination
          totalItems={filteredAndSortedEvents.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Confirmation Dialog for Deleting an Event */}
      <ConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        title="Delete Event"
        description={`Are you sure you want to delete "${selectedEvent?.event_title || 'this event'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={isLoading}
        variant="destructive"
      />

      {selectedEvent && (
        <EventDetailsDialog
          event={{
            id: selectedEvent.event_id || 0,
            title: selectedEvent.event_title || 'Untitled Event',
            buildingId: selectedEvent.building_id || 0,
            amenityId: selectedEvent.amenity_id || 0,
            startTime: selectedEvent.start_time || new Date().toISOString(),
            endTime: selectedEvent.end_time || new Date().toISOString(),
            eventTypeId: selectedEvent.event_type_id || 0,
            isRecurring: selectedEvent.is_recurring || false,
            recurringPattern: selectedEvent.recurring_pattern_id ? selectedEvent.recurring_pattern_id.toString() : "none",
            notes: selectedEvent.notes || '',
            cost: selectedEvent.cost || 0,
            attachment: selectedEvent.attachment_url || '',
            contactPhone: selectedEvent.contact_phone || '',
            contactEmail: selectedEvent.contact_email || '',
            createdAt: selectedEvent.created_at || new Date().toISOString()
          }}
          isOpen={isDetailsDialogOpen}
          onClose={() => {
            setIsDetailsDialogOpen(false);
            setSelectedEvent(null);
          }}
          onEdit={() => handleEditEvent(selectedEvent)}
          onDelete={handleDeleteEvent}
          buildingsList={mappedBuildings}
          amenitiesList={mappedAmenities}
          eventTypesList={mappedEventTypes}
        />
      )}

      {selectedEvent && !isLoadingDropdowns && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Event: {selectedEvent.event_title || 'Untitled Event'}</DialogTitle>
            </DialogHeader>
            {buildings.length > 0 && eventTypes.length > 0 ? (
              <EventEditForm
                event={{
                  id: selectedEvent.event_id || 0,
                  title: selectedEvent.event_title || 'Untitled Event',
                  buildingId: selectedEvent.building_id || 0,
                  amenityId: selectedEvent.amenity_id || 0,
                  startTime: selectedEvent.start_time || new Date().toISOString(),
                  endTime: selectedEvent.end_time || new Date().toISOString(),
                  eventTypeId: selectedEvent.event_type_id || 0,
                  isRecurring: selectedEvent.is_recurring || false,
                  recurringPattern: selectedEvent.recurring_pattern_id ? selectedEvent.recurring_pattern_id.toString() : "none",
                  recurringStartDate: selectedEvent.recurring_start_date || '',
                  recurringEndDate: selectedEvent.recurring_end_date || '',
                  notes: selectedEvent.notes || '',
                  cost: selectedEvent.cost || 0,
                  attachment: selectedEvent.attachment_url || '',
                  contactPhone: selectedEvent.contact_phone || '',
                  contactEmail: selectedEvent.contact_email || '',
                  createdAt: selectedEvent.created_at || new Date().toISOString()
                }}
                buildings={mappedBuildings.length > 0 ? mappedBuildings : [{ id: 0, name: 'Default Building', regionId: 0, key: 'default-building' }]}
                regions={mappedRegions.length > 0 ? mappedRegions : [{ id: 0, name: 'Default Region', key: 'default-region' }]}
                amenities={mappedAmenities.length > 0 ? mappedAmenities : [{ id: 0, name: 'Default Amenity', buildingId: 0, floor: 0, key: 'default-amenity' }]}
                eventTypes={mappedEventTypes.length > 0 ? mappedEventTypes : [{ id: 0, name: 'Default Type', colorCode: 'bg-gray-300', key: 'default-type' }]}
                isLoading={isLoading}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedEvent(null);
                }}
                onSave={updatedEvent => {
                  console.log('Received updated event from form:', updatedEvent);
                  
                  // Convert format from EventEditForm to database format
                  const dbFormat: Event = {
                    event_id: updatedEvent.id as number,
                    event_title: updatedEvent.title,
                    building_id: updatedEvent.buildingId as number,
                    amenity_id: updatedEvent.amenityId as number,
                    start_time: updatedEvent.startTime,
                    end_time: updatedEvent.endTime,
                    event_type_id: updatedEvent.eventTypeId as number,
                    is_recurring: updatedEvent.isRecurring,
                    recurring_pattern_id: updatedEvent.recurringPattern && updatedEvent.recurringPattern !== "none" ? parseInt(updatedEvent.recurringPattern) : undefined,
                    notes: updatedEvent.notes,
                    cost: updatedEvent.cost as number,
                    attachment_url: updatedEvent.attachment,
                    contact_phone: updatedEvent.contactPhone,
                    contact_email: updatedEvent.contactEmail,
                    // Make sure to properly format dates
                    one_time_date: new Date(updatedEvent.startTime).toISOString().split('T')[0],
                    // Handle recurring dates properly
                    recurring_start_date: updatedEvent.isRecurring && updatedEvent.recurringStartDate 
                      ? new Date(updatedEvent.recurringStartDate).toISOString().split('T')[0] 
                      : undefined,
                    recurring_end_date: updatedEvent.isRecurring && updatedEvent.recurringEndDate 
                      ? new Date(updatedEvent.recurringEndDate).toISOString().split('T')[0] 
                      : undefined,
                    created_at: updatedEvent.createdAt
                  };
                  
                  console.log('Converted to DB format:', dbFormat);
                  handleEventUpdate(dbFormat);
                }}
                onDelete={handleDeleteEvent}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Loading form data...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MockEventsTab;
