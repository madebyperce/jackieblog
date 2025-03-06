import mongoose from 'mongoose';

const PhotoSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  capturedAt: {
    type: Date,
    required: true,
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  metadata: {
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
    originalLocation: {
      type: String,
      required: false,
    },
    coordinates: {
      type: String,
      required: false,
    }
  }
});

export default mongoose.models.Photo || mongoose.model('Photo', PhotoSchema); 