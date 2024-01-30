-- ==================================================================
-- Final operation code and nextDestination => remove nextDestination
-- ==================================================================

-- EXPLAIN: actual time=145.152..3056.319, rows=2251, loops=1
update "default$default"."Form" 
set "nextDestinationCompanyName" = '', "nextDestinationCompanySiret" = '', "nextDestinationCompanyAddress" = '', "nextDestinationCompanyContact" = '', "nextDestinationCompanyPhone" = '', "nextDestinationCompanyMail" = '', "nextDestinationCompanyCountry" = '', "nextDestinationCompanyVatNumber" = '', "nextDestinationNotificationNumber" = '', "nextDestinationProcessingOperation" = ''
where "processingOperationDone" in ('R 0', 'R 1', 'R 2', 'R 3', 'R 4', 'R 5', 'R 6', 'R 7', 'R 8', 'R 9', 'R 10', 'R 11', 'D 1', 'D 2', 'D 3', 'D 4', 'D 5', 'D 6', 'D 7', 'D 8', 'D 9 F', 'D 10', 'D 12')
and coalesce(TRIM("nextDestinationCompanySiret"), '') != '';

-- ========================================================================
-- Final operation code and noTraceability = true => noTraceability = false
-- ========================================================================

-- EXPLAIN: actual time=131.700..2859.004, rows=207, loops=1
update "default$default"."Form" 
set "noTraceability" = false
where "processingOperationDone" in ('R 0', 'R 1', 'R 2', 'R 3', 'R 4', 'R 5', 'R 6', 'R 7', 'R 8', 'R 9', 'R 10', 'R 11', 'D 1', 'D 2', 'D 3', 'D 4', 'D 5', 'D 6', 'D 7', 'D 8', 'D 9 F', 'D 10', 'D 12')
and "noTraceability" is true;

-- =======================================================================
-- Final operation code and status = NO_TRACEABILITY => status = PROCESSED
-- =======================================================================

-- EXPLAIN: actual time=2685.227..2736.477, rows=206, loops=1
update "default$default"."Form" 
set "status" = 'PROCESSED'
where "processingOperationDone" in ('R 0', 'R 1', 'R 2', 'R 3', 'R 4', 'R 5', 'R 6', 'R 7', 'R 8', 'R 9', 'R 10', 'R 11', 'D 1', 'D 2', 'D 3', 'D 4', 'D 5', 'D 6', 'D 7', 'D 8', 'D 9 F', 'D 10', 'D 12')
and "status" = 'NO_TRACEABILITY';