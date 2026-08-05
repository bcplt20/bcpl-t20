-- Scalability: hot-path indexes (safe to rerun)
CREATE INDEX IF NOT EXISTS deliveries_innings_id_idx ON deliveries (innings_id);
CREATE INDEX IF NOT EXISTS innings_match_id_idx ON innings (match_id);
CREATE INDEX IF NOT EXISTS otp_sessions_phone_idx ON otp_sessions (phone, purpose);
