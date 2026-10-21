const { uploadFileToCloudinary } = require("../config/cloudinary");
const Post = require("../model/Post");
const Story = require("../model/story");
const User = require("../model/User");
const response = require("../utils/responseHandler");
const { createNotification } = require("../utils/createNotification");

const createPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    // console.log('This is my auth userId',userId);
    // const { content } = req.body;
    const { content, location } = req.body;

//      if (!location) {
//   return response(res, 400, "Location is required to create a post");
// }

    const file = req.file;
    let mediaUrl = null;
    let mediaType = null;
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      // console.log('This is my uploadResult',uploadResult);
      mediaUrl = uploadResult?.secure_url;
      mediaType = file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    //create a new post
    const newPost = await new Post({
      user: userId,
      content,
      location, // added here
      mediaUrl,
      mediaType,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
    });

    await newPost.save();
//     if (!location) {
//   return response(res, 400, "Location is required to create a post");
// }

    return response(res, 201, "Post created successfully", newPost);
  } catch (error) {
    console.log("error creating post", error);
    return response(
      res,
      500,
      "Internal server error",
      error?.stack || error?.message || error
    );
  }
};

//create story
const createStory = async (req, res) => {
  try {
    const userId = req.user.userId;
    // console.log('This is my auth userId',userId);
    const file = req.file;
    if (!file) {
      return response(res, 400, "file is required to create a story");
    }
    let mediaUrl = null;
    let mediaType = null;
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      // console.log('This is my uploadResult',uploadResult);
      mediaUrl = uploadResult?.secure_url;
      mediaType = file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    //create a new story
    const newStory = await new Story({
      user: userId,
      mediaUrl,
      mediaType,
    });

    await newStory.save();
    return response(res, 201, "Story created successfully", newStory);
  } catch (error) {
    console.log("error creating story", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// getAllStory
const getAllStory = async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const story = await Story.find({ createdAt: { $gte: cutoff } }) // only recent stories
      .sort({ createdAt: -1 })
      .populate('user', '_id username profilePicture email');

    return response(res, 200, "Get all story successfully", story);
  } catch (error) {
    console.log("error getting story", error);
    return response(res, 500, "Internal server error", error.message);
  }
};


// // get all posts
// const getAllPosts = async (req, res) => {
//   try {
//     const currentUserId = req.user.userId;

//     const posts = await Post.find({ blocked: false })
//       .sort({ createdAt: -1 })
//       .populate('user', '_id username profilePicture email')
//       .populate({
//         path: 'comments.user',
//         select: 'username profilePicture',
//       })
//       .lean(); // plain JS objects so we can add fields easily

//     const postsWithLikeInfo = posts.map((post) => ({
//       ...post,
//       // make sure likes is an array and check if current user id is inside
//       likedByCurrentUser:
//         Array.isArray(post.likes) &&
//         post.likes.some((id) => id.toString() === currentUserId.toString()),
//     }));

//     return response(res, 200, "Get all posts successfully", postsWithLikeInfo);
//   } catch (error) {
//     console.log("error getting posts", error);
//     return response(res, 500, "Internal server error", error.message);
//   }
// };


// // get post by userID
// const getPostByUserId = async (req, res) => {
//   const { userId } = req.params;
//   const currentUserId = req.user.userId;

//   try {
//     if (!userId) {
//       return response(res, 400, "UserId is required to get user post");
//     }

//     const posts = await Post.find({ user: userId, blocked: false })
//       .sort({ createdAt: -1 })
//       .populate("user", "_id username profilePicture email")
//       .populate({
//         path: "comments.user",
//         select: "username profilePicture",
//       })
//       .lean();

//     const postsWithLikeInfo = posts.map((post) => ({
//       ...post,
//       likedByCurrentUser:
//         Array.isArray(post.likes) &&
//         post.likes.some((id) => id.toString() === currentUserId.toString()),
//     }));

//     return response(res, 200, "Get user post successfully", postsWithLikeInfo);
//   } catch (error) {
//     console.log("error getting posts", error);
//     return response(res, 500, "Internal server error", error.message);
//   }
// };

// const likePost = async (req, res) => {
//   const { postId } = req.params;
//   const userId = req.user.userId;

//   try {
//     const post = await Post.findById(postId);
//     if (!post) {
//       return response(res, 404, "post not found");
//     }

//     const hasLiked = post.likes.some(
//       (id) => id.toString() === userId.toString()
//     );

//     if (hasLiked) {
//       post.likes = post.likes.filter(
//         (id) => id.toString() !== userId.toString()
//       );
//       post.likeCount = Math.max(0, post.likeCount - 1);
//     } else {
//       post.likes.push(userId);
//       post.likeCount += 1;
//     }

//     const updatedPost = await post.save();
//     const postObj = updatedPost.toObject();
//     // After the toggle, likedByCurrentUser is the inverse of hasLiked
//     postObj.likedByCurrentUser = !hasLiked;

//     return response(
//       res,
//       200,
//       hasLiked ? "Post unliked successfully" : "Post liked successfully",
//       postObj
//     );
//   } catch (error) {
//     console.log(error);
//     return response(res, 500, "Internal server error", error.message);
//   }
// };

// //post comment by user
// const addCommentToPost = async (req, res) => {
//   const { postId } = req.params;
//   const userId = req.user.userId;
//   const { text } = req.body;

//   try {
//     const post = await Post.findById(postId);
//     if (!post) {
//       return response(res, 404, "post not found");
//     }

//     post.comments.push({ user: userId, text });
//     post.commentCount += 1;

//     //save post with new comments
//     await post.save();
//     return response(res, 201, "Comments added successfully", post);
//   } catch (error) {
//     console.log(error);
//     return response(res, 500, "Internal server error", error.message);
//   }
// };

// //share on post by user
// const sharePost = async (req, res) => {
//   const { postId } = req.params;
//   const userId = req.user.userId;

//   try {
//     const post = await Post.findById(postId);
//     if (!post) return response(res, 404, "Post not found");

//     if (!post.share.includes(userId)) {
//       post.share.push(userId);
//     }
//     post.shareCount += 1;

//     await post.save();

//     const shareUrl = `${process.env.FRONTEND_URL}/posts/public/${postId}`;

//     return response(res, 201, "Post shared successfully", { post, shareUrl });
//   } catch (error) {
//     console.error(error);
//     return response(res, 500, "Internal server error", error.message);
//   }
// };



// const deletePost = async (req, res) => {
//   const { postId } = req.params;
//   try {
//     const post = await Post.findById(postId);
//     if (!post) return response(res, 404, "Post not found");
//     // Optionally check req.user.userId === post.user or admin
//      await Post.findByIdAndDelete(postId);
//     return response(res, 200, "Post deleted successfully");
//   } catch (err) {
//     console.error(err);
//     return response(res, 500, "Server error", err.message);
//   }
// };

// const getPostById = async (req, res) => {
//   const { postId } = req.params;
//   const currentUserId = req.user.userId;

//   try {
//     const post = await Post.findById(postId)
//       .populate("user", "_id username profilePicture email")
//       .populate({
//         path: "comments.user",
//         select: "username profilePicture",
//       })
//       .lean();

//     if (!post) {
//       return response(res, 404, "Post not found");
//     }

//     // add likedByCurrentUser info
//     post.likedByCurrentUser =
//       Array.isArray(post.likes) &&
//       post.likes.some((id) => id.toString() === currentUserId.toString());

//     return response(res, 200, "Get post successfully", post);
//   } catch (error) {
//     console.error("Error fetching single post:", error);
//     return response(res, 500, "Internal server error", error.message);
//   }
// };


// const getPostByIdPublic = async (req, res) => {
//   const { postId } = req.params;

//   try {
//     const post = await Post.findById({ _id: postId, blocked: false })
//       .populate("user", "_id username profilePicture")
//       .populate({
//         path: "comments.user",
//         select: "username profilePicture",
//       })
//       .lean();

//     if (!post) {
//       return response(res, 404, "Post not found");
//     }

//     // Don’t send sensitive info like who liked
//     delete post.likes;

//     return response(res, 200, "Get post successfully", post);
//   } catch (error) {
//     console.error("Error fetching single public post:", error);
//     return response(res, 500, "Internal server error", error.message);
//   }
// };

// // block / unblock post
// const toggleBlockPost = async (req, res) => {
//   const { postId } = req.params;
//   const { blocked } = req.body;

//   try {
//     const post = await Post.findById(postId);
//     if (!post) return response(res, 404, "Post not found");

//     post.blocked = blocked; // explicitly set
//     await post.save();

//     return response(res, 200, `Post ${blocked ? "blocked" : "unblocked"} successfully`, post);
//   } catch (error) {
//     console.error("Error blocking/unblocking post:", error);
//     return response(res, 500, "Internal server error", error.message);
//   }
// };




// --------------------- NEW / UPDATED POST METHODS ---------------------

// get all posts
const getAllPosts = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const isAdmin = req.user && req.user.role === "admin";

    // admin sees everything, others see only posts that are NOT explicitly blocked (blocked !== true)
    const filter = isAdmin ? {} : { blocked: { $ne: true } };

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', '_id username profilePicture email')
      .populate({ path: 'comments.user', select: 'username profilePicture' })
      .lean();

    const postsWithLikeInfo = posts.map((post) => ({
      ...post,
      likedByCurrentUser:
        Array.isArray(post.likes) &&
        post.likes.some((id) => id.toString() === currentUserId.toString()),
    }));

    return response(res, 200, "Get all posts successfully", postsWithLikeInfo);
  } catch (error) {
    console.log("error getting posts", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// get post by userID
const getPostByUserId = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.userId;

  try {
    if (!userId) {
      return response(res, 400, "UserId is required to get user post");
    }

    const isAdmin = req.user && req.user.role === "admin";
    const filter = isAdmin ? { user: userId } : { user: userId, blocked: { $ne: true } };

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "_id username profilePicture email")
      .populate({ path: "comments.user", select: "username profilePicture" })
      .lean();

    const postsWithLikeInfo = posts.map((post) => ({
      ...post,
      likedByCurrentUser:
        Array.isArray(post.likes) &&
        post.likes.some((id) => id.toString() === currentUserId.toString()),
    }));

    return response(res, 200, "Get user post successfully", postsWithLikeInfo);
  } catch (error) {
    console.log("error getting posts", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return response(res, 404, "post not found");
    }

    const hasLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likes.push(userId);
      post.likeCount += 1;

      const actor = await User.findById(userId).select("username");
      await createNotification({
        recipient: post.user,
        sender: userId,
        type: "like",
        message: `${actor?.username || "Someone"} liked your post`,
        link: `/`,
        entityType: "post",
        entityId: post._id,
      });
    }

    const updatedPost = await post.save();
    const postObj = updatedPost.toObject();
    postObj.likedByCurrentUser = !hasLiked;

    return response(res, 200, hasLiked ? "Post unliked successfully" : "Post liked successfully", postObj);
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// post comment by user
const addCommentToPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;
  const { text } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return response(res, 404, "post not found");
    }

    post.comments.push({ user: userId, text });
    post.commentCount += 1;

    await post.save();

    const actor = await User.findById(userId).select("username");
    await createNotification({
      recipient: post.user,
      sender: userId,
      type: "comment",
      message: `${actor?.username || "Someone"} commented on your post`,
      link: `/`,
      entityType: "post",
      entityId: post._id,
    });

    return response(res, 201, "Comments added successfully", post);
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// share on post by user
const sharePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) return response(res, 404, "Post not found");

    if (!post.share.includes(userId)) {
      post.share.push(userId);
    }
    post.shareCount += 1;

    await post.save();

    const shareUrl = `${process.env.FRONTEND_URL}/posts/public/${postId}`;

    return response(res, 201, "Post shared successfully", { post, shareUrl });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error", error.message);
  }
};

