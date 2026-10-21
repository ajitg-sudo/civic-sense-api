const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User',required:true},
    content:{type:String},
    mediaUrl:{type:String},
    mediaType:{type:String,enum:['image','video']},
    likes:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
    comments:[
        {
            user: {type:mongoose.Schema.Types.ObjectId, ref:'User'},
            text:{type:String,required:true},
            // createdAt: { type:Date, default:Date.now()},
            createdAt: { type: Date, default: Date.now }

        }
    ],
    likeCount: {type:Number ,default:0},
    commentCount : {type:Number ,default:0},
    share:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
    shareCount:{type:Number,default:0},
    location: {
    type: String,
    // required: true, // if you want it mandatory
},
    // NEW: blocked flag (explicit)
  blocked: { type: Boolean, default: false }

},{timestamps:true})


const Post = mongoose.model('Post',postSchema)

module.exports = Post;