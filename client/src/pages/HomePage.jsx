import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  PhoneCall,
  Search,
  CheckCircle2,
  Building2,
  Users,
  Wallet,
  PlusCircle,
  Home,
  UserPlus,
  ClipboardList,
  Handshake,
  Compass,
  Sparkles,
} from 'lucide-react';
import Seo from '../components/common/Seo';
import HeroSearchBar from '../components/search/HeroSearchBar';
import PropertyCard from '../components/property/PropertyCard';
import { PropertyCardSkeleton } from '../components/common/Skeletons';
import { propertyApi, localityApi } from '../services/api';
import { formatINR } from '../utils/formatters';

const FEATURED_LOCALITIES = [
  {
    name: 'ADA',
    subtitle: 'Planned residential sectors & parks',
    image: '/assets/locality-house.jpg',
  },
  {
    name: 'Naini',
    subtitle: 'Near SHUATS & peaceful colonies',
    image: '/assets/locality-residential.jpg',
  },
  {
    name: 'Civil Lines',
    subtitle: 'Central city flats & premium homes',
    image: '/assets/locality-civil-lines.jpg',
  },
  {
    name: 'Teliarganj',
    subtitle: 'Near MNNIT & student coaching hub',
    image: '/assets/category-students.jpg',
  },
  {
    name: 'Jhunsi',
    subtitle: 'Spacious family portions & Awas Vikas',
    image: '/assets/category-families.jpg',
  },
  {
    name: 'Allahpur',
    subtitle: 'Popular student rooms near University',
    image: '/assets/category-girls.jpg',
  },
];

const RENTAL_CATEGORIES = [
  {
    key: 'students',
    title: 'Rooms for Students',
    subtitle: 'Study-friendly rooms near Allahabad University, MNNIT & coaching hubs',
    image: '/assets/category-students.jpg',
    to: '/rooms?tenantType=Students',
    badge: 'Students',
  },
  {
    key: 'families',
    title: 'Rooms for Families',
    subtitle: 'Independent 1BHK, 2BHK flats & residential floors in calm colonies',
    image: '/assets/category-families.jpg',
    to: '/rooms?tenantType=Families',
    badge: 'Families',
  },
  {
    key: 'girlsOnly',
    title: 'Girls-Only Rooms',
    subtitle: 'Safe, owner-verified rooms & PGs dedicated for female tenants',
    image: '/assets/category-girls.jpg',
    to: '/rooms?genderPreference=Girls+Only',
    badge: 'Girls Only',
  },
  {
    key: 'boysOnly',
    title: 'Boys-Only Rooms',
    subtitle: 'Clean single & shared rooms for male students and bachelors',
    image: '/assets/category-boys.jpg',
    to: '/rooms?genderPreference=Boys+Only',
    badge: 'Boys Only',
  },
  {
    key: 'workingProfessionals',
    title: 'Rooms for Working Professionals',
    subtitle: 'Well-connected furnished rooms & studio flats with modern amenities',
    image: '/assets/category-professionals.jpg',
    to: '/rooms?tenantType=Working+Professionals',
    badge: 'Professionals',
  },
];

const SEEKER_STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Search Your Location',
    desc: 'Pick your preferred Prayagraj locality, monthly budget, and tenant preferences.',
  },
  {
    step: '02',
    icon: Compass,
    title: 'Explore Available Rooms',
    desc: 'Compare real photos, deposit terms, amenities, and owner-stated eligibility upfront.',
  },
  {
    step: '03',
    icon: PhoneCall,
    title: 'Contact Owners Directly',
    desc: 'Call or WhatsApp verified property owners directly with zero brokerage and no login required.',
  },
];

const OWNER_STEPS = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Register',
    desc: 'Create a free direct property owner account in under a minute using your mobile number.',
  },
  {
    step: '02',
    icon: ClipboardList,
    title: 'List Your Property',
    desc: 'Add room photos, rent details, and clear tenant preferences through our guided 7-step form.',
  },
  {
    step: '03',
    icon: Handshake,
    title: 'Connect With Tenants',
    desc: 'Once approved by our team, receive genuine calls and WhatsApp inquiries directly.',
  },
];

