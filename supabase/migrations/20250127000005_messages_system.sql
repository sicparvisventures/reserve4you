-- ============================================================
-- BERICHTEN SYSTEEM (MESSAGING SYSTEM)
-- iMessage-achtige berichten tussen gebruikers met locatie delen
-- ============================================================

-- 1. CONVERSATIONS TABLE
-- Gesprekken tussen gebruikers
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    CONSTRAINT conversations_updated_after_created CHECK (updated_at >= created_at)
);

-- 2. CONVERSATION_PARTICIPANTS TABLE
-- Deelnemers aan gesprekken (many-to-many)
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT FALSE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, consumer_id)
);

CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_consumer ON conversation_participants(consumer_id);
CREATE INDEX idx_conversation_participants_archived ON conversation_participants(is_archived);

-- 3. MESSAGES TABLE
-- Berichten in gesprekken
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL DEFAULT 'text',
    message_content TEXT,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    location_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_edited BOOLEAN DEFAULT FALSE,
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'location', 'system')),
    CONSTRAINT messages_has_content CHECK (
        (message_type = 'text' AND message_content IS NOT NULL) OR
        (message_type = 'location' AND location_id IS NOT NULL) OR
        (message_type = 'system')
    )
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_location ON messages(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_messages_deleted ON messages(deleted_at) WHERE deleted_at IS NULL;

-- 4. MESSAGE_READS TABLE
-- Gelezen status per gebruiker per bericht
CREATE TABLE IF NOT EXISTS message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, consumer_id)
);

CREATE INDEX idx_message_reads_message ON message_reads(message_id);
CREATE INDEX idx_message_reads_consumer ON message_reads(consumer_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Update conversation timestamp when message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        updated_at = NEW.created_at,
        last_message_at = NEW.created_at,
        last_message_preview = CASE
            WHEN NEW.message_type = 'text' THEN LEFT(NEW.message_content, 100)
            WHEN NEW.message_type = 'location' THEN '📍 Locatie gedeeld'
            ELSE 'Bericht'
        END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversation_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Automatically mark own messages as read
CREATE OR REPLACE FUNCTION auto_mark_own_message_read()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO message_reads (message_id, consumer_id, read_at)
    VALUES (NEW.id, NEW.sender_id, NEW.created_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_mark_own_message_read
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_mark_own_message_read();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- CONVERSATIONS POLICIES
-- Gebruikers kunnen alleen conversations zien waar ze deel van uitmaken
CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            INNER JOIN consumers c ON c.id = cp.consumer_id
            WHERE cp.conversation_id = conversations.id
            AND c.auth_user_id = auth.uid()
        )
    );

-- Gebruikers kunnen conversations aanmaken (wordt gecontroleerd via participants)
CREATE POLICY "Authenticated users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Gebruikers kunnen hun conversations updaten
CREATE POLICY "Users can update their conversations"
    ON conversations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            INNER JOIN consumers c ON c.id = cp.consumer_id
            WHERE cp.conversation_id = conversations.id
            AND c.auth_user_id = auth.uid()
        )
    );

-- CONVERSATION_PARTICIPANTS POLICIES
-- Gebruikers kunnen hun eigen participations zien
CREATE POLICY "Users can view their participations"
    ON conversation_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM consumers c
            WHERE c.id = conversation_participants.consumer_id
            AND c.auth_user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            INNER JOIN consumers c ON c.id = cp.consumer_id
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND c.auth_user_id = auth.uid()
        )
    );

-- Gebruikers kunnen participations toevoegen
CREATE POLICY "Users can add participants to their conversations"
    ON conversation_participants FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Gebruikers kunnen hun eigen participation updaten (bijv. archiveren)
CREATE POLICY "Users can update their own participation"
    ON conversation_participants FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM consumers c
            WHERE c.id = conversation_participants.consumer_id
            AND c.auth_user_id = auth.uid()
        )
    );

-- MESSAGES POLICIES
-- Gebruikers kunnen berichten zien in hun conversations
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM conversation_participants cp
            INNER JOIN consumers c ON c.id = cp.consumer_id
            WHERE cp.conversation_id = messages.conversation_id
            AND c.auth_user_id = auth.uid()
        )
    );

-- Gebruikers kunnen berichten sturen in hun conversations
CREATE POLICY "Users can send messages in their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            INNER JOIN consumers c ON c.id = cp.consumer_id
            WHERE cp.conversation_id = conversation_id
            AND c.auth_user_id = auth.uid()
            AND c.id = sender_id
        )
    );

