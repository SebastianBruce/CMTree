const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String },
  description: { type: String, required: true },
  eventDate: { type: Date },
  type: { type: String, enum: ['update', 'blog', 'event'], default: 'update' },
  createdAt: { type: Date, default: Date.now },
  file: { type: String },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Post', postSchema, 'posts');
