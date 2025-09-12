const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementVisibility
} = require('../controllers/announcementController');
const {
  validateCreateAnnouncement,
  validateUpdateAnnouncement,
  validateAnnouncementId
} = require('../middleware/announcementValidation');

// Get all announcements
// GET /api/v1/announcements
// Query params: visible_only (boolean) - if true, only returns visible announcements
router.get('/', getAnnouncements);

// Get announcement by ID
// GET /api/v1/announcements/:id
router.get('/:id', validateAnnouncementId, getAnnouncement);

// Create new announcement
// POST /api/v1/announcements
router.post('/', validateCreateAnnouncement, createAnnouncement);

// Update announcement
// PUT /api/v1/announcements/:id
router.put('/:id', validateAnnouncementId, validateUpdateAnnouncement, updateAnnouncement);

// Delete announcement
// DELETE /api/v1/announcements/:id
router.delete('/:id', validateAnnouncementId, deleteAnnouncement);

// Toggle announcement visibility
// PATCH /api/v1/announcements/:id/toggle-visibility
router.patch('/:id/toggle-visibility', validateAnnouncementId, toggleAnnouncementVisibility);

module.exports = router;
