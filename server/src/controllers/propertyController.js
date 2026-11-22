import mongoose from 'mongoose';
import { Property } from '../models/Property.js';
import { Locality } from '../models/Locality.js';
import { Favourite } from '../models/Favourite.js';
import { Report } from '../models/Report.js';
import { AppError, sendSuccess, asyncHandler } from '../utils/apiResponse.js';
import { generatePropertySlug } from '../utils/slugify.js';
import { sanitizePublicProperty } from '../utils/sanitizeProperty.js';
import { deleteStoredImage } from '../services/imageService.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseBooleanQuery(val) {
  if (val === 'true' || val === true) return true;
  if (val === 'false' || val === false) return false;
  return undefined;
}

/**
 * Public Homepage curated sections — strictly backed by real approved DB listings.
 */
export const getHomepageSections = asyncHandler(async (req, res) => {
  const city = (req.query.city || 'Prayagraj').trim();
  const baseMatch = {
    status: 'approved',
    availability: 'available',
    city: new RegExp(`^${escapeRegex(city)}$`, 'i'),
  };

  const studentFilter = {
    ...baseMatch,
    'tenantPreferences.tenantTypes': { $in: ['Students', 'Any Tenant'] },
  };
  const familyFilter = {
    ...baseMatch,
    'tenantPreferences.tenantTypes': { $in: ['Families'] },
  };
  const girlsOnlyFilter = {
    ...baseMatch,
    'tenantPreferences.genderPreference': 'Girls Only',
  };
  const boysOnlyFilter = {
    ...baseMatch,
    'tenantPreferences.genderPreference': 'Boys Only',
  };
  const workingProFilter = {
    ...baseMatch,
    'tenantPreferences.tenantTypes': { $in: ['Working Professionals'] },
  };

  const [
    recentlyAdded,
    affordableRooms,
    studentRooms,
    familyRooms,
    girlsOnlyRooms,
    boysOnlyRooms,
    workingProfessionalRooms,
    studentsCount,
    familiesCount,
    girlsOnlyCount,
    boysOnlyCount,
    workingProCount,
    localities,
    localityCounts,
    totalApprovedCount,
  ] = await Promise.all([
    Property.find(baseMatch)
      .populate('ownerId', 'name phoneVerified createdAt')
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(6),
    Property.find({ ...baseMatch, monthlyRent: { $lte: 6500 } })
      .populate('ownerId', 'name phoneVerified createdAt')
      .sort({ monthlyRent: 1, createdAt: -1 })
      .limit(6),
    Property.find(studentFilter)
      .populate('ownerId', 'name phoneVerified createdAt')
      .sort({ monthlyRent: 1, createdAt: -1 })
      .limit(6),
    Property.find(familyFilter)
      .populate('ownerId', 'name phoneVerified createdAt')
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(6),
    Property.find(girlsOnlyFilter)
      .populate('ownerId', 'name phoneVerified createdAt')
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(6),
    Property.find(boysOnlyFilter)
      .populate('ownerId', 'name phoneVerified createdAt')
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(6),
    Property.find(workingProFilter)
      .populate('ownerId', 'name phoneVerified createdAt')
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(6),
    Property.countDocuments(studentFilter),
    Property.countDocuments(familyFilter),
    Property.countDocuments(girlsOnlyFilter),
    Property.countDocuments(boysOnlyFilter),
    Property.countDocuments(workingProFilter),
    Locality.find({ city: new RegExp(`^${escapeRegex(city)}$`, 'i'), active: true })
      .sort({ isPopular: -1, localityName: 1 })
      .lean(),
    Property.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$locality',
          count: { $sum: 1 },
          minRent: { $min: '$monthlyRent' },
        },
      },
    ]),
    Property.countDocuments(baseMatch),
  ]);

  const countMap = new Map(
    localityCounts.map((item) => [
      String(item._id).toLowerCase(),
      { count: item.count, minRent: item.minRent },
    ])
  );

  const popularLocations = localities
    .filter((loc) => loc.isPopular)
    .slice(0, 8)
    .map((loc) => {
      const stats = countMap.get(loc.localityName.toLowerCase()) || { count: 0, minRent: null };
      return {
        id: loc._id,
        city: loc.city,
        localityName: loc.localityName,
        slug: loc.slug,
        listingCount: stats.count,
        startingRent: stats.minRent,
      };
    });

  return sendSuccess(res, {
    data: {
      city,
      totalApprovedCount,
      recentlyAdded: recentlyAdded.map((p) => sanitizePublicProperty(p)),
      affordableRooms: affordableRooms.map((p) => sanitizePublicProperty(p)),
      studentRooms: studentRooms.map((p) => sanitizePublicProperty(p)),
      familyRooms: familyRooms.map((p) => sanitizePublicProperty(p)),
      girlsOnlyRooms: girlsOnlyRooms.map((p) => sanitizePublicProperty(p)),
      boysOnlyRooms: boysOnlyRooms.map((p) => sanitizePublicProperty(p)),
      workingProfessionalRooms: workingProfessionalRooms.map((p) => sanitizePublicProperty(p)),
      categoryCounts: {
        students: studentsCount,
        families: familiesCount,
        girlsOnly: girlsOnlyCount,
        boysOnly: boysOnlyCount,
        workingProfessionals: workingProCount,
      },
      popularLocations,
    },
  });
});

