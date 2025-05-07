import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from 'date-fns';
import { DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatUtcTime, formatUtcTimeToAmPm, formatUtcDate, formatUtcDatetimeToAmPm } from '@/utils/calendarUtils';

export interface EventEditFormProps {
  event: any;
  buildings: any[];
  regions: any[];
  amenities: any[];
  eventTypes: any[];
  isOpen?: boolean;
  isLoading?: boolean;
  onCancel: () => void;
  onSave: (editedEvent: any) => void;
  onDelete: () => void;
}

const EventEditForm = ({ 
  event, 
  buildings, 
  regions, 
  amenities, 
  eventTypes,
  isLoading = false,
  isOpen = true, 
  onCancel, 
  onSave,
  onDelete 
}: EventEditFormProps) => {
  // Add debug logging
  console.log("EventEditForm Props:", {
    eventId: event.id,
    eventBuildingId: event.buildingId,
    buildingsCount: buildings.length,
    regionsCount: regions.length,
    amenitiesCount: amenities.length,
    eventTypesCount: eventTypes.length
  });
  
  if (amenities.length > 0) {
    console.log("First amenity:", amenities[0]);
  }
  
  const building = buildings.find(b => b.building_id === event.buildingId);
  const [selectedRegion, setSelectedRegion] = useState(building?.region_id?.toString() || '');
  const [selectedBuilding, setSelectedBuilding] = useState(event.buildingId?.toString() || '');
  const [filteredBuildings, setFilteredBuildings] = useState(buildings.filter(b => 
    !selectedRegion || b.region_id === parseInt(selectedRegion)
  ));
  const [filteredAmenities, setFilteredAmenities] = useState<any[]>([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false);
  const [showRecurringAlert, setShowRecurringAlert] = useState(false);
  const [editedEvent, setEditedEvent] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    title: event.title || '',
    eventTypeId: event.eventTypeId?.toString() || '',
    buildingId: selectedBuilding,
    amenityId: event.amenityId?.toString() || '',
    startTime: event.startTime ? format(new Date(formatUtcDatetimeToAmPm(event.startTime)), "yyyy-MM-dd'T'HH:mm") : '',
    endTime: event.endTime ? format(new Date(formatUtcDatetimeToAmPm(event.endTime)), "yyyy-MM-dd'T'HH:mm") : '',
    notes: event.notes || '',
    cost: event.cost || '',
    contactPhone: event.contactPhone || '',
    contactEmail: event.contactEmail || '',
    isRecurring: event.isRecurring || false,
  });
  
  // Update filtered buildings when region changes
  useEffect(() => {
    if (selectedRegion) {
      const regionId = parseInt(selectedRegion);
      setFilteredBuildings(buildings.filter(b => b.region_id === regionId));
      if (selectedBuilding && !buildings.some(b => b.region_id === regionId && b.building_id === parseInt(selectedBuilding))) {
        setSelectedBuilding('');
        setFormData(prev => ({...prev, buildingId: '', amenityId: ''}));
      }
    } else {
      setFilteredBuildings(buildings);
    }
  }, [selectedRegion, selectedBuilding, buildings]);

  // Fetch amenities for the selected building
  const fetchAmenitiesForBuilding = async (buildingId: string) => {
    if (!buildingId || buildingId === '') return;
    
    setIsLoadingAmenities(true);
    try {
      // First, get the amenity IDs for this building from the junction table
      const { data: buildingAmenitiesData, error: buildingAmenitiesError } = await supabase
        .from('building_amenities')
        .select('amenity_id')
        .eq('building_id', parseInt(buildingId));
      
      if (buildingAmenitiesError) throw buildingAmenitiesError;
      
      // If no amenities are found for this building
      if (!buildingAmenitiesData || buildingAmenitiesData.length === 0) {
        console.log(`No amenities found for building ${buildingId}`);
        setFilteredAmenities([]);
        setFormData(prev => ({...prev, amenityId: ''}));
        return;
      }
      
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
      
      // If there's only one amenity, auto-select it
      if (amenitiesData && amenitiesData.length === 1) {
        const amenityId = amenitiesData[0].amenity_id.toString();
        setFormData(prev => ({...prev, amenityId}));
      } else if (formData.amenityId) {
        // Check if current selected amenity is available for this building
        const isAmenityAvailable = amenitiesData?.some(
          a => a.amenity_id.toString() === formData.amenityId
        );
        
        if (!isAmenityAvailable) {
          setFormData(prev => ({...prev, amenityId: ''}));
        }
      }
    } catch (error) {
      console.error('Error fetching amenities for building:', error);
      setFilteredAmenities([]);
    } finally {
      setIsLoadingAmenities(false);
    }
  };

  // Update filtered amenities when building changes
  useEffect(() => {
    console.log("Building selection changed:", {
      selectedBuilding,
      buildingId: selectedBuilding ? parseInt(selectedBuilding) : null
    });
    
    if (selectedBuilding) {
      fetchAmenitiesForBuilding(selectedBuilding);
    } else {
      console.log("No building selected, clearing amenities");
      setFilteredAmenities([]);
      setFormData(prev => ({...prev, amenityId: ''}));
    }
  }, [selectedBuilding]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.eventTypeId) {
      errors.eventTypeId = "Event type is required";
    }

    if (!formData.buildingId) {
      errors.buildingId = "Building is required";
    }

    if (!formData.amenityId) {
      errors.amenityId = "Amenity is required";
    }

    if (!formData.startTime) {
      errors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      errors.endTime = "End time is required";
    }

    // Validate that end time is after start time
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end <= start) {
        errors.endTime = "End time must be after start time";
      }
    }

    // Validate email format if provided
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = "Invalid email format";
    }

    // Validate cost is a number
    if (formData.cost && isNaN(Number(formData.cost))) {
      errors.cost = "Cost must be a number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({...prev, [field]: value}));
    
    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Extract the event date from the full datetime
    const eventDate = parseISO(formData.startTime).toISOString().split('T')[0];
    
    // Get the original event date
    const originalDate = new Date(event.startTime).toISOString().split('T')[0];
    
    // Create a new DateTime using the original date but with the new time values
    const startTimeOnly = formData.startTime.split('T')[1];
    const endTimeOnly = formData.endTime.split('T')[1];
    
    const newStartTime = `${originalDate}T${startTimeOnly}`;
    const newEndTime = `${originalDate}T${endTimeOnly}`;
    
    const updatedEvent = {
      ...event,
      title: formData.title,
      eventTypeId: parseInt(formData.eventTypeId),
      buildingId: parseInt(formData.buildingId),
      amenityId: parseInt(formData.amenityId),
      startTime: newStartTime,
      endTime: newEndTime,
      notes: formData.notes,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      isRecurring: event.isRecurring, // Keep original recurring status
      oneTimeDate: eventDate
    };

    // Always directly save non-recurring events
    if (!event.isRecurring) {
      onSave(updatedEvent);
      return;
    }
    
    // For recurring events, we'll let the onSave handler manage showing the confirmation
    // dialog through the context. No need to show our own dialog.
    onSave(updatedEvent);
  };

  // Format the time for display (showing only time, not date)
  const formatTimeOnly = (dateTimeString: string) => {
    try {
      return format(new Date(dateTimeString), "h:mm a");
    } catch (error) {
      console.error("Error formatting time:", error);
      return dateTimeString;
    }
  };

  const startTime = formatTimeOnly(event.startTime);
  const endTime = formatTimeOnly(event.endTime);
  const eventDate = event.startTime ? format(new Date(event.startTime), "PPP") : '';

  const handleCloseModal = () => {
    // Make sure we're not in the middle of an operation
    if (!isLoading) {
      // Reset any form states
      setFormErrors({});
      setFormData({
        title: event.title || '',
        eventTypeId: event.eventTypeId?.toString() || '',
        buildingId: event.buildingId?.toString() || '',
        amenityId: event.amenityId?.toString() || '',
        startTime: event.startTime ? format(new Date(formatUtcDatetimeToAmPm(event.startTime)), "yyyy-MM-dd'T'HH:mm") : '',
        endTime: event.endTime ? format(new Date(formatUtcDatetimeToAmPm(event.endTime)), "yyyy-MM-dd'T'HH:mm") : '',
        notes: event.notes || '',
        cost: event.cost || '',
        contactPhone: event.contactPhone || '',
        contactEmail: event.contactEmail || '',
        isRecurring: event.isRecurring || false,
      });
      
      // Force a re-render to ensure cleanup
      setTimeout(() => {
        // Remove any lingering pointer-events styles
        document.body.style.pointerEvents = '';
        // Close the modal
        onCancel();
      }, 0);
    }
  };

  // Add cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      document.body.style.pointerEvents = '';
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="w-full max-w-6xl">
          <DialogHeader>
            <DialogTitle>{event.title ? `Edit Event: ${event.title}` : 'Edit Event'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className={formErrors.title ? "text-destructive font-semibold" : ""}>
                  Event Title *
                </Label>
                <Input 
                  id="title" 
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={isLoading}
                  className={formErrors.title ? "border-destructive" : ""}
                />
                {formErrors.title && <p className="text-sm text-destructive">{formErrors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-type" className={formErrors.eventTypeId ? "text-destructive font-semibold" : ""}>
                  Event Type *
                </Label>
                <Select 
                  value={formData.eventTypeId} 
                  onValueChange={(value) => handleInputChange('eventTypeId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="event-type" className={formErrors.eventTypeId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes && eventTypes.length > 0 ? eventTypes.map((type) => (
                      <SelectItem key={type.event_type_id} value={type.event_type_id?.toString() || ''}>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full ${type.color_code || 'bg-gray-400'} mr-2`}></div>
                          {type.event_type_name}
                        </div>
                      </SelectItem>
                    )) : (
                      <SelectItem value="" disabled>No event types available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.eventTypeId && <p className="text-sm text-destructive">{formErrors.eventTypeId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select 
                  value={selectedRegion} 
                  onValueChange={setSelectedRegion}
                  disabled={isLoading}
                >
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.length > 0 ? (
                      regions.map((region) => (
                        <SelectItem key={region.region_id} value={region.region_id.toString()}>
                          {region.region_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-regions" disabled>
                        No regions available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="building" className={formErrors.buildingId ? "text-destructive font-semibold" : ""}>
                  Building *
                </Label>
                <Select 
                  value={formData.buildingId} 
                  onValueChange={(value) => {
                    setSelectedBuilding(value);
                    handleInputChange('buildingId', value);
                  }}
                  disabled={isLoading || !selectedRegion}
                >
                  <SelectTrigger id="building" className={formErrors.buildingId ? "border-destructive" : ""}>
                    <SelectValue placeholder={selectedRegion ? "Select building" : "Select region first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBuildings.length > 0 ? (
                      filteredBuildings.map((building) => (
                        <SelectItem key={building.building_id} value={building.building_id.toString()}>
                          {building.building_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-buildings" disabled>
                        {selectedRegion ? "No buildings available for this region" : "Select a region first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.buildingId && <p className="text-sm text-destructive">{formErrors.buildingId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amenity" className={formErrors.amenityId ? "text-destructive font-semibold" : ""}>
                  Amenity *
                </Label>
                <Select 
                  value={formData.amenityId} 
                  onValueChange={(value) => handleInputChange('amenityId', value)}
                  disabled={isLoading || !formData.buildingId || isLoadingAmenities}
                >
                  <SelectTrigger id="amenity" className={formErrors.amenityId ? "border-destructive" : ""}>
                    {isLoadingAmenities ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading amenities...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={formData.buildingId ? "Select amenity" : "Select building first"} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAmenities ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading amenities...</span>
                      </div>
                    ) : filteredAmenities.length > 0 ? (
                      filteredAmenities.map((amenity) => (
                        <SelectItem key={amenity.amenity_id} value={amenity.amenity_id.toString()}>
                          {amenity.amenity_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-amenities" disabled>
                        {formData.buildingId ? "No amenities available for this building" : "Select a building first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.amenityId && <p className="text-sm text-destructive">{formErrors.amenityId}</p>}
                {formData.buildingId && !isLoadingAmenities && filteredAmenities.length === 0 && (
                  <p className="text-sm text-amber-500">
                    This building has no amenities. Please contact an administrator.
                  </p>
                )}
              </div>
            </div>

            {/* Event Date Display */}
            <div className="mb-4">
              <Label>Event Date</Label>
              <div className="p-2 border rounded bg-muted/30">
                {formatUtcDate(event.startTime)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time" className={formErrors.startTime ? "text-destructive font-semibold" : ""}>
                  Start Time *
                </Label>
                <Input 
                  id="start-time" 
                  type="time"
                  value={formData.startTime.split('T')[1].substring(0, 5)}
                  onChange={(e) => {
                    const [date] = formatUtcDatetimeToAmPm(formData.endTime).split(' ');
                    handleInputChange('startTime', `${date}T${e.target.value}:00`);
                  }}
                  disabled={isLoading}
                  className={formErrors.startTime ? "border-destructive" : ""}
                />
                <div className="text-sm text-muted-foreground">
                  Current: {formatUtcTimeToAmPm(event.startTime)}
                </div>
                {formErrors.startTime && <p className="text-sm text-destructive">{formErrors.startTime}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time" className={formErrors.endTime ? "text-destructive font-semibold" : ""}>
                  End Time *
                </Label>
                <Input 
                  id="end-time" 
                  type="time"
                  value={formData.endTime.split('T')[1].substring(0, 5)}
                  onChange={(e) => {
                    const [date] = formatUtcDatetimeToAmPm(formData.endTime).split(' ');
                    handleInputChange('endTime', `${date}T${e.target.value}:00`);
                  }}
                  disabled={isLoading}
                  className={formErrors.endTime ? "border-destructive" : ""}
                />
                <div className="text-sm text-muted-foreground">
                  Current: {formatUtcTimeToAmPm(event.endTime)}
                </div>
                {formErrors.endTime && <p className="text-sm text-destructive">{formErrors.endTime}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="cost"
                    type="text"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', e.target.value)}
                    className={`pl-10 ${formErrors.cost ? "border-destructive" : ""}`}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                </div>
                {formErrors.cost && <p className="text-sm text-destructive">{formErrors.cost}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone">Contact Phone</Label>
                <Input 
                  id="contact-phone" 
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="Contact phone number" 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email" className={formErrors.contactEmail ? "text-destructive" : ""}>
                  Contact Email
                </Label>
                <Input 
                  id="contact-email" 
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="Contact email address" 
                  disabled={isLoading}
                  className={formErrors.contactEmail ? "border-destructive" : ""}
                />
                {formErrors.contactEmail && <p className="text-sm text-destructive">{formErrors.contactEmail}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any additional notes"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventEditForm;
