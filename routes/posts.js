const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Post = require("../models/Post");
const Notification = require("../models/Notification");

//List posts
router.get("/posts", async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt';
    const searchQuery = req.query.search || '';
    const filter = req.query.filter || (req.user ? req.user.filterPreference : 'all'); // Use saved filterPreference if user is logged in

    let sortOption = {};
    if (sortBy === 'class') sortOption = { class: 1 };
    else if (sortBy === 'title') sortOption = { title: 1 };
    else sortOption = { createdAt: -1 };

    let searchFilter = {};
    if (searchQuery) {
      const regex = new RegExp(searchQuery, "i");
      searchFilter.$or = [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
      ];
    }

    // Handle filtering by following
    if (filter === 'following' && req.user) {
      const currentUser = await mongoose.model('User').findById(req.user._id);
      const followingIds = currentUser.following || [];
      searchFilter.userId = { $in: followingIds };
    } else if (filter === 'blog') {
      searchFilter.type = 'blog';
    } else if (filter === 'event') {
      searchFilter.type = 'event';
    }
    
    // Fetch posts and populate the associated user data (username and profile picture)
    const posts = await Post.find(searchFilter)
    .sort(sortOption)
    .populate('userId', 'username profilePicture');
  
    const userId = req.user ? req.user._id.toString() : null;
    
    // Add likedByUser to each post
    const postsWithLikeStatus = posts.map(a => {
      const likedByUser = userId ? a.likes.map(id => id.toString()).includes(userId) : false;

      return {
        ...a.toObject(),
        likedByUser
      };
    });
    
    res.render("posts", {
      posts: postsWithLikeStatus,
      searchQuery,
      sortBy,
      filter,
      isGuest: !req.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

//Show form to add a new post
router.get("/posts/new", (req, res) => {
  if (!req.user) {
    req.flash("error_msg", "You must be logged in to add an post.");
    return res.redirect("/login");
  }
  res.render("new-post"); //New template for creating
});

//Handle submission of a new post
router.post("/posts", async (req, res) => {
  if (!req.user) {
    req.flash("error_msg", "You must be logged in to add an post.");
    return res.redirect("/login");
  }

  try {
    const { title, description, eventDate, createdAt, file, type } = req.body;

    const newPost = new Post({
      userId: req.user._id,
      title,
      eventDate,
      description,
      createdAt,
      file,
      type
    });    

    await newPost.save();
    req.flash("success_msg", "Post added successfully!");
    res.redirect("/posts");
  } catch (err) {
    req.flash("error_msg", "Error adding post. Please try again.");
    res.redirect("/posts/new");
  }
});

//Show details of one post
router.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId attendees')
      .populate('replies.user');

    if (!post) {
      req.flash("error_msg", "Post not found.");
      return res.redirect("/posts");
    }

    // Sort replies by newest first
    post.replies.sort((a, b) => b.createdAt - a.createdAt);

    const isOwner = req.user && post.userId.equals(req.user._id);
    
    const userId = req.user ? req.user._id.toString() : null;
    const likedByUser = userId ? post.likes.map(id => id.toString()).includes(userId) : false;
    const userAttending = userId ? post.attendees.some(att => att._id.toString() === userId) : false;

    // Determine which view to render
    let view = "post-details";
    if (post.type === 'event') view = "event-details";
    else if (post.type === 'blog') view = "blog-details";

    res.render(view, {
      post,
      isGuest: !req.user,
      isOwner,
      likedByUser,
      userAttending
    });
  } catch (err) {
    req.flash("error_msg", "Could not load post.");
    res.redirect("/posts");
  }
});

//Show edit form
router.get("/posts/:id/edit", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash("error_msg", "Post not found.");
      return res.redirect("/posts");
    }

    if (!req.user || !post.userId.equals(req.user._id)) {
      req.flash("error_msg", "Unauthorized access.");
      return res.redirect("/login");
    }

    // Format the eventDate to YYYY-MM-DD for date input
    const formattedDate = post.eventDate
      ? new Date(post.eventDate).toISOString().split("T")[0]
      : "";

    res.render("edit-post", {
      post,
      formattedDate
    });
  } catch (err) {
    req.flash("error_msg", "Could not load post for editing.");
    res.redirect("/posts");
  }
});

//Handle update
router.put("/posts/:id", async (req, res) => {
  if (!req.user) {
    req.flash("error_msg", "You must be logged in to edit an post.");
    return res.redirect("/login");
  }

  try {
    const { title, description, eventDate, createdAt, class: postClass, file } = req.body;

    const updatedPost = {
      title,
      description,
      eventDate,
      createdAt: new Date(),
      class: postClass,
      file,
    };

    const post = await Post.findByIdAndUpdate(req.params.id, updatedPost, {
      new: true,
    });

    req.flash("success_msg", "Post updated successfully!");
    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    req.flash("error_msg", "Error updating post. Please try again.");
    res.redirect(`/posts/${req.params.id}/edit`);
  }
});

