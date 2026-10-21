const User = require("../model/User");
const response = require("../utils/responseHandler");
const { createNotification } = require("../utils/createNotification");



//follow user
const followUser = async (req, res) => {
     const { userIdToFollow} = req.body;
    const userId = req?.user?.userId;

    // Check if the user is trying to follow themselves
    if (userId === userIdToFollow) {
        return response(res, 400, "You cannot follow yourself");
    }
    try {
        const userToFollow = await User.findById(userIdToFollow);
        const currentUser = await User.findById(userId);

        // Check if both the useris exists in db or not
        if (!userToFollow || !currentUser) {
            return response(res, 404, "User not found");
        }

        // Check if the user is already following the userToFollow
        if (currentUser.following.includes(userIdToFollow)) {
            return response(res, 400, "You are already following this user");
        }

        // Add userToFollow to currentUser's following list
        currentUser.following.push(userIdToFollow);

        // Add currentUser to userToFollow's followers list 
        userToFollow.followers.push(currentUser);

        //update follower and following count in db
        currentUser.followingCount += 1;
        userToFollow.followerCount += 1;

        //save the update current user and userToFollow
        await currentUser.save();
        await userToFollow.save();

        await createNotification({
          recipient: userIdToFollow,
          sender: userId,
          type: "follow",
          message: `${currentUser.username} started following you`,
          link: `/user-profile/${userId}`,
          entityType: "user",
          entityId: userId,
        });

        return response(res, 200, "User followed successfully");
    } catch (error) {
        return response(res, 500, "Internal server error", error.message);
    }
}




//unfollow user
const UnfollowUser = async (req, res) => {
     const { userIdToUnFollow} = req.body;
    const userId = req?.user?.userId;

    // Check if the user is trying to follow themselves
    if (userId === userIdToUnFollow) {
        return response(res, 400, "You cannot unfollow yourself");
    }
    try {
        const userToUnFollow = await User.findById(userIdToUnFollow);
        const currentUser = await User.findById(userId);

        // Check if both the useris exists in db or not
        if (!userToUnFollow || !currentUser) {
            return response(res, 404, "User not found");
        }

        // Check if the user is already following the userToFollow
        if (!currentUser.following.includes(userIdToUnFollow)) {
            return response(res, 404, "You are not following this user");
        }

        // Remove userToFollow from currentUser's following list and update the follower count
        currentUser.following = currentUser.following.filter(id => id.toString() !== userIdToUnFollow);

        // Remove currentUser from userToFollow's followers list and update the following count
        userToUnFollow.followers = userToUnFollow.following.filter(id => id.toString() !== userId);
        


        //update follower and following count in db
        currentUser.followingCount -= 1;
        userToUnFollow.followerCount -= 1;

        //save the update current user and userToFollow
        await currentUser.save();
        await userToUnFollow.save();
        return response(res, 200, "User Unfollowed successfully");
    } catch (error) {
        return response(res, 500, "Internal server error", error.message);
    }
}



// //unfollow user
// const UnfollowUser = async (req, res) => {
//      const { userIdToUnFollow} = req.body;
//     const userId = req?.user?.userId;

//     // Check if the user is trying to follow themselves
//     if (userId === userIdToUnFollow) {
//         return response(res, 400, "You cannot unfollow yourself");
//     }
//     try {
//         const userToUnFollow = await User.findById(userIdToUnFollow);
//         const currentUser = await User.findById(userId);

//         // Check if both the useris exists in db or not
//         if (!userToUnFollow || !currentUser) {
//             return response(res, 404, "User not found");
//         }

//         // Check if the user is already following the userToFollow
//         if (!currentUser.following.includes(userIdToUnFollow)) {
//             return response(res, 404, "You are not following this user");
//         }

//         // Remove userToFollow from currentUser's following list and update the follower count
//         currentUser.following = currentUser.following.filter(id => id.toString() !== userIdToUnFollow);

//         // Remove currentUser from userToFollow's followers list and update the following count
//         userToUnFollow.followers = userToUnFollow.following.filter(id => id.toString() !== userId);
        


//         //update follower and following count in db
//         currentUser.followingCount -= 1;
//         userToUnFollow.followerCount -= 1;

//         //save the update current user and userToFollow
//         await currentUser.save();
//         await userToUnFollow.save();
//         return response(res, 200, "User Unfollowed successfully");
//     } catch (error) {
//         return response(res, 500, "Internal server error", error.message);
//     }
// }

