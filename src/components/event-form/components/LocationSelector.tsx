import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LocationSelectorProps {
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  selectedBuilding: string;
  setSelectedBuilding: (building: string) => void;
  selectedAmenity: string;
  setSelectedAmenity: (amenity: string) => void;
  filteredBuildings: any[];
  filteredAmenities: any[];
  hasConflict: boolean;
  regions: any[]; // Add regions prop
  isLoadingAmenities?: boolean;
  validationErrors?: {
    region?: boolean;
    building?: boolean;
    amenity?: boolean;
  };
}

const LocationSelector = ({
  selectedRegion,
  setSelectedRegion,
  selectedBuilding,
  setSelectedBuilding,
  selectedAmenity,
  setSelectedAmenity,
  filteredBuildings,
  filteredAmenities,
  hasConflict,
  regions,
  isLoadingAmenities = false,
  validationErrors = {}
}: LocationSelectorProps) => {
  return (
    <div>
      <Label className="block mb-2 text-lg font-medium">Location</Label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="region" className={cn(
            validationErrors.region ? "text-destructive font-semibold" : ""
          )}>
            Region *
            </Label>
          <Select
            value={selectedRegion}
            onValueChange={(value) => {
              setSelectedRegion(value);
              setSelectedBuilding('');
              setSelectedAmenity('');
            }}
          >
            <SelectTrigger id="region" className={cn(
              validationErrors.region ? "border-destructive" : "",
              hasConflict && selectedRegion ? "border-amber-500" : ""
            )}>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.length > 0 ? (
                regions.map(region => (
                  <SelectItem 
                    key={region.id || `region-${Math.random()}`} 
                    value={region.id?.toString() || ""}
                  >
                    {region.name || "Unnamed Region"}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-regions" disabled>
                  No regions available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {validationErrors.region && (
            <p className="text-sm text-destructive">Region is required</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="building" className={cn(
            validationErrors.building ? "text-destructive font-semibold" : ""
          )}>
            Building *
          </Label>
          <Select
            value={selectedBuilding}
            onValueChange={(value) => {
              setSelectedBuilding(value);
              setSelectedAmenity('');
            }}
            disabled={filteredBuildings.length === 0}
          >
            <SelectTrigger id="building" className={cn(
              validationErrors.building ? "border-destructive" : "",
              hasConflict && selectedBuilding ? "border-amber-500" : ""
            )}>
              <SelectValue placeholder={selectedRegion ? "Select building" : "Select region first"} />
            </SelectTrigger>
            <SelectContent>
              {filteredBuildings.length > 0 ? (
                filteredBuildings.map(building => (
                  <SelectItem 
                    key={building.building_id || building.id || `building-${Math.random()}`} 
                    value={building.building_id?.toString() || building.id?.toString() || ""}
                  >
                    {building.building_name || building.name || "Unnamed Building"}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-buildings" disabled>
                  {selectedRegion ? "No buildings available for this region" : "Select a region first"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {validationErrors.building && (
            <p className="text-sm text-destructive">Building is required</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amenity" className={cn(
            validationErrors.amenity ? "text-destructive font-semibold" : ""
          )}>
            Amenity *
          </Label>
          <Select
            value={selectedAmenity}
            onValueChange={setSelectedAmenity}
            disabled={!selectedBuilding || filteredAmenities.length === 0 || isLoadingAmenities}
          >
            <SelectTrigger id="amenity" className={cn(
              validationErrors.amenity ? "border-destructive" : "",
              hasConflict && selectedAmenity ? "border-amber-500" : ""
            )}>
              {isLoadingAmenities ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading amenities...</span>
                </div>
              ) : (
                <SelectValue placeholder={selectedBuilding ? "Select amenity" : "Select building first"} />
              )}
            </SelectTrigger>
            <SelectContent>
              {isLoadingAmenities ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading amenities...</span>
                </div>
              ) : filteredAmenities.length > 0 ? (
                filteredAmenities.map(amenity => (
                  <SelectItem 
                    key={amenity.amenity_id || amenity.id || `amenity-${Math.random()}`} 
                    value={amenity.amenity_id?.toString() || amenity.id?.toString() || ""}
                  >
                    {amenity.amenity_name || amenity.name || "Unnamed Amenity"}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-amenities" disabled>
                  {selectedBuilding ? "No amenities available for this building" : "Select a building first"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {validationErrors.amenity && (
            <p className="text-sm text-destructive">Amenity is required</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
