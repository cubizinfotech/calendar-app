
import React, { useState, useEffect } from "react";
import ReportsView from "@/components/reports/ReportsView";
import AppLayout from "@/components/layout/AppLayout";
import { fetchDashboardData, fetchReportsData, DashboardData } from "@/utils/databaseService";

const Reports = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    events: [],
    totalEvents: 0,
    oneTimeEvents: 0,
    recurringEvents: 0,
    buildingsCount: 0,
    amenitiesCount: 0,
    regionsCount: 0,
    buildingAmenitiesCount: 0,
    eventTypeCounts: {}
  });
  
  const [reportData, setReportData] = useState({
    regions: [],
    buildings: [],
    amenities: [],
    eventTypes: []
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch data in parallel for better performance
        const [dashboardResults, reportsResults] = await Promise.all([
          fetchDashboardData(),
          fetchReportsData()
        ]);
        
        console.log("Reports data loaded:", {
          regions: reportsResults.regions?.length || 0,
          buildings: reportsResults.buildings?.length || 0,
          amenities: reportsResults.amenities?.length || 0,
          eventTypes: reportsResults.eventTypes?.length || 0
        });
        
        // Set dashboard data
        setDashboardData(dashboardResults || {
          events: [],
          totalEvents: 0,
          oneTimeEvents: 0,
          recurringEvents: 0,
          buildingsCount: 0,
          amenitiesCount: 0,
          regionsCount: 0,
          buildingAmenitiesCount: 0,
          eventTypeCounts: {}
        });
        
        // Set report data
        setReportData(reportsResults || {
          regions: [],
          buildings: [],
          amenities: [],
          eventTypes: []
        });
      } catch (error) {
        console.error("Error fetching data for reports:", error);
        // Set default values on error
        setDashboardData({
          events: [],
          totalEvents: 0,
          oneTimeEvents: 0,
          recurringEvents: 0,
          buildingsCount: 0,
          amenitiesCount: 0,
          regionsCount: 0, 
          buildingAmenitiesCount: 0,
          eventTypeCounts: {}
        });
        
        setReportData({
          regions: [],
          buildings: [],
          amenities: [],
          eventTypes: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <AppLayout>
      <ReportsView 
        dashboardData={dashboardData} 
        isLoading={loading} 
        reportData={reportData}
      />
    </AppLayout>
  );
};

export default Reports;