/**
 * Server-side filtered, sorted, paginated property search + nearby locality suggestions.
 */
export const searchProperties = asyncHandler(async (req, res) => {
  const {
    q,
    city,
    locality,
    minRent,
    maxRent,
    propertyType,
    furnishing,
    tenantType,
    genderPreference,
    occupancy,
    foodPreference,
    attachedBathroom,
    parking,
    wifi,
    ac,
    waterSupply,
    petsAllowed,
    smokingAllowed,
    availability = 'available',
    sort = 'newest',
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { status: 'approved' };

  if (availability && availability !== 'all') {
    filter.availability = availability;
  }

  if (city && city.trim()) {
    filter.city = new RegExp(`^${escapeRegex(city.trim())}$`, 'i');
  }

  if (locality && locality.trim()) {
    filter.locality = new RegExp(`^${escapeRegex(locality.trim())}$`, 'i');
  }

  if (q && q.trim()) {
    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [
      { title: regex },
      { locality: regex },
      { 'address.publicArea': regex },
      { 'address.landmark': regex },
      { description: regex },
    ];
  }

  if (minRent || maxRent) {
    filter.monthlyRent = {};
    if (minRent && !Number.isNaN(Number(minRent))) {
      filter.monthlyRent.$gte = Number(minRent);
    }
    if (maxRent && !Number.isNaN(Number(maxRent))) {
      filter.monthlyRent.$lte = Number(maxRent);
    }
    if (Object.keys(filter.monthlyRent).length === 0) {
      delete filter.monthlyRent;
    }
  }

  if (propertyType) {
    const types = String(propertyType)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (types.length > 0) filter.propertyType = { $in: types };
  }

  if (furnishing) {
    const items = String(furnishing)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length > 0) filter.furnishing = { $in: items };
  }

  if (tenantType) {
    const items = String(tenantType)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length > 0) {
      filter['tenantPreferences.tenantTypes'] = { $in: [...items, 'Any Tenant'] };
    }
  }

  if (genderPreference) {
    filter['tenantPreferences.genderPreference'] = genderPreference;
  }

  if (occupancy) {
    const items = String(occupancy)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length > 0) {
      filter['tenantPreferences.occupancy'] = { $in: items };
    }
  }

  if (foodPreference) {
    filter['tenantPreferences.foodPreference'] = foodPreference;
  }

  if (parseBooleanQuery(attachedBathroom) === true) {
    filter['amenities.attachedBathroom'] = true;
  }
  if (parseBooleanQuery(parking) === true) {
    filter['amenities.parking'] = true;
  }
  if (parseBooleanQuery(wifi) === true) {
    filter['amenities.wifi'] = true;
  }
  if (parseBooleanQuery(ac) === true) {
    filter['amenities.ac'] = true;
  }
  if (waterSupply && waterSupply.trim()) {
    filter['amenities.waterSupply'] = waterSupply.trim();
  }
  if (parseBooleanQuery(petsAllowed) === true) {
    filter['tenantPreferences.petsAllowed'] = true;
  }
  if (parseBooleanQuery(smokingAllowed) === true) {
    filter['tenantPreferences.smokingAllowed'] = true;
  }

  const sortMap = {
    newest: { approvedAt: -1, createdAt: -1 },
    rent_asc: { monthlyRent: 1, createdAt: -1 },
    rent_desc: { monthlyRent: -1, createdAt: -1 },
  };
  const sortQuery = sortMap[sort] || sortMap.newest;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(30, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('ownerId', 'name phoneVerified createdAt')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum),
    Property.countDocuments(filter),
  ]);

  // Suggest nearby localities using GeoJSON when a locality is selected or results are sparse
  let nearbyLocalities = [];
  if (locality && locality.trim()) {
    const targetLocality = await Locality.findOne({
      localityName: new RegExp(`^${escapeRegex(locality.trim())}$`, 'i'),
      active: true,
    });
    if (targetLocality?.location?.coordinates) {
      const nearby = await Locality.find({
        _id: { $ne: targetLocality._id },
        active: true,
        location: {
          $near: {
            $geometry: targetLocality.location,
            $maxDistance: 15000, // 15 km radius
          },
        },
      })
        .limit(6)
        .lean();

      const counts = await Property.aggregate([
        {
          $match: {
            status: 'approved',
            availability: 'available',
            locality: { $in: nearby.map((n) => n.localityName) },
          },
        },
        { $group: { _id: '$locality', count: { $sum: 1 } } },
      ]);
      const countMap = new Map(counts.map((c) => [c._id, c.count]));
      nearbyLocalities = nearby.map((n) => ({
        localityName: n.localityName,
        city: n.city,
        listingCount: countMap.get(n.localityName) || 0,
      }));
    }
  } else if (total === 0) {
    const popular = await Locality.find({ active: true, isPopular: true }).limit(6).lean();
    nearbyLocalities = popular.map((n) => ({
      localityName: n.localityName,
      city: n.city,
    }));
  }

  return sendSuccess(res, {
    data: {
      properties: properties.map((p) => sanitizePublicProperty(p)),
      nearbyLocalities,
    },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
});

