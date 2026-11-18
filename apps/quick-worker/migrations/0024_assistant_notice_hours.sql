CREATE TABLE IF NOT EXISTS quick_agent_notice_hours (
 owner_id TEXT PRIMARY KEY NOT NULL,
 digest_hour INTEGER NOT NULL CHECK(digest_hour BETWEEN 0 AND 23),
 quiet_start INTEGER,
 quiet_end INTEGER,
 delivery_hour INTEGER GENERATED ALWAYS AS (
   CASE WHEN (quiet_start<quiet_end AND digest_hour>=quiet_start AND digest_hour<quiet_end)
      OR (quiet_start>quiet_end AND (digest_hour>=quiet_start OR digest_hour<quiet_end))
     THEN quiet_end ELSE digest_hour END
 ) STORED,
 CHECK((quiet_start IS NULL AND quiet_end IS NULL) OR
       (quiet_start IS NOT NULL AND quiet_end IS NOT NULL AND quiet_start BETWEEN 0 AND 23 AND
        quiet_end BETWEEN 0 AND 23 AND quiet_start<>quiet_end))
);
