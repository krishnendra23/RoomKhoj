import mongoose from 'mongoose';

const localitySchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
      default: 'Prayagraj',
      index: true,
    },
    localityName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [81.8463, 25.4358],
      },
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

localitySchema.index({ city: 1, localityName: 1 }, { unique: true });
localitySchema.index({ location: '2dsphere' });

export const Locality = mongoose.model('Locality', localitySchema);
