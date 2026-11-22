import { User } from '../models/User.js';
import { Property } from '../models/Property.js';
import { Report } from '../models/Report.js';
import { Favourite } from '../models/Favourite.js';
import { AppError, sendSuccess, asyncHandler } from '../utils/apiResponse.js';
import { sanitizePublicProperty } from '../utils/sanitizeProperty.js';
import { deleteStoredImage } from '../services/imageService.js';

export const getAdminStats = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalOwners,
    suspendedUsers,
    totalListings,
    pendingListings,
    approvedListings,
    rejectedListings,
    rentedListings,
    openReports,
    totalReports,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ accountStatus: 'suspended' }),
    Property.countDocuments({ status: { $ne: 'draft' } }),
    Property.countDocuments({ status: 'pending' }),
    Property.countDocuments({ status: 'approved' }),
    Property.countDocuments({ status: 'rejected' }),
    Property.countDocuments({ availability: 'rented' }),
    Report.countDocuments({ status: 'open' }),
    Report.countDocuments({}),
  ]);

  return sendSuccess(res, {
    data: {
      totalUsers,
      totalOwners,
      suspendedUsers,
      totalListings,
      pendingListings,
      approvedListings,
      rejectedListings,
      rentedListings,
      openReports,
      totalReports,
    },
  });
});

export const getAdminProperties = asyncHandler(async (req, res) => {
  const { status = 'pending', q, locality, page = 1, limit = 15 } = req.query;
  const filter = {};

  if (status && status !== 'all') {
    if (status === 'rented') {
      filter.availability = 'rented';
    } else {
      filter.status = status;
    }
  } else {
    filter.status = { $ne: 'draft' };
  }

  if (locality && locality.trim()) {
    filter.locality = new RegExp(locality.trim(), 'i');
  }

  if (q && q.trim()) {
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { locality: regex }, { contactPhone: regex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
  const skip = (pageNum - 1) * limitNum;

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('ownerId', 'name mobile role phoneVerified accountStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Property.countDocuments(filter),
  ]);

  const formatted = properties.map((p) => {
    const base = sanitizePublicProperty(p, { includeExact: true });
    return {
      ...base,
      ownerAccount: p.ownerId
        ? {
            id: p.ownerId._id,
            name: p.ownerId.name,
            mobile: p.ownerId.mobile,
            role: p.ownerId.role,
            phoneVerified: p.ownerId.phoneVerified,
            accountStatus: p.ownerId.accountStatus,
          }
        : null,
    };
  });

  return sendSuccess(res, {
    data: { properties: formatted },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
});

export const moderateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, rejectionReason } = req.body;

  const property = await Property.findById(id);
  if (!property) {
    throw new AppError('Property listing not found', 404);
  }

  if (action === 'approve') {
    property.status = 'approved';
    property.approvedAt = new Date();
    property.approvedBy = req.user._id;
    property.rejectionReason = '';
  } else if (action === 'reject') {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      throw new AppError('Please provide a clear rejection reason (at least 5 characters)', 400);
    }
    property.status = 'rejected';
    property.rejectionReason = rejectionReason.trim();
  }

  await property.save();

  return sendSuccess(res, {
    message:
      action === 'approve'
        ? 'Property approved and published live on RoomKhoj'
        : 'Property listing rejected',
    data: {
      property: sanitizePublicProperty(property, { includeExact: true }),
    },
  });
});

export const adminDeleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  for (const photo of property.photos || []) {
    await deleteStoredImage(photo.publicId);
  }

  await Promise.all([
    Favourite.deleteMany({ propertyId: property._id }),
    Report.deleteMany({ propertyId: property._id }),
    property.deleteOne(),
  ]);

  return sendSuccess(res, { message: 'Listing permanently removed by admin' });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const { role, status, q, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (role && role !== 'all') filter.role = role;
  if (status && status !== 'all') filter.accountStatus = status;
  if (q && q.trim()) {
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { mobile: regex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  const ownerIds = users.map((u) => u._id);
  const listingCounts = await Property.aggregate([
    { $match: { ownerId: { $in: ownerIds } } },
    { $group: { _id: '$ownerId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(listingCounts.map((c) => [String(c._id), c.count]));

  return sendSuccess(res, {
    data: {
      users: users.map((u) => ({
        ...u.toSafeObject(),
        listingCount: countMap.get(String(u._id)) || 0,
      })),
    },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { accountStatus } = req.body;

  if (String(id) === String(req.user._id)) {
    throw new AppError('You cannot suspend your own admin account', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (user.role === 'admin') {
    throw new AppError('Cannot modify another admin account status here', 403);
  }

  user.accountStatus = accountStatus;
  await user.save();

  // If an owner is suspended, reject their pending listings to keep marketplace clean
  if (accountStatus === 'suspended' && user.role === 'owner') {
    await Property.updateMany(
      { ownerId: user._id, status: { $in: ['pending', 'approved'] } },
      {
        status: 'rejected',
        rejectionReason: 'Listing removed because owner account was suspended by moderation.',
      }
    );
  }

  return sendSuccess(res, {
    message: `User account ${accountStatus === 'suspended' ? 'suspended' : 'reactivated'}`,
    data: { user: user.toSafeObject() },
  });
});

export const getAdminReports = asyncHandler(async (req, res) => {
  const { status = 'open', page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reportedBy', 'name mobile role')
      .populate({
        path: 'propertyId',
        select: 'title slug locality city monthlyRent status ownerId photos',
        populate: { path: 'ownerId', select: 'name mobile accountStatus' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Report.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: { reports },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
});

export const updateReportStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  const report = await Report.findById(id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  report.status = status;
  if (adminNote !== undefined) report.adminNote = adminNote;
  report.resolvedBy = req.user._id;
  await report.save();

  return sendSuccess(res, {
    message: `Report marked as ${status}`,
    data: { report },
  });
});
