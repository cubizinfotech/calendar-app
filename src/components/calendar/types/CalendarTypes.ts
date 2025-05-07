// Define interfaces for calendar context
export interface CalendarFilters {
  region: string;
  building: string;
  amenity: string;
  eventType: string[];
}

export interface CalendarEvent {
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
  recurringPattern?: string;
  notes?: string;
  cost?: number | string;
  recurringParentId?: string;
  contactPhone?: string;
  contactEmail?: string;
  attachmentUrl?: string;
  originalEventId?: number;
  modifiedDate?: string;
}

export interface Building {
  building_id?: number;
  id?: number;
  building_name: string;
  region_id?: number;
  [key: string]: any;
}

export interface Amenity {
  amenity_id?: number;
  id?: number;
  amenity_name: string;
  [key: string]: any;
}

export interface Region {
  region_id?: number;
  id?: number;
  region_name: string;
  [key: string]: any;
}

export interface EventType {
  event_type_id?: number;
  id?: number;
  event_type_name?: string;
  name?: string;
  colorCode?: string;
  [key: string]: any;
}

export interface CalendarContextProps {
  activeMonth: number;
  activeYear: number;
  filters: CalendarFilters;
  events: CalendarEvent[];
  buildings: Building[];
  amenities: Amenity[];
  regions: Region[];
  eventTypes: EventType[];
  allMonthEvents: CalendarEvent[];
  isLoading: boolean;
  activeView: string;
  setActiveMonth: (month: number) => void;
  setActiveYear: (year: number) => void;
  setActiveView: (view: string) => void;
  setFilters: (filters: CalendarFilters) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  handleEventClick: (event: CalendarEvent) => void;
  selectedEvent: CalendarEvent | null;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  showEventDetails: boolean;
  setShowEventDetails: (show: boolean) => void;
  showEventEdit: boolean;
  setShowEventEdit: (show: boolean) => void;
  handleCloseDetails: () => void;
  handleEditClick: (event: CalendarEvent) => void;
  handleCloseEdit: () => void;
  handleEventSave: (event: CalendarEvent) => void;
  handleEventDelete: (deleteType?: 'single' | 'series') => void;
  deleteInProgress: boolean;
  showDeleteConfirmation: boolean;
  // Edit-related properties
  editInProgress: boolean;
  showEditConfirmation: boolean;
  setShowEditConfirmation: (show: boolean) => void;
  currentEditType: 'single' | 'series' | undefined;
  setCurrentEditType: (type: 'single' | 'series' | undefined) => void;
  executeEventEdit: (eventToEdit?: CalendarEvent | null, editType?: 'single' | 'series' | null) => void;
  // Data refresh functions
  refreshEvents?: () => Promise<void>;
  fetchEvents?: () => Promise<void>;
}

export interface CalendarProviderProps {
  children: React.ReactNode;
  initialEvents?: CalendarEvent[];
  isLoading?: boolean;
}