/**
 * Public property detail by SEO slug (or Mongo ID fallback).
 */
export const getPropertyBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const query = mongoose.isValidObjectId(slug) ? { _id: slug } : { slug: slug.toLowerCase() };

  const property = await Property.findOne(query).populate('ownerId', 'name phoneVerified createdAt');

  if (!property) {
    throw new AppError('Property listing not found', 404);
  }

  const isOwner = req.user && String(property.ownerId?._id || property.ownerId) === String(req.user._id);
  const isAdmin = req.user && req.user.role === 'admin';

  if (property.status !== 'approved' && !isOwner && !isAdmin) {
    throw new AppError('This listing is currently not publicly available', 404);
  }

  // Increment view count asynchronously for public views
  if (!isOwner && !isAdmin) {
    Property.updateOne({ _id: property._id }, { $inc: { 'stats.views': 1 } }).catch(() => {});
  }

  let isFavourited = false;
  if (req.user) {
    const fav = await Favourite.exists({ userId: req.user._id, propertyId: property._id });
    isFavourited = Boolean(fav);
  }

  // Fetch similar rooms in the same city / locality
  const similar = await Property.find({
    _id: { $ne: property._id },
    status: 'approved',
    availability: 'available',
    city: property.city,
    $or: [{ locality: property.locality }, { propertyType: property.propertyType }],
  })
    .populate('ownerId', 'name phoneVerified createdAt')
    .sort({ approvedAt: -1 })
    .limit(3);

  return sendSuccess(res, {
    data: {
      property: sanitizePublicProperty(property, { includeExact: isOwner || isAdmin }),
      isFavourited,
      similarProperties: similar.map((p) => sanitizePublicProperty(p)),
    },
  });
});

/**
 * Track direct Call or WhatsApp owner contact clicks for owner analytics.
 */
export const trackContactClick = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { channel } = req.body || {};

  if (!['call', 'whatsapp'].includes(channel)) {
    throw new AppError('Channel must be "call" or "whatsapp"', 400);
  }

  const field = channel === 'call' ? 'stats.callClicks' : 'stats.whatsappClicks';
  await Property.updateOne({ _id: id, status: 'approved' }, { $inc: { [field]: 1 } });

  return sendSuccess(res, { message: 'Contact interaction recorded' });
});

