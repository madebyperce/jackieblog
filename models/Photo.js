import mongoose from 'mongoose';

const PhotoSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: [true, 'Please provide an image URL'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
  },
  location: {
    type: String,
    required: [true, 'Please provide a location'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  capturedAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    latitude: Number,
    longitude: Number,
    coordinates: String,
    originalLocation: String,
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
});

export default mongoose.models.Photo || mongoose.model('Photo', PhotoSchema); 