# Data Migration Guide: GCP to Supabase

Follow these steps to migrate your MedusaJS data from Google Cloud SQL to your new Supabase project.

### Step 1: Export Data from Google Cloud SQL
Run this command from your terminal (ensure you have access to your GCP instance):

```bash
pg_dump -h [YOUR_GCP_IP] -U [YOUR_GCP_USER] -d [YOUR_DB_NAME] \
  --data-only --column-inserts \
  -t product -t product_variant -t price -t image -t product_images \
  > medusa_data.sql
```

### Step 2: Prepare Supabase
1. Open your **Supabase SQL Editor**.
2. Run the first part of the mapping script to create the migration schema:
   ```sql
   CREATE SCHEMA IF NOT EXISTS medusa_migration;
   ```

### Step 3: Import Raw Data
Use the `psql` command to import the raw data into the temporary schema:

```bash
psql -h [SUPABASE_HOST] -U postgres.[PROJECT_REF] -d postgres -f medusa_data.sql
```
*Note: You may need to manually prepend `SET search_path TO medusa_migration;` to the top of your `medusa_data.sql` file.*

### Step 4: Run Mapping Script
In the Supabase SQL Editor, execute the contents of `supabase/migrations/20251226110500_data_mapping.sql`.

### Step 5: Verify
Check the `public.products` table in your Supabase dashboard to ensure all products, handles, and prices are correct.

### Step 6: Cleanup
Once verified, drop the temporary schema:
```sql
DROP SCHEMA medusa_migration CASCADE;
```




psql "postgresql://postgres:H6Yb.nXfgNa68c-@db.xhfasilbxjjxaqgxkann.supabase.co:5432/postgres" -f medusa_final.sql