const deletePost = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) return response(res, 404, "Post not found");
    // Optionally check req.user.userId === post.user or admin
    await Post.findByIdAndDelete(postId);
    return response(res, 200, "Post deleted successfully");
  } catch (err) {
    console.error(err);
    return response(res, 500, "Server error", err.message);
  }
};

const getPostById = async (req, res) => {
  const { postId } = req.params;
  const currentUserId = req.user.userId;
  try {
    const post = await Post.findById(postId)
      .populate("user", "_id username profilePicture email")
      .populate({ path: "comments.user", select: "username profilePicture" })
      .lean();

    if (!post) {
      return response(res, 404, "Post not found");
    }

    // If post is blocked and requester is not admin -> don't reveal
    const isAdmin = req.user && req.user.role === "admin";
    if (post.blocked === true && !isAdmin) {
      return response(res, 404, "Post not found");
    }

    post.likedByCurrentUser =
      Array.isArray(post.likes) &&
      post.likes.some((id) => id.toString() === currentUserId.toString());

    return response(res, 200, "Get post successfully", post);
  } catch (error) {
    console.error("Error fetching single post:", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

const getPostByIdPublic = async (req, res) => {
  const { postId } = req.params;
  try {
    // public fetch must not return blocked posts. Using $ne:true ensures older docs without `blocked` field are included.
    const post = await Post.findOne({ _id: postId, blocked: { $ne: true } })
      .populate("user", "_id username profilePicture")
      .populate({ path: "comments.user", select: "username profilePicture" })
      .lean();

    if (!post) {
      return response(res, 404, "Post not found or blocked");
    }

    // Do not send likes array to public
    delete post.likes;
    return response(res, 200, "Get post successfully", post);
  } catch (error) {
    console.error("Error fetching single public post:", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

// Block/unblock post (explicit) — requires admin
const toggleBlockPost = async (req, res) => {
  const { postId } = req.params;
  const { blocked } = req.body;

  try {
    // require explicit boolean
    if (typeof blocked !== "boolean") {
      return response(res, 400, "blocked field must be boolean (true/false)");
    }

    // check admin role
    const isAdmin = req.user && req.user.role === "admin";
    if (!isAdmin) {
      return response(res, 403, "Forbidden: admin only");
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { blocked },
      { new: true }
    )
      .populate("user", "_id username profilePicture email")
      .populate({ path: "comments.user", select: "username profilePicture" })
      .lean();

    if (!updatedPost) return response(res, 404, "Post not found");

    return response(res, 200, `Post ${blocked ? "blocked" : "unblocked"} successfully`, updatedPost);
  } catch (error) {
    console.error("Error blocking/unblocking post:", error);
    return response(res, 500, "Internal server error", error.message);
  }
};


module.exports = {
  createPost,
  getAllPosts,
  getPostByUserId,
  likePost,
  addCommentToPost,
  sharePost,
  createStory,
  getAllStory,
  deletePost,
  getPostById,   // ✅ add this
  getPostByIdPublic, // ✅ add this
  toggleBlockPost // 👈 export
};
