
import { useState, useEffect } from "react";
import CalendarView from "@/components/calendar/CalendarView";
import AppLayout from "@/components/layout/AppLayout";
import { fetchDashboardData } from "@/utils/databaseService";
import PrintButton from "@/components/calendar/PrintButton";
import PrintableCalendar from "@/components/calendar/PrintableCalendar";
import { CalendarContextProvider } from "@/components/calendar/CalendarContext";
import { toast } from "sonner";

// Define interface for events
interface CalendarEvent {
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
  cost?: number;
}

const Calendar = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [activeView, setActiveView] = useState<string>("calendar");
  const [filters, setFilters] = useState({
    region: 'all',
    building: 'all',
    amenity: 'all',
    eventType: ['all'],
  });
  
  // Fetch events data directly from the database service
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log("Calendar: Fetching data from database service");
        const data = await fetchDashboardData();
        console.log("Calendar: Data fetched:", data);
        
        // Handle null or undefined data
        if (data && Array.isArray(data.events)) {
          setEvents(data.events);
          console.log("Calendar: Events set:", data.events.length);
        } else {
          console.error("Calendar: Invalid events data received:", data);
          setEvents([]); // Set to empty array when no valid data
        }
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        setEvents([]); // Set to empty array on error
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Handle print function
  const handlePrint = () => {
    toast.info("Preparing calendar for printing...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <AppLayout>
      <CalendarContextProvider initialEvents={events || []} isLoading={isLoading}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Calendar</h1>
          <PrintButton onClick={handlePrint} />
        </div>
        
        <CalendarView />
        
        <PrintableCalendar
          activeMonth={activeMonth}
          activeYear={activeYear}
          filters={filters}
          events={events}
          buildings={[]}
          amenities={[]}
          eventTypes={[]}
          regions={[]}
        />
      </CalendarContextProvider>
    </AppLayout>
  );
};

export default Calendar;