/**
 * Create a new property listing (Direct Owners only).
 * New listings default to `pending` status until admin approves (or `draft` if explicitly saved as draft).
 */
export const createProperty = asyncHandler(async (req, res) => {
  const payload = req.body;

  // Anti-spam: prevent duplicate identical listing by the same owner within 24 hours
  const duplicate = await Property.findOne({
    ownerId: req.user._id,
    title: new RegExp(`^${escapeRegex(payload.title)}$`, 'i'),
    locality: new RegExp(`^${escapeRegex(payload.locality)}$`, 'i'),
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  if (duplicate) {
    throw new AppError(
      'You already created an identical listing in this locality recently. Edit your existing listing instead.',
      409
    );
  }

  // Resolve coordinates from Locality catalog when not supplied explicitly
  let location = payload.location;
  if (!location) {
    const locDoc = await Locality.findOne({
      city: new RegExp(`^${escapeRegex(payload.city)}$`, 'i'),
      localityName: new RegExp(`^${escapeRegex(payload.locality)}$`, 'i'),
    }).lean();
    location = locDoc?.location || { type: 'Point', coordinates: [81.8463, 25.4358] };
  }

  const photos = (payload.photos || []).map((photo, idx) => ({
    url: photo.url,
    publicId: photo.publicId,
    isPrimary: photo.isPrimary || idx === 0,
  }));

  const status = payload.saveAsDraft ? 'draft' : 'pending';

  if (status === 'pending' && photos.length === 0) {
    throw new AppError('Please upload at least 1 property photo before submitting for approval.', 400);
  }

  const slug = generatePropertySlug(payload.title, payload.locality, payload.city);

  const property = await Property.create({
    ownerId: req.user._id,
    slug,
    title: payload.title,
    description: payload.description,
    propertyType: payload.propertyType,
    monthlyRent: payload.monthlyRent,
    securityDeposit: payload.securityDeposit,
    negotiable: payload.negotiable,
    brokerage: 0,
    city: payload.city,
    locality: payload.locality,
    address: payload.address,
    location,
    furnishing: payload.furnishing,
    rooms: payload.rooms,
    bathrooms: payload.bathrooms,
    kitchen: payload.kitchen,
    floor: payload.floor,
    areaSqFt: payload.areaSqFt,
    amenities: payload.amenities,
    tenantPreferences: payload.tenantPreferences,
    photos,
    contactPhone: payload.contactPhone,
    whatsappNumber: payload.whatsappNumber || payload.contactPhone,
    isDirectOwner: true,
    status,
    availability: payload.availability || 'available',
    availableFrom: payload.availableFrom || new Date(),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message:
      status === 'draft'
        ? 'Property saved as draft'
        : 'Property submitted successfully and is pending admin approval',
    data: {
      property: sanitizePublicProperty(property, { includeExact: true }),
    },
  });
});

/**
 * List authenticated owner's properties + summary metrics.
 */
export const getOwnerProperties = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { ownerId: req.user._id };
  if (status && status !== 'all') {
    if (status === 'rented') {
      filter.availability = 'rented';
    } else {
      filter.status = status;
    }
  }

  const [properties, allOwnerProps] = await Promise.all([
    Property.find(filter).sort({ updatedAt: -1 }),
    Property.find({ ownerId: req.user._id }).select('status availability stats').lean(),
  ]);

  const stats = allOwnerProps.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === 'approved') acc.approved += 1;
      if (item.status === 'pending') acc.pending += 1;
      if (item.status === 'rejected') acc.rejected += 1;
      if (item.status === 'draft') acc.draft += 1;
      if (item.availability === 'rented') acc.rented += 1;
      acc.totalViews += item.stats?.views || 0;
      acc.totalCalls += item.stats?.callClicks || 0;
      acc.totalWhatsapp += item.stats?.whatsappClicks || 0;
      return acc;
    },
    {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      draft: 0,
      rented: 0,
      totalViews: 0,
      totalCalls: 0,
      totalWhatsapp: 0,
    }
  );

  return sendSuccess(res, {
    data: {
      stats,
      properties: properties.map((p) => sanitizePublicProperty(p, { includeExact: true })),
    },
  });
});

/**
 * Fetch a single owner property by ID (strictly verifies ownership).
 */