const deleteUserFromRequest = async (req, res) => {

    try {
        const loggedInUserId = req?.user?.userId;
        const {requestSenderId} = req.body;

        const requestSender = await User.findById(requestSenderId);
        const loggedInUser = await User.findById(loggedInUserId);

        // Check if both the useris exists in db or not
        if (!requestSender || !loggedInUser) {
            return response(res, 404, "User not found");
        }

        // Check if the logged-in user is following the request sender
        const isRequestSend = requestSender.following.includes(loggedInUserId);
        if (!isRequestSend) {
            return response(res, 404, "No request is found for this user");
        }
        
        // Remove the logged-in user from the request sender's following list
        requestSender.following = requestSender.following.filter(user => user.toString() !== loggedInUserId);

        // Remove the request sender from the logged-in user's followers list
        loggedInUser.followers = loggedInUser.followers.filter(user => user.toString() !== requestSenderId);

        // Update the following and follower counts
        loggedInUser.followerCount = loggedInUser.followers.length;
        requestSender.followingCount = requestSender.following.length;


        //save btoht users
        await loggedInUser.save();
        await requestSender.save(); 

        return response(res, 200, `Friend request from ${requestSender.username} deleted successfully`);

    } catch (error) {
        return response(res, 500, "Internal server error", error.message);
    }
}


//get all friend requests for user
const getAllFriendRequests = async (req, res) => {

    try {
        const loggedInUserId = req?.user?.userId;

        //find the logged-in user and retrive their followers and follwoing
        const loggedInUser = await User.findById(loggedInUserId).select('followers following');
        if (!loggedInUser) {
            return response(res, 404, "User not found");
        }

        //find user who follow the logged-in user but are not follow back
        const userToFollowBack = await User.find({
            _id:{
                $in: loggedInUser.followers, //user who follow the logged in user
                $nin: loggedInUser.following //but not following back
            }
        }).select('username profilePicture email followerCount');
         
        return response(res, 200, "User to follow back successfully", userToFollowBack);
    } catch (error) {
         return response(res, 500, "Internal server error", error.message);
    }
}


const getAllUserForRequest = async (req, res) => {

    try {
        const loggedInUserId = req?.user?.userId;

        //find the logged-in user and retrive their followers and follwoing
        const loggedInUser = await User.findById(loggedInUserId).select('followers following');
        if (!loggedInUser) {
            return response(res, 404, "User not found");
        }

        //find user who neither followers  nor following of the logged in user
        const userForFriendRequest= await User.find({
            _id:{
                $ne: loggedInUser, //user who follow the logged in user
                $nin: [...loggedInUser.following, ...loggedInUser.followers] //exclude both
            }
        }).select('username profilePicture email followerCount');
         
        return response(res, 200, "User for freinds request get successfully ", userForFriendRequest);
    } catch (error) {
         return response(res, 500, "Internal server error", error.message);
    }
}


//api for get mutual freinds
const getAllMutualFriends = async (req, res) => {

    try {
        const ProfileUserId = req?.params?.userId;

        //find the logged-in user and retrive their followers and follwoing
        const loggedInUser = await User.findById(ProfileUserId)
        .select('followers following')
        .populate('following', 'username profilePicture email followerCount followingCount') //populate following with required fields
        .populate('followers', 'username profilePicture email followerCount followingCount')
        ;
        if (!loggedInUser) {
            return response(res, 404, "User not found");
        }

        //create a set of userid that loggedd in user is following
        const followingUserId = new Set(loggedInUser.following.map(user => user._id.toString()));

        //filter the followers to get only rhose who are also following u and followed by loggedin user, mutual friends
        const mutualFriends = loggedInUser.followers.filter(follower => followingUserId.has(follower._id.toString()));
        
        return response(res, 200, "Mutual friends retrieved successfully", mutualFriends);

    } catch (error) {
         return response(res, 500, "Internal server error", error.message);
    }
}


//get all users so that u can search for profile
const getAllUser = async (req, res) => {

    try {

       
        const users = await User.find().select('username profilePicture email followerCount role');    
        return response(res, 200, "Users get successfully", users);
    } catch (error) {
         return response(res, 500, "Internal server error", error.message);
    }
}

//check if usser is authenticated or not
const checkUserAuth = async(req,res) =>{
    try {
        const userId = req?.user?.userId;
        if (!userId) {
            return response(res, 404, "User not authenticated , please login");
        }

        //ftech the user detail and excude sensitive information
        const user = await User.findById(userId).select('-password');

        if(!user){
            return response(res, 404, "User not found");
        }

        return response(res, 201, "User retrived and allow to use civicene", user);
        
    } catch (error) {
        return response(res, 500, "Internal server error", error.message); 
    }
}


const getUserProfile = async(req,res) =>{
    try {
        const {userId} = req.params; //get userId from params
        const loggedInUserId = req?.user?.userId;

        //ftech the user detail and excude sensitive information
        const userProfile = await User.findById(userId).select('-password').populate('bio').exec();

        if(!userProfile){
            return response(res, 404, "User not found");
        }

        const isOwner = loggedInUserId === userId;

        return response(res, 201, "User profile get successfully ", {profile:userProfile,isOwner});
        
    } catch (error) {
        return response(res, 500, "Internal server error", error.message); 
    }
}


module.exports = {
    followUser,
    UnfollowUser,
    deleteUserFromRequest,
    getAllFriendRequests,
    getAllUserForRequest,
    getAllMutualFriends,
    getAllUser,
    checkUserAuth,
    getUserProfile,

};