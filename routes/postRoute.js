// const express = require("express");
// // const authMiddleware = require("../middleware/authMiddleware").default;
// //const authMiddleware = require("../middleware/authMiddleware");

// const { authMiddleware } = require("../middleware/authMiddleware");


// const { multerMiddleware } = require("../config/cloudinary");
// const {
//   createPost,
//   getAllPosts,
//   getPostByUserId,
//   likePost,
//   sharePost,
//   addCommentToPost,
//   getAllStory,
//   createStory,
//   deletePost,
//   getPostById,
//   getPostByIdPublic,
//   toggleBlockPost
// } = require("../controllers/postController");
// const router = express.Router();

// //create post
// router.post(
//   "/posts",
//   authMiddleware,
//   multerMiddleware.single("media"),
//   createPost
// );

// router.get("/posts/:postId", authMiddleware, getPostById);


// // Public: get single post by ID (no login required)
// router.get("/posts/public/:postId", getPostByIdPublic);

// //get all posts
// router.get("/posts", authMiddleware, getAllPosts);

// //get post by userId
// router.get("/posts/user/:userId", authMiddleware, getPostByUserId);

// //user like post route
// router.post("/posts/likes/:postId", authMiddleware, likePost);

// //user share post route
// router.post("/posts/share/:postId", authMiddleware, sharePost);

// //user comments post route
// router.post("/posts/comments/:postId", authMiddleware, addCommentToPost);

// router.delete('/posts/:postId', authMiddleware, deletePost);

// // block/unblock post
// // block/unblock post (explicit, body: { blocked: true|false })
// router.patch("/posts/:postId/block", authMiddleware, toggleBlockPost);


// //create story
// router.post(
//   "/story",
//   authMiddleware,
//   multerMiddleware.single("media"),
//   createStory
// );

// //get all story
// router.get("/story", authMiddleware, getAllStory);

// module.exports = router;


const express = require("express");
const { authMiddleware, verifyAdmin } = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinary");
const {
  createPost,
  getAllPosts,
  getPostByUserId,
  likePost,
  sharePost,
  addCommentToPost,
  getAllStory,
  createStory,
  deletePost,
  getPostById,
  getPostByIdPublic,
  toggleBlockPost,
} = require("../controllers/postController");

const router = express.Router();

// ================= POSTS ================= //

// Create post
router.post(
  "/posts",
  authMiddleware,
  multerMiddleware.single("media"),
  createPost
);

// Get single post (auth)
router.get("/posts/:postId", authMiddleware, getPostById);

// Get single post (public)
router.get("/posts/public/:postId", getPostByIdPublic);

// Get all posts
router.get("/posts", authMiddleware, getAllPosts);

// Get posts by user
router.get("/posts/user/:userId", authMiddleware, getPostByUserId);

// Like/unlike post
router.post("/posts/likes/:postId", authMiddleware, likePost);

// Share post
router.post("/posts/share/:postId", authMiddleware, sharePost);

// Comment on post
router.post("/posts/comments/:postId", authMiddleware, addCommentToPost);

// Delete post
router.delete("/posts/:postId", authMiddleware, deletePost);

// Block/unblock post (admin only)
router.patch("/posts/:postId/block", authMiddleware, verifyAdmin, toggleBlockPost);

// ================= STORIES ================= //

// Create story
router.post(
  "/story",
  authMiddleware,
  multerMiddleware.single("media"),
  createStory
);

// Get all stories
router.get("/story", authMiddleware, getAllStory);

module.exports = router;
