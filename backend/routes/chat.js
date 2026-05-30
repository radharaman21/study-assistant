const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Placeholder - real-time chat handled via Socket.IO in server.js
router.get('/status', protect, (req, res) => {
  res.json({ message: 'Real-time chat available via WebSocket' });
});

module.exports = router;