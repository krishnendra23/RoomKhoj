import mongoose from 'mongoose';

export const REPORT_REASONS = [
  'Broker or Agent Listing',
  'Fake or Duplicate Listing',
  'Incorrect Rent or Details',
  'Property Already Rented',
  'Inappropriate or Misleading Content',
  'Other',
];

export const REPORT_STATUSES = ['open', 'reviewed', 'resolved', 'dismissed'];

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporterIpHash: {
      type: String,
      select: false,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [600, 'Description cannot exceed 600 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'open',
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 400,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ status: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
