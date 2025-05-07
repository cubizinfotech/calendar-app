import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { readExcelFile, convertExcelDateOnly, convertExcelTimeOnly, combineDateAndTime } from '@/utils/excel';
import DataPreviewTable from './DataPreviewTable';
import { supabase } from '@/integrations/supabase/client';
import { log } from 'console';

// Event type mapping for color codes
const eventTypesColorCode = [
  { name: "Tenant", colorCode: "event-tenant" },
  { name: "Agency", colorCode: "event-agency" },
  { name: "Internal", colorCode: "event-internal" },
  { name: "Priority", colorCode: "event-priority" },
  { name: "Other", colorCode: "event-other" }
];

const toSentenceCase = (str: any): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Helper function to get color code based on event type name
const getColorCodeForEventType = (typeName: string): string | null => {
  const normalizedTypeName = typeName.trim().toLowerCase();
  const matchedType = eventTypesColorCode.find(type =>
    normalizedTypeName.includes(type.name.toLowerCase())
  );
  return matchedType ? matchedType.colorCode : null;
};

const ALLOWED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv' // .csv
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ImportSection = () => {
  const [importType, setImportType] = useState('events');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFileAndPreview = () => {
    setFile(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportTypeChange = (value: string) => {
    setImportType(value);
    clearFileAndPreview();
  };

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Invalid file format. Please upload an Excel or CSV file.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 5MB limit.');
      return false;
    }

    return true;
  };

  const validateRequiredHeaders = (data: any[]): boolean => {
    if (data.length === 0) {
      toast.error('File is empty.');
      return false;
    }

    const requiredHeaders = {
      buildings: ['Region', 'Building Address'],
      amenities: ['Amenity'],
      building_amenities: ['Region', 'Building Address', 'Amenity'],
      events: ['Event Title', 'Building', 'Amenity', 'Start Time', 'End Time', 'Agency or Tenant-Led-led', 'Date', 'Notes']
    };

    const headers = Object.keys(data[0]);
    const required = requiredHeaders[importType as keyof typeof requiredHeaders] || [];

    const missingHeaders = required.filter(header => !headers.includes(header));

    if (missingHeaders.length > 0) {
      toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!validateFile(uploadedFile)) {
      clearFileAndPreview();
      return;
    }

    setFile(uploadedFile);
    toast.success(`File selected: ${uploadedFile.name}`);

    try {
      if (importType === 'buildings') {
        const data = await readExcelFile(uploadedFile, 0);

        if (!validateRequiredHeaders(data)) {
          clearFileAndPreview();
          return;
        }
      
        const formattedData = data.map((row: any, index: number) => {
          if (row['Region'] && row['Building Address']) {
            return {
              id: index + 1,
              region_name: toSentenceCase(row['Region']?.trim() || ''),
              building_name: toSentenceCase(row['Building Address']?.trim() || '')
            };
          } else {
            // toast.error('Missing required fields. Please check Region and Building Address.');
            // return null;
          }
        })
        .filter(Boolean);
      
        // Filter to keep only unique (region_name + building_name) combinations
        const uniqueBuildings = formattedData.filter((value, index, self) =>
          index === self.findIndex((t) => 
            t.region_name === value.region_name &&
            t.building_name === value.building_name
          )
        );
      
        setPreviewData(uniqueBuildings);

      } else if (importType === 'amenities') {
        const data = await readExcelFile(uploadedFile, 0);
      
        if (!validateRequiredHeaders(data)) {
          clearFileAndPreview();
          return;
        }
      
        // First map the data
        const formattedData = data.map((row: any, index: number) => {
          if (row['Amenity']) {
            return {
              id: index + 1,
              amenity_name: toSentenceCase(row['Amenity']?.trim() || '')
            };
          } else {
            // toast.error('Missing required fields. Please check Amenity.');
            // return null;
          }
        })
        .filter(Boolean);
      
        // Filter to keep only unique amenity names
        const uniqueAmenities = formattedData.filter((value, index, self) =>
          index === self.findIndex((t) => t.amenity_name === value.amenity_name)
        );
      
        setPreviewData(uniqueAmenities);

      } else if (importType === 'building_amenities') {
        const data = await readExcelFile(uploadedFile, 0);
      
        if (!validateRequiredHeaders(data)) {
          clearFileAndPreview();
          return;
        }
      
        const formattedData = data.map((row: any, index: number) => {
          if (row['Region'] && row['Building Address'] && row['Amenity']) {
            return {
              id: index + 1,
              region_name: toSentenceCase(row['Region']?.trim() || ''),
              building_name: toSentenceCase(row['Building Address']?.trim() || ''),
              amenity_name: toSentenceCase(row['Amenity']?.trim() || ''),
              floor: toSentenceCase(String(row['Floor'] ?? '').trim())
            };
          } else {
            // toast.error('Missing required fields. Please check Amenity.');
            // return null;
          }          
        })
        .filter(Boolean);
      
        // Filter to keep only unique (region_name + building_name + amenity_name) combinations
        const uniqueBuildingAmenities = formattedData.filter((value, index, self) =>
          index === self.findIndex((t) => 
            t.region_name === value.region_name &&
            t.building_name === value.building_name &&
            t.amenity_name === value.amenity_name
          )
        );
      
        setPreviewData(uniqueBuildingAmenities);

      } else if (importType === 'events') {
        const data = await readExcelFile(uploadedFile, 1);
        
        if (!validateRequiredHeaders(data)) {
          clearFileAndPreview();
          return;
        }

        const formattedData = data.map((row: any, index: number) => {
          if (
            row['Event Title'] && 
            row['Region'] && 
            row['Building'] && 
            row['Amenity'] && 
            row['Agency or Tenant-Led-led'] && 
            row['Date'] && 
            row['Start Time'] && 
            row['End Time']
          ) {
            const date = new Date();
            const eventDate = convertExcelDateOnly(row['Date']);
            const eventDates = new Date(eventDate);
            const startTime = convertExcelTimeOnly(row['Start Time']);
            const endTime = convertExcelTimeOnly(row['End Time']);

            if (date.getMonth() <= eventDates.getMonth() && date.getFullYear() <= eventDates.getFullYear()) {
              return {
                id: index + 1,
                event_title: toSentenceCase(row['Event Title']?.trim() || ''),
                region_name: toSentenceCase(row['Region']?.trim() || ''),
                building_name: toSentenceCase(row['Building']?.trim() || ''),
                amenity_name: toSentenceCase(row['Amenity']?.trim() || ''),
                type: toSentenceCase(row['Agency or Tenant-Led-led']?.trim() || ''),
                date: eventDate,
                startTime: startTime,
                endTime: endTime,
                notes: toSentenceCase(row['Notes']?.trim() || '')
              };
            }
          } else {
            // toast.error('Missing required fields. Please check Event Title, Building, Amenity, Agency or Tenant-Led-led, Date, Start Time, and End Time.');
            // return null;
          }
        })
        .filter(Boolean);
    
        console.log("formattedData: ", formattedData);
        setPreviewData(formattedData);
      }
    } catch (err) {
      console.error('Error reading file:', err);
      toast.error('Error reading file. Please make sure the file is not corrupted.');
      clearFileAndPreview();
    }
  };

  const handleImport = async () => {
    if (!file || previewData.length === 0) {
      toast.error('Please select a file with valid data first.');
      return;
    }

    if (importType === 'buildings' && previewData.length > 0) {
      setIsImporting(true);
      try {
        for (const row of previewData) {
          let { data: existingRegions, error: regionQueryError } = await supabase
            .from('regions')
            .select('region_id')
            .eq('region_name', row.region_name);
            
          if (regionQueryError) {
            console.error('Error querying region:', regionQueryError);
            throw regionQueryError;
          }

          let regionId;
          
          if (!existingRegions || existingRegions.length === 0) {
            console.log(`Region "${row.region_name}" not found, creating new one`);
            const { data: newRegion, error: regionError } = await supabase
              .from('regions')
              .insert({ region_name: row.region_name })
              .select('region_id')
              .single();

            if (regionError) throw regionError;
            regionId = newRegion.region_id;
            console.log(`Created new region with ID: ${regionId}`);
          } else {
            regionId = existingRegions[0].region_id;
            console.log(`Found existing region with ID: ${regionId}`);
          }

          const { data: existingBuildings, error: buildingQueryError } = await supabase
            .from('buildings')
            .select('building_id')
            .eq('building_name', row.building_name);
            
          if (buildingQueryError) {
            console.error('Error querying building:', buildingQueryError);
            throw buildingQueryError;
          }

          if (!existingBuildings || existingBuildings.length === 0) {
            console.log(`Building "${row.building_name}" not found in region ${regionId}, creating new one`);
            const { error: buildingError } = await supabase
              .from('buildings')
              .insert({
                building_name: row.building_name,
                region_id: regionId
              });

            if (buildingError) throw buildingError;
            console.log(`Created new building: ${row.building_name}`);
          } else {
            console.log(`Building "${row.building_name}" already exists in region ${regionId}`);
          }
        }

        toast.success('Buildings data imported successfully!');
        clearFileAndPreview();
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Error importing data. Please try again.');
      } finally {
        setIsImporting(false);
      }

    } else if (importType === 'amenities' && previewData.length > 0) {
      setIsImporting(true);
      try {
        for (const row of previewData) {
          let { data: existingAmenity, error: amenityQueryError } = await supabase
            .from('amenities')
            .select('amenity_id')
            .eq('amenity_name', row.amenity_name);
            
          if (amenityQueryError) {
            console.error('Error querying amenity:', amenityQueryError);
            throw amenityQueryError;
          }
          
          if (!existingAmenity || existingAmenity.length === 0) {
            console.log(`Amenity "${row.amenity_name}" not found, creating new one`);
            const { data: newAmenity, error: amenityError } = await supabase
              .from('amenities')
              .insert({ amenity_name: row.amenity_name });

            if (amenityError) throw amenityError;
            console.log(`Created new amenity: ${row.amenity_name}`);
          } else {
            console.log(`Amenity ${row.amenity_name} already exists.`);
          }
        }

        toast.success('Amenities data imported successfully!');
        clearFileAndPreview();
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Error importing data. Please try again.');
      } finally {
        setIsImporting(false);
      }

    } else if (importType === 'building_amenities' && previewData.length > 0) {
      setIsImporting(true);
      try {
        for (const row of previewData) {
          let { data: existingRegions, error: regionQueryError } = await supabase
            .from('regions')
            .select('region_id')
            .eq('region_name', row.region_name);
            
          if (regionQueryError) {
            console.error('Error querying region:', regionQueryError);
            throw regionQueryError;
          }

          let regionId;
          
          if (!existingRegions || existingRegions.length === 0) {
            console.log(`Region "${row.region_name}" not found, creating new one`);
            const { data: newRegion, error: regionError } = await supabase
              .from('regions')
              .insert({ region_name: row.region_name })
              .select('region_id')
              .single();

            if (regionError) throw regionError;
            regionId = newRegion.region_id;
            console.log(`Created new region with ID: ${regionId}`);
          } else {
            regionId = existingRegions[0].region_id;
            console.log(`Found existing region with ID: ${regionId}`);
          }

          const { data: existingBuildings, error: buildingQueryError } = await supabase
            .from('buildings')
            .select('building_id')
            .eq('building_name', row.building_name);
            
          if (buildingQueryError) {
            console.error('Error querying building:', buildingQueryError);
            throw buildingQueryError;
          }

          let buildingId;

          if (!existingBuildings || existingBuildings.length === 0) {
            console.log(`Building "${row.building_name}" not found in region ${regionId}, creating new one`);
            const { data: newBuilding, error: buildingError } = await supabase
              .from('buildings')
              .insert({
                building_name: row.building_name,
                region_id: regionId
              })
              .select('building_id')
              .single();

            if (buildingError) throw buildingError;
            buildingId = newBuilding.building_id;
            console.log(`Created new building with ID: ${buildingId}`);
          } else {
            buildingId = existingBuildings[0].building_id;
            console.log(`Building "${row.building_name}" already exists in region ${regionId}`);
          }

          let { data: existingAmenity, error: amenityQueryError } = await supabase
            .from('amenities')
            .select('amenity_id')
            .eq('amenity_name', row.amenity_name);
            
          if (amenityQueryError) {
            console.error('Error querying amenity:', amenityQueryError);
            throw amenityQueryError;
          }

          let amenityId;
          
          if (!existingAmenity || existingAmenity.length === 0) {
            console.log(`Amenity "${row.amenity_name}" not found, creating new one`);
            const { data: newAmenity, error: amenityError } = await supabase
              .from('amenities')
              .insert({ amenity_name: row.amenity_name })
              .select('amenity_id')
              .single();

            if (amenityError) throw amenityError;
            amenityId = newAmenity.amenity_id;
            console.log(`Created new amenity with ID: ${amenityId}`);
          } else {
            amenityId = existingAmenity[0].amenity_id;
            console.log(`Found existing amenity with ID: ${amenityId}`);
          }

          let { data: existingBuildingAmenity, error: buildingAmenityQueryError } = await supabase
            .from('building_amenities')
            .select('*')
            .eq('building_id', buildingId)
            .eq('amenity_id', amenityId);
            
          if (buildingAmenityQueryError) {
            console.error('Error querying building amenity:', buildingAmenityQueryError);
            throw buildingAmenityQueryError;
          }
          
          if (!existingBuildingAmenity || existingBuildingAmenity.length === 0) {
            console.log(`Building Amenity buildingId: "${buildingId}", amenityId: "${amenityId}" not found, creating new one`);
            const { error: buildingAmenityError } = await supabase
              .from('building_amenities')
              .insert({
                building_id: buildingId,
                amenity_id: amenityId,
                floor: row.floor
              });

            if (buildingAmenityError) throw buildingAmenityError;
            console.log(`Created new building amenity: buildingId: "${buildingId}", amenityId: "${amenityId}"`);
          } else {
            console.log(`Found existing building amenity: buildingId: "${buildingId}", amenityId: "${amenityId}"`);
          }
        }

        toast.success('Building Amenities data imported successfully!');
        clearFileAndPreview();
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Error importing data. Please try again.');
      } finally {
        setIsImporting(false);
      }

    } else if (importType === 'events' && previewData.length > 0) {
      setIsImporting(true);
      try {
        for (const row of previewData) {
          let { data: existingRegions, error: regionQueryError } = await supabase
            .from('regions')
            .select('region_id')
            .eq('region_name', row.region_name);
            
          if (regionQueryError) {
            console.error('Error querying region:', regionQueryError);
            throw regionQueryError;
          }

          let regionId;
          
          if (!existingRegions || existingRegions.length === 0) {
            /*
            console.log(`Region "${row.region_name}" not found, creating new one`);
            const { data: newRegion, error: regionError } = await supabase
              .from('regions')
              .insert({ region_name: row.region_name })
              .select('region_id')
              .single();

            if (regionError) throw regionError;
            regionId = newRegion.region_id;
            console.log(`Created new region with ID: ${regionId}`);
            */
          } else {
            regionId = existingRegions[0].region_id;
            console.log(`Found existing region with ID: ${regionId}`);
          }

          const { data: existingBuildings, error: buildingQueryError } = await supabase
            .from('buildings')
            .select('building_id')
            .eq('building_name', row.building_name);
            
          if (buildingQueryError) {
            console.error('Error querying building:', buildingQueryError);
            throw buildingQueryError;
          }

          let buildingId;

          if (!existingBuildings || existingBuildings.length === 0) {
            /*
            console.log(`Building "${row.building_name}" not found in region ${regionId}, creating new one`);
            const { data: newBuilding, error: buildingError } = await supabase
              .from('buildings')
              .insert({
                building_name: row.building_name,
                region_id: regionId
              })
              .select('building_id')
              .single();

            if (buildingError) throw buildingError;
            buildingId = newBuilding.building_id;
            console.log(`Created new building with ID: ${buildingId}`);
            */
          } else {
            buildingId = existingBuildings[0].building_id;
            console.log(`Building "${row.building_name}" already exists in region ${regionId}`);
          }

          let { data: existingAmenity, error: amenityQueryError } = await supabase
            .from('amenities')
            .select('amenity_id')
            .eq('amenity_name', row.amenity_name);
            
          if (amenityQueryError) {
            console.error('Error querying amenity:', amenityQueryError);
            throw amenityQueryError;
          }

          let amenityId;
          
          if (!existingAmenity || existingAmenity.length === 0) {
            /*
            console.log(`Amenity "${row.amenity_name}" not found, creating new one`);
            const { data: newAmenity, error: amenityError } = await supabase
              .from('amenities')
              .insert({ amenity_name: row.amenity_name })
              .select('amenity_id')
              .single();

            if (amenityError) throw amenityError;
            amenityId = newAmenity.amenity_id;
            console.log(`Created new amenity with ID: ${amenityId}`);
            */
          } else {
            amenityId = existingAmenity[0].amenity_id;
            console.log(`Found existing amenity with ID: ${amenityId}`);
          }

          if (buildingId && amenityId) {

            let { data: existingBuildingAmenity, error: buildingAmenityQueryError } = await supabase
              .from('building_amenities')
              .select('*')
              .eq('building_id', buildingId)
              .eq('amenity_id', amenityId);
              
            if (buildingAmenityQueryError) {
              console.error('Error querying building amenity:', buildingAmenityQueryError);
              throw buildingAmenityQueryError;
            }
            
            if (!existingBuildingAmenity || existingBuildingAmenity.length === 0) {
              console.log(`Building Amenity buildingId: "${buildingId}", amenityId: "${amenityId}" not found, creating new one`);
              const { error: buildingAmenityError } = await supabase
                .from('building_amenities')
                .insert({
                  building_id: buildingId,
                  amenity_id: amenityId,
                  floor: row.floor
                });

              if (buildingAmenityError) throw buildingAmenityError;
              console.log(`Created new building amenity: buildingId: "${buildingId}", amenityId: "${amenityId}"`);
            } else {
              console.log(`Found existing building amenity: buildingId: "${buildingId}", amenityId: "${amenityId}"`);
            }

            let { data: existingEventType, error: eventTypeQueryError } = await supabase
              .from('event_types')
              .select('event_type_id')
              .eq('event_type_name', row.type);
              
            if (eventTypeQueryError) {
              console.error('Error querying event type:', eventTypeQueryError);
              throw eventTypeQueryError;
            }

            let eventTypeId;
            
            if (!existingEventType || existingEventType.length === 0) {
              console.log(`Event type "${row.type}" not found, creating new one`);
              const colorCode = getColorCodeForEventType(row.type);
              const { data: newEventType, error: eventTypeError } = await supabase
                .from('event_types')
                .insert({
                  event_type_name: row.type,
                  color_code: colorCode
                })
                .select('event_type_id')
                .single();

              if (eventTypeError) throw eventTypeError;
              eventTypeId = newEventType.event_type_id;
              console.log(`Created new event type with ID: ${eventTypeId}, color code: ${colorCode}`);
            } else {
              eventTypeId = existingEventType[0].event_type_id;
              console.log(`Found existing event type with ID: ${eventTypeId}`);
            }

            const startDateTime = `${row.date}T${row.startTime}:00Z`;
            const endDateTime = `${row.date}T${row.endTime}:00Z`;

            let { data: existingEvent, error: eventQueryError } = await supabase
              .from('events')
              .select('event_id')
              .eq('building_id', buildingId)
              .eq('amenity_id', amenityId)
              .eq('event_type_id', eventTypeId)
              .eq('start_time', startDateTime)
              .eq('end_time', endDateTime)
              .eq('one_time_date', row.date);
              
            if (eventQueryError) {
              console.error('Error querying event:', eventQueryError);
              throw eventQueryError;
            }
            
            if (!existingEvent || existingEvent.length === 0) {
              console.log(`Event "${row.event_title}" not found, creating new one`);
              const { data: newEvent, error: eventError } = await supabase
                .from('events')
                .insert({
                  event_title: row.event_title,
                  building_id: buildingId,
                  amenity_id: amenityId,
                  event_type_id: eventTypeId,
                  start_time: startDateTime,
                  end_time: endDateTime,
                  one_time_date: row.date,
                  notes: row.notes
                });

              if (eventError) throw eventError;
              console.log(`Created new event: ${row.event_title}`);
            } else {
              console.log(`Event ${row.event_title} already exists.`);
            }
            
          }
        }

        toast.success('Events data imported successfully!');
        clearFileAndPreview();
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Error importing data. Please try again.');
      } finally {
        setIsImporting(false);
      }
    } else {
      toast.error('No data to import');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Import Data</h2>
      
      <div className="space-y-4">
        <RadioGroup
          value={importType}
          onValueChange={handleImportTypeChange}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="events" id="events" />
            <Label htmlFor="events">Events</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="buildings" id="buildings" />
            <Label htmlFor="buildings">Buildings</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="amenities" id="amenities" />
            <Label htmlFor="amenities">Amenities</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="building_amenities" id="building_amenities" />
            <Label htmlFor="building_amenities">Building Amenities</Label>
          </div>
        </RadioGroup>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Required Headers</h3>
                <p className="text-sm text-muted-foreground">
                  {importType === 'events' && 'Event Title, Building, Amenity, Start Time, End Time, Agency or Tenant-Led-led, Date, Notes'}
                  {importType === 'buildings' && 'Region, Building Address'}
                  {importType === 'amenities' && 'Amenity'}
                  {importType === 'building_amenities' && 'Region, Building Address, Amenity, Floor'}
                </p>
              </div>

              <div>
                <Label htmlFor="file-upload">Upload File (Excel or CSV)</Label>
                <Input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>

              {file && previewData.length > 0 && (
                <DataPreviewTable data={previewData} />
              )}

              {file && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Confirm Import
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportSection;
