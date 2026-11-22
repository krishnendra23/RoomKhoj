import { Link } from 'react-router-dom';
import { ShieldCheck, Users, MapPin, CheckCircle2, ArrowRight, Ban } from 'lucide-react';
import Seo from '../components/common/Seo';

export default function AboutPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <Seo
        title="About Us"
        description="Learn how RoomKhoj connects Prayagraj room seekers directly with verified property owners with zero brokerage."
      />

      {/* Hero */}
      <section className="bg-[#0F172A] text-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-4">
            <MapPin className="w-3.5 h-3.5" />
            Built for Prayagraj, Uttar Pradesh
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Find Your Perfect Room. Without Roaming Around.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            RoomKhoj was built to solve a real, everyday frustration in Prayagraj: students,
            families, and working professionals spend days walking through lanes looking for
            &ldquo;To-Let&rdquo; boards, while genuine house owners struggle to reach reliable
            tenants without brokers.
          </p>
        </div>
      </section>

      {/* Core Principles */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#0F172A]">Direct Owners Only</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Only direct property owners can publish rooms on RoomKhoj. Every owner confirms zero
              brokerage before listing.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <Ban className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#0F172A]">Zero Brokers &amp; Agents</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Broker and agent accounts are strictly prohibited. Users can report any suspected
              broker listing for swift moderation review and account suspension.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#0F172A]">Transparent Eligibility</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Clear owner-stated rental criteria — tenant type, gender preference, occupancy, food
              preference, and house rules — save everyone&apos;s time.
            </p>
          </div>
        </div>

        {/* Moderation & Compliance Policy */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-xl font-bold text-[#0F172A]">
            Our Quality, Privacy &amp; Compliance Standards
          </h2>
          <ul className="space-y-3 text-sm text-slate-600">
            {[
              'Every newly submitted property remains in a pending moderation queue until reviewed and approved by a RoomKhoj administrator.',
              'Room seekers can browse rooms, inspect photos, and contact property owners via Call or WhatsApp without mandatory account registration.',
              'Exact house/flat numbers are withheld from public pages to safeguard owner privacy while clearly showing the locality and nearby landmark.',
              'All basic owner listings are free during our Prayagraj launch so local homeowners can list comfortably.',
              'Property owners are responsible for ensuring their stated rental guidelines and agreements comply with applicable Indian and Uttar Pradesh laws.',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold"
            >
              Browse Prayagraj Rooms
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register?role=owner"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#0F172A] text-sm font-semibold"
            >
              List Your Property Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
