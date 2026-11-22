import { Favourite } from '../models/Favourite.js';
import { Property } from '../models/Property.js';
import { AppError, sendSuccess, asyncHandler } from '../utils/apiResponse.js';
import { sanitizePublicProperty } from '../utils/sanitizeProperty.js';

export const getFavourites = asyncHandler(async (req, res) => {
  const favs = await Favourite.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'propertyId',
      match: { status: 'approved' },
      populate: { path: 'ownerId', select: 'name phoneVerified createdAt' },
    });

  const properties = favs
    .filter((f) => Boolean(f.propertyId))
    .map((f) => ({
      favouriteId: f._id,
      savedAt: f.createdAt,
      property: sanitizePublicProperty(f.propertyId),
    }));

  return sendSuccess(res, {
    data: {
      favourites: properties,
      favouriteIds: properties.map((p) => String(p.property.id)),
    },
  });
});

export const getFavouriteIds = asyncHandler(async (req, res) => {
  const favs = await Favourite.find({ userId: req.user._id }).select('propertyId').lean();
  return sendSuccess(res, {
    data: { favouriteIds: favs.map((f) => String(f.propertyId)) },
  });
});

export const toggleFavourite = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const property = await Property.findOne({ _id: propertyId, status: 'approved' }).select('_id');
  if (!property) {
    throw new AppError('Property not found or unavailable', 404);
  }

  const existing = await Favourite.findOne({ userId: req.user._id, propertyId });
  if (existing) {
    await existing.deleteOne();
    return sendSuccess(res, {
      message: 'Removed from favourites',
      data: { isFavourited: false, propertyId },
    });
  }

  await Favourite.create({ userId: req.user._id, propertyId });
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Saved to favourites',
    data: { isFavourited: true, propertyId },
  });
});
