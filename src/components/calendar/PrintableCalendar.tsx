
import React from 'react';
import { format, isSameMonth, isSameYear } from 'date-fns';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import EventsList from '@/components/calendar/EventsList';

// Define interface for component props
interface PrintableCalendarProps {
  activeMonth: number;
  activeYear: number;
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
  regions: any[];
}

const PrintableCalendar: React.FC<PrintableCalendarProps> = ({
  activeMonth,
  activeYear,
  filters,
  events,
  buildings,
  amenities,
  eventTypes,
  regions
}) => {
  // Get filter names instead of IDs for display
  const getFilterNames = () => {
    const regionName = filters.region === 'all' 
      ? 'All Regions' 
      : regions.find(r => r.region_id?.toString() === filters.region)?.region_name || 'Unknown';
    
    const buildingName = filters.building === 'all' 
      ? 'All Buildings' 
      : buildings.find(b => b.building_id?.toString() === filters.building)?.building_name || 'Unknown';
    
    const amenityName = filters.amenity === 'all' 
      ? 'All Amenities' 
      : amenities.find(a => a.amenity_id?.toString() === filters.amenity)?.amenity_name || 'Unknown';
    
    let eventTypeNames = 'All Event Types';
    
    if (!filters.eventType.includes('all')) {
      eventTypeNames = filters.eventType
        .map(id => {
          const eventType = eventTypes.find(et => (et.event_type_id || et.id)?.toString() === id);
          return eventType?.event_type_name || eventType?.name || 'Unknown';
        })
        .join(', ');
    }
    
    return { regionName, buildingName, amenityName, eventTypeNames };
  };
  
  const filterNames = getFilterNames();
  
  return (
    <div className="print-container" style={{ display: 'none' }} id="printable-calendar">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-calendar, #printable-calendar * {
            visibility: visible;
          }
          #printable-calendar {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
          .page-break-before {
            page-break-before: always;
          }
          
          /* Hide scrollbars and other UI elements */
          ::-webkit-scrollbar {
            display: none;
          }
          
          /* Adjust table for print */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          /* Filter bar styling */
          .print-filter-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
            font-size: 12px;
          }
          
          .print-filter-item {
            display: inline-flex;
            align-items: center;
          }
          
          .print-filter-label {
            font-weight: bold;
            margin-right: 4px;
          }
        }
      `}</style>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Calendar: {format(new Date(activeYear, activeMonth), 'MMMM yyyy')}</h1>
          <div className="text-sm text-gray-500">Generated on {format(new Date(), 'PP')}</div>
        </div>
        
        {/* Filter Information - Compact inline format */}
        <div className="mb-4 p-3 border rounded bg-gray-50 print-filter-bar">
          <div className="print-filter-item"><span className="print-filter-label">Region:</span> {filterNames.regionName}</div>
          <div className="print-filter-item"><span className="print-filter-label">Building:</span> {filterNames.buildingName}</div>
          <div className="print-filter-item"><span className="print-filter-label">Amenity:</span> {filterNames.amenityName}</div>
          <div className="print-filter-item"><span className="print-filter-label">Event Types:</span> {filterNames.eventTypeNames}</div>
        </div>
        
        {/* Calendar Grid */}
        <div className="mb-6 page-break-inside-avoid">
          <div className="bg-white border rounded p-4">
            <CalendarGrid 
              year={activeYear} 
              month={activeMonth} 
              filters={filters}
              events={events}
              eventTypes={eventTypes}
              buildings={buildings}
              onEventClick={() => {}} // No-op in print view
            />
          </div>
        </div>
        
        {/* Events List as Single Table - On a new page */}
        <div className="page-break-before">
          <h2 className="text-xl font-semibold mb-4">Events Schedule</h2>
          <div className="bg-white border rounded p-4">
            <EventsList 
              year={activeYear}
              month={activeMonth}
              filters={filters}
              events={events}
              buildings={buildings}
              amenities={amenities}
              eventTypes={eventTypes}
              regions={regions}
              onEventClick={() => {}} // No-op in print view
              printView={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableCalendar;
