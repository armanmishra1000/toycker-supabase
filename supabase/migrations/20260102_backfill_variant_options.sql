-- Backfill existing variant options from product_variants table
-- This migration reads existing variant titles like "Color: white" or "Size: M / Color: red"
-- and creates proper product_options and product_option_values entries

DO $$
DECLARE
    variant_record RECORD;
    option_title TEXT;
    option_value TEXT;
    option_id UUID;
    value_id UUID;
    v_product_id TEXT;
    parts TEXT[];
BEGIN
    -- Iterate through all variants that have options in their title but no corresponding product_options
    FOR variant_record IN
        SELECT pv.id, pv.product_id, pv.title, pv.options
        FROM product_variants pv
        WHERE pv.title LIKE '%:%'
          AND pv.title NOT LIKE '% / %'  -- Skip complex multi-option variants for now
          AND NOT EXISTS (
              SELECT 1 FROM product_options po
              WHERE po.product_id = pv.product_id
          )
    LOOP
        v_product_id := variant_record.product_id;

        -- Parse title like "Color: white" to extract option type and value
        parts := regexp_split_to_array(variant_record.title, ':');
        IF array_length(parts, 1) >= 2 THEN
            option_title := trim(parts[1]);
            option_value := trim(parts[2]);

            -- Check if this option already exists for this product
            SELECT id INTO option_id
            FROM product_options
            WHERE product_id = v_product_id
              AND lower(title) = lower(option_title)
            LIMIT 1;

            -- If not, create the option
            IF option_id IS NULL THEN
                INSERT INTO product_options (title, product_id)
                VALUES (option_title, v_product_id)
                RETURNING id INTO option_id;
            END IF;

            -- Check if this value already exists
            SELECT id INTO value_id
            FROM product_option_values
            WHERE option_id = option_id
              AND lower(value) = lower(option_value)
            LIMIT 1;

            -- If not, create the value
            IF value_id IS NULL THEN
                INSERT INTO product_option_values (option_id, value, variant_id)
                VALUES (option_id, option_value, variant_record.id)
                RETURNING id INTO value_id;
            ELSE
                -- Update the variant_id if the value exists but wasn't linked
                UPDATE product_option_values
                SET variant_id = variant_record.id
                WHERE id = value_id;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Add comment for documentation
COMMENT ON TABLE product_options IS 'Stores product options like Color, Size, etc.';
COMMENT ON TABLE product_option_values IS 'Stores values for product options and links to variants';
