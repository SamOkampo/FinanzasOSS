CREATE TABLE IF NOT EXISTS quick_agent_chat_preferences (
 owner_id TEXT NOT NULL PRIMARY KEY,
 qwen_allowed INTEGER NOT NULL CHECK(qwen_allowed IN (0,1)),
 updated_at TEXT NOT NULL
);
