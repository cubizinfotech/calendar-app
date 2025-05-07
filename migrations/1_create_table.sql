-- Step 1: Create regions table
CREATE TABLE IF NOT EXISTS regions (
    region_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    region_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
    building_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    building_name TEXT NOT NULL UNIQUE,
    region_id INTEGER NOT NULL REFERENCES regions(region_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create amenities table
CREATE TABLE IF NOT EXISTS amenities (
    amenity_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    amenity_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create building_amenities table
CREATE TABLE IF NOT EXISTS building_amenities (
    building_id INTEGER NOT NULL REFERENCES buildings(building_id) ON DELETE CASCADE,
    amenity_id INTEGER NOT NULL REFERENCES amenities(amenity_id) ON DELETE CASCADE,
    floor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (building_id, amenity_id) -- Composite primary key
);

-- Step 5: Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
    event_type_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type_name TEXT NOT NULL UNIQUE,
    color_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create recurring_patterns table
CREATE TABLE IF NOT EXISTS recurring_patterns (
  pattern_id SERIAL PRIMARY KEY,
  pattern_name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  days TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create events table
CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(building_id) ON DELETE CASCADE,
    amenity_id INTEGER NOT NULL REFERENCES amenities(amenity_id) ON DELETE CASCADE,
    event_title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    event_type_id INTEGER NOT NULL REFERENCES event_types(event_type_id) ON DELETE CASCADE,
    one_time_date DATE DEFAULT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern_id INTEGER REFERENCES recurring_patterns(pattern_id) ON DELETE CASCADE,
    recurring_start_date DATE DEFAULT NULL,
    recurring_end_date DATE DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    cost NUMERIC DEFAULT NULL,
    attachment_url TEXT DEFAULT NULL,
    contact_phone TEXT DEFAULT NULL,
    contact_email TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create deleted_events table
CREATE TABLE IF NOT EXISTS deleted_events (
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    excluded_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (event_id, excluded_date) -- Composite primary key
);

-- Step 9: Create modified_events table
CREATE TABLE IF NOT EXISTS modified_events (
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    modified_date DATE NOT NULL,
    building_id INTEGER NOT NULL REFERENCES buildings(building_id) ON DELETE CASCADE,
    amenity_id INTEGER NOT NULL REFERENCES amenities(amenity_id) ON DELETE CASCADE,
    event_title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    event_type_id INTEGER NOT NULL REFERENCES event_types(event_type_id) ON DELETE CASCADE,
    notes TEXT DEFAULT NULL,
    cost NUMERIC DEFAULT NULL,
    contact_phone TEXT DEFAULT NULL,
    contact_email TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (event_id, modified_date) -- Composite primary key
);

-- Enable RLS (already done in your script, repeated for completeness)
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE modified_events ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations
CREATE POLICY allow_all ON regions FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON buildings FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON amenities FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON building_amenities FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON event_types FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON recurring_patterns FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON events FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON deleted_events FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON modified_events FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
