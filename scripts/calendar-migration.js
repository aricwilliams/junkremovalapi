const { query } = require('../config/database');

const createCalendarTables = async () => {
  try {
    console.log('🚀 Starting calendar database migration...');

    // 1. Create calendar_events table
    console.log('📅 Creating calendar_events table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        event_type ENUM('job', 'meeting', 'maintenance', 'training', 'other') DEFAULT 'job',
        start_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_date DATE NULL,
        end_time TIME NULL,
        is_all_day BOOLEAN DEFAULT FALSE,
        status ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        location VARCHAR(500) NULL,
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        recurring_pattern ENUM('none', 'daily', 'weekly', 'monthly', 'yearly') DEFAULT 'none',
        recurring_end_date DATE NULL,
        created_by VARCHAR(36) NULL,
        assigned_to VARCHAR(36) NULL,
        related_job_id VARCHAR(36) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_start_date (start_date),
        INDEX idx_event_type (event_type),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_related_job_id (related_job_id),
        INDEX idx_recurring_pattern (recurring_pattern),
        INDEX idx_date_range (start_date, end_date)
      )
    `);

    // 2. Create calendar_recurring_patterns table
    console.log('🔄 Creating calendar_recurring_patterns table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_recurring_patterns (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        pattern_type ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
        interval_value INT NOT NULL DEFAULT 1,
        weekdays JSON NULL,
        month_day INT NULL,
        month_week INT NULL,
        month_weekday INT NULL,
        year_month INT NULL,
        year_day INT NULL,
        end_after_occurrences INT NULL,
        end_date DATE NULL,
        exceptions JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id),
        INDEX idx_pattern_type (pattern_type)
      )
    `);

    // 3. Create calendar_attendees table
    console.log('👥 Creating calendar_attendees table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_attendees (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        attendee_type ENUM('employee', 'customer', 'vendor', 'other') NOT NULL,
        attendee_id VARCHAR(36) NOT NULL,
        attendee_name VARCHAR(255) NOT NULL,
        attendee_email VARCHAR(255) NULL,
        attendee_phone VARCHAR(20) NULL,
        response_status ENUM('pending', 'accepted', 'declined', 'tentative') DEFAULT 'pending',
        response_date TIMESTAMP NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
        UNIQUE KEY unique_event_attendee (event_id, attendee_id),
        INDEX idx_event_id (event_id),
        INDEX idx_attendee_type (attendee_type),
        INDEX idx_response_status (response_status)
      )
    `);

    // 4. Create calendar_reminders table
    console.log('🔔 Creating calendar_reminders table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_reminders (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        reminder_type ENUM('email', 'sms', 'push', 'popup') NOT NULL,
        reminder_time TIMESTAMP NOT NULL,
        reminder_offset INT NOT NULL,
        message TEXT NULL,
        is_sent BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP NULL,
        recipient_id VARCHAR(36) NULL,
        recipient_type ENUM('employee', 'customer', 'all') DEFAULT 'all',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id),
        INDEX idx_reminder_time (reminder_time),
        INDEX idx_is_sent (is_sent),
        INDEX idx_recipient_id (recipient_id)
      )
    `);

    // 5. Create calendar_categories table
    console.log('🏷️ Creating calendar_categories table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
        icon VARCHAR(50) NULL,
        description TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_category_name (name),
        INDEX idx_is_active (is_active),
        INDEX idx_sort_order (sort_order)
      )
    `);

    // 6. Create calendar_event_categories table
    console.log('🔗 Creating calendar_event_categories table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_event_categories (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        category_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES calendar_categories(id) ON DELETE CASCADE,
        UNIQUE KEY unique_event_category (event_id, category_id),
        INDEX idx_event_id (event_id),
        INDEX idx_category_id (category_id)
      )
    `);

    // 7. Create calendar_availability table
    console.log('⏰ Creating calendar_availability table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_availability (
        id VARCHAR(36) PRIMARY KEY,
        resource_type ENUM('employee', 'crew', 'truck') NOT NULL,
        resource_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        reason VARCHAR(255) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_resource_time (resource_type, resource_id, date, start_time),
        INDEX idx_resource_type (resource_type),
        INDEX idx_resource_id (resource_id),
        INDEX idx_date (date),
        INDEX idx_is_available (is_available)
      )
    `);

    // 8. Create calendar_working_hours table
    console.log('🕐 Creating calendar_working_hours table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_working_hours (
        id VARCHAR(36) PRIMARY KEY,
        resource_type ENUM('employee', 'crew', 'company') NOT NULL,
        resource_id VARCHAR(36) NULL,
        day_of_week TINYINT NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        break_start TIME NULL,
        break_end TIME NULL,
        is_working_day BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_resource_day (resource_type, resource_id, day_of_week),
        INDEX idx_resource_type (resource_type),
        INDEX idx_resource_id (resource_id),
        INDEX idx_day_of_week (day_of_week)
      )
    `);

    // 9. Create calendar_holidays table
    console.log('🎉 Creating calendar_holidays table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_holidays (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurring_year INT NULL,
        description TEXT NULL,
        is_paid_holiday BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_holiday_date (date),
        INDEX idx_date (date),
        INDEX idx_is_recurring (is_recurring)
      )
    `);

    // 10. Create calendar_views table
    console.log('👁️ Creating calendar_views table...');
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_views (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        view_name VARCHAR(100) NOT NULL,
        view_type ENUM('day', 'week', 'month', 'year', 'agenda') DEFAULT 'month',
        default_view BOOLEAN DEFAULT FALSE,
        filters JSON NULL,
        display_settings JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_view_type (view_type)
      )
    `);

    console.log('✅ Calendar database migration completed successfully!');

    // Insert sample data
    await insertSampleData();

  } catch (error) {
    console.error('❌ Error during calendar migration:', error);
    throw error;
  }
};

