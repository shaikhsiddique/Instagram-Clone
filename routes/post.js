const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/instagram");

const postSchema = mongoose.Schema({
    image: String,
    caption: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    like: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    date: {
        type: Date,
        default: Date.now(),
    },
});

const Post = mongoose.model("post", postSchema); 
module.exports = Post;
