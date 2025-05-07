
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BuildingsTab from './BuildingsTab';
import AmenitiesTab from './AmenitiesTab';
import BuildingAmenitiesTab from './BuildingAmenitiesTab';
import ImportExportTab from './ImportExportTab';
import MockEventsTab from './MockEventsTab';
import RecurringPatternsTab from './RecurringPatternsTab';

const AdminView = () => {
  const [activeTab, setActiveTab] = useState('import-export');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
              <TabsTrigger value="buildings">Buildings</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
              <TabsTrigger value="building-amenities">Building Amenities</TabsTrigger>
              <TabsTrigger value="mock-events">Mock Events</TabsTrigger>
              <TabsTrigger value="recurring-patterns">Recurring Patterns</TabsTrigger>
            </TabsList>

            <TabsContent value="import-export">
              {activeTab === 'import-export' && <ImportExportTab />}
            </TabsContent>

            <TabsContent value="buildings">
              {activeTab === 'buildings' && <BuildingsTab />}
            </TabsContent>

            <TabsContent value="amenities">
              {activeTab === 'amenities' && <AmenitiesTab />}
            </TabsContent>

            <TabsContent value="building-amenities">
              {activeTab === 'building-amenities' && <BuildingAmenitiesTab />}
            </TabsContent>

            <TabsContent value="mock-events">
              {activeTab === 'mock-events' && <MockEventsTab />}
            </TabsContent>

            <TabsContent value="recurring-patterns">
              {activeTab === 'recurring-patterns' && <RecurringPatternsTab />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminView;
