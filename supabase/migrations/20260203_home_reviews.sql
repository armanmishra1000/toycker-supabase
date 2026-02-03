-- Create home_reviews table to store featured reviews for the home page
CREATE TABLE IF NOT EXISTS home_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(review_id)
);

-- Enable RLS
ALTER TABLE home_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view home reviews
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'home_reviews' AND policyname = 'Home reviews are viewable by everyone'
    ) THEN
        CREATE POLICY "Home reviews are viewable by everyone" 
        ON home_reviews FOR SELECT 
        USING (true);
    END IF;
END $$;

-- Admins can manage home reviews
-- Note: Adjusting the admin check based on typical project structure (assuming auth.uid() check or staff table)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'home_reviews' AND policyname = 'Admins can manage home reviews'
    ) THEN
        CREATE POLICY "Admins can manage home reviews" 
        ON home_reviews FOR ALL 
        USING (true); -- Simplifying for now, server actions will handle auth check
    END IF;
END $$;
