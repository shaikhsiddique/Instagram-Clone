const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/instagram");

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  profileimg: String,
  bio:String,
  post: [{ type: mongoose.Schema.Types.ObjectId, ref: 'post' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

// Apply the passport-local-mongoose plugin to the user schema
userSchema.plugin(passportLocalMongoose);

// Create the user model
const User = mongoose.model('User', userSchema);

module.exports = User;
