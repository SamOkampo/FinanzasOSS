CREATE TABLE IF NOT EXISTS quick_agent_conversations (
 owner_id TEXT NOT NULL,
 id TEXT NOT NULL,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(owner_id,id)
);
CREATE INDEX IF NOT EXISTS quick_agent_conversations_latest ON quick_agent_conversations(owner_id,updated_at DESC,id);
CREATE TABLE IF NOT EXISTS quick_agent_conversation_turns (
 owner_id TEXT NOT NULL,
 conversation_id TEXT NOT NULL,
 id TEXT NOT NULL,
 question TEXT NOT NULL CHECK(length(question) BETWEEN 1 AND 200),
 answer TEXT NOT NULL CHECK(json_valid(answer)),
 created_at TEXT NOT NULL,
 PRIMARY KEY(owner_id,conversation_id,id),
 FOREIGN KEY(owner_id,conversation_id) REFERENCES quick_agent_conversations(owner_id,id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS quick_agent_conversation_turns_latest
 ON quick_agent_conversation_turns(owner_id,conversation_id,created_at DESC,id);
