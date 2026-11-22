import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  MessageCircle,
  Heart,
  Flag,
  ShieldCheck,
  Calendar,
  BedDouble,
  Bath,
  UtensilsCrossed,
  Layers,
  Maximize2,
  Droplets,
  CheckCircle2,
  ChevronRight,
  Share2,
  UserCheck,
  Clock,
} from 'lucide-react';
import Seo from '../components/common/Seo';
import ImageGallery from '../components/property/ImageGallery';
import TenantPreferenceCard from '../components/property/TenantPreferenceCard';
import PropertyCard from '../components/property/PropertyCard';
import ReportModal from '../components/property/ReportModal';
import { PropertyDetailSkeleton } from '../components/common/Skeletons';
import { propertyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AMENITIES_META } from '../utils/constants';
import {
  formatINR,
  formatDate,
  buildCallHref,
  buildWhatsAppHref,
  extractApiError,
} from '../utils/formatters';

export default function PropertyDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, favouriteIds, toggleFavourite } = useAuth();
  const toast = useToast();

  const [property, setProperty] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await propertyApi.getBySlug(slug);
        if (!active) return;
        setProperty(res.data?.property || null);
        setSimilar(res.data?.similarProperties || []);
      } catch {
        if (!active) return;
        setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <PropertyDetailSkeleton />;

  if (notFound || !property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Seo title="Listing Not Found" />
        <h1 className="text-2xl font-bold text-[#0F172A]">Property Listing Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">
          This room may have been removed or is no longer publicly listed.
        </p>
        <Link
          to="/rooms"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8]"
        >
          Browse Available Rooms
        </Link>
      </div>
    );
  }

  const isSaved = favouriteIds.has(String(property.id));
  const amenities = property.amenities || {};
  const availableAmenities = AMENITIES_META.filter((item) => Boolean(amenities[item.key]));

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to save favourite rooms');
      navigate(`/login?redirect=${encodeURIComponent(`/rooms/${property.slug}`)}`);
      return;
    }
    try {
      const saved = await toggleFavourite(property.id);
      toast.success(saved ? 'Saved to your favourites' : 'Removed from favourites');
    } catch (err) {
      toast.error(extractApiError(err, 'Could not update favourite'));
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `${property.title} in ${property.locality}, ${property.city} — ${formatINR(
            property.monthlyRent
          )}/month on RoomKhoj`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Listing link copied to clipboard');
    } catch {
      toast.info(shareUrl);
    }
  };

  const handleContactTrack = (channel) => {
    propertyApi.trackContact(property.id, channel).catch(() => {});
  };

  const callHref = buildCallHref(property.contactPhone);
  const waHref = buildWhatsAppHref(property.whatsappNumber || property.contactPhone, property);

  return (
    <div className="bg-[#F8FAFC] pb-24 lg:pb-14">
      <Seo
        title={`${property.title} — ${property.locality}, ${property.city}`}
        description={`${property.propertyType} for rent in ${property.locality}, ${
          property.city
        } at ${formatINR(property.monthlyRent)}/month. ${property.furnishing}. Direct owner, zero brokerage.`}
        ogImage={property.photos?.[0]?.url}
      />

      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 text-xs text-slate-500">
          <nav className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-[#2563EB]">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link to="/rooms" className="hover:text-[#2563EB]">
              {property.city}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link
              to={`/rooms?city=${encodeURIComponent(property.city)}&locality=${encodeURIComponent(
                property.locality
              )}`}
              className="hover:text-[#2563EB]"
            >
              {property.locality}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[#0F172A] font-medium truncate max-w-[200px]">
              {property.title}
            </span>
          </nav>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#2563EB] shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {property.status !== 'approved' && (
          <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
            <strong>Preview Notice:</strong> This listing currently has status{' '}
            <span className="uppercase font-bold">{property.status}</span> and is only visible to
            you and RoomKhoj moderators.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-6">
            {/* Image Gallery */}
            <ImageGallery photos={property.photos} title={property.title} />

            {/* Header Info Card */}
            <section className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200/70">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Direct Owner • Zero Brokerage
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB]">
                  {property.propertyType}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {property.furnishing}
                </span>
                {property.availability === 'rented' ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    Currently Rented
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#16A34A]">
                    Available
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-snug">
                {property.title}
              </h1>

              <p className="mt-2.5 flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <span>
                  {property.address?.publicArea ? `${property.address.publicArea}, ` : ''}
                  {property.locality}, {property.city}
                  {property.address?.pincode ? ` - ${property.address.pincode}` : ''}
                  {property.address?.landmark ? (
                    <span className="block text-xs text-slate-500 mt-0.5">
                      Landmark: {property.address.landmark}
                    </span>
                  ) : null}
                </span>
              </p>

              {/* Quick Specs Row */}
              <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5 text-[#2563EB]" /> Rooms
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#0F172A]">
                    {property.rooms} {property.rooms === 1 ? 'Room' : 'Rooms'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-[#2563EB]" /> Bathrooms
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#0F172A]">
                    {property.bathrooms}{' '}
                    {amenities.attachedBathroom ? '(Attached)' : '(Common)'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#2563EB]" /> Kitchen
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#0F172A]">{property.kitchen}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#2563EB]" /> Floor
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#0F172A]">
                    {property.floor || 'Ground Floor'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#2563EB]" /> Available From
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#0F172A]">
                    {formatDate(property.availableFrom)}
                  </p>
                </div>
              </div>

              {property.areaSqFt && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Approximate Area: <strong className="text-[#0F172A]">{property.areaSqFt} sq.ft</strong>
                </p>
              )}

              {/* Description */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h2 className="text-base font-bold text-[#0F172A] mb-2">About This Property</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            </section>

            {/* Tenant Preferences — Prominent Section */}
            <TenantPreferenceCard preferences={property.tenantPreferences} />

            {/* Facilities & Amenities */}
            <section className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-[#0F172A]">Facilities &amp; Amenities</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100">
                  <Droplets className="w-3.5 h-3.5" />
                  Water Supply: {amenities.waterSupply || '24x7'}
                </span>
              </div>

              {availableAmenities.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableAmenities.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-2.5 rounded-xl bg-slate-50/90 border border-slate-100 px-3.5 py-2.5 text-sm font-medium text-[#0F172A]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      {item.label}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Standard basic utilities provided. Confirm specific appliances directly with the
                  owner.
                </p>
              )}
            </section>

            {/* Listing Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Listed on {formatDate(property.createdAt)}
                </span>
                <span>Last updated {formatDate(property.updatedAt)}</span>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold"
              >
                <Flag className="w-3.5 h-3.5" />
                Report this listing
              </button>
            </div>
          </div>

          {/* RIGHT STICKY SIDEBAR */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* Rent & Direct Contact Card */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    {formatINR(property.monthlyRent)}
                  </span>
                  <span className="text-sm font-medium text-slate-500"> / month</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    property.negotiable
                      ? 'bg-blue-50 text-[#2563EB]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {property.negotiable ? 'Negotiable' : 'Fixed Rent'}
                </span>
              </div>

              <div className="mt-4 space-y-2.5 py-4 border-y border-slate-100 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Security Deposit</span>
                  <span className="font-semibold text-[#0F172A]">
                    {property.securityDeposit > 0
                      ? formatINR(property.securityDeposit)
                      : 'No Deposit'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Brokerage Fee</span>
                  <span className="font-bold text-[#16A34A]">₹0 (Direct Owner)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Availability</span>
                  <span className="font-semibold text-[#0F172A] capitalize">
                    {property.availability === 'available'
                      ? `From ${formatDate(property.availableFrom)}`
                      : 'Currently Rented'}
                  </span>
                </div>
              </div>

              {/* Owner Information (Privacy-Controlled) */}
              <div className="mt-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0F172A] text-white font-bold flex items-center justify-center uppercase shrink-0">
                  {property.owner?.name?.charAt(0) || 'O'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0F172A] truncate">
                    {property.owner?.name || 'Property Owner'}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                    Direct Property Owner
                    {property.owner?.memberSince
                      ? ` • Since ${new Date(property.owner.memberSince).getFullYear()}`
                      : ''}
                  </p>
                </div>
              </div>

              {/* Prominent Call & WhatsApp Buttons */}
              <div className="mt-5 space-y-2.5">
                <motion.a
                  whileTap={{ scale: 0.98 }}
                  href={callHref}
                  onClick={() => handleContactTrack('call')}
                  className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Owner (+91 {property.contactPhone})
                </motion.a>

                <motion.a
                  whileTap={{ scale: 0.98 }}
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactTrack('whatsapp')}
                  className="w-full py-3 px-4 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Owner
                </motion.a>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSave}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isSaved
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved ? 'Saved' : 'Save Favourite'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Report Listing
                  </button>
                </div>
              </div>

              <p className="mt-4 text-[11px] text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                <strong>Safety Tip:</strong> Visit the room in person before paying any rent or
                security deposit. Never transfer money to anyone claiming brokerage on RoomKhoj.
              </p>
            </div>
          </aside>
        </div>

        {/* Similar Listings */}
        {similar.length > 0 && (
          <section className="mt-14 pt-10 border-t border-slate-200/80">
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">
              Similar Rooms in {property.city}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((item, idx) => (
                <PropertyCard key={item.id} property={item} index={idx} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Fixed Call & WhatsApp Action Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center gap-2.5 shadow-lg">
        <a
          href={callHref}
          onClick={() => handleContactTrack('call')}
          className="flex-1 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          <Phone className="w-4 h-4" />
          Call Owner
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleContactTrack('whatsapp')}
          className="flex-1 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        propertyId={property.id}
        propertyTitle={property.title}
      />
    </div>
  );
}