-- Gebruikers kunnen hun eigen berichten updaten (bewerken)
CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM consumers c
            WHERE c.id = messages.sender_id
            AND c.auth_user_id = auth.uid()
        )
    );

-- MESSAGE_READS POLICIES
-- Gebruikers kunnen reads zien in hun conversations
CREATE POLICY "Users can view reads in their conversations"
    ON message_reads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            INNER JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
            INNER JOIN consumers c ON c.id = cp.consumer_id
            WHERE m.id = message_reads.message_id
            AND c.auth_user_id = auth.uid()
        )
    );

-- Gebruikers kunnen hun eigen reads toevoegen
CREATE POLICY "Users can mark messages as read"
    ON message_reads FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM consumers c
            WHERE c.id = message_reads.consumer_id
            AND c.auth_user_id = auth.uid()
        )
    );

-- ============================================================
-- HELPER VIEWS
-- ============================================================

-- View voor conversations met ongelezen berichten count
CREATE OR REPLACE VIEW conversation_list AS
SELECT 
    c.id,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    c.last_message_preview,
    cp.consumer_id,
    cp.is_archived,
    cp.last_read_at,
    (
        SELECT COUNT(*)
        FROM messages m
        LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.consumer_id = cp.consumer_id
        WHERE m.conversation_id = c.id
        AND m.deleted_at IS NULL
        AND m.sender_id != cp.consumer_id
        AND mr.id IS NULL
    ) as unread_count,
    (
        SELECT json_agg(json_build_object(
            'consumer_id', cp2.consumer_id,
            'email', cons.email,
            'name', cons.name
        ))
        FROM conversation_participants cp2
        INNER JOIN consumers cons ON cons.id = cp2.consumer_id
        WHERE cp2.conversation_id = c.id
        AND cp2.consumer_id != cp.consumer_id
    ) as other_participants
FROM conversations c
INNER JOIN conversation_participants cp ON cp.conversation_id = c.id;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Functie om conversation te vinden of maken tussen twee gebruikers
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    user1_email TEXT,
    user2_email TEXT
)
RETURNS UUID AS $$
DECLARE
    v_consumer1_id UUID;
    v_consumer2_id UUID;
    v_conversation_id UUID;
BEGIN
    -- Get consumer IDs
    SELECT id INTO v_consumer1_id FROM consumers WHERE email = user1_email;
    SELECT id INTO v_consumer2_id FROM consumers WHERE email = user2_email;
    
    IF v_consumer1_id IS NULL OR v_consumer2_id IS NULL THEN
        RAISE EXCEPTION 'One or both users not found';
    END IF;
    
    -- Check if conversation exists
    SELECT DISTINCT c.id INTO v_conversation_id
    FROM conversations c
    INNER JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
    INNER JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
    WHERE cp1.consumer_id = v_consumer1_id
    AND cp2.consumer_id = v_consumer2_id;
    
    -- Create if doesn't exist
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations DEFAULT VALUES
        RETURNING id INTO v_conversation_id;
        
        INSERT INTO conversation_participants (conversation_id, consumer_id)
        VALUES 
            (v_conversation_id, v_consumer1_id),
            (v_conversation_id, v_consumer2_id);
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- INDEXES VOOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC NULLS LAST);

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_reads TO authenticated;
GRANT SELECT ON conversation_list TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation TO authenticated;

-- ============================================================
-- COMMENTS VOOR DOCUMENTATIE
-- ============================================================

COMMENT ON TABLE conversations IS 'Gesprekken tussen gebruikers voor het berichtensysteem';
COMMENT ON TABLE conversation_participants IS 'Deelnemers aan gesprekken (many-to-many relationship)';
COMMENT ON TABLE messages IS 'Berichten binnen gesprekken (tekst, locaties, system berichten)';
COMMENT ON TABLE message_reads IS 'Gelezen status van berichten per gebruiker';
COMMENT ON VIEW conversation_list IS 'View voor lijst van conversations met metadata en ongelezen count';
COMMENT ON FUNCTION get_or_create_conversation IS 'Helper functie om conversation te vinden of aan te maken tussen twee gebruikers';

-- ============================================================
-- EINDE BERICHTEN SYSTEEM MIGRATIE
-- ============================================================

