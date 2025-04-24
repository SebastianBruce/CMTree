const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Notification = require("../models/Notification");

//List assignments
router.get("/assignments", async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'dueDate';
    const searchQuery = req.query.search || '';
    const filter = req.query.filter || (req.user ? req.user.filterPreference : 'all'); // Use saved filterPreference if user is logged in

    let sortOption = {};
    if (sortBy === 'class') sortOption = { class: 1 };
    else if (sortBy === 'title') sortOption = { title: 1 };
    else sortOption = { dueDate: 1 };

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
    }

    // Fetch assignments and populate the associated user data (username and profile picture)
    const assignments = await Assignment.find(searchFilter)
    .sort(sortOption)
    .populate('userId', 'username profilePicture');
  
    const userId = req.user ? req.user._id.toString() : null;
    
    // Add likedByUser to each assignment
    const assignmentsWithLikeStatus = assignments.map(a => {
      const likedByUser = userId ? a.likes.map(id => id.toString()).includes(userId) : false;
      return {
        ...a.toObject(),
        likedByUser
      };
    });
    
    res.render("assignments", {
      assignments: assignmentsWithLikeStatus,
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

//Show form to add a new assignment
router.get("/assignments/new", (req, res) => {
  if (!req.user) {
    req.flash("error_msg", "You must be logged in to add an assignment.");
    return res.redirect("/login");
  }
  res.render("new-assignment"); //New template for creating
});

//Handle submission of a new assignment
router.post("/assignments", async (req, res) => {
  if (!req.user) {
    req.flash("error_msg", "You must be logged in to add an assignment.");
    return res.redirect("/login");
  }

  try {
    const { title, description, dueDate, class: assignmentClass, file } = req.body;

    const newAssignment = new Assignment({
      userId: req.user._id,
      title,
      description,
      dueDate,
      class: assignmentClass,
      file,
    });

    await newAssignment.save();
    req.flash("success_msg", "Assignment added successfully!");
    res.redirect("/assignments");
  } catch (err) {
    req.flash("error_msg", "Error adding assignment. Please try again.");
    res.redirect("/assignments/new");
  }
});

//Show details of one assignment
router.get("/assignments/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      req.flash("error_msg", "Assignment not found.");
      return res.redirect("/assignments");
    }

    res.render("assignment-details", {
      assignment,
      isGuest: !req.user,
    });
  } catch (err) {
    req.flash("error_msg", "Could not load assignment.");
    res.redirect("/assignments");
  }
});

//Show edit form
router.get("/assignments/:id/edit", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      req.flash("error_msg", "Assignment not found.");
      return res.redirect("/assignments");
    }

    if (!req.user || req.user && !assignment.userId.equals(req.user._id)) {
      req.flash("error_msg", "Unauthorized access.");
      return res.redirect("/login");
    }

    //Format due date for input[type=date]
    const formattedDueDate = assignment.dueDate.toISOString().split("T")[0];

    res.render("edit-assignment", {
      assignment,
      formattedDueDate,
    });
  } catch (err) {
    req.flash("error_msg", "Could not load assignment for editing.");
    res.redirect("/assignments");
  }
});

//Handle update
router.put("/assignments/:id", async (req, res) => {
  if (!req.user) {
    req.flash("error_msg", "You must be logged in to edit an assignment.");
    return res.redirect("/login");
  }

  try {
    const { title, description, dueDate, class: assignmentClass, file } = req.body;

    const updatedAssignment = {
      title,
      description,
      dueDate: new Date(dueDate),
      class: assignmentClass,
      file,
    };

    const assignment = await Assignment.findByIdAndUpdate(req.params.id, updatedAssignment, {
      new: true,
    });

    req.flash("success_msg", "Assignment updated successfully!");
    res.redirect(`/assignments/${assignment._id}`);
  } catch (err) {
    req.flash("error_msg", "Error updating assignment. Please try again.");
    res.redirect(`/assignments/${req.params.id}/edit`);
  }
});

//Delete route
router.delete("/assignments/:id", async (req, res) => {
  console.log("DELETE route hit for assignment ID:", req.params.id);
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      req.flash("error_msg", "Assignment not found.");
      return res.redirect("/assignments");
    }

    if (!req.user || !assignment.userId.equals(req.user._id)) {
      req.flash("error_msg", "Unauthorized access.");
      return res.redirect("/assignments");
    }

    await Assignment.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Assignment deleted successfully!");
    res.redirect("/assignments");
  } catch (err) {
    req.flash("error_msg", "Error deleting assignment. Please try again.");
    res.redirect("/assignments");
  }
});

// Update user's filter preference
router.get("/assignments/set-filter/:filter", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const { filter } = req.params;
  if (filter !== 'all' && filter !== 'following') {
    return res.status(400).send("Invalid filter option.");
  }

  try {
    const user = await mongoose.model('User').findById(req.user._id);
    user.filterPreference = filter; // Update filter preference
    await user.save();
    res.redirect("/assignments");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/assignments/data", async (req, res) => {
  try {
    const filter = req.query.filter || (req.user ? req.user.filterPreference : 'all');

    let searchFilter = {};
    if (filter === 'following' && req.user) {
      const currentUser = await mongoose.model('User').findById(req.user._id);
      const followingIds = currentUser.following || [];
      searchFilter.userId = { $in: followingIds };
    }

    const assignments = await Assignment.find(searchFilter)
      .sort({ dueDate: 1 })
      .populate('userId', 'username profilePicture');

    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Toggle like on an assignment
router.post("/assignments/:id/like", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const userId = req.user._id;
    const index = assignment.likes.indexOf(userId);

    if (index === -1) {
      // Not yet liked — add
      assignment.likes.push(userId);

      // Create a like notification (if not liking own post)
      if (!assignment.userId.equals(userId)) {
        // Remove old notification if it exists
        await Notification.findOneAndDelete({
          recipient: assignment.userId,
          sender: userId,
          type: 'like',
          assignment: assignment._id
        });

        // Create new notification
        await Notification.create({
          recipient: assignment.userId,
          sender: userId,
          type: 'like',
          assignment: assignment._id
        });

        // Emit real-time event using Socket.IO
        const io = req.app.get('io');
        io.to(assignment.userId._id.toString()).emit('new-notification');
      }
    } else {
      // Already liked — remove
      assignment.likes.splice(index, 1);

      // Remove the existing like notification
      await Notification.findOneAndDelete({
        recipient: assignment.userId,
        sender: userId,
        type: 'like',
        assignment: assignment._id
      });
    }

    await assignment.save();
    res.json({ likesCount: assignment.likes.length, liked: index === -1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
