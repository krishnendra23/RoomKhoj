import crypto from 'crypto';
import { Report } from '../models/Report.js';
import { Property } from '../models/Property.js';
import { AppError, sendSuccess, asyncHandler } from '../utils/apiResponse.js';

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(String(ip || 'unknown'))
    .digest('hex');
}

export const createReport = asyncHandler(async (req, res) => {
  const { propertyId, reason, description } = req.body;

  const property = await Property.findById(propertyId).select('_id ownerId status');
  if (!property || property.status !== 'approved') {
    throw new AppError('Property not found', 404);
  }

  if (req.user && String(property.ownerId) === String(req.user._id)) {
    throw new AppError('You cannot report your own property listing', 400);
  }

  const ipHash = hashIp(req.ip);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const dupQuery = req.user
    ? { propertyId, reportedBy: req.user._id, createdAt: { $gte: since } }
    : { propertyId, reporterIpHash: ipHash, createdAt: { $gte: since } };

  const alreadyReported = await Report.findOne(dupQuery);
  if (alreadyReported) {
    throw new AppError('You have already reported this listing recently. Our team will review it.', 409);
  }

  const report = await Report.create({
    reportedBy: req.user ? req.user._id : null,
    reporterIpHash: ipHash,
    propertyId,
    reason,
    description,
    status: 'open',
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Thank you. Your report has been submitted to RoomKhoj moderation.',
    data: { reportId: report._id },
  });
});
