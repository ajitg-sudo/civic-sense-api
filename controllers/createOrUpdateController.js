const { uploadFileToCloudinary } = require("../config/cloudinary");
const User = require("../model/User");
const Bio = require("../model/UserBio");
const response = require("../utils/responseHandler");

const createOrUpdateUserBio = async (req, res) => {
    try {
        const { userId } = req.params;
        const { bioText,liveIn,relationship,workplace,education,phone,hometown} = req.body;

        let bio = await Bio.findOneAndUpdate(
            { user: userId },
            { bioText,
              liveIn,
              relationship, 
              workplace,
              education,
              phone,
               hometown },
            { new: true, runValidators: true } // Create if it doesn't exist
        );
      
        //if bio is not found, create a new one
        if (!bio) {
            bio = new Bio({
                user: userId,
                bioText,
                liveIn,
                relationship,
                workplace,
                education,
                phone,
                hometown
            });
            await bio.save();
            await User.findByIdAndUpdate(userId, { bio: bio._id });
        }

        return response(res, 201, "Bio created or updated successfully", bio);



    } catch (error) {
        console.log(error);
        return response(res, 500, "Internal server error",error.message);

    }
}


const updateCoverPhoto = async(req,res) => {
    try {
        const { userId } = req.params;
        const file = req.file;
        let coverPhoto = null;

        if(file){
            const uploadResult = await uploadFileToCloudinary(file);
            coverPhoto = uploadResult.secure_url;
        }

        if(!coverPhoto) {
            return response(res, 400, "failed to uploaded cover photo");
        }

        //update user profile with cover photo
        await User.updateOne(
            { _id: userId },
            {  $set: { coverPhoto } },
        )

         const updateUser = await User.findById(userId);
        if(!updateUser) {
            return response(res, 404, "User not found");
        }
        return response(res, 200, "Cover photo updated successfully", updateUser);
    } catch (error) {
        console.log(error);
        return response(res, 500, "Internal server error", error.message);
    }
}


const updateUserProfile = async(req,res) => {
    try {
        const { userId } = req.params;
        const {username,gender,dateOfBirth} = req.body;
        const file = req.file;
        let profilePicture = null;

        if(file){
            const uploadResult = await uploadFileToCloudinary(file);
            profilePicture = uploadResult.secure_url;
        }


        //update user profile with cover photo
          await User.updateOne(
            { _id: userId },
            {  $set: {username,gender,dateOfBirth,
                ...(profilePicture && { profilePicture })
             } },
        )

        const updateUser = await User.findById(userId);
        if(!updateUser) {
            return response(res, 404, "User not found");
        }
        return response(res, 200, "User profile updated successfully", updateUser);
    } catch (error) {
        console.log(error);
        return response(res, 500, "Internal server error", error.message);
    }
}


module.exports = {
    createOrUpdateUserBio,
    updateCoverPhoto,
    updateUserProfile,

}