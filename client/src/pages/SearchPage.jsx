import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SlidersHorizontal,
  X,
  Search,
  MapPin,
  RotateCcw,
  ArrowUpDown,
  Building2,
} from 'lucide-react';
import Seo from '../components/common/Seo';
import PropertyCard from '../components/property/PropertyCard';
import Pagination from '../components/common/Pagination';
import { PropertyCardSkeleton } from '../components/common/Skeletons';
import { propertyApi, localityApi } from '../services/api';
import {
  PROPERTY_TYPES,
  FURNISHING_TYPES,
  TENANT_TYPES,
  GENDER_PREFERENCES,
  OCCUPANCY_TYPES,
  FOOD_PREFERENCES,
  WATER_SUPPLY_TYPES,
} from '../utils/constants';

const INITIAL_FILTERS = {
  q: '',
  city: 'Prayagraj',
  locality: '',
  minRent: '',
  maxRent: '',
  propertyType: '',
  furnishing: '',
  tenantType: '',
  genderPreference: '',
  occupancy: '',
  foodPreference: '',
  attachedBathroom: false,
  parking: false,
  wifi: false,
  ac: false,
  waterSupply: '',
  petsAllowed: false,
  smokingAllowed: false,
  availability: 'available',
  sort: 'newest',
  page: 1,
};

