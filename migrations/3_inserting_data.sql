-- Insert default patterns in recurring_patterns table
INSERT INTO recurring_patterns (pattern_name, frequency, days)
VALUES 
  ('Daily Weekdays', 'Daily', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  ('Weekly Monday', 'Weekly', ARRAY['Monday']),
  ('Weekly Wednesday', 'Weekly', ARRAY['Wednesday']),
  ('Weekly Friday', 'Weekly', ARRAY['Friday']),
  ('Bi-weekly Monday', 'Bi-weekly', ARRAY['Monday']),
  ('Monthly First Monday', 'Monthly', ARRAY['Monday']),
  ('Quarterly Planning', 'Quarterly', ARRAY['Monday', 'Tuesday'])
ON CONFLICT DO NOTHING;
