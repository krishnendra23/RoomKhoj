import mongoose from 'mongoose';

const favouriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

favouriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export const Favourite = mongoose.model('Favourite', favouriteSchema);
