import mongoose from 'mongoose';

export const PROPERTY_TYPES = ['Single Room', '1BHK', '2BHK', 'Flat', 'PG'];
export const FURNISHING_TYPES = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
export const KITCHEN_TYPES = ['Private Kitchen', 'Shared Kitchen', 'No Kitchen'];
export const WATER_SUPPLY_TYPES = ['24x7', 'Morning & Evening', 'Regular', 'Limited'];
export const TENANT_TYPES = [
  'Students',
  'Families',
  'Working Professionals',
  'Bachelors',
  'Couples',
  'Any Tenant',
];
export const GENDER_PREFERENCES = ['Girls Only', 'Boys Only', 'Any Gender'];
export const OCCUPANCY_TYPES = [
  'Single Occupancy',
  'Double Sharing',
  'Triple Sharing',
  'Multiple Sharing',
];
export const FOOD_PREFERENCES = [
  'Vegetarian Only',
  'Non-Vegetarian Allowed',
  'Any Food Preference',
];
export const VISITOR_POLICIES = ['Allowed', 'Restricted'];
export const PROPERTY_STATUSES = ['draft', 'pending', 'approved', 'rejected'];
export const AVAILABILITY_STATUSES = ['available', 'rented'];

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      minlength: [8, 'Title must be at least 8 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2500, 'Description cannot exceed 2500 characters'],
    },
    propertyType: {
      type: String,
      enum: PROPERTY_TYPES,
      required: true,
      index: true,
    },
    monthlyRent: {
      type: Number,
      required: true,
      min: [500, 'Monthly rent must be at least ₹500'],
      max: [500000, 'Monthly rent cannot exceed ₹5,00,000'],
      index: true,
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative'],
      max: [2000000, 'Security deposit is too high'],
    },
    negotiable: {
      type: Boolean,
      default: false,
    },
    brokerage: {
      type: Number,
      default: 0,
      min: 0,
      max: [0, 'RoomKhoj is strictly for direct property owners with zero brokerage'],
    },
    city: {
      type: String,
      required: true,
      trim: true,
      default: 'Prayagraj',
      index: true,
    },
    locality: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      publicArea: {
        type: String,
        required: [true, 'Street / area name is required'],
        trim: true,
        maxlength: 160,
      },
      landmark: {
        type: String,
        trim: true,
        maxlength: 140,
        default: '',
      },
      exactAddress: {
        type: String,
        trim: true,
        maxlength: 220,
        default: '',
      },
      pincode: {
        type: String,
        trim: true,
        match: [/^(\d{6})?$/, 'Pincode must be a 6-digit number'],
        default: '',
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [81.8463, 25.4358], // Prayagraj center
        validate: {
          validator: (coords) =>
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 &&
            coords[1] >= -90 &&
            coords[1] <= 90,
          message: 'Invalid GeoJSON coordinates [lng, lat]',
        },
      },
    },
    furnishing: {
      type: String,
      enum: FURNISHING_TYPES,
      required: true,
      index: true,
    },
    rooms: {
      type: Number,
      default: 1,
      min: 1,
      max: 20,
    },
    bathrooms: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    kitchen: {
      type: String,
      enum: KITCHEN_TYPES,
      default: 'No Kitchen',
    },
    floor: {
      type: String,
      trim: true,
      maxlength: 40,
      default: 'Ground Floor',
    },
    areaSqFt: {
      type: Number,
      min: 50,
      max: 20000,
    },
    amenities: {
      attachedBathroom: { type: Boolean, default: false, index: true },
      parking: { type: Boolean, default: false, index: true },
      wifi: { type: Boolean, default: false, index: true },
      ac: { type: Boolean, default: false, index: true },
      waterSupply: {
        type: String,
        enum: WATER_SUPPLY_TYPES,
        default: '24x7',
      },
      powerBackup: { type: Boolean, default: false },
      geyser: { type: Boolean, default: false },
      roWater: { type: Boolean, default: false },
      cctv: { type: Boolean, default: false },
      lift: { type: Boolean, default: false },
      washingMachine: { type: Boolean, default: false },
      refrigerator: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
      studyTable: { type: Boolean, default: false },
      wardrobe: { type: Boolean, default: false },
      bed: { type: Boolean, default: false },
    },
    tenantPreferences: {
      tenantTypes: {
        type: [{ type: String, enum: TENANT_TYPES }],
        default: ['Any Tenant'],
        validate: {
          validator: (arr) => Array.isArray(arr) && arr.length > 0,
          message: 'Select at least one tenant type',
        },
      },
      genderPreference: {
        type: String,
        enum: GENDER_PREFERENCES,
        default: 'Any Gender',
        index: true,
      },
      occupancy: {
        type: [{ type: String, enum: OCCUPANCY_TYPES }],
        default: ['Single Occupancy'],
        validate: {
          validator: (arr) => Array.isArray(arr) && arr.length > 0,
          message: 'Select at least one occupancy option',
        },
      },
      foodPreference: {
        type: String,
        enum: FOOD_PREFERENCES,
        default: 'Any Food Preference',
        index: true,
      },
      smokingAllowed: { type: Boolean, default: false },
      petsAllowed: { type: Boolean, default: false },
      visitorsAllowed: {
        type: String,
        enum: VISITOR_POLICIES,
        default: 'Allowed',
      },
      couplesAllowed: { type: Boolean, default: false },
      timingRestrictions: {
        type: String,
        trim: true,
        maxlength: 160,
        default: '',
      },
      otherRules: {
        type: String,
        trim: true,
        maxlength: 500,
        default: '',
      },
    },
    photos: {
      type: [photoSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Maximum 10 property photos are allowed',
      },
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Contact phone must be a valid 10-digit Indian mobile number'],
    },
    whatsappNumber: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'WhatsApp number must be a valid 10-digit Indian mobile number'],
    },
    isDirectOwner: {
      type: Boolean,
      required: true,
      default: true,
      validate: {
        validator: (v) => v === true,
        message: 'Only direct property owners can list properties on RoomKhoj',
      },
    },
    status: {
      type: String,
      enum: PROPERTY_STATUSES,
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 400,
      default: '',
    },
    availability: {
      type: String,
      enum: AVAILABILITY_STATUSES,
      default: 'available',
      index: true,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    stats: {
      views: { type: Number, default: 0 },
      callClicks: { type: Number, default: 0 },
      whatsappClicks: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// GeoJSON 2dsphere index for location-based search & nearby properties
propertySchema.index({ location: '2dsphere' });
// Compound indexes for high-performance server-side search & moderation queries
propertySchema.index({ status: 1, availability: 1, city: 1, locality: 1, monthlyRent: 1 });
propertySchema.index({ status: 1, createdAt: -1 });
propertySchema.index({ status: 1, 'tenantPreferences.genderPreference': 1, monthlyRent: 1 });
propertySchema.index({ status: 1, 'tenantPreferences.tenantTypes': 1, createdAt: -1 });
propertySchema.index({ ownerId: 1, createdAt: -1 });

export const Property = mongoose.model('Property', propertySchema);
