const express = require('express');
const router = express.Router();
const { multerMiddleware } = require('../config/cloudinary');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  createLocalIssue,
  getAllLocalIssues,
  getLocalIssueById,
  toggleSupport,
  addComment,
  updateStatus,
  getUserLocalIssues,
  getStatistics,
  deleteLocalIssue
} = require('../controllers/localIssueController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new local issue
router.post('/', multerMiddleware.array('media', 5), createLocalIssue);

// Get all local issues with filtering and pagination
router.get('/', getAllLocalIssues);

// Get statistics for dashboard
router.get('/statistics', getStatistics);

// Get user's local issues
router.get('/my-issues', getUserLocalIssues);

// Get a single local issue by ID
router.get('/:id', getLocalIssueById);

// Support/Unsupport a local issue
router.post('/:id/support', toggleSupport);

// Add comment to local issue
router.post('/:id/comments', addComment);

// Update issue status (admin or issue creator only)
router.patch('/:id/status', updateStatus);

// Delete local issue (admin or creator only)
router.delete('/:id', deleteLocalIssue);

module.exports = router;
