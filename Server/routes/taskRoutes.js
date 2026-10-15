const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

// All task routes require authentication
router.use(protect);

// ─── Validation rule sets ─────────────────────────────────────────────────────

const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const VALID_STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];

const createTaskRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 2, max: 150 }).withMessage('Title must be between 2 and 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES).withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('project')
    .notEmpty().withMessage('Project is required')
    .isMongoId().withMessage('Invalid project ID'),
  body('assignee')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Invalid assignee ID'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid date (ISO 8601)'),
];

const updateTaskRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Title must be between 2 and 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES).withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('assignee')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Invalid assignee ID'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid date (ISO 8601)'),
];

const statusUpdateRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.route('/')
  .get(getTasks)
  .post(createTaskRules, validate, createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTaskRules, validate, updateTask)
  .delete(deleteTask);

router.patch('/:id/status', statusUpdateRules, validate, updateTaskStatus);

module.exports = router;
