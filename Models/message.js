import mongoose from 'mongoose';
const { Schema, Types } = mongoose;

const messageSchema = new Schema(
  {
    content: String,
    creator: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    chat: {
      type: Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Message', messageSchema);