const insertSampleData = async () => {
  try {
    console.log('📝 Inserting sample calendar data...');

    // Insert sample categories
    const categories = [
      { name: 'Jobs', color: '#3B82F6', icon: 'briefcase', description: 'Junk removal jobs and appointments', sort_order: 1 },
      { name: 'Meetings', color: '#10B981', icon: 'users', description: 'Team meetings and client consultations', sort_order: 2 },
      { name: 'Maintenance', color: '#F59E0B', icon: 'wrench', description: 'Vehicle and equipment maintenance', sort_order: 3 },
      { name: 'Training', color: '#8B5CF6', icon: 'graduation-cap', description: 'Employee training sessions', sort_order: 4 },
      { name: 'Holidays', color: '#EF4444', icon: 'calendar', description: 'Company holidays and time off', sort_order: 5 }
    ];

    for (const category of categories) {
      await query(`
        INSERT IGNORE INTO calendar_categories (id, name, color, icon, description, sort_order)
        VALUES (UUID(), ?, ?, ?, ?, ?)
      `, [category.name, category.color, category.icon, category.description, category.sort_order]);
    }

    // Insert sample working hours
    const workingDays = [
      { day: 1, start: '08:00:00', end: '17:00:00' }, // Monday
      { day: 2, start: '08:00:00', end: '17:00:00' }, // Tuesday
      { day: 3, start: '08:00:00', end: '17:00:00' }, // Wednesday
      { day: 4, start: '08:00:00', end: '17:00:00' }, // Thursday
      { day: 5, start: '08:00:00', end: '17:00:00' }, // Friday
      { day: 6, start: '09:00:00', end: '15:00:00' }, // Saturday
      { day: 0, start: '00:00:00', end: '00:00:00' }  // Sunday
    ];

    for (const day of workingDays) {
      const isWorkingDay = day.day !== 0; // Sunday is not a working day
      await query(`
        INSERT IGNORE INTO calendar_working_hours (id, resource_type, day_of_week, start_time, end_time, is_working_day)
        VALUES (UUID(), 'company', ?, ?, ?, ?)
      `, [day.day, day.start, day.end, isWorkingDay]);
    }

    // Insert sample holidays
    const holidays = [
      { name: 'New Year\'s Day', date: '2024-01-01', is_recurring: true },
      { name: 'Memorial Day', date: '2024-05-27', is_recurring: true },
      { name: 'Independence Day', date: '2024-07-04', is_recurring: true },
      { name: 'Labor Day', date: '2024-09-02', is_recurring: true },
      { name: 'Thanksgiving', date: '2024-11-28', is_recurring: true },
      { name: 'Christmas Day', date: '2024-12-25', is_recurring: true }
    ];

    for (const holiday of holidays) {
      await query(`
        INSERT IGNORE INTO calendar_holidays (id, name, date, is_recurring)
        VALUES (UUID(), ?, ?, ?)
      `, [holiday.name, holiday.date, holiday.is_recurring]);
    }

    console.log('✅ Sample calendar data inserted successfully!');

  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  createCalendarTables()
    .then(() => {
      console.log('🎉 Calendar migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Calendar migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createCalendarTables };
