-- Migration to run all the SQL migrations in the correct order

-- First, update the study_groups table
\i update_study_groups_table.sql

-- Then create the stored procedures
\i check_study_group_membership.sql
\i leave_study_group.sql
\i get_group_chat_messages.sql
\i send_group_chat_message.sql
