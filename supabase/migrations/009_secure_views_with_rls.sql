-- Apply the underlying tables' row-level security policies when views are queried.
ALTER VIEW vw_active_loans_summary SET (security_invoker = true);
ALTER VIEW vw_equipment_inventory_status SET (security_invoker = true);
