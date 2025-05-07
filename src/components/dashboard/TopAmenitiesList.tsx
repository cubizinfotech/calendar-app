
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { fetchTopAmenities } from '@/utils/databaseService';

const TopAmenitiesList = () => {
  const [topAmenities, setTopAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAmenities = async () => {
      try {
        setLoading(true);
        const data = await fetchTopAmenities();
        setTopAmenities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching top amenities:", error);
        setTopAmenities([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAmenities();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-slate-600">Top Amenities</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <ul className="space-y-3">
            {topAmenities.length > 0 ? 
              topAmenities.map(amenity => (
                <li key={`amenity-${amenity?.id || Math.random()}`} className="flex justify-between">
                  <span>{amenity?.name || 'Unknown'}</span>
                  <span className="font-medium">{amenity?.count || 0}</span>
                </li>
              )) : 
              <li className="text-center text-gray-500">No amenity usage data</li>
            }
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default TopAmenitiesList;
