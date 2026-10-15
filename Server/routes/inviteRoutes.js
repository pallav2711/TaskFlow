const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  sendInvite,
  getSentInvites,
  getMyInvites,
  acceptInvite,
  declineInvite,
  cancelInvite,
} = require('../controllers/inviteController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.use(protect);

const sendInviteRules = [
  body('projectId').notEmpty().isMongoId().withMessage('Valid project ID is required'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
];

// Send invite (manager only)
router.post('/', sendInviteRules, validate, sendInvite);

// Manager: see invites sent for a project (?projectId=...)
router.get('/sent', getSentInvites);

// Developer: see own pending invites
router.get('/inbox', getMyInvites);

// Accept / decline / cancel
router.patch('/:id/accept', acceptInvite);
router.patch('/:id/decline', declineInvite);
router.delete('/:id', cancelInvite);

module.exports = router;
