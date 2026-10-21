const mongoose = require('mongoose');

const localIssueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['Roads', 'Water', 'Electricity', 'Cleanliness', 'Safety', 'Transport', 'Environment', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    }
  },
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    publicId: String // Cloudinary public ID for deletion
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supportCount: {
    type: Number,
    default: 0
  },
  supporters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
localIssueSchema.index({ 'location.coordinates': '2dsphere' });
localIssueSchema.index({ category: 1, status: 1 });
localIssueSchema.index({ createdAt: -1 });
localIssueSchema.index({ supportCount: -1 });

// Virtual for formatted address
localIssueSchema.virtual('formattedAddress').get(function() {
  const parts = [this.location.address, this.location.city, this.location.state].filter(Boolean);
  return parts.join(', ');
});

// Method to calculate distance from a point
localIssueSchema.methods.calculateDistance = function(lat, lng) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat - this.location.coordinates[1]) * Math.PI / 180;
  const dLng = (lng - this.location.coordinates[0]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.coordinates[1] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Method to check if user has supported this issue
localIssueSchema.methods.hasUserSupported = function(userId) {
  return this.supporters.some(id => id.toString() === userId.toString());
};

// Pre-save middleware to update comment count
localIssueSchema.pre('save', function(next) {
  if (this.isModified('comments')) {
    this.commentCount = this.comments.length;
  }
  next();
});

// Static method to find nearby issues
localIssueSchema.statics.findNearby = function(lat, lng, maxDistance = 10) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    }
  });
};

module.exports = mongoose.model('LocalIssue', localIssueSchema);

