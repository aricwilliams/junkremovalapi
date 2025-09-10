const CallForwarding = require('../models/CallForwarding');
const UserPhoneNumber = require('../models/UserPhoneNumber');

// Create call forwarding rule
exports.createForwarding = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      phone_number_id, 
      forward_to_number, 
      forwarding_type = 'always', 
      ring_timeout = 20 
    } = req.body;

    // Validate required fields
    if (!phone_number_id || !forward_to_number) {
      return res.status(400).json({ 
        error: 'phone_number_id and forward_to_number are required' 
      });
    }

    // Verify phone number belongs to user
    const phoneNumber = await UserPhoneNumber.findById(phone_number_id);
    if (!phoneNumber) {
      return res.status(404).json({ error: 'Phone number not found' });
    }

    if (phoneNumber.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate forwarding type
    const validTypes = ['always', 'busy', 'no_answer', 'unavailable'];
    if (!validTypes.includes(forwarding_type)) {
      return res.status(400).json({ 
        error: 'Invalid forwarding_type. Must be one of: ' + validTypes.join(', ') 
      });
    }

    // Validate ring timeout
    if (ring_timeout < 5 || ring_timeout > 60) {
      return res.status(400).json({ 
        error: 'ring_timeout must be between 5 and 60 seconds' 
      });
    }

    // If creating an 'always' forwarding rule, deactivate other rules for this number
    if (forwarding_type === 'always') {
      await CallForwarding.deactivateAllForNumber(phone_number_id);
    }

    const forwardingId = await CallForwarding.create({
      user_id: userId,
      phone_number_id: phone_number_id,
      forward_to_number: forward_to_number,
      forwarding_type: forwarding_type,
      ring_timeout: ring_timeout
    });

    const newForwarding = await CallForwarding.findById(forwardingId);

    res.status(201).json({
      success: true,
      message: 'Call forwarding rule created successfully',
      data: newForwarding.toJSON()
    });

  } catch (err) {
    console.error('Error creating call forwarding:', err);
    next(err);
  }
};

// Get user's call forwarding rules
exports.getForwardingRules = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const forwardingRules = await CallForwarding.findByUserId(userId);
    const stats = await CallForwarding.getForwardingStats(userId);

    res.json({
      success: true,
      data: forwardingRules.map(rule => rule.toJSON()),
      stats: stats
    });

  } catch (err) {
    console.error('Error fetching call forwarding rules:', err);
    next(err);
  }
};

// Get forwarding rules for a specific phone number
exports.getForwardingByPhoneNumber = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { phoneNumberId } = req.params;

    // Verify phone number belongs to user
    const phoneNumber = await UserPhoneNumber.findById(phoneNumberId);
    if (!phoneNumber) {
      return res.status(404).json({ error: 'Phone number not found' });
    }

    if (phoneNumber.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const forwardingRules = await CallForwarding.findByPhoneNumberId(phoneNumberId);

    res.json({
      success: true,
      data: forwardingRules.map(rule => rule.toJSON())
    });

  } catch (err) {
    console.error('Error fetching forwarding rules for phone number:', err);
    next(err);
  }
};

// Update call forwarding rule
exports.updateForwarding = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { 
      forward_to_number, 
      forwarding_type, 
      ring_timeout, 
      is_active 
    } = req.body;

    const forwarding = await CallForwarding.findById(id);
    if (!forwarding) {
      return res.status(404).json({ error: 'Call forwarding rule not found' });
    }

    // Verify phone number belongs to user
    const phoneNumber = await UserPhoneNumber.findById(forwarding.phone_number_id);
    if (!phoneNumber || phoneNumber.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {};
    if (forward_to_number !== undefined) updateData.forward_to_number = forward_to_number;
    if (forwarding_type !== undefined) {
      const validTypes = ['always', 'busy', 'no_answer', 'unavailable'];
      if (!validTypes.includes(forwarding_type)) {
        return res.status(400).json({ 
          error: 'Invalid forwarding_type. Must be one of: ' + validTypes.join(', ') 
        });
      }
      updateData.forwarding_type = forwarding_type;
    }
    if (ring_timeout !== undefined) {
      if (ring_timeout < 5 || ring_timeout > 60) {
        return res.status(400).json({ 
          error: 'ring_timeout must be between 5 and 60 seconds' 
        });
      }
      updateData.ring_timeout = ring_timeout;
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    const updated = await CallForwarding.update(id, updateData);
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update call forwarding rule' });
    }

    const updatedForwarding = await CallForwarding.findById(id);

    res.json({
      success: true,
      message: 'Call forwarding rule updated successfully',
      data: updatedForwarding.toJSON()
    });

  } catch (err) {
    console.error('Error updating call forwarding:', err);
    next(err);
  }
};

// Toggle call forwarding rule active status
exports.toggleForwarding = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const forwarding = await CallForwarding.findById(id);
    if (!forwarding) {
      return res.status(404).json({ error: 'Call forwarding rule not found' });
    }

    // Verify phone number belongs to user
    const phoneNumber = await UserPhoneNumber.findById(forwarding.phone_number_id);
    if (!phoneNumber || phoneNumber.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const toggled = await CallForwarding.toggleActive(id);
    if (!toggled) {
      return res.status(500).json({ error: 'Failed to toggle call forwarding rule' });
    }

    const updatedForwarding = await CallForwarding.findById(id);

    res.json({
      success: true,
      message: `Call forwarding rule ${updatedForwarding.is_active ? 'activated' : 'deactivated'} successfully`,
      data: updatedForwarding.toJSON()
    });

  } catch (err) {
    console.error('Error toggling call forwarding:', err);
    next(err);
  }
};

// Delete call forwarding rule
exports.deleteForwarding = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const forwarding = await CallForwarding.findById(id);
    if (!forwarding) {
      return res.status(404).json({ error: 'Call forwarding rule not found' });
    }

    // Verify phone number belongs to user
    const phoneNumber = await UserPhoneNumber.findById(forwarding.phone_number_id);
    if (!phoneNumber || phoneNumber.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = await CallForwarding.delete(id);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete call forwarding rule' });
    }

    res.json({
      success: true,
      message: 'Call forwarding rule deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting call forwarding:', err);
    next(err);
  }
};

// Get call forwarding statistics
exports.getForwardingStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await CallForwarding.getForwardingStats(userId);

    res.json({
      success: true,
      stats: stats
    });

  } catch (err) {
    console.error('Error fetching call forwarding stats:', err);
    next(err);
  }
};
