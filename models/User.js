const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

//Define the User schema
const UserSchema = new mongoose.Schema({
  name: { type: String, default: 'CMTree User' },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

//Compare input with stored password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

//Export the User model
module.exports = mongoose.model("User", UserSchema);
