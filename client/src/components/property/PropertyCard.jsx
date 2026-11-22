import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Heart,
  ShieldCheck,
  Users,
  Utensils,
  Wifi,
  Snowflake,
  Bath,
  BedDouble,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  formatINR,
  optimizeImageUrl,
  extractApiError,
} from '../../utils/formatters';

export default function PropertyCard({ property, index = 0 }) {
  const { isAuthenticated, favouriteIds, toggleFavourite } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isSaved = favouriteIds.has(String(property.id));
  const primaryPhoto =
    property.photos?.find((p) => p.isPrimary)?.url || property.photos?.[0]?.url;

  const tp = property.tenantPreferences || {};
  const amenities = property.amenities || {};
  const isAvailable = property.availability !== 'rented';

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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

  const genderBadgeStyle =
    tp.genderPreference === 'Girls Only'
      ? 'bg-rose-50 text-rose-700 border-rose-200/80'
      : tp.genderPreference === 'Boys Only'
      ? 'bg-sky-50 text-sky-700 border-sky-200/80'
      : 'bg-[#F8FAFC] text-slate-700 border-[#E2E8F0]';

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.22) }}
      whileHover={{ y: -4 }}
      className="group rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover:shadow-xl hover:shadow-slate-200/80 hover:border-blue-200 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Large Property Image */}
      <Link to={`/rooms/${property.slug}`} className="relative block aspect-[16/10] bg-slate-100 overflow-hidden">
        <img
          src={optimizeImageUrl(primaryPhoto, 760)}
          alt={`${property.title} in ${property.locality}, ${property.city}`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
        />

        {/* Top Left Badges — Clean Light Surfaces */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-[#0F172A] shadow-sm border border-white/60">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            Direct Owner
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-[#2563EB] shadow-sm">
            {property.propertyType}
          </span>
        </div>

        {/* Save Favourite Button */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={isSaved ? 'Remove from favourites' : 'Save to favourites'}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
            isSaved
              ? 'bg-red-500 text-white'
              : 'bg-white/95 text-slate-600 hover:bg-white hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Bottom Status Badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm ${
              isAvailable
                ? 'bg-white/95 text-[#16A34A]'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            {isAvailable ? 'Available Now' : 'Rented'}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2563EB] text-white shadow-sm">
            Zero Brokerage
          </span>
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Monthly Rent & Furnishing */}
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-xl font-extrabold text-[#0F172A] tracking-tight">
              {formatINR(property.monthlyRent)}
            </span>
            <span className="text-xs font-medium text-[#64748B]"> /month</span>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
            {property.furnishing}
          </span>
        </div>

        {/* Title */}
        <Link to={`/rooms/${property.slug}`} className="mt-2 block">
          <h3 className="text-[15px] font-bold text-[#0F172A] line-clamp-1 group-hover:text-[#2563EB] transition-colors">
            {property.title}
          </h3>
        </Link>

        {/* Locality */}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#64748B] line-clamp-1">
          <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
          <span>
            {property.locality}, {property.city}
            {property.address?.landmark ? ` • ${property.address.landmark}` : ''}
          </span>
        </p>

        {/* Tenant Preference Badges */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
          {tp.genderPreference && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${genderBadgeStyle}`}
            >
              <Users className="w-3 h-3" />
              {tp.genderPreference}
            </span>
          )}
          {tp.tenantTypes?.slice(0, 2).map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-100 text-[11px] font-semibold"
            >
              {t}
            </span>
          ))}
          {tp.foodPreference && tp.foodPreference !== 'Any Food Preference' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold">
              <Utensils className="w-3 h-3" />
              {tp.foodPreference === 'Vegetarian Only' ? 'Veg Only' : 'Non-Veg OK'}
            </span>
          )}
        </div>

        {/* Quick Amenities Row */}
        <div className="mt-3 flex items-center gap-3 text-[11px] text-[#64748B]">
          {amenities.attachedBathroom && (
            <span className="inline-flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              Attached Bath
            </span>
          )}
          {amenities.wifi && (
            <span className="inline-flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-slate-400" />
              Wi-Fi
            </span>
          )}
          {amenities.ac && (
            <span className="inline-flex items-center gap-1">
              <Snowflake className="w-3.5 h-3.5 text-slate-400" />
              AC
            </span>
          )}
          {!amenities.attachedBathroom && !amenities.wifi && !amenities.ac && (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 text-slate-400" />
              {tp.occupancy?.[0] || `${property.rooms} Room`}
            </span>
          )}
        </div>

        {/* View Details Button */}
        <div className="mt-auto pt-4">
          <Link
            to={`/rooms/${property.slug}`}
            className="w-full py-2.5 px-4 rounded-xl bg-[#F8FAFC] hover:bg-[#2563EB] text-[#0F172A] hover:text-white border border-[#E2E8F0] hover:border-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