//Delete route
router.delete("/posts/:id", async (req, res) => {
  console.log("DELETE route hit for post ID:", req.params.id);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash("error_msg", "Post not found.");
      return res.redirect("/posts");
    }

    if (!req.user || !post.userId.equals(req.user._id)) {
      req.flash("error_msg", "Unauthorized access.");
      return res.redirect("/posts");
    }

    await Post.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Post deleted successfully!");
    res.redirect("/posts");
  } catch (err) {
    req.flash("error_msg", "Error deleting post. Please try again.");
    res.redirect("/posts");
  }
});

// Update user's filter preference
router.get("/posts/set-filter/:filter", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const { filter } = req.params;
  if (filter !== 'all' && filter !== 'following' && filter !== 'blog' && filter !== 'event') {
    return res.status(400).send("Invalid filter option.");
  }

  try {
    const user = await mongoose.model('User').findById(req.user._id);
    user.filterPreference = filter; // Update filter preference
    await user.save();
    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/posts/data", async (req, res) => {
  try {
    const filter = req.query.filter || (req.user ? req.user.filterPreference : 'all');

    let searchFilter = {};
    // Handle filtering
    if (filter === 'following' && req.user) {
      const currentUser = await mongoose.model('User').findById(req.user._id);
      const followingIds = currentUser.following || [];
      searchFilter.userId = { $in: followingIds };
    } else if (filter === 'blog') {
      searchFilter.type = 'blog';
    } else if (filter === 'event') {
      searchFilter.type = 'event';
    }

    const posts = await Post.find(searchFilter)
      .sort({ createdAt: 1 })
      .populate('userId', 'username profilePicture');

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Toggle like on an post
router.post("/posts/:id/like", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.user._id;
    const index = post.likes.indexOf(userId);

    if (index === -1) {
      // Not yet liked — add
      post.likes.push(userId);

      // Create a like notification (if not liking own post)
      if (!post.userId.equals(userId)) {
        // Remove old notification if it exists
        await Notification.findOneAndDelete({
          recipient: post.userId,
          sender: userId,
          type: 'like',
          post: post._id
        });

        // Create new notification
        await Notification.create({
          recipient: post.userId,
          sender: userId,
          type: 'like',
          post: post._id
        });

        // Emit real-time event using Socket.IO
        const io = req.app.get('io');
        io.to(post.userId._id.toString()).emit('new-notification');
      }
    } else {
      // Already liked — remove
      post.likes.splice(index, 1);

      // Remove the existing like notification
      await Notification.findOneAndDelete({
        recipient: post.userId,
        sender: userId,
        type: 'like',
        post: post._id
      });
    }

    await post.save();
    res.json({ likesCount: post.likes.length, liked: index === -1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Toggle like on an post
router.post("/posts/:id/rsvp", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.type !== 'event') return res.status(404).json({ error: "Post not found" });

    const userId = req.user._id;
    const index = post.attendees.indexOf(userId);

    if (index === -1) {
      // Not yet liked — add
      post.attendees.push(userId);

      // Create a like notification (if not liking own post)
      if (!post.userId.equals(userId)) {
        // Remove old notification if it exists
        await Notification.findOneAndDelete({
          recipient: post.userId,
          sender: userId,
          type: 'RSVP',
          post: post._id
        });

        // Create new notification
        await Notification.create({
          recipient: post.userId,
          sender: userId,
          type: 'RSVP',
          post: post._id
        });

        // Emit real-time event using Socket.IO
        const io = req.app.get('io');
        io.to(post.userId._id.toString()).emit('new-notification');
      }
    } else {
      // Already liked — remove
      post.attendees.splice(index, 1);

      // Remove the existing like notification
      await Notification.findOneAndDelete({
        recipient: post.userId,
        sender: userId,
        type: 'RSVP',
        post: post._id
      });
    }

    res.json({ attending: index === -1 });
    await post.save();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/posts/:id/attendees", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('attendees', 'name username _id');
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post.attendees); // Send the list of attendees
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Handle new reply
router.post("/posts/:id/replies", async (req, res) => {
  if (!req.user) {
    req.flash("error_msg", "You must be logged in to reply.");
    return res.redirect("/login");
  }

  try {
    const post = await Post.findById(req.params.id)
      .populate('userId attendees')
      .populate('replies.user', 'username profilePicture');

    if (!post) {
      req.flash("error_msg", "Post not found.");
      return res.redirect("/posts");
    }

    const newReply = {
      user: req.user._id,
      text: req.body.text,
      createdAt: new Date()
    };

    post.replies.push(newReply);
    await post.save();

    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error adding reply.");
    res.redirect("/posts");
  }
});

module.exports = router;
