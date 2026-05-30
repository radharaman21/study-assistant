const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ isActive: true })
      .populate('members', 'name email avatar')
      .populate('admin', 'name email')
      .sort({ createdAt: -1 });

    res.json({ groups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/recommended', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const course = user?.profile?.course || '';

    const groups = await Group.find({
      course: { $regex: course, $options: 'i' },
      isActive: true,
    })
      .populate('members', 'name email avatar')
      .populate('admin', 'name')
      .limit(6);

    const filtered = groups.filter(
      g => (g.members?.length || 0) < (g.maxMembers || 50)
    );

    res.json({ groups: filtered });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, description, subjects } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const user = await User.findById(req.user._id);

    const group = await Group.create({
      name: name.trim(),
      description: description || '',
      course: user?.profile?.course || 'General',
      subjects: subjects || user?.profile?.subjects || [],
      members: [req.user._id],
      admin: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { studyGroups: group._id },
    });

    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const alreadyMember = group.members.some(
      m => String(m) === String(req.user._id)
    );

    if (alreadyMember) {
      return res.status(400).json({ message: 'Already a member' });
    }

    if ((group.members?.length || 0) >= (group.maxMembers || 50)) {
      return res.status(400).json({ message: 'Group is full' });
    }

    group.members.push(req.user._id);
    await group.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { studyGroups: group._id },
    });

    res.json({ message: 'Joined group', group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/leave', protect, async (req, res) => {
  try {
    await Group.findByIdAndUpdate(req.params.id, {
      $pull: { members: req.user._id },
    });

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { studyGroups: req.params.id },
    });

    res.json({ message: 'Left group' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/messages', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .select('messages name')
      .populate('messages.sender', 'name avatar');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({
      messages: group.messages.slice(-50),
      groupName: group.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(
      m => String(m) === String(req.user._id)
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member' });
    }

    const message = {
      sender: req.user._id,
      senderName: req.user.name || 'User',
      content: content.trim(),
      timestamp: new Date(),
    };

    group.messages.push(message);

    if (group.messages.length > 200) {
      group.messages = group.messages.slice(-200);
    }

    await group.save();

    res.json({
      message: group.messages[group.messages.length - 1],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;