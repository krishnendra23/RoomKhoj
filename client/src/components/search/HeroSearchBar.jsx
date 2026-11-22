import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Building2, IndianRupee, Compass } from 'lucide-react';
import { PROPERTY_TYPES } from '../../utils/constants';

export default function HeroSearchBar({ cities = ['Prayagraj'], localities = [] }) {
  const navigate = useNavigate();
  const [city, setCity] = useState(cities[0] || 'Prayagraj');
  const [locality, setLocality] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [propertyType, setPropertyType] = useState('');

  const filteredLocalities = localities.filter(
    (l) => !city || l.city.toLowerCase() === city.toLowerCase()
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (locality) params.set('locality', locality);
    if (minRent) params.set('minRent', minRent);
    if (maxRent) params.set('maxRent', maxRent);
    if (propertyType) params.set('propertyType', propertyType);
    navigate(`/rooms?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Search rental rooms"
      className="w-full rounded-2xl bg-white border border-[#E2E8F0] shadow-xl shadow-slate-200/70 p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
        {/* City */}
        <div className="lg:col-span-2">
          <label
            htmlFor="hero-city"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5 px-0.5"
          >
            City
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#2563EB] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="hero-city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setLocality('');
              }}
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white focus:bg-white text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
            >
              {(cities.length ? cities : ['Prayagraj']).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Locality */}
        <div className="lg:col-span-3">
          <label
            htmlFor="hero-locality"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5 px-0.5"
          >
            Locality
          </label>
          <div className="relative">
            <Compass className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="hero-locality"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white focus:bg-white text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
            >
              <option value="">All Prayagraj Areas</option>
              {filteredLocalities.map((loc) => (
                <option key={loc.id || loc.localityName} value={loc.localityName}>
                  {loc.localityName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Property Type */}
        <div className="lg:col-span-2">
          <label
            htmlFor="hero-type"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5 px-0.5"
          >
            Property Type
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="hero-type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white focus:bg-white text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
            >
              <option value="">Any Type</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Min & Max Rent */}
        <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="hero-min-rent"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5 px-0.5"
            >
              Min Rent
            </label>
            <div className="relative">
              <IndianRupee className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="hero-min-rent"
                type="number"
                min="500"
                step="500"
                placeholder="2,500"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                className="w-full h-11 pl-8 pr-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white focus:bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="hero-max-rent"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5 px-0.5"
            >
              Max Rent
            </label>
            <div className="relative">
              <IndianRupee className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="hero-max-rent"
                type="number"
                min="500"
                step="500"
                placeholder="15,000"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                className="w-full h-11 pl-8 pr-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white focus:bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="sm:col-span-2 lg:col-span-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search Rooms
          </motion.button>
        </div>
      </div>
    </form>
  );
}
