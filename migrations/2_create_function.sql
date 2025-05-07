
-- Drop the existing function first
DROP FUNCTION IF EXISTS find_conflicting_events(integer, integer, date, time, time);

-- Create the updated version of the function with better conflict detection
CREATE OR REPLACE FUNCTION find_conflicting_events(
  b_id integer,
  a_id integer,
  target_date date,
  s_time time,
  e_time time
)
RETURNS TABLE (
  event_id               integer,
  building_id            integer,
  amenity_id             integer,
  event_type_id          integer,
  event_title            text,
  start_time             timestamp,
  end_time               timestamp,
  one_time_date          date,
  is_recurring           boolean,
  recurring_start_date   date,
  recurring_end_date     date,
  recurring_pattern_id   integer,
  notes                  text,
  cost                   integer
)
LANGUAGE sql
SET search_path = pg_temp, public
AS $$
SELECT
  e.event_id,
  COALESCE(m.building_id, e.building_id)        AS building_id,
  COALESCE(m.amenity_id, e.amenity_id)          AS amenity_id,
  COALESCE(m.event_type_id, e.event_type_id)    AS event_type_id,
  COALESCE(m.event_title, e.event_title)        AS event_title,
  COALESCE(m.start_time, e.start_time)          AS start_time,
  COALESCE(m.end_time, e.end_time)              AS end_time,
  COALESCE(m.modified_date, e.one_time_date)    AS one_time_date,
  e.is_recurring,
  e.recurring_start_date,
  e.recurring_end_date,
  e.recurring_pattern_id,
  COALESCE(m.notes, e.notes)                    AS notes,
  COALESCE(m.cost, e.cost)                      AS cost
FROM events e
LEFT JOIN modified_events m
  ON m.event_id = e.event_id
  AND m.modified_date = target_date
LEFT JOIN deleted_events d
  ON d.event_id = e.event_id
  AND d.excluded_date = target_date
WHERE 
  d.event_id IS NULL
  AND (
    COALESCE(m.building_id, e.building_id) = b_id
    AND COALESCE(m.amenity_id, e.amenity_id) = a_id
  )
  AND (
    COALESCE(m.modified_date, e.one_time_date) = target_date
    OR (
      e.recurring_start_date <= target_date
      AND e.recurring_end_date >= target_date
      -- Add check for recurring pattern match based on day of week
      AND (
        -- For recurring events, ensure the day of week matches
        -- This assumes weekly or similar patterns are handled by recurring_pattern_id
        e.is_recurring = true
      )
    )
  )
  AND (
    -- Better time conflict detection: 
    -- Event starts before new event ends AND event ends after new event starts
    COALESCE(m.start_time, e.start_time)::time < e_time
    AND COALESCE(m.end_time, e.end_time)::time > s_time
  );
$$;

-- ==============================================================================================================================

-- Keep existing find_events_by_building function
DROP FUNCTION IF EXISTS find_events_by_building(integer, date);

-- Create the updated version of the function
CREATE OR REPLACE FUNCTION find_events_by_building(
  b_id        integer,
  target_date date
)
RETURNS TABLE (
  event_id               integer,
  building_id            integer,
  amenity_id             integer,
  event_type_id          integer,
  event_title            text,
  start_time             timestamp,
  end_time               timestamp,
  one_time_date          date,
  is_recurring           boolean,
  recurring_start_date   date,
  recurring_end_date     date,
  recurring_pattern_id   integer,
  notes                  text,
  cost                   integer
)
LANGUAGE sql
SET search_path = pg_temp, public
AS $$
SELECT
  e.event_id,
  COALESCE(m.building_id, e.building_id)        AS building_id,
  COALESCE(m.amenity_id, e.amenity_id)          AS amenity_id,
  COALESCE(m.event_type_id, e.event_type_id)    AS event_type_id,
  COALESCE(m.event_title, e.event_title)        AS event_title,
  COALESCE(m.start_time, e.start_time)          AS start_time,
  COALESCE(m.end_time, e.end_time)              AS end_time,
  COALESCE(m.modified_date, e.one_time_date)    AS one_time_date,
  e.is_recurring,
  e.recurring_start_date,
  e.recurring_end_date,
  e.recurring_pattern_id,
  COALESCE(m.notes, e.notes)                    AS notes,
  COALESCE(m.cost, e.cost)                      AS cost
FROM events e
LEFT JOIN modified_events m
  ON m.event_id = e.event_id
  AND m.modified_date = target_date
LEFT JOIN deleted_events d
  ON d.event_id = e.event_id
  AND d.excluded_date = target_date
WHERE 
  d.event_id IS NULL -- exclude deleted
  AND (
    -- either the base event or the modified one must match the building
    e.building_id = b_id OR m.building_id = b_id
  )
  AND (
    -- match by one-time date (original or modified)
    COALESCE(m.modified_date, e.one_time_date) = target_date
    OR (
      e.recurring_start_date <= target_date
      AND e.recurring_end_date >= target_date
    )
  );
$$;