export const getOwnerPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    throw new AppError('Property not found', 404);
  }
  if (String(property.ownerId) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('You are not authorized to access this property', 403);
  }

  return sendSuccess(res, {
    data: {
      property: sanitizePublicProperty(property, { includeExact: true }),
    },
  });
});

/**
 * Update an owner's property (strict ownership check).
 * Substantial edits put the property back into `pending` moderation queue unless saved as `draft`.
 */
export const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    throw new AppError('Property not found', 404);
  }
  if (String(property.ownerId) !== String(req.user._id)) {
    throw new AppError('You can only edit your own property listings', 403);
  }

  const payload = req.body;
  const nextStatus = payload.saveAsDraft ? 'draft' : 'pending';

  if (nextStatus === 'pending' && (!payload.photos || payload.photos.length === 0)) {
    throw new AppError('At least 1 photo is required before submitting for approval.', 400);
  }

  // Update GeoJSON if locality changed
  if (payload.locality !== property.locality || payload.city !== property.city) {
    const locDoc = await Locality.findOne({
      city: new RegExp(`^${escapeRegex(payload.city)}$`, 'i'),
      localityName: new RegExp(`^${escapeRegex(payload.locality)}$`, 'i'),
    }).lean();
    if (locDoc?.location) {
      property.location = locDoc.location;
    }
  }

  // Clean up removed photos from storage
  const newPublicIds = new Set((payload.photos || []).map((p) => p.publicId));
  const removedPhotos = (property.photos || []).filter((p) => !newPublicIds.has(p.publicId));
  for (const removed of removedPhotos) {
    deleteStoredImage(removed.publicId).catch(() => {});
  }

  property.title = payload.title;
  property.description = payload.description;
  property.propertyType = payload.propertyType;
  property.monthlyRent = payload.monthlyRent;
  property.securityDeposit = payload.securityDeposit;
  property.negotiable = payload.negotiable;
  property.brokerage = 0;
  property.city = payload.city;
  property.locality = payload.locality;
  property.address = payload.address;
  property.furnishing = payload.furnishing;
  property.rooms = payload.rooms;
  property.bathrooms = payload.bathrooms;
  property.kitchen = payload.kitchen;
  property.floor = payload.floor;
  property.areaSqFt = payload.areaSqFt;
  property.amenities = payload.amenities;
  property.tenantPreferences = payload.tenantPreferences;
  property.photos = (payload.photos || []).map((photo, idx) => ({
    url: photo.url,
    publicId: photo.publicId,
    isPrimary: photo.isPrimary || idx === 0,
  }));
  property.contactPhone = payload.contactPhone;
  property.whatsappNumber = payload.whatsappNumber || payload.contactPhone;
  property.availability = payload.availability || property.availability;
  property.availableFrom = payload.availableFrom || property.availableFrom;
  property.status = nextStatus;
  property.rejectionReason = '';

  await property.save();

  return sendSuccess(res, {
    message:
      nextStatus === 'draft'
        ? 'Draft updated successfully'
        : 'Property updated and sent for admin re-approval',
    data: {
      property: sanitizePublicProperty(property, { includeExact: true }),
    },
  });
});

/**
 * Quick availability toggle (available <-> rented) for owner.
 */
export const updateAvailability = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    throw new AppError('Property not found', 404);
  }
  if (String(property.ownerId) !== String(req.user._id)) {
    throw new AppError('You can only update availability of your own listings', 403);
  }

  property.availability = req.body.availability;
  if (req.body.availableFrom) {
    property.availableFrom = req.body.availableFrom;
  }
  await property.save();

  return sendSuccess(res, {
    message: `Listing marked as ${property.availability}`,
    data: {
      property: sanitizePublicProperty(property, { includeExact: true }),
    },
  });
});

/**
 * Delete an owner's property listing & associated records/photos.
 */
export const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    throw new AppError('Property not found', 404);
  }
  if (String(property.ownerId) !== String(req.user._id)) {
    throw new AppError('You can only delete your own property listings', 403);
  }

  for (const photo of property.photos || []) {
    await deleteStoredImage(photo.publicId);
  }

  await Promise.all([
    Favourite.deleteMany({ propertyId: property._id }),
    Report.deleteMany({ propertyId: property._id }),
    property.deleteOne(),
  ]);

  return sendSuccess(res, { message: 'Property deleted permanently' });
});
