CREATE TABLE chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id   uuid NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        text NOT NULL,
  content     text,
  tool_calls  jsonb,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_chat_messages_matter ON chat_messages(matter_id, created_at);
