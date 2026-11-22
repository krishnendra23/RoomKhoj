export function formatINR(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateString) {
  if (!dateString) return '';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  return formatDate(dateString);
}

/**
 * Optimizes Cloudinary image URLs with automatic format & quality and responsive width.
 * Leaves non-Cloudinary URLs untouched.
 */
export function optimizeImageUrl(url, width = 800) {
  if (!url) {
    return 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';
  }
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  return url;
}

export function buildCallHref(phone) {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  return digits ? `tel:+91${digits}` : '#';
}

export function buildWhatsAppHref(phone, property) {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!digits) return '#';
  const pageUrl =
    typeof window !== 'undefined' && property?.slug
      ? `${window.location.origin}/rooms/${property.slug}`
      : '';
  const text = `Hi, I saw your ${property?.propertyType || 'room'} listing "${
    property?.title || ''
  }" in ${property?.locality || 'Prayagraj'} (${formatINR(
    property?.monthlyRent
  )}/month) on RoomKhoj. Is it currently available? ${pageUrl}`.trim();

  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
}

export function extractApiError(error, fallback = 'Something went wrong. Please try again.') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.details?.[0]?.message ||
    error?.message ||
    fallback
  );
}
