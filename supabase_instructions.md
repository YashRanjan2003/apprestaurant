# Running the Feedback Tables SQL in Supabase

Follow these steps to create the necessary database tables for the feedback system:

1. **Log in to your Supabase dashboard** at https://app.supabase.com/
2. **Select your project** from the dashboard
3. **Go to the SQL Editor** tab in the left sidebar
4. **Create a new query** by clicking the "New Query" button
5. **Copy and paste** the entire contents of the `feedback_tables.sql` file into the SQL editor
6. **Execute the query** by clicking the "Run" button

This will:
- Create the UUID extension if not already present
- Create the core tables (orders, order_items, menu_items) if they don't exist
- Create the feedback tables (order_feedback, item_feedback)
- Set up the necessary Row Level Security policies

Once complete, you should see the two new feedback tables in your table editor.

## Troubleshooting

If you encounter errors:

1. **Look for detailed error messages** in the output panel
2. For errors mentioning foreign key constraints, check that the referenced tables and columns exist
3. For permission errors, make sure your Supabase user has admin privileges
4. If specific rows of the SQL script cause errors, you may need to run the script in segments 