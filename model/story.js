const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User',required:true},
    mediaUrl:{type:String},
    mediaType:{type:String,enum:['image','video']},
    
},{timestamps:true})

// TTL index — Mongo will delete after 24h
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Story = mongoose.model('Story',storySchema)

module.exports = Story;