-- Check if the trigger is properly installed and active
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'inventory_transfer_trigger';

-- Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_inventory_transfer';

-- Check recent trigger executions by looking for NOTICE messages in logs
-- (This would need to be run in a session where client_min_messages is set to NOTICE)
