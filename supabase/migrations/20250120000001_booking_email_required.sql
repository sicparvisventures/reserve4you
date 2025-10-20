-- Make email required in bookings table (guest_email OR customer_email)
-- Created: 2025-01-20
--
-- This migration makes email mandatory for all bookings
-- Phone becomes optional instead
-- Supports both guest_* and customer_* column naming

DO $$
DECLARE
  use_guest_columns BOOLEAN;
  email_col TEXT;
  name_col TEXT;
  phone_col TEXT;
BEGIN
  -- Detect which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'guest_email'
  ) INTO use_guest_columns;
  
  IF use_guest_columns THEN
    email_col := 'guest_email';
    name_col := 'guest_name';
    phone_col := 'guest_phone';
  ELSE
    email_col := 'customer_email';
    name_col := 'customer_name';
    phone_col := 'customer_phone';
  END IF;
  
  -- Fix NULL email values
  EXECUTE format('
    UPDATE bookings
    SET %I = CASE
      WHEN %I IS NOT NULL AND %I != '''' THEN
        REPLACE(%I, ''+'', '''') || ''@gast.reserve4you.be''
      WHEN %I IS NOT NULL AND %I != '''' THEN
        LOWER(REPLACE(REPLACE(%I, '' '', ''.''), '''''''', '''')) || ''@gast.reserve4you.be''
      ELSE
        ''gast.'' || SUBSTRING(id::text, 1, 8) || ''@gast.reserve4you.be''
    END
    WHERE %I IS NULL OR %I = ''''
  ', 
    email_col,
    phone_col, phone_col, phone_col,
    name_col, name_col, name_col,
    email_col, email_col
  );
  
  -- Add NOT NULL constraint
  EXECUTE format('ALTER TABLE bookings ALTER COLUMN %I SET NOT NULL', email_col);
  
  -- Add email validation
  EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_%I_valid', email_col);
  EXECUTE format('
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_%I_valid 
    CHECK (%I ~* ''^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'')
  ', email_col, email_col);
  
  -- Create index
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_bookings_%I ON bookings(%I)', email_col, email_col);
  
  -- Make phone optional
  BEGIN
    EXECUTE format('ALTER TABLE bookings ALTER COLUMN %I DROP NOT NULL', phone_col);
  EXCEPTION WHEN OTHERS THEN
    -- Already nullable, that's fine
  END;
  
  RAISE NOTICE 'Successfully updated % column to NOT NULL', email_col;
  RAISE NOTICE '% is now optional', phone_col;
END $$;

