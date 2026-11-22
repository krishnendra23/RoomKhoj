/**
 * Sanitizes a property document for public responses.
 * - Excludes exact house/flat address to prevent exposing private owner address publicly.
 * - Excludes internal owner metadata and only exposes public owner display name + member since + verified status.
 */
export function sanitizePublicProperty(propertyDoc, { includeExact = false } = {}) {
  const doc = propertyDoc.toObject ? propertyDoc.toObject() : { ...propertyDoc };

  const publicAddress = {
    publicArea: doc.address?.publicArea || '',
    landmark: doc.address?.landmark || '',
    pincode: doc.address?.pincode || '',
  };

  if (includeExact && doc.address?.exactAddress) {
    publicAddress.exactAddress = doc.address.exactAddress;
  }

  let owner = null;
  if (doc.ownerId && typeof doc.ownerId === 'object' && doc.ownerId.name) {
    owner = {
      name: doc.ownerId.name,
      phoneVerified: Boolean(doc.ownerId.phoneVerified),
      memberSince: doc.ownerId.createdAt,
      isDirectOwner: true,
    };
  }

  return {
    id: doc._id,
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    propertyType: doc.propertyType,
    monthlyRent: doc.monthlyRent,
    securityDeposit: doc.securityDeposit,
    negotiable: doc.negotiable,
    brokerage: doc.brokerage ?? 0,
    city: doc.city,
    locality: doc.locality,
    address: publicAddress,
    location: doc.location,
    furnishing: doc.furnishing,
    rooms: doc.rooms,
    bathrooms: doc.bathrooms,
    kitchen: doc.kitchen,
    floor: doc.floor,
    areaSqFt: doc.areaSqFt,
    amenities: doc.amenities,
    tenantPreferences: doc.tenantPreferences,
    photos: doc.photos || [],
    contactPhone: doc.contactPhone,
    whatsappNumber: doc.whatsappNumber || doc.contactPhone,
    isDirectOwner: doc.isDirectOwner,
    status: doc.status,
    rejectionReason: includeExact ? doc.rejectionReason : undefined,
    availability: doc.availability,
    availableFrom: doc.availableFrom,
    approvedAt: doc.approvedAt,
    stats: includeExact ? doc.stats : { views: doc.stats?.views || 0 },
    owner,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
