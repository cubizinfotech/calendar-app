import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardData, fetchAmenityUsageReport, fetchEventTypeReport } from '@/utils/databaseService';
import { formatUtcDatetimeToAmPm, formatUtcDate, formatUtcTimeToAmPm } from '@/utils/calendarUtils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ReportsViewProps {
  dashboardData: DashboardData;
  isLoading: boolean;
  reportData: {
    regions: any[];
    buildings: any[];
    amenities: any[];
    eventTypes: any[];
  };
}

const ReportsView: React.FC<ReportsViewProps> = ({ dashboardData, isLoading, reportData }) => {
  const [activeTab, setActiveTab] = useState('standard');
  const [filter, setFilter] = useState({
    region: 'all',
    building: 'all',
    quarter: 'Q2',
    eventType: 'all',
    amenity: 'all',
    year: '2025',
  });
  
  // State for reports data
  const [standardReportData, setStandardReportData] = useState<{
    totalEvents: number;
    eventTypes: any[];
  }>({
    totalEvents: 0,
    eventTypes: []
  });
  
  const [amenityReportData, setAmenityReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState<boolean>(false);

  // Log received props
  useEffect(() => {
    console.log("ReportsView received props:", {
      regionsCount: reportData.regions?.length || 0,
      buildingsCount: reportData.buildings?.length || 0,
      amenitiesCount: reportData.amenities?.length || 0,
      eventTypesCount: reportData.eventTypes?.length || 0
    });
  }, [reportData]);

  // Ensure dropdowns have valid selections
  useEffect(() => {
    // If regions loaded and filter is still 'all', keep it as 'all'
    if (reportData.regions?.length > 0) {
      // Optional: Set a default selection if needed
      // setFilter(prev => ({ ...prev, region: reportData.regions[0].id.toString() }));
      console.log("Regions available:", reportData.regions.length);
    }
  }, [reportData.regions]);

  // Load report data when filters change
  useEffect(() => {
    const loadReportData = async () => {
      if (activeTab === 'standard') {
        setReportLoading(true);
        try {
          const data = await fetchEventTypeReport(filter);
          console.log("Standard report data loaded:", data);
          setStandardReportData(data);
        } catch (error) {
          console.error("Error loading standard report:", error);
          toast.error("Failed to load report data");
        } finally {
          setReportLoading(false);
        }
      } else if (activeTab === 'custom') {
        setReportLoading(true);
        try {
          const data = await fetchAmenityUsageReport(filter);
          console.log("Amenity report data loaded:", data);
          setAmenityReportData(data);
        } catch (error) {
          console.error("Error loading amenity report:", error);
          toast.error("Failed to load report data");
        } finally {
          setReportLoading(false);
        }
      }
    };
    
    loadReportData();
  }, [filter, activeTab]);

  // Function to handle exporting data to Excel
  const handleExport = () => {
    try {
      if (activeTab === 'standard') {
        exportStandardReport();
      } else {
        exportCustomReport();
      }
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  // Export Standard Report (Event Type breakdown)
  const exportStandardReport = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Prepare data for the Event Type report
    const typeData = standardReportData.eventTypes.map(type => ({
      'Event Type': type.name,
      'Count': type.count || 0
    }));
    
    // Create summary worksheet
    const summaryData = [
      { 'Report Type': 'Standard Report' },
      { 'Date': new Date().toLocaleDateString() },
      { 'Quarter': filter.quarter },
      { 'Year': filter.year },
      { 'Region': filter.region === 'all' ? 'All Regions' : safeRegions.find(r => r.id.toString() === filter.region)?.name || 'Unknown' },
      { 'Building': filter.building === 'all' ? 'All Buildings' : safeBuildings.find(b => b.id.toString() === filter.building)?.name || 'Unknown' },
      { 'Total Events': standardReportData.totalEvents }
    ];
    
    // Convert to worksheets
    const summaryWs = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });
    const typeWs = XLSX.utils.json_to_sheet(typeData);
    
    // Add to workbook
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    XLSX.utils.book_append_sheet(wb, typeWs, 'Event Types');
    
    // Generate Excel file
    const excelFileName = `Standard_Report_${filter.quarter}_${filter.year}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    // Save file
    saveAs(fileData, excelFileName);
  };
  
  // Export Custom Report (Amenity Usage)
  const exportCustomReport = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare summary data
    const summaryData = [
      { 'Report Type': 'Custom Amenity Usage Report' },
      { 'Date': new Date().toLocaleDateString() },
      { 'Quarter': filter.quarter },
      { 'Year': filter.year },
      { 'Region': filter.region === 'all' ? 'All Regions' : safeRegions.find(r => r.id.toString() === filter.region)?.name || 'Unknown' },
      { 'Building': filter.building === 'all' ? 'All Buildings' : safeBuildings.find(b => b.id.toString() === filter.building)?.name || 'Unknown' },
      { 'Amenity': filter.amenity === 'all' ? 'All Amenities' : safeAmenities.find(a => a.id.toString() === filter.amenity)?.name || 'Unknown' },
    ];
    
    // Prepare amenity data
    const amenityUsageData = amenityReportData.map(item => ({
      'Amenity': item.amenityName || 'Unknown',
      'Total Hours': item.totalHours || 0,
      'Number of Events': item.events?.length || 0
    }));
    
    // Prepare event details data
    const eventDetailsData = [];
    amenityReportData.forEach(amenity => {
      if (amenity.events && amenity.events.length > 0) {
        amenity.events.forEach(event => {
          // Calculate duration
          const startTime = new Date(formatUtcDatetimeToAmPm(event.startTime));
          const endTime = new Date(formatUtcDatetimeToAmPm(event.endTime));
          const durationHours = ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(1);
          
          eventDetailsData.push({
            'Amenity': amenity.amenityName,
            'Event': event.title || 'Untitled Event',
            'Date': formatUtcDate(event.startTime),
            'Start Time': formatUtcTimeToAmPm(event.startTime),
            'End Time': formatUtcTimeToAmPm(event.endTime),
            'Duration (Hours)': durationHours,
            'Event Type': event.eventType?.name || 'Unknown'
          });
        });
      }
    });
    
    // Convert to worksheets
    const summaryWs = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });
    const amenityWs = XLSX.utils.json_to_sheet(amenityUsageData);
    const eventDetailsWs = XLSX.utils.json_to_sheet(eventDetailsData);
    
    // Add to workbook
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    XLSX.utils.book_append_sheet(wb, amenityWs, 'Amenity Usage');
    XLSX.utils.book_append_sheet(wb, eventDetailsWs, 'Event Details');
    
    // Generate Excel file
    const excelFileName = `Amenity_Usage_Report_${filter.quarter}_${filter.year}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    // Save file
    saveAs(fileData, excelFileName);
  };

  // Ensure we have valid data before processing
  const safeEventTypes = Array.isArray(reportData.eventTypes) ? reportData.eventTypes : [];
  const safeRegions = Array.isArray(reportData.regions) ? reportData.regions : [];
  const safeBuildings = Array.isArray(reportData.buildings) ? reportData.buildings : [];
  const safeAmenities = Array.isArray(reportData.amenities) ? reportData.amenities : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="standard">Standard Report</TabsTrigger>
          <TabsTrigger value="custom">Custom Report</TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region-standard">Region</Label>
                    <Select
                      value={filter.region}
                      onValueChange={(value) => setFilter({ ...filter, region: value })}
                    >
                      <SelectTrigger id="region-standard">
                        <SelectValue placeholder="All Regions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {safeRegions.map((region) => (
                          <SelectItem key={region.id.toString()} value={region.id.toString()}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="building-standard">Building</Label>
                    <Select
                      value={filter.building}
                      onValueChange={(value) => setFilter({ ...filter, building: value })}
                    >
                      <SelectTrigger id="building-standard">
                        <SelectValue placeholder="All Buildings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Buildings</SelectItem>
                        {safeBuildings.map((building) => (
                          <SelectItem key={building.id.toString()} value={building.id.toString()}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quarter-standard">Quarter</Label>
                    <Select
                      value={filter.quarter}
                      onValueChange={(value) => setFilter({ ...filter, quarter: value })}
                    >
                      <SelectTrigger id="quarter-standard">
                        <SelectValue placeholder="Select Quarter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                        <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                        <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                        <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-type-standard">Event Type</Label>
                    <Select
                      value={filter.eventType}
                      onValueChange={(value) => setFilter({ ...filter, eventType: value })}
                    >
                      <SelectTrigger id="event-type-standard">
                        <SelectValue placeholder="All Event Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Event Types</SelectItem>
                        {safeEventTypes.map((type) => (
                          <SelectItem key={type.id.toString()} value={type.id.toString()}>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full ${type.colorCode || 'bg-gray-400'} mr-2`}></div>
                              {type.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Report Results</h3>
                  
                  {isLoading || reportLoading ? (
                    <div className="text-center py-4">Loading report data...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{standardReportData.totalEvents || 0}</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Filtered by selected criteria
                          </p>
                        </CardContent>
                      </Card>
      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Event Type Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {standardReportData.eventTypes.length > 0 ? (
                              standardReportData.eventTypes.map((type) => (
                                <li key={type.id.toString()} className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full ${type.colorCode || 'bg-gray-400'} mr-2`}></div>
                                    <span>{type.name}</span>
                                  </div>
                                  <span className="font-medium">{type.count || 0}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-center py-2 text-muted-foreground">No event data found</li>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleExport} 
                    disabled={isLoading || reportLoading || !standardReportData.eventTypes?.length}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region-custom">Region</Label>
                    <Select
                      value={filter.region}
                      onValueChange={(value) => setFilter({ ...filter, region: value })}
                    >
                      <SelectTrigger id="region-custom">
                        <SelectValue placeholder="All Regions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {safeRegions.map((region) => (
                          <SelectItem key={region.id.toString()} value={region.id.toString()}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="building-custom">Building</Label>
                    <Select
                      value={filter.building}
                      onValueChange={(value) => setFilter({ ...filter, building: value })}
                    >
                      <SelectTrigger id="building-custom">
                        <SelectValue placeholder="All Buildings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Buildings</SelectItem>
                        {safeBuildings.map((building) => (
                          <SelectItem key={building.id.toString()} value={building.id.toString()}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quarter-custom">Quarter</Label>
                    <Select
                      value={filter.quarter}
                      onValueChange={(value) => setFilter({ ...filter, quarter: value })}
                    >
                      <SelectTrigger id="quarter-custom">
                        <SelectValue placeholder="Select Quarter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1">Q1 {filter.year} (Jan-Mar)</SelectItem>
                        <SelectItem value="Q2">Q2 {filter.year} (Apr-Jun)</SelectItem>
                        <SelectItem value="Q3">Q3 {filter.year} (Jul-Sep)</SelectItem>
                        <SelectItem value="Q4">Q4 {filter.year} (Oct-Dec)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amenity-custom">Amenity</Label>
                    <Select
                      value={filter.amenity}
                      onValueChange={(value) => setFilter({ ...filter, amenity: value })}
                    >
                      <SelectTrigger id="amenity-custom">
                        <SelectValue placeholder="All Amenities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Amenities</SelectItem>
                        {safeAmenities.map((amenity) => (
                          <SelectItem key={amenity.id.toString()} value={amenity.id.toString()}>
                            {amenity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year-custom">Year</Label>
                  <Select
                    value={filter.year}
                    onValueChange={(value) => setFilter({ ...filter, year: value })}
                  >
                    <SelectTrigger id="year-custom" className="w-[180px]">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Amenity Usage Report</h3>
                
                  {isLoading || reportLoading ? (
                    <div className="text-center py-4">Loading report data...</div>
                  ) : (
                    <div className="space-y-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Amenity</TableHead>
                            <TableHead>Total Hours Booked</TableHead>
                            <TableHead>Number of Events</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {amenityReportData.length > 0 ? (
                            amenityReportData.map((item) => (
                              <TableRow key={item.amenityId.toString()}>
                                <TableCell>{item.amenityName || 'Unknown'}</TableCell>
                                <TableCell>{item.totalHours || 0} hours</TableCell>
                                <TableCell>{(item.events && item.events.length) || 0} events</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-4">
                                No data found for the selected filters
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>

                      {amenityReportData.map((item) => {
                        const eventsList = Array.isArray(item.events) ? item.events : [];
                        return eventsList.length > 0 ? (
                          <div key={`details-${item.amenityId.toString()}`} className="mt-4">
                            <h4 className="font-medium mb-2">{item.amenityName || 'Unknown'} - Event Details</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Event</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Start Time</TableHead>
                                  <TableHead>End Time</TableHead>
                                  <TableHead>Duration</TableHead>
                                  <TableHead>Type</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {eventsList.map((event) => (
                                  <TableRow key={event.id.toString()}>
                                    <TableCell>{event.title || 'Untitled Event'}</TableCell>
                                    <TableCell>
                                      { formatUtcDate(event.startTime) }
                                    </TableCell>
                                    <TableCell>
                                      { formatUtcTimeToAmPm(event.startTime) }
                                    </TableCell>
                                    <TableCell>
                                      { formatUtcTimeToAmPm(event.endTime) }
                                    </TableCell>
                                    <TableCell>
                                      {(event.startTime && event.endTime) ? 
                                        ((new Date(event.endTime).getTime() - 
                                          new Date(event.startTime).getTime()) / 
                                          (1000 * 60 * 60)).toFixed(1) : '0'} hours
                                    </TableCell>
                                    <TableCell>
                                      <span className={`px-2 py-1 rounded-full text-xs ${event.eventType?.colorCode || 'bg-gray-100 text-gray-800'}`}>
                                        {event.eventType?.name || 'Unknown Type'}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleExport} 
                    disabled={isLoading || reportLoading || !amenityReportData?.length}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsView;
