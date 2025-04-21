const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Assignment = require("../models/Assignment");

const EXAMPLE_USER_ID = new mongoose.Types.ObjectId("67f9a990b64a6366c1f78774");

//List assignments
router.get("/assignments", async (req, res) => {
  try {
    const rawUserId = req.user ? req.user._id : EXAMPLE_USER_ID;
    const userId = new mongoose.Types.ObjectId(rawUserId);

    const sortBy = req.query.sortBy || 'dueDate';
    const searchQuery = req.query.search || '';

    let sortOption = {};
    if (sortBy === 'class') sortOption = { class: 1 };
    else if (sortBy === 'title') sortOption = { title: 1 };
    else sortOption = { dueDate: 1 };

    let searchFilter = { userId };
    if (searchQuery) {
      const regex = new RegExp(searchQuery, "i");
      searchFilter.$or = [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
      ];
    }

    const assignments = await Assignment.find(searchFilter).sort(sortOption);

    res.render("assignments", {
      assignments,
      searchQuery,
      sortBy,
      isGuest: !req.user,
    });
  } catch (err) {
    console.error("Error loading assignments:", err);
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
    console.error("Error adding assignment:", err);
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

    if (!req.user && !assignment.userId.equals(EXAMPLE_USER_ID) || req.user && !assignment.userId.equals(req.user._id)) {
      req.flash("error_msg", "Unauthorized access.");
      return res.redirect("/assignments");
    }

    res.render("assignment-details", {
      assignment,
      isGuest: !req.user,
    });
  } catch (err) {
    console.error("Error loading assignment:", err);
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
    console.error("Error loading assignment for edit:", err);
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
    console.error("Error updating assignment:", err);
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
    console.error("Error deleting assignment:", err);
    req.flash("error_msg", "Error deleting assignment. Please try again.");
    res.redirect("/assignments");
  }
});

module.exports = router;
