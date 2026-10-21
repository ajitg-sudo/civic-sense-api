const LocalIssue = require('../model/LocalIssue');
const User = require('../model/User');
const { uploadFileToCloudinary } = require('../config/cloudinary');
const response = require('../utils/responseHandler');
const { createNotification } = require('../utils/createNotification');

// Create a new local issue
const createLocalIssue = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, category, priority, latitude, longitude, address, city, state, tags } = req.body;

    // Validate required fields
    if (!title || !description || !latitude || !longitude) {
      return response(res, 400, "Title, description, and location coordinates are required");
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return response(res, 400, "Invalid coordinates provided");
    }

    // Handle file uploads
    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await uploadFileToCloudinary(file);
          media.push({
            url: uploadResult.secure_url,
            type: file.mimetype.startsWith('video') ? 'video' : 'image',
            publicId: uploadResult.public_id
          });
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          // Continue with other files, don't fail the entire request
        }
      }
    }

    // Create the local issue
    const localIssue = new LocalIssue({
      title,
      description,
      category: category || 'Other',
      priority: priority || 'Medium',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || '',
        city: city || '',
        state: state || ''
      },
      media,
      user: userId,
      tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : []
    });

    await localIssue.save();
    await localIssue.populate('user', 'username profilePicture email');

    return response(res, 201, "Local issue created successfully", localIssue);
  } catch (error) {
    console.error('Error creating local issue:', error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// Get all local issues with filtering and pagination
const getAllLocalIssues = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      priority,
      search,
      latitude,
      longitude,
      maxDistance = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Note: For geospatial queries, we'll use find() with $near instead of aggregation
    // This will be handled separately in the query execution

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let issues, total;

    // Temporarily disable geospatial queries to isolate the issue
    console.log('Using regular query (geospatial disabled for debugging)');
    
    issues = await LocalIssue.find(filter)
      .populate('user', 'username profilePicture email')
      .populate('supporters', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .populate('verifiedBy', 'username profilePicture')
      .populate('resolvedBy', 'username profilePicture')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    total = await LocalIssue.countDocuments(filter);

    // Calculate distance for each issue if user location provided
    if (latitude && longitude) {
      issues.forEach(issue => {
        try {
          issue.distance = issue.calculateDistance(parseFloat(latitude), parseFloat(longitude));
        } catch (error) {
          console.error('Error calculating distance for issue:', issue._id, error);
          issue.distance = null;
        }
      });
    }

    return response(res, 200, "Local issues retrieved successfully", {
      issues,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalIssues: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching local issues:', error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// Get a single local issue by ID
const getLocalIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.query;

    const issue = await LocalIssue.findById(id)
      .populate('user', 'username profilePicture email')
      .populate('supporters', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .populate('verifiedBy', 'username profilePicture')
      .populate('resolvedBy', 'username profilePicture');

    if (!issue) {
      return response(res, 404, "Local issue not found");
    }

    // Increment view count
    issue.views += 1;
    await issue.save();

    // Calculate distance if user location provided
    if (latitude && longitude) {
      issue.distance = issue.calculateDistance(parseFloat(latitude), parseFloat(longitude));
    }

    return response(res, 200, "Local issue retrieved successfully", issue);
  } catch (error) {
    console.error('Error fetching local issue:', error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// Support/Unsupport a local issue
const toggleSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const issue = await LocalIssue.findById(id);
    if (!issue) {
      return response(res, 404, "Local issue not found");
    }

    const hasSupported = issue.hasUserSupported(userId);

    if (hasSupported) {
      // Remove support
      issue.supporters = issue.supporters.filter(id => id.toString() !== userId.toString());
      issue.supportCount = Math.max(0, issue.supportCount - 1);
    } else {
      // Add support
      issue.supporters.push(userId);
      issue.supportCount += 1;

      const actor = await User.findById(userId).select('username');
      await createNotification({
        recipient: issue.user,
        sender: userId,
        type: 'support',
        message: `${actor?.username || 'Someone'} supported your issue`,
        link: '/local-issues',
        entityType: 'issue',
        entityId: issue._id,
      });
    }

    await issue.save();
    await issue.populate('supporters', 'username profilePicture');

    return response(res, 200, hasSupported ? "Support removed successfully" : "Issue supported successfully", {
      supportCount: issue.supportCount,
      hasSupported: !hasSupported
    });
  } catch (error) {
    console.error('Error toggling support:', error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// Add comment to local issue
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return response(res, 400, "Comment text is required");
    }

    const issue = await LocalIssue.findById(id);
    if (!issue) {
      return response(res, 404, "Local issue not found");
    }

    issue.comments.push({
      user: userId,
      text: text.trim()
    });

    await issue.save();
    await issue.populate('comments.user', 'username profilePicture');

    const newComment = issue.comments[issue.comments.length - 1];

    const actor = await User.findById(userId).select('username');
    await createNotification({
      recipient: issue.user,
      sender: userId,
      type: 'issue_comment',
      message: `${actor?.username || 'Someone'} commented on your issue`,
      link: '/local-issues',
      entityType: 'issue',
      entityId: issue._id,
    });

    return response(res, 201, "Comment added successfully", newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// Update issue status (admin or issue creator only)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { status, resolvedBy } = req.body;

    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return response(res, 400, "Invalid status provided");
    }

    const issue = await LocalIssue.findById(id);
    if (!issue) {
      return response(res, 404, "Local issue not found");
    }

    // Check if user can update status (admin or issue creator)
    const isAdmin = req.user.role === 'admin';
    const isCreator = issue.user.toString() === userId.toString();

    if (!isAdmin && !isCreator) {
      return response(res, 403, "You don't have permission to update this issue status");
    }

    issue.status = status;
    
    if (status === 'Resolved') {
      issue.resolvedAt = new Date();
      issue.resolvedBy = resolvedBy || userId;
    }

    await issue.save();
    await issue.populate('resolvedBy', 'username profilePicture');

    return response(res, 200, "Issue status updated successfully", issue);
  } catch (error) {
    console.error('Error updating status:', error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// Get user's local issues
const getUserLocalIssues = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const issues = await LocalIssue.find(filter)
      .populate('user', 'username profilePicture email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await LocalIssue.countDocuments(filter);

    return response(res, 200, "User local issues retrieved successfully", {
      issues,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalIssues: total
      }
    });
  } catch (error) {
    console.error('Error fetching user local issues:', error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// Get statistics for dashboard
const getStatistics = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query;

    let filter = {};
    let issues;

    // Handle geospatial queries separately
    if (latitude && longitude) {
      // Use find() with $near for geospatial queries
      filter['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(maxDistance) * 1000
        }
      };
      issues = await LocalIssue.find(filter);
    } else {
      issues = await LocalIssue.find(filter);
    }

    // Calculate statistics manually
    const stats = {
      totalIssues: issues.length,
      openIssues: issues.filter(issue => issue.status === 'Open').length,
      inProgressIssues: issues.filter(issue => issue.status === 'In Progress').length,
      resolvedIssues: issues.filter(issue => issue.status === 'Resolved').length,
      totalSupport: issues.reduce((sum, issue) => sum + (issue.supportCount || 0), 0),
      totalComments: issues.reduce((sum, issue) => sum + (issue.commentCount || 0), 0)
    };

    // Calculate category statistics
    const categoryStats = issues.reduce((acc, issue) => {
      const category = issue.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const categoryStatsArray = Object.entries(categoryStats)
      .map(([category, count]) => ({ _id: category, count }))
      .sort((a, b) => b.count - a.count);

    return response(res, 200, "Statistics retrieved successfully", {
      overview: stats,
      categories: categoryStatsArray
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// Delete local issue (admin or creator only)
const deleteLocalIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const issue = await LocalIssue.findById(id);
    if (!issue) {
      return response(res, 404, "Local issue not found");
    }

    // Check if user can delete (admin or issue creator)
    const isAdmin = req.user.role === 'admin';
    const isCreator = issue.user.toString() === userId.toString();

    if (!isAdmin && !isCreator) {
      return response(res, 403, "You don't have permission to delete this issue");
    }

    await LocalIssue.findByIdAndDelete(id);

    return response(res, 200, "Local issue deleted successfully");
  } catch (error) {
    console.error('Error deleting local issue:', error);
    return response(res, 500, "Internal server error", error.message);
  }
};

module.exports = {
  createLocalIssue,
  getAllLocalIssues,
  getLocalIssueById,
  toggleSupport,
  addComment,
  updateStatus,
  getUserLocalIssues,
  getStatistics,
  deleteLocalIssue
};
