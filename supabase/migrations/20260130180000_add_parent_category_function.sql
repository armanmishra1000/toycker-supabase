-- Create computed relationship function for parent_category
-- This enables PostgREST to properly embed the parent category in recursive self-joins
-- See: https://docs.postgrest.org/en/stable/references/api/resource_embedding.html#recursive-relationships

CREATE OR REPLACE FUNCTION parent_category(categories) 
RETURNS SETOF categories 
ROWS 1 
AS $$
  SELECT * FROM categories WHERE id = $1.parent_category_id
$$ 
STABLE LANGUAGE SQL;
