const express = require('express');
const passport = require('passport');
const router = express.Router();
const LocalStrategy = require("passport-local").Strategy;
const User = require('./users');
const Post = require('./post');
const upload = require('./multer'); 

passport.use(new LocalStrategy(User.authenticate())); // Use User.authenticate()

router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false});
});

router.get('/feed',isloggedin,async function(req, res) {
  const post= await Post.find().populate('user')
  const user = await User.findById(req.user._id);
  res.render('feed', {post,user,footer: true});
});
router.get('/profile', isloggedin, async function(req, res) {
  try {
    const userId = req.user._id;

    // Retrieve user data from the database
    const user = await User.findById(userId).populate('post');
    // Render the 'profile' view and pass user data to it
    res.render('profile', { user, footer: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/search', isloggedin, function(req, res) {
  // Pass an empty array as a placeholder for users
  res.render('search', { users: [], footer: true });
});
router.get('/profile/:id', isloggedin, async function(req, res) {
  try {
    const uid = req.params.id;
    const user = await User.findById(uid).populate("post");
    const loginUser = await User.findById(req.user._id);

    if (!user) {
      // Handle case where user is not found
      return res.status(404).send('User not found');
    }

    console.log(user);
    res.render('vistedprofile', { user,loginUser,footer: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/follow/:id', isloggedin, async (req, res) => {
  try {
    const loggedInUserId = req.user._id; // ID of the logged-in user
    const userIdToFollow = req.params.id; // ID of the user to follow

    // Find the logged-in user and the user to follow
    const loggedInUser = await User.findById(loggedInUserId);
    const userToFollow = await User.findById(userIdToFollow);

    // Check if both users exist
    if (!loggedInUser || !userToFollow) {
      return res.status(404).send('User not found');
    }

    // Check if the user is already being followed
    const isFollowing = loggedInUser.following.includes(userIdToFollow);

    if (isFollowing) {
      // If already following, unfollow the user
      const index = loggedInUser.following.indexOf(userIdToFollow);
      loggedInUser.following.splice(index, 1);
      await loggedInUser.save();

      // Remove the logged-in user from the followers list of the user to unfollow
      const followerIndex = userToFollow.followers.indexOf(loggedInUserId);
      userToFollow.followers.splice(followerIndex, 1);
      await userToFollow.save();
    } else {
      // If not following, follow the user
      loggedInUser.following.push(userToFollow._id);
      await loggedInUser.save();

      // Add the logged-in user to the followers list of the user to follow
      userToFollow.followers.push(loggedInUser._id);
      await userToFollow.save();
    }

    // Redirect or send a response
    res.redirect('/profile'); // Redirect back to the profile page, adjust as needed
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/like/:id',async function(req, res){
  const Postid = req.params.id;
  const userid = req.user._id
  
  const post = await Post.findOne({_id:Postid})


  const isliked = post.like.includes(userid);

  if(isliked){
    const index = post.like.indexOf(Postid);
      post.like.splice(index, 1);
      await post.save();
  }
  else{
    post.like.push(userid);
    await post.save();
  }
  res.redirect('/feed');
})

router.get('/edit', isloggedin, function(req, res) { // Use the isloggedin middleware
  res.render('edit', {footer: true});
});

router.get('/upload', isloggedin, function(req, res) { // Use the isloggedin middleware
  res.render('upload', {footer: true});
});
router.get('/username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Assuming a case-insensitive search for simplicity
    const matchingUsers = await User.find({
      $or: [
        { username: { $regex: new RegExp(username, 'i') } },
        { name: { $regex: new RegExp(username, 'i') } }
      ]
    });

    // Send a JSON response with the matching users
    res.json({ users: matchingUsers });
  } catch (error) {
    console.error(error);

    // Send an HTML error response
    res.status(500).send('Internal Server Error');
  }
});

router.post('/register', function (req, res) {
  const { username, name, email, password } = req.body;

  // Create a new user instance
  const newUser = new User({ username, name, email });

  // Use the register method provided by passport-local-mongoose
  User.register(newUser, password, function (err, registeredUser) {
    if (err) {
      console.error(err);
      return res.redirect('/register'); // Handle registration error
    }

    passport.authenticate('local')(req, res, function () {
      res.redirect('/profile');
    });
  });
});

router.post("/login",passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect: '/'
}),function(req,res){});


router.get('/logout', function(req, res) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});
router.post('/update', isloggedin, upload.single('image'), async (req, res) => {
  const { username, name, bio } = req.body;

  // Get the logged-in user ID
  const userId = req.user._id;

  // Find the user by ID
  const user = await User.findById(userId);

  // Update the user data based on the non-empty fields
  if (username) {
    user.username = username;
  }

  if (name) {
    user.name = name;
  }

  if (bio) {
    user.bio = bio;
  }

  // Handle file upload if a file is provided
  if (req.file) {
    // Save the file name in the 'profileimg' field
    user.profileimg = req.file.filename;
  }

  // Save the updated user data
  await user.save();

  // Redirect or render a response
  res.redirect('/profile');
});

router.post('/upload', isloggedin, upload.single("image"), async function(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      // Handle the case where the user is not found
      return res.status(404).send("User not found");
    }

    const postdata = await Post.create({
      image: req.file.filename,
      caption: req.body.caption,
      user: userId,
    });

    user.post.push(postdata._id);
    await user.save();
    res.redirect("/profile");
  } catch (error) {
    // Handle errors, log them, and send an appropriate response
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
function isloggedin(req, res, next) {
  if(req.isAuthenticated()){ // Corrected the method name to isAuthenticated()
    return next();
  }
  res.redirect('/');
}
module.exports = router;
