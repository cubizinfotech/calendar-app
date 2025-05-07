
import { Building, Calendar, LayoutGrid } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import EventTypeList from "@/components/dashboard/EventTypeList";
import UpcomingEventsList from "@/components/dashboard/UpcomingEventsList";
import TopAmenitiesList from "@/components/dashboard/TopAmenitiesList";
import RegionsOverview from "@/components/dashboard/RegionsOverview";
import AppLayout from "@/components/layout/AppLayout";
import { fetchDashboardData, DashboardData } from "@/utils/databaseService";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    events: [],
    totalEvents: 0,
    oneTimeEvents: 0,
    recurringEvents: 0,
    buildingsCount: 0,
    amenitiesCount: 0,
    buildingAmenitiesCount: 0,
    regionsCount: 0,
    eventTypeCounts: {}
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData();
        // Ensure we have valid data with defaults for any missing values
        setDashboardData({
          events: Array.isArray(data?.events) ? data.events : [],
          totalEvents: data?.totalEvents || 0,
          oneTimeEvents: data?.oneTimeEvents || 0,
          recurringEvents: data?.recurringEvents || 0,
          buildingsCount: data?.buildingsCount || 0,
          amenitiesCount: data?.amenitiesCount || 0,
          buildingAmenitiesCount: data?.buildingAmenitiesCount || 0,
          regionsCount: data?.regionsCount || 0,
          eventTypeCounts: data?.eventTypeCounts || {}
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Reset to default values on error
        setDashboardData({
          events: [],
          totalEvents: 0,
          oneTimeEvents: 0,
          recurringEvents: 0,
          buildingsCount: 0,
          amenitiesCount: 0,
          buildingAmenitiesCount: 0,
          regionsCount: 0,
          eventTypeCounts: {}
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="font-bold text-3xl">DASHBOARD</h1>

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Events" 
            value={dashboardData.totalEvents.toString()} 
            description={`${dashboardData.oneTimeEvents || 0} One-time, ${dashboardData.recurringEvents || 0} Recurring`} 
            icon={<Calendar className="h-4 w-4" />} 
          />
          <KpiCard 
            title="Buildings & Amenities" 
            // value={`${dashboardData.buildingsCount || 0} / ${dashboardData.amenitiesCount || 0}`} 
            value={`${dashboardData.buildingsCount || 0} / ${dashboardData.buildingAmenitiesCount || 0}`} 
            description="Buildings / Amenities" 
            icon={<Building className="h-4 w-4" />} 
          />
          <KpiCard 
            title="Regions" 
            value={(dashboardData.regionsCount || 0).toString()} 
            icon={<LayoutGrid className="h-4 w-4" />} 
          />
          <EventTypeList eventTypeCounts={dashboardData.eventTypeCounts || {}} />
        </div>

        {/* Loading state for the entire dashboard */}
        {loading ? (
          <div className="text-center py-8">Loading dashboard data...</div>
        ) : (
          <>
            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <UpcomingEventsList />
              <TopAmenitiesList />
            </div>

            {/* Regions Section */}
            <div>
              <h2 className="font-medium mb-4 text-2xl">Regions Overview</h2>
              <RegionsOverview />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