const WHY_CHOOSE = [
  {
    icon: ShieldCheck,
    title: '100% Direct Property Owners',
    desc: 'Brokers and agents are barred from publishing listings. Deal directly with house owners.',
  },
  {
    icon: Wallet,
    title: 'Zero Brokerage & Free Listings',
    desc: 'No commission for room seekers, and basic listings are completely free for property owners.',
  },
  {
    icon: Users,
    title: 'Clear Tenant Eligibility',
    desc: 'See exact rules for students, families, girls-only, boys-only, food preference, and timings upfront.',
  },
  {
    icon: CheckCircle2,
    title: 'Admin-Reviewed Quality',
    desc: 'Every new listing is inspected by our moderation team before going live to prevent fake ads.',
  },
];

function SectionHeader({ eyebrow, title, subtitle, viewAllTo, viewAllLabel = 'View all' }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
      <div>
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-1 text-2xl sm:text-[28px] font-bold tracking-tight text-[#0F172A]">
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-sm text-[#64748B] max-w-2xl">{subtitle}</p>}
      </div>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors shrink-0"
        >
          {viewAllLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function PropertyGridSection({
  id,
  eyebrow,
  title,
  subtitle,
  viewAllTo,
  properties,
  loading,
  bgClass = 'bg-white',
}) {
  if (!loading && (!properties || properties.length === 0)) {
    return null;
  }

  return (
    <section id={id} className={`py-14 sm:py-16 ${bgClass} border-t border-[#E2E8F0]/70`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          viewAllTo={viewAllTo}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, idx) => <PropertyCardSkeleton key={idx} />)
            : properties.slice(0, 6).map((property, idx) => (
                <PropertyCard key={property.id} property={property} index={idx} />
              ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const shouldReduceMotion = useReducedMotion();
  const [homepageData, setHomepageData] = useState(null);
  const [localities, setLocalities] = useState([]);
  const [cities, setCities] = useState(['Prayagraj']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [homeRes, locRes] = await Promise.all([
          propertyApi.getHomepage('Prayagraj'),
          localityApi.getAll({ city: 'Prayagraj' }),
        ]);
        if (!active) return;
        setHomepageData(homeRes.data);
        setLocalities(locRes.data?.localities || []);
        setCities(locRes.data?.cities?.length ? locRes.data.cities : ['Prayagraj']);
      } catch {
        if (!active) return;
        setError('Unable to load live room listings right now. Please try again shortly.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  // Merge live DB stats into our 6 featured Prayagraj localities
  const localityStatsMap = new Map(
    (homepageData?.popularLocations || []).map((l) => [l.localityName.toLowerCase(), l])
  );
  const localityCards = FEATURED_LOCALITIES.map((item) => {
    const dbStats = localityStatsMap.get(item.name.toLowerCase());
    return {
      ...item,
      listingCount: dbStats?.listingCount || 0,
      startingRent: dbStats?.startingRent || null,
    };
  });

  // Only display rental categories with matching approved property listings
  const derivedFallbackCounts = {
    students: homepageData?.studentRooms?.length || 0,
    families: homepageData?.familyRooms?.length || 0,
    girlsOnly: homepageData?.girlsOnlyRooms?.length || 0,
    boysOnly:
      homepageData?.boysOnlyRooms?.length ??
      (homepageData?.recentlyAdded || []).filter(
        (p) => p.tenantPreferences?.genderPreference === 'Boys Only'
      ).length,
    workingProfessionals:
      homepageData?.workingProfessionalRooms?.length ??
      (homepageData?.recentlyAdded || []).filter((p) =>
        (p.tenantPreferences?.tenantTypes || []).includes('Working Professionals')
      ).length,
  };

  const activeCategories = RENTAL_CATEGORIES.map((cat) => ({
    ...cat,
    count: homepageData?.categoryCounts?.[cat.key] ?? derivedFallbackCounts[cat.key] ?? 0,
  })).filter((cat) => cat.count > 0);

  return (
    <div className="bg-white text-[#0F172A] overflow-x-clip">
      <Seo
        title="Find Your Perfect Room, Without Roaming Around"
        description="Discover affordable rooms and rental properties directly from verified property owners in Prayagraj. Zero brokerage."
      />

      {/* =====================================================================
          1. LIGHT PREMIUM REAL-ESTATE HERO SECTION
      ===================================================================== */}
      <section className="relative bg-gradient-to-b from-[#F8FAFC] via-white to-white pt-10 pb-14 sm:pt-14 sm:pb-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading, Subtitle, Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-6 space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-[#2563EB]">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                Prayagraj&apos;s Direct-Owner Rental Marketplace
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight leading-[1.13] text-[#0F172A]">
                Find Your Perfect Room,{' '}
                <span className="text-[#2563EB]">Without Roaming Around.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl">
                Discover affordable rooms and rental properties directly from verified property
                owners in Prayagraj.
              </p>

              {/* Quick Trust Metrics */}
              <div className="pt-2 grid grid-cols-3 gap-4 max-w-md">
                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-3">
                  <p className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
                    {homepageData?.totalApprovedCount ?? '—'}
                  </p>
                  <p className="text-[11px] font-medium text-[#64748B] mt-0.5">Verified Rooms</p>
                </div>
                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-3">
                  <p className="text-lg sm:text-xl font-extrabold text-[#16A34A]">₹0</p>
                  <p className="text-[11px] font-medium text-[#64748B] mt-0.5">Brokerage Fee</p>
                </div>
                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-3">
                  <p className="text-lg sm:text-xl font-extrabold text-[#2563EB]">100%</p>
                  <p className="text-[11px] font-medium text-[#64748B] mt-0.5">Direct Owners</p>
                </div>
              </div>

              {/* Quick Locality Jump Links */}
              <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#64748B] font-medium">Popular areas:</span>
                {['Civil Lines', 'ADA', 'Naini', 'Teliarganj', 'Jhunsi', 'Allahpur'].map((loc) => (
                  <Link
                    key={loc}
                    to={`/rooms?city=Prayagraj&locality=${encodeURIComponent(loc)}`}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB] text-slate-700 font-medium transition-colors"
                  >
                    {loc}
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Right Column: Prominent Real Estate House / Apartment Photograph */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="lg:col-span-6 relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-2xl shadow-slate-200/80 bg-[#F8FAFC] aspect-[4/3]">
                <img
                  src="/assets/hero-indian-home.jpg"
                  alt="Bright modern Indian residential home and sunlit balcony apartment available for rent on RoomKhoj"
                  className="w-full h-full object-cover"
                />
                {/* Subtle bright natural edge sheen */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-slate-900/15 via-transparent to-transparent pointer-events-none"
                />
              </div>

              {/* Floating Information Card with Gentle Float Animation */}
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="sm:absolute sm:-bottom-5 sm:left-6 mt-4 sm:mt-0 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-xl shadow-slate-900/8 px-4 py-3.5 flex items-center gap-3.5 max-w-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0F172A]">
                    Direct Owner Contact • Zero Brokerage
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Find Rooms That Fit Your Budget
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Horizontal Light Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="mt-10 sm:mt-14"
          >
            <HeroSearchBar cities={cities} localities={localities} />
          </motion.div>
        </div>
      </section>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        </div>
      )}

      {/* =====================================================================
          2. POPULAR LOCALITIES — "Explore Rooms in Popular Areas"
      ===================================================================== */}
      <section className="py-14 sm:py-16 bg-[#F8FAFC] border-t border-[#E2E8F0]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Prayagraj Neighborhoods"
            title="Explore Rooms in Popular Areas"
            subtitle="Browse verified rental rooms and independent flats across Prayagraj's most sought-after localities."
            viewAllTo="/rooms"
            viewAllLabel="Explore all areas"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {localityCards.map((loc, idx) => (
              <motion.div
                key={loc.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.28, delay: idx * 0.04 }}
                whileHover={{ y: -3 }}
              >
                <Link
                  to={`/rooms?city=Prayagraj&locality=${encodeURIComponent(loc.name)}`}
                  className="group flex items-center gap-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/70 p-3.5 transition-all"
                >
                  <div className="w-24 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={loc.image}
                      alt={`Rental rooms in ${loc.name}, Prayagraj`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                        {loc.name}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">{loc.subtitle}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                      <MapPin className="w-3.5 h-3.5" />
                      {loc.listingCount > 0
                        ? `${loc.listingCount} ${loc.listingCount === 1 ? 'Room' : 'Rooms'}`
                        : 'View Listings'}
                      {loc.startingRent && (
                        <span className="text-[#64748B] font-medium">
                          • From {formatINR(loc.startingRent)}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. RECENTLY ADDED ROOMS (Live Database Listings)
      ===================================================================== */}
      <PropertyGridSection
        id="recently-added"
        eyebrow="Freshly Approved"
        title="Recently Added Rooms"
        subtitle="Newly verified rooms, 1BHK/2BHK flats, and PGs posted directly by Prayagraj property owners."
        viewAllTo="/rooms?sort=newest"
        properties={homepageData?.recentlyAdded}
        loading={loading}
        bgClass="bg-white"
      />

      {/* Empty State if DB has zero approved listings */}
      {!loading && !error && homepageData?.totalApprovedCount === 0 && (
        <section className="py-16 bg-white border-t border-[#E2E8F0]">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-10">
              <Building2 className="w-10 h-10 text-[#2563EB] mx-auto mb-3" />
              <h2 className="text-xl font-bold text-[#0F172A]">
                Launching Across Prayagraj Localities
              </h2>
              <p className="mt-2 text-sm text-[#64748B]">
                No approved rooms are live yet. Are you a direct property owner in Prayagraj? Post
                your room for free and connect with genuine tenants directly.
              </p>
              <Link
                to="/register?role=owner"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8]"
              >
                <PlusCircle className="w-4 h-4" />
                List Your Property Free
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          4. DEDICATED RENTAL CATEGORIES (Only Categories with Matching Listings)
      ===================================================================== */}
      {!loading && activeCategories.length > 0 && (
        <section className="py-14 sm:py-16 bg-[#F8FAFC] border-t border-[#E2E8F0]/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Browse by Eligibility"
              title="Dedicated Rental Categories"
              subtitle="Find rooms matched to your exact lifestyle and owner-stated preferences — no wasted visits."
              viewAllTo="/rooms"
              viewAllLabel="See all filters"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCategories.map((cat, idx) => (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.28, delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    to={cat.to}
                    className="group block rounded-2xl bg-white border border-[#E2E8F0] hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/70 overflow-hidden transition-all h-full flex flex-col"
                  >
                    <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                      <img
                        src={cat.image}
                        alt={cat.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[#2563EB] text-[11px] font-bold shadow-xs">
                        {cat.badge}
                      </span>
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-white/95 text-[#0F172A] text-[11px] font-semibold shadow-xs">
                        {cat.count} {cat.count === 1 ? 'Listing' : 'Listings'}
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                        {cat.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed flex-1">
                        {cat.subtitle}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                        Explore {cat.title}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          5. AFFORDABLE RENTAL PROPERTIES & MATCHING CATEGORY LISTINGS
      ===================================================================== */}
      <PropertyGridSection
        id="affordable"
        eyebrow="Budget Friendly"
        title="Affordable Rental Properties"
        subtitle="Clean, pocket-friendly rooms under ₹6,500/month with zero brokerage."
        viewAllTo="/rooms?maxRent=6500&sort=rent_asc"
        properties={homepageData?.affordableRooms}
        loading={loading}
        bgClass="bg-white"
      />

      <PropertyGridSection
        id="students"
        eyebrow="Study-Ready Spaces"
        title="Rooms for Students"
        subtitle="Quiet rooms near Allahabad University, MNNIT, SHUATS, and major coaching centers."
        viewAllTo="/rooms?tenantType=Students"
        properties={homepageData?.studentRooms}
        loading={false}
        bgClass="bg-[#F8FAFC]"
      />

      <PropertyGridSection
        id="families"
        eyebrow="Independent Portions & Flats"
        title="Rooms for Families"
        subtitle="Spacious 1BHK, 2BHK, and residential floors well suited for families."
        viewAllTo="/rooms?tenantType=Families"
        properties={homepageData?.familyRooms}
        loading={false}
        bgClass="bg-white"
      />

      <PropertyGridSection
        id="girls-only"
        eyebrow="Owner-Stated Preference"
        title="Girls-Only Rooms"
        subtitle="Dedicated rooms and PGs listed exclusively for female students and working women."
        viewAllTo="/rooms?genderPreference=Girls+Only"
        properties={homepageData?.girlsOnlyRooms}
        loading={false}
        bgClass="bg-[#F8FAFC]"
      />

      <PropertyGridSection
        id="boys-only"
        eyebrow="Owner-Stated Preference"
        title="Boys-Only Rooms"
        subtitle="Independent single rooms and shared stays for male students and bachelors."
        viewAllTo="/rooms?genderPreference=Boys+Only"
        properties={homepageData?.boysOnlyRooms}
        loading={false}
        bgClass="bg-white"
      />

      <PropertyGridSection
        id="working-professionals"
        eyebrow="Move-In Ready"
        title="Rooms for Working Professionals"
        subtitle="Well-connected flats and furnished rooms ideal for salaried professionals."
        viewAllTo="/rooms?tenantType=Working+Professionals"
        properties={homepageData?.workingProfessionalRooms}
        loading={false}
        bgClass="bg-[#F8FAFC]"
      />

      {/* =====================================================================
          6. HOW IT WORKS — Dual-Audience Clean 3-Step Section
      ===================================================================== */}
      <section className="py-16 sm:py-20 bg-white border-t border-[#E2E8F0]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              Simple &amp; Transparent
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              How RoomKhoj Works
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Whether you are searching for a room or renting out a vacant space, RoomKhoj keeps
              every step direct and broker-free.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* For Room Seekers */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 sm:p-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold mb-6">
                <Search className="w-3.5 h-3.5" />
                For Room Seekers
              </div>
              <div className="space-y-6">
                {SEEKER_STEPS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                          Step {item.step}
                        </p>
                        <h3 className="text-base font-bold text-[#0F172A] mt-0.5">{item.title}</h3>
                        <p className="text-sm text-[#64748B] mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* For Property Owners */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 sm:p-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#16A34A] text-xs font-bold mb-6">
                <Building2 className="w-3.5 h-3.5" />
                For Property Owners
              </div>
              <div className="space-y-6">
                {OWNER_STEPS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-[#E2E8F0] text-[#16A34A] flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#16A34A]">
                          Step {item.step}
                        </p>
                        <h3 className="text-base font-bold text-[#0F172A] mt-0.5">{item.title}</h3>
                        <p className="text-sm text-[#64748B] mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. WHY CHOOSE ROOMKHOJ
      ===================================================================== */}
      <section className="py-16 bg-[#F8FAFC] border-t border-[#E2E8F0]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
                Built for Trust
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                Why Choose RoomKhoj?
              </h2>
              <p className="mt-3 text-sm text-[#64748B] leading-relaxed">
                Finding a rental room in Prayagraj shouldn&apos;t require paying brokerage fees or
                walking street to street asking neighbours. RoomKhoj brings direct clarity to both
                tenants and local homeowners.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/rooms"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  Browse Verified Rooms
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-slate-300 text-[#0F172A] text-sm font-semibold transition-colors"
                >
                  Direct-Owner Policy
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WHY_CHOOSE.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    className="rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-[#0F172A]">{card.title}</h3>
                    <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">{card.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. LIST YOUR PROPERTY CTA (Light Premium Real Estate Card)
      ===================================================================== */}
      <section className="py-16 bg-white border-t border-[#E2E8F0]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#EFF6FF] via-white to-[#F8FAFC] border border-blue-200/80 p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-lg shadow-blue-900/5">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-[#16A34A] text-xs font-semibold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                100% Free for Direct Property Owners
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                Have a vacant room, flat, or PG in Prayagraj?
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-[#64748B] leading-relaxed">
                Publish your room in 5 minutes with clear tenant preferences. Connect directly with
                genuine students, families, and working professionals via Call and WhatsApp.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full lg:w-auto">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/register?role=owner"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  List Your Property Free
                </Link>
              </motion.div>
              <Link
                to="/owner/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold transition-colors"
              >
                Owner Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
