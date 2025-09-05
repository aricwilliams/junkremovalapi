-- Sample SQL to add 3 jobs to the MySQL database
-- First, let's check what business_id exists in your database

-- Check existing businesses
SELECT id, business_name, owner_email FROM businesses LIMIT 5;

-- Check existing customers (we'll need customer_id for jobs)
SELECT id, name, email FROM customers LIMIT 5;

-- Check existing employees (we'll need employee_id for jobs)
SELECT id, first_name, last_name, email FROM employees LIMIT 5;

-- Check existing estimates (we'll need estimate_id for jobs)
SELECT id, title, amount, status FROM estimates LIMIT 5;

-- ==============================================
-- INSERT SAMPLE JOBS
-- ==============================================
-- Note: Replace the business_id, customer_id, employee_id, and estimate_id 
-- with actual IDs from your database

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
    1,  -- Replace with actual business_id
    1,  -- Replace with actual customer_id (or NULL if no customer)
    1,  -- Replace with actual estimate_id (or NULL if no estimate)
    1,  -- Replace with actual employee_id (or NULL if no employee assigned)
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
    1,  -- Replace with actual business_id
    2,  -- Replace with actual customer_id (or NULL if no customer)
    2,  -- Replace with actual estimate_id (or NULL if no estimate)
    2,  -- Replace with actual employee_id (or NULL if no employee assigned)
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
    1,  -- Replace with actual business_id
    3,  -- Replace with actual customer_id (or NULL if no customer)
    NULL,  -- No estimate for this job
    1,  -- Replace with actual employee_id (or NULL if no employee assigned)
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
-- Add initial status history for each job

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
(1, 1, 'general', 'Customer requested early morning pickup', false, NOW()),
(1, 1, 'customer_communication', 'Confirmed pickup time with customer', false, NOW());

-- Notes for Job 2
INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
VALUES 
(2, 1, 'internal', 'Building has elevator access', true, NOW()),
(2, 1, 'customer_communication', 'Office manager will be on-site during pickup', false, NOW());

-- Notes for Job 3
INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
VALUES 
(3, 1, 'general', 'Garage is accessible from alley', false, NOW());

-- ==============================================
-- VERIFY THE DATA
-- ==============================================

-- Check the inserted jobs
SELECT 
    j.id,
    j.title,
    j.status,
    j.scheduled_date,
    j.total_cost,
    c.name as customer_name,
    e.first_name as employee_first_name,
    e.last_name as employee_last_name
FROM jobs j
LEFT JOIN customers c ON j.customer_id = c.id
LEFT JOIN employees e ON j.assigned_employee_id = e.id
ORDER BY j.id;

-- Check job items
SELECT 
    ji.job_id,
    j.title as job_title,
    ji.name as item_name,
    ji.category,
    ji.quantity,
    ji.base_price
FROM job_items ji
JOIN jobs j ON ji.job_id = j.id
ORDER BY ji.job_id, ji.id;

-- Check job notes
SELECT 
    jn.job_id,
    j.title as job_title,
    jn.note_type,
    jn.content,
    jn.is_important
FROM job_notes jn
JOIN jobs j ON jn.job_id = j.id
ORDER BY jn.job_id, jn.id;
