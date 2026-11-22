import { Link } from 'react-router-dom';
import { Home, ShieldCheck, MapPin, PhoneCall } from 'lucide-react';

const POPULAR_LOCALITIES = [
  'Civil Lines',
  'ADA',
  'Naini',
  'Teliarganj',
  'Jhunsi',
  'Allahpur',
  'Katra',
  'Tagore Town',
];

export default function Footer() {
  return (
    <footer className="bg-[#F8FAFC] text-[#64748B] border-t border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-sm shadow-blue-600/20">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                Room<span className="text-[#2563EB]">Khoj</span>
              </span>
            </Link>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Find Your Perfect Room, Without Roaming Around. Connecting room seekers directly with
              verified property owners in Prayagraj — with zero brokerage.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              100% Direct Owners • Zero Broker Policy
            </div>
          </div>

          {/* Popular Prayagraj Localities */}
          <div>
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4">
              Prayagraj Localities
            </h3>
            <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm">
              {POPULAR_LOCALITIES.map((loc) => (
                <li key={loc}>
                  <Link
                    to={`/rooms?city=Prayagraj&locality=${encodeURIComponent(loc)}`}
                    className="hover:text-[#2563EB] transition-colors inline-flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    {loc}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Browse */}
          <div>
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4">
              Browse Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/rooms" className="hover:text-[#2563EB] transition-colors">
                  All Rooms in Prayagraj
                </Link>
              </li>
              <li>
                <Link
                  to="/rooms?tenantType=Students"
                  className="hover:text-[#2563EB] transition-colors"
                >
                  Rooms for Students
                </Link>
              </li>
              <li>
                <Link
                  to="/rooms?tenantType=Families"
                  className="hover:text-[#2563EB] transition-colors"
                >
                  Family Flats &amp; 1BHK/2BHK
                </Link>
              </li>
              <li>
                <Link
                  to="/rooms?genderPreference=Girls+Only"
                  className="hover:text-[#2563EB] transition-colors"
                >
                  Girls-Only Rooms &amp; PGs
                </Link>
              </li>
              <li>
                <Link
                  to="/rooms?genderPreference=Boys+Only"
                  className="hover:text-[#2563EB] transition-colors"
                >
                  Boys-Only Rooms
                </Link>
              </li>
              <li>
                <Link
                  to="/rooms?tenantType=Working+Professionals"
                  className="hover:text-[#2563EB] transition-colors"
                >
                  Rooms for Working Professionals
                </Link>
              </li>
            </ul>
          </div>

          {/* Owners & Company */}
          <div>
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4">
              For Property Owners
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register?role=owner" className="hover:text-[#2563EB] transition-colors">
                  List Your Property Free
                </Link>
              </li>
              <li>
                <Link to="/owner/dashboard" className="hover:text-[#2563EB] transition-colors">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#2563EB] transition-colors">
                  About RoomKhoj &amp; Policies
                </Link>
              </li>
              <li className="pt-2 flex items-start gap-2 text-xs text-[#64748B]">
                <PhoneCall className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                Every listing is reviewed by our moderation team before going live.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <p>© {new Date().getFullYear()} RoomKhoj. Built for Prayagraj, Uttar Pradesh.</p>
          <p>Direct owner listings only. Brokers and agents are strictly prohibited.</p>
        </div>
      </div>
    </footer>
  );
}
