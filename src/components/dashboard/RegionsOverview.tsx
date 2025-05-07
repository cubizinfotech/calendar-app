
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { fetchRegionsData } from '@/utils/databaseService';

interface RegionData {
  id: number;
  name: string;
  buildings: number;
  portfolioPercentage: number;
  topAmenities: string[];
}

const RegionsOverview = () => {
  const [regionStats, setRegionStats] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRegionsData = async () => {
      try {
        setLoading(true);
        const data = await fetchRegionsData();
        setRegionStats(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching regions data:", error);
        setRegionStats([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadRegionsData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading ? (
        <div className="col-span-full text-center py-4">Loading regions data...</div>
      ) : regionStats.length > 0 ? (
        regionStats.map((region) => (
          <Card key={`region-${region?.id || Math.random()}`} className="h-full">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">{region?.name || 'Unknown Region'}</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Buildings</span>
                  <span className="font-medium">{region?.buildings || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Portfolio</span>
                  <span className="font-medium">{region?.portfolioPercentage || 0}%</span>
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Top Amenities</h4>
                  <ul className="text-sm">
                    {Array.isArray(region?.topAmenities) ? 
                      region.topAmenities.map((amenity, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                          {amenity || 'Unknown'}
                        </li>
                      )) : 
                      <li className="flex items-center">
                        <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                        No amenities data
                      </li>
                    }
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="col-span-full text-center py-4">No regions data available</div>
      )}
    </div>
  );
};

export default RegionsOverview;
