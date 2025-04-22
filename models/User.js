const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the User schema
const UserSchema = new mongoose.Schema({
  name: { type: String, default: 'CMTree User' },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: Buffer },
  bio: { type: String },
  link: { type: String },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  filterPreference: { type: String, enum: ['all', 'following'], default: 'all' }
});

// Compare input with stored password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the User model
module.exports = mongoose.model("User", UserSchema);
