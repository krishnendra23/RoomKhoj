import { z } from 'zod';
import {
  PROPERTY_TYPES,
  FURNISHING_TYPES,
  KITCHEN_TYPES,
  WATER_SUPPLY_TYPES,
  TENANT_TYPES,
  GENDER_PREFERENCES,
  OCCUPANCY_TYPES,
  FOOD_PREFERENCES,
  VISITOR_POLICIES,
  AVAILABILITY_STATUSES,
} from '../models/Property.js';
import { REPORT_REASONS, REPORT_STATUSES } from '../models/Report.js';

const indianMobileSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/^\+91/, '').replace(/[\s-]/g, ''))
  .refine((val) => /^[6-9]\d{9}$/.test(val), {
    message: 'Enter a valid 10-digit Indian mobile number',
  });

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(80),
    mobile: indianMobileSchema,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password cannot exceed 72 characters')
      .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
        message: 'Password must include both letters and numbers',
      }),
    confirmPassword: z.string(),
    // Security: Public registration NEVER permits 'admin'
    role: z.enum(['seeker', 'owner']).default('owner'),
    isDirectOwnerDeclared: z.boolean().optional().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.role !== 'owner' || data.isDirectOwnerDeclared === true, {
    message: 'Property owners must confirm they are direct owners and not brokers/agents',
    path: ['isDirectOwnerDeclared'],
  });

export const loginSchema = z.object({
  mobile: indianMobileSchema,
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  upgradeToOwner: z.boolean().optional(),
  isDirectOwnerDeclared: z.boolean().optional(),
});

export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
});

const photoInputSchema = z.object({
  url: z.string().url('Invalid photo URL'),
  publicId: z.string().min(1, 'Photo publicId is required'),
  isPrimary: z.boolean().optional().default(false),
});

const tenantPreferencesSchema = z
  .object({
    tenantTypes: z
      .array(z.enum(TENANT_TYPES))
      .min(1, 'Select at least one eligible tenant type')
      .transform((arr) => (arr.includes('Any Tenant') ? ['Any Tenant'] : [...new Set(arr)])),
    genderPreference: z.enum(GENDER_PREFERENCES),
    occupancy: z
      .array(z.enum(OCCUPANCY_TYPES))
      .min(1, 'Select at least one occupancy option')
      .transform((arr) => [...new Set(arr)]),
    foodPreference: z.enum(FOOD_PREFERENCES),
    smokingAllowed: z.boolean().default(false),
    petsAllowed: z.boolean().default(false),
    visitorsAllowed: z.enum(VISITOR_POLICIES).default('Allowed'),
    couplesAllowed: z.boolean().default(false),
    timingRestrictions: z.string().trim().max(160).optional().default(''),
    otherRules: z.string().trim().max(500).optional().default(''),
  })
  .superRefine((tp, ctx) => {
    // Prevent contradictory combinations
    if (
      (tp.genderPreference === 'Girls Only' || tp.genderPreference === 'Boys Only') &&
      tp.couplesAllowed
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['couplesAllowed'],
        message: `Couples cannot be allowed when gender preference is "${tp.genderPreference}"`,
      });
    }
    if (
      (tp.genderPreference === 'Girls Only' || tp.genderPreference === 'Boys Only') &&
      tp.tenantTypes.includes('Couples')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tenantTypes'],
        message: `"Couples" tenant type conflicts with "${tp.genderPreference}" preference`,
      });
    }
    if (
      (tp.genderPreference === 'Girls Only' || tp.genderPreference === 'Boys Only') &&
      tp.tenantTypes.includes('Families')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tenantTypes'],
        message: `"Families" tenant type conflicts with "${tp.genderPreference}" preference`,
      });
    }
  });

export const propertyPayloadSchema = z.object({
  title: z.string().trim().min(8, 'Title must be at least 8 characters').max(120),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(2500),
  propertyType: z.enum(PROPERTY_TYPES),
  monthlyRent: z.coerce.number().int().min(500, 'Minimum rent is ₹500').max(500000),
  securityDeposit: z.coerce.number().int().min(0).max(2000000).default(0),
  negotiable: z.boolean().default(false),
  brokerage: z.coerce
    .number()
    .int()
    .refine((v) => v === 0, { message: 'RoomKhoj strictly allows zero-brokerage direct owner listings' })
    .default(0),
  city: z.string().trim().min(2).max(60).default('Prayagraj'),
  locality: z.string().trim().min(2, 'Select a locality').max(80),
  address: z.object({
    publicArea: z.string().trim().min(3, 'Enter street / area / sector').max(160),
    landmark: z.string().trim().max(140).optional().default(''),
    exactAddress: z.string().trim().max(220).optional().default(''),
    pincode: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\d{6}$/.test(v), 'Pincode must be 6 digits')
      .optional()
      .default(''),
  }),
  location: z
    .object({
      type: z.literal('Point').default('Point'),
      coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
    })
    .optional(),
  furnishing: z.enum(FURNISHING_TYPES),
  rooms: z.coerce.number().int().min(1).max(20).default(1),
  bathrooms: z.coerce.number().int().min(1).max(10).default(1),
  kitchen: z.enum(KITCHEN_TYPES).default('No Kitchen'),
  floor: z.string().trim().max(40).optional().default('Ground Floor'),
  areaSqFt: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(50).max(20000).optional()
  ),
  amenities: z.object({
    attachedBathroom: z.boolean().default(false),
    parking: z.boolean().default(false),
    wifi: z.boolean().default(false),
    ac: z.boolean().default(false),
    waterSupply: z.enum(WATER_SUPPLY_TYPES).default('24x7'),
    powerBackup: z.boolean().default(false),
    geyser: z.boolean().default(false),
    roWater: z.boolean().default(false),
    cctv: z.boolean().default(false),
    lift: z.boolean().default(false),
    washingMachine: z.boolean().default(false),
    refrigerator: z.boolean().default(false),
    balcony: z.boolean().default(false),
    studyTable: z.boolean().default(false),
    wardrobe: z.boolean().default(false),
    bed: z.boolean().default(false),
  }),
  tenantPreferences: tenantPreferencesSchema,
  photos: z.array(photoInputSchema).max(10, 'Maximum 10 photos allowed').default([]),
  contactPhone: indianMobileSchema,
  whatsappNumber: indianMobileSchema.optional(),
  isDirectOwner: z
    .boolean()
    .refine((v) => v === true, { message: 'Only direct property owners can publish on RoomKhoj' }),
  availableFrom: z.coerce.date().optional(),
  availability: z.enum(AVAILABILITY_STATUSES).optional().default('available'),
  saveAsDraft: z.boolean().optional().default(false),
});

export const availabilityUpdateSchema = z.object({
  availability: z.enum(AVAILABILITY_STATUSES),
  availableFrom: z.coerce.date().optional(),
});

export const reportCreateSchema = z.object({
  propertyId: z.string().min(12, 'Invalid property ID'),
  reason: z.enum(REPORT_REASONS),
  description: z.string().trim().max(600).optional().default(''),
});

export const adminModerationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().trim().max(400).optional().default(''),
});

export const adminUserStatusSchema = z.object({
  accountStatus: z.enum(['active', 'suspended']),
});

export const adminReportStatusSchema = z.object({
  status: z.enum(REPORT_STATUSES),
  adminNote: z.string().trim().max(400).optional().default(''),
});

export const localitySchema = z.object({
  city: z.string().trim().min(2).max(60).default('Prayagraj'),
  localityName: z.string().trim().min(2).max(80),
  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
    .optional(),
  isPopular: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});
