const multer = require('multer')
const {CloudinaryStorage} = require('multer-storage-cloudinary')
const cloudinary = require('cloudinary').v2;
require('dotenv').config();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})



const uploadFileToCloudinary = (file) =>{
    const isVideo = file.mimetype.startsWith('video');
    
    const options = {
        resource_type: isVideo ? 'video' : 'image',
        folder: 'facely', // Organize uploads in a folder
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        // Add optimization transformations
        transformation: isVideo ? [
            {
                // For videos, use 'limit' to maintain aspect ratio and prevent upscaling
                // This will scale down large videos but keep small videos at original size
                width: 1280,
                height: 720,
                crop: 'limit', // This maintains aspect ratio without cropping or upscaling
                quality: 'auto',
                video_codec: 'h264',
                audio_codec: 'aac',
                bit_rate: '1500k',
                // Add flags to prevent upscaling
                flags: 'progressive'
            }
        ] : [
            {
                width: 1080,
                height: 1350,
                crop: 'limit', // Use 'limit' instead of 'scale' to prevent upscaling
                quality: 'auto',
                format: 'auto', // Automatically choose best format (WebP, AVIF, etc.)
                fetch_format: 'auto'
            }
        ]
    }

    return new Promise((resolve, reject) =>{
        //for video upload 
        if(isVideo){
            cloudinary.uploader.upload_large(file.path, options, (error, result) =>{
                if(error){
                    console.error('Video upload error:', error);
                    return reject(error);
                }
                console.log('Video uploaded successfully:', result.secure_url);
                console.log('Video dimensions:', result.width, 'x', result.height);
                resolve(result)
            })
        }else{
            //image upload
            cloudinary.uploader.upload(file.path, options, (error, result) =>{
                if(error){
                    console.error('Image upload error:', error);
                    return reject(error);
                }
                console.log('Image uploaded successfully:', result.secure_url);
                resolve(result)
            })
        }
    })
}

const multerMiddleware = multer({dest : "uploads/"})

module.exports= {multerMiddleware,uploadFileToCloudinary}