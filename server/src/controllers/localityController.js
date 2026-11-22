import { Locality } from '../models/Locality.js';
import { Property } from '../models/Property.js';
import { AppError, sendSuccess, asyncHandler } from '../utils/apiResponse.js';
import { slugifyText } from '../utils/slugify.js';

export const getLocalities = asyncHandler(async (req, res) => {
  const { city, includeInactive } = req.query;
  const filter = {};
  if (!(includeInactive === 'true' && req.user?.role === 'admin')) {
    filter.active = true;
  }
  if (city && city.trim()) {
    filter.city = new RegExp(`^${city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }

  const [localities, counts] = await Promise.all([
    Locality.find(filter).sort({ city: 1, isPopular: -1, localityName: 1 }).lean(),
    Property.aggregate([
      { $match: { status: 'approved', availability: 'available' } },
      { $group: { _id: { city: '$city', locality: '$locality' }, count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(
    counts.map((c) => [`${c._id.city.toLowerCase()}::${c._id.locality.toLowerCase()}`, c.count])
  );

  const cities = [...new Set(localities.map((l) => l.city))];

  const enriched = localities.map((l) => ({
    id: l._id,
    city: l.city,
    localityName: l.localityName,
    slug: l.slug,
    coordinates: l.location?.coordinates || [81.8463, 25.4358],
    isPopular: l.isPopular,
    active: l.active,
    listingCount: countMap.get(`${l.city.toLowerCase()}::${l.localityName.toLowerCase()}`) || 0,
  }));

  return sendSuccess(res, {
    data: {
      cities,
      localities: enriched,
    },
  });
});

export const createLocality = asyncHandler(async (req, res) => {
  const { city, localityName, coordinates, isPopular, active } = req.body;

  const existing = await Locality.findOne({
    city: new RegExp(`^${city}$`, 'i'),
    localityName: new RegExp(`^${localityName}$`, 'i'),
  });
  if (existing) {
    throw new AppError(`${localityName} already exists in ${city}`, 409);
  }

  const locality = await Locality.create({
    city,
    localityName,
    slug: slugifyText(`${localityName}-${city}`),
    location: {
      type: 'Point',
      coordinates: coordinates || [81.8463, 25.4358],
    },
    isPopular,
    active,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Locality added successfully',
    data: { locality },
  });
});

export const updateLocality = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const locality = await Locality.findById(id);
  if (!locality) {
    throw new AppError('Locality not found', 404);
  }

  const { city, localityName, coordinates, isPopular, active } = req.body;
  if (city !== undefined) locality.city = city;
  if (localityName !== undefined) {
    locality.localityName = localityName;
    locality.slug = slugifyText(`${localityName}-${locality.city}`);
  }
  if (coordinates) {
    locality.location = { type: 'Point', coordinates };
  }
  if (isPopular !== undefined) locality.isPopular = isPopular;
  if (active !== undefined) locality.active = active;

  await locality.save();

  return sendSuccess(res, {
    message: 'Locality updated',
    data: { locality },
  });
});

export const deleteLocality = asyncHandler(async (req, res) => {
  const locality = await Locality.findByIdAndDelete(req.params.id);
  if (!locality) {
    throw new AppError('Locality not found', 404);
  }
  return sendSuccess(res, { message: 'Locality removed' });
});
