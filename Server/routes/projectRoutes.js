const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

// All project routes require authentication
router.use(protect);

// ─── Validation rule sets ─────────────────────────────────────────────────────

const createProjectRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Project title is required')
    .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'on-hold', 'completed', 'archived'])
    .withMessage('Invalid project status'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code'),
];

const updateProjectRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'on-hold', 'completed', 'archived'])
    .withMessage('Invalid project status'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.route('/')
  .get(getProjects)
  .post(createProjectRules, validate, createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProjectRules, validate, updateProject)
  .delete(deleteProject);

router.route('/:id/members/:userId')
  .delete(removeMember);

module.exports = router;