function parseSearchParams(sp) {
  return {
    q: sp.get('q') || '',
    city: sp.get('city') || 'Prayagraj',
    locality: sp.get('locality') || '',
    minRent: sp.get('minRent') || '',
    maxRent: sp.get('maxRent') || '',
    propertyType: sp.get('propertyType') || '',
    furnishing: sp.get('furnishing') || '',
    tenantType: sp.get('tenantType') || '',
    genderPreference: sp.get('genderPreference') || '',
    occupancy: sp.get('occupancy') || '',
    foodPreference: sp.get('foodPreference') || '',
    attachedBathroom: sp.get('attachedBathroom') === 'true',
    parking: sp.get('parking') === 'true',
    wifi: sp.get('wifi') === 'true',
    ac: sp.get('ac') === 'true',
    waterSupply: sp.get('waterSupply') || '',
    petsAllowed: sp.get('petsAllowed') === 'true',
    smokingAllowed: sp.get('smokingAllowed') === 'true',
    availability: sp.get('availability') || 'available',
    sort: sp.get('sort') || 'newest',
    page: Math.max(1, parseInt(sp.get('page') || '1', 10) || 1),
  };
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => parseSearchParams(searchParams));
  const [localities, setLocalities] = useState([]);
  const [cities, setCities] = useState(['Prayagraj']);
  const [properties, setProperties] = useState([]);
  const [nearbyLocalities, setNearbyLocalities] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL query params -> filter state when navigating from Navbar/Footer/Home
  useEffect(() => {
    setFilters(parseSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    localityApi
      .getAll()
      .then((res) => {
        setLocalities(res.data?.localities || []);
        if (res.data?.cities?.length) setCities(res.data.cities);
      })
      .catch(() => {});
  }, []);

  // Push filter updates to URL so searches are shareable & SEO-friendly
  const updateFilters = (patch, resetPage = true) => {
    const next = { ...filters, ...patch, ...(resetPage ? { page: 1 } : {}) };
    setFilters(next);

    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, val]) => {
      if (val === '' || val === false || val === null || val === undefined) return;
      if (key === 'availability' && val === 'available') return;
      if (key === 'sort' && val === 'newest') return;
      if (key === 'page' && val === 1) return;
      params.set(key, String(val));
    });
    setSearchParams(params, { replace: true });
  };

  const clearAllFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchParams({ city: 'Prayagraj' }, { replace: true });
  };

  // Fetch server-side filtered results whenever filters change
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const query = { page: filters.page, limit: 12, sort: filters.sort };
        if (filters.q.trim()) query.q = filters.q.trim();
        if (filters.city) query.city = filters.city;
        if (filters.locality) query.locality = filters.locality;
        if (filters.minRent) query.minRent = filters.minRent;
        if (filters.maxRent) query.maxRent = filters.maxRent;
        if (filters.propertyType) query.propertyType = filters.propertyType;
        if (filters.furnishing) query.furnishing = filters.furnishing;
        if (filters.tenantType) query.tenantType = filters.tenantType;
        if (filters.genderPreference) query.genderPreference = filters.genderPreference;
        if (filters.occupancy) query.occupancy = filters.occupancy;
        if (filters.foodPreference) query.foodPreference = filters.foodPreference;
        if (filters.attachedBathroom) query.attachedBathroom = true;
        if (filters.parking) query.parking = true;
        if (filters.wifi) query.wifi = true;
        if (filters.ac) query.ac = true;
        if (filters.waterSupply) query.waterSupply = filters.waterSupply;
        if (filters.petsAllowed) query.petsAllowed = true;
        if (filters.smokingAllowed) query.smokingAllowed = true;
        if (filters.availability) query.availability = filters.availability;

        const res = await propertyApi.search(query);
        if (!active) return;
        setProperties(res.data?.properties || []);
        setNearbyLocalities(res.data?.nearbyLocalities || []);
        setMeta(res.meta || { page: 1, total: 0, totalPages: 1 });
      } catch {
        if (!active) return;
        setProperties([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.q) chips.push({ key: 'q', label: `"${filters.q}"` });
    if (filters.locality) chips.push({ key: 'locality', label: filters.locality });
    if (filters.minRent) chips.push({ key: 'minRent', label: `Min ₹${filters.minRent}` });
    if (filters.maxRent) chips.push({ key: 'maxRent', label: `Max ₹${filters.maxRent}` });
    if (filters.propertyType) chips.push({ key: 'propertyType', label: filters.propertyType });
    if (filters.furnishing) chips.push({ key: 'furnishing', label: filters.furnishing });
    if (filters.tenantType) chips.push({ key: 'tenantType', label: filters.tenantType });
    if (filters.genderPreference)
      chips.push({ key: 'genderPreference', label: filters.genderPreference });
    if (filters.occupancy) chips.push({ key: 'occupancy', label: filters.occupancy });
    if (filters.foodPreference) chips.push({ key: 'foodPreference', label: filters.foodPreference });
    if (filters.attachedBathroom) chips.push({ key: 'attachedBathroom', label: 'Attached Bath' });
    if (filters.parking) chips.push({ key: 'parking', label: 'Parking' });
    if (filters.wifi) chips.push({ key: 'wifi', label: 'Wi-Fi' });
    if (filters.ac) chips.push({ key: 'ac', label: 'AC' });
    if (filters.waterSupply)
      chips.push({ key: 'waterSupply', label: `Water: ${filters.waterSupply}` });
    if (filters.petsAllowed) chips.push({ key: 'petsAllowed', label: 'Pets Allowed' });
    if (filters.smokingAllowed) chips.push({ key: 'smokingAllowed', label: 'Smoking Allowed' });
    if (filters.availability !== 'available')
      chips.push({ key: 'availability', label: `Status: ${filters.availability}` });
    return chips;
  }, [filters]);

  const removeChip = (key) => {
    const defaultVal = INITIAL_FILTERS[key];
    updateFilters({ [key]: defaultVal });
  };

  const cityLocalities = localities.filter(
    (l) => !filters.city || l.city.toLowerCase() === filters.city.toLowerCase()
  );

  const FilterFields = (
    <div className="space-y-5">
      {/* Keyword */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Search Keyword</label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.q}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="MNNIT, University, AC room..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* City & Locality */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
          <select
            value={filters.city}
            onChange={(e) => updateFilters({ city: e.target.value, locality: '' })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Locality</label>
          <select
            value={filters.locality}
            onChange={(e) => updateFilters({ locality: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
          >
            <option value="">All Localities</option>
            {cityLocalities.map((l) => (
              <option key={l.id || l.localityName} value={l.localityName}>
                {l.localityName} {l.listingCount > 0 ? `(${l.listingCount})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rent Range */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Monthly Rent (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="500"
            step="500"
            placeholder="Min"
            value={filters.minRent}
            onChange={(e) => updateFilters({ minRent: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
          />
          <input
            type="number"
            min="500"
            step="500"
            placeholder="Max"
            value={filters.maxRent}
            onChange={(e) => updateFilters({ maxRent: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">Property Type</label>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((type) => {
            const active = filters.propertyType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => updateFilters({ propertyType: active ? '' : type })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Furnishing */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Furnishing</label>
        <select
          value={filters.furnishing}
          onChange={(e) => updateFilters({ furnishing: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
        >
          <option value="">Any Furnishing</option>
          {FURNISHING_TYPES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Tenant Preferences Section */}
      <div className="pt-4 border-t border-slate-100 space-y-3.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
          Tenant Preferences
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tenant Type</label>
          <select
            value={filters.tenantType}
            onChange={(e) => updateFilters({ tenantType: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="">Any Tenant Type</option>
            {TENANT_TYPES.filter((t) => t !== 'Any Tenant').map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Gender Preference
          </label>
          <select
            value={filters.genderPreference}
            onChange={(e) => updateFilters({ genderPreference: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="">All Gender Preferences</option>
            {GENDER_PREFERENCES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Occupancy</label>
          <select
            value={filters.occupancy}
            onChange={(e) => updateFilters({ occupancy: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="">Any Occupancy</option>
            {OCCUPANCY_TYPES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Food Preference
          </label>
          <select
            value={filters.foodPreference}
            onChange={(e) => updateFilters({ foodPreference: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="">Any Food Preference</option>
            {FOOD_PREFERENCES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Amenities & Rules */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
          Amenities &amp; Rules
        </p>

        <div className="grid grid-cols-1 gap-2">
          {[
            { key: 'attachedBathroom', label: 'Attached Bathroom' },
            { key: 'wifi', label: 'Wi-Fi Available' },
            { key: 'ac', label: 'Air Conditioning (AC)' },
            { key: 'parking', label: 'Parking Available' },
            { key: 'petsAllowed', label: 'Pets Allowed' },
            { key: 'smokingAllowed', label: 'Smoking Allowed' },
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={Boolean(filters[key])}
                onChange={(e) => updateFilters({ [key]: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              {label}
            </label>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Water Supply</label>
          <select
            value={filters.waterSupply}
            onChange={(e) => updateFilters({ waterSupply: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="">Any Water Supply</option>
            {WATER_SUPPLY_TYPES.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Availability</label>
          <select
            value={filters.availability}
            onChange={(e) => updateFilters({ availability: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="available">Available Now Only</option>
            <option value="all">Include Recently Rented</option>
          </select>
        </div>
      </div>
    </div>
  );

  const pageTitle = filters.locality
    ? `Rooms for Rent in ${filters.locality}, ${filters.city}`
    : `Find Rental Rooms in ${filters.city}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Seo
        title={pageTitle}
        description={`Browse verified direct-owner rooms, 1BHK, 2BHK, flats and PGs in ${
          filters.locality || filters.city
        } with zero brokerage.`}
      />

      {/* Header Strip */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">{pageTitle}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? 'Searching direct owner listings...'
                  : `${meta.total} verified ${meta.total === 1 ? 'listing' : 'listings'} found • Zero brokerage`}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0F172A] hover:bg-slate-50"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                Filters
                {activeFilterChips.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white text-[11px]">
                    {activeFilterChips.length}
                  </span>
                )}
              </button>

              {/* Sort Selector */}
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select
                  aria-label="Sort listings"
                  value={filters.sort}
                  onChange={(e) => updateFilters({ sort: e.target.value })}
                  className="text-sm font-medium text-[#0F172A] bg-transparent focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="rent_asc">Lowest Rent</option>
                  <option value="rent_desc">Highest Rent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {activeFilterChips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removeChip(chip.key)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200/70 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  {chip.label}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-[#0F172A]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-20">
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs max-h-[calc(100vh-6.5rem)] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                  Filter Rooms
                </h2>
                {activeFilterChips.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {FilterFields}
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <PropertyCardSkeleton key={idx} />
                ))}
              </div>
            ) : properties.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.map((property, idx) => (
                    <PropertyCard key={property.id} property={property} index={idx} />
                  ))}
                </div>

                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(p) => {
                    updateFilters({ page: p }, false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </>
            ) : (
              /* Empty State + Nearby Locality Suggestions */
              <div className="rounded-2xl bg-white border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-[#0F172A]">
                  No rooms match all your current filters
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
                  Try widening your rent range, removing a specific amenity requirement, or explore
                  nearby Prayagraj localities below.
                </p>

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear All Filters
                </button>

                {nearbyLocalities.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                      Explore Nearby Localities in {filters.city}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {nearbyLocalities.map((loc) => (
                        <button
                          key={loc.localityName}
                          type="button"
                          onClick={() => updateFilters({ locality: loc.localityName })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                          {loc.localityName}
                          {loc.listingCount > 0 && (
                            <span className="text-slate-400">({loc.listingCount})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Nearby Locality Strip when browsing a specific locality */}
            {!loading && properties.length > 0 && nearbyLocalities.length > 0 && (
              <div className="mt-10 rounded-2xl bg-white border border-slate-200/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Nearby Localities to {filters.locality}
                </p>
                <div className="flex flex-wrap gap-2">
                  {nearbyLocalities.map((loc) => (
                    <button
                      key={loc.localityName}
                      type="button"
                      onClick={() => updateFilters({ locality: loc.localityName })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs font-medium text-slate-700 hover:text-[#2563EB] transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {loc.localityName}
                      {loc.listingCount > 0 ? ` (${loc.listingCount})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animated Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] bg-[#0F172A]/60 lg:hidden flex justify-end"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-[#0F172A]">Filter Rooms</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">{FilterFields}</div>
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2.5">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold"
                >
                  Show {meta.total} Rooms
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
