-- Simple SQL to add 3 sample jobs to your database
-- Using business_id = 1 (Test Junk Removal LLC)

-- ==============================================
-- INSERT 3 SAMPLE JOBS
-- ==============================================

-- Job 1: Residential Cleanout
INSERT INTO jobs (
    business_id, 
    customer_id, 
    estimate_id, 
    assigned_employee_id, 
    title, 
    description, 
    scheduled_date, 
    completion_date, 
    status, 
    total_cost
) VALUES (
    1,  -- business_id (Test Junk Removal LLC)
    NULL,  -- no customer yet
    NULL,  -- no estimate yet
    NULL,  -- no employee assigned yet
    'Residential Cleanout - Main Street',
    'Remove old furniture, appliances, and general household items from 3-bedroom house',
    '2024-01-15 09:00:00',
    NULL,
    'scheduled',
    350.00
);

-- Job 2: Office Cleanout
INSERT INTO jobs (
    business_id, 
    customer_id, 
    estimate_id, 
    assigned_employee_id, 
    title, 
    description, 
    scheduled_date, 
    completion_date, 
    status, 
    total_cost
) VALUES (
    1,  -- business_id (Test Junk Removal LLC)
    NULL,  -- no customer yet
    NULL,  -- no estimate yet
    NULL,  -- no employee assigned yet
    'Office Cleanout - Downtown Building',
    'Remove office furniture, computers, and equipment from closed business',
    '2024-01-18 14:00:00',
    NULL,
    'scheduled',
    750.00
);

-- Job 3: Garage Cleanout
INSERT INTO jobs (
    business_id, 
    customer_id, 
    estimate_id, 
    assigned_employee_id, 
    title, 
    description, 
    scheduled_date, 
    completion_date, 
    status, 
    total_cost
) VALUES (
    1,  -- business_id (Test Junk Removal LLC)
    NULL,  -- no customer yet
    NULL,  -- no estimate yet
    NULL,  -- no employee assigned yet
    'Garage Cleanout - Suburban Home',
    'Remove old tools, equipment, and storage items from 2-car garage',
    '2024-01-20 10:00:00',
    NULL,
    'scheduled',
    200.00
);

-- ==============================================
-- ADD JOB STATUS HISTORY
-- ==============================================

-- Status history for Job 1
INSERT INTO job_status_history (job_id, old_status, new_status, changed_by, notes, changed_at)
VALUES (1, NULL, 'scheduled', 1, 'Job created', NOW());

-- Status history for Job 2
INSERT INTO job_status_history (job_id, old_status, new_status, changed_by, notes, changed_at)
VALUES (2, NULL, 'scheduled', 1, 'Job created', NOW());

-- Status history for Job 3
INSERT INTO job_status_history (job_id, old_status, new_status, changed_by, notes, changed_at)
VALUES (3, NULL, 'scheduled', 1, 'Job created', NOW());

-- ==============================================
-- ADD SAMPLE JOB ITEMS
-- ==============================================

-- Items for Job 1
INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
VALUES 
(1, 'Sofa', 'furniture', 1, 50.00, 'medium', 30),
(1, 'Refrigerator', 'appliances', 1, 75.00, 'hard', 45),
(1, 'Dining Table', 'furniture', 1, 40.00, 'medium', 25);

-- Items for Job 2
INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
VALUES 
(2, 'Office Desk', 'furniture', 3, 60.00, 'medium', 35),
(2, 'Computer Monitors', 'electronics', 5, 25.00, 'easy', 15),
(2, 'Filing Cabinets', 'furniture', 2, 45.00, 'medium', 30);

-- Items for Job 3
INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
VALUES 
(3, 'Old Tools', 'miscellaneous', 1, 30.00, 'easy', 20),
(3, 'Storage Boxes', 'miscellaneous', 10, 5.00, 'easy', 10);

-- ==============================================
-- ADD SAMPLE JOB NOTES
-- ==============================================

-- Notes for Job 1
INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
VALUES 
(1, NULL, 'general', 'Customer requested early morning pickup', false, NOW()),
(1, NULL, 'customer_communication', 'Confirmed pickup time with customer', false, NOW());

-- Notes for Job 2
INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
VALUES 
(2, NULL, 'internal', 'Building has elevator access', true, NOW()),
(2, NULL, 'customer_communication', 'Office manager will be on-site during pickup', false, NOW());

-- Notes for Job 3
INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
VALUES 
(3, NULL, 'general', 'Garage is accessible from alley', false, NOW());
