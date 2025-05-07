-- Drop the find_events_by_building_and_amenity function if it exists
DROP FUNCTION IF EXISTS find_events_by_building_and_amenity(integer,integer,date) ;

-- Drop the find_events_by_building function if it exists
DROP FUNCTION IF EXISTS find_events_by_building(integer, date);

-- Drop the find_conflicting_events function if it exists
DROP FUNCTION IF EXISTS find_conflicting_events(integer, integer, date, time, time);

-- Drop the modified_events table if it exists
DROP TABLE IF EXISTS modified_events;

-- Drop the deleted_events table if it exists
DROP TABLE IF EXISTS deleted_events;

-- Drop the events table if it exists
DROP TABLE IF EXISTS events;

-- Drop the event types table if it exists
DROP TABLE IF EXISTS event_types;

-- Drop the recurring patterns table if it exists
DROP TABLE IF EXISTS recurring_patterns;

-- Drop the building_amenities junction table if it exists
DROP TABLE IF EXISTS building_amenities;

-- Drop the buildings table if it exists
DROP TABLE IF EXISTS buildings;

-- Drop the amenities table if it exists
DROP TABLE IF EXISTS amenities;

-- Drop the regions table if it exists
DROP TABLE IF EXISTS regions;
