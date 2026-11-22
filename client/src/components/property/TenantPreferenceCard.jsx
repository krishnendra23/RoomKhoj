import {
  Users,
  UserCheck,
  BedDouble,
  Utensils,
  Cigarette,
  PawPrint,
  DoorOpen,
  HeartHandshake,
  Clock,
  FileText,
  Check,
  X,
} from 'lucide-react';

export default function TenantPreferenceCard({ preferences }) {
  if (!preferences) return null;

  const rules = [
    {
      label: 'Smoking',
      allowed: Boolean(preferences.smokingAllowed),
      text: preferences.smokingAllowed ? 'Allowed' : 'Not Allowed',
      Icon: Cigarette,
    },
    {
      label: 'Pets',
      allowed: Boolean(preferences.petsAllowed),
      text: preferences.petsAllowed ? 'Allowed' : 'Not Allowed',
      Icon: PawPrint,
    },
    {
      label: 'Visitors',
      allowed: preferences.visitorsAllowed === 'Allowed',
      text: preferences.visitorsAllowed || 'Allowed',
      Icon: DoorOpen,
    },
    {
      label: 'Couples',
      allowed: Boolean(preferences.couplesAllowed),
      text: preferences.couplesAllowed ? 'Allowed' : 'Not Allowed',
      Icon: HeartHandshake,
    },
  ];

  return (
    <section className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Who Can Rent This Property?</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Owner-stated rental eligibility and house guidelines
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-100">
          {preferences.genderPreference || 'Any Gender'}
        </span>
      </div>

      {/* Primary Eligibility Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
        <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <Users className="w-4 h-4 text-[#2563EB]" />
            Eligible Tenant Types
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(preferences.tenantTypes || ['Any Tenant']).map((item) => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#0F172A]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <BedDouble className="w-4 h-4 text-[#2563EB]" />
            Occupancy Options
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(preferences.occupancy || ['Single Occupancy']).map((item) => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#0F172A]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <UserCheck className="w-4 h-4 text-[#2563EB]" />
            Gender Preference
          </div>
          <p className="mt-1.5 text-sm font-semibold text-[#0F172A]">
            {preferences.genderPreference || 'Any Gender'}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <Utensils className="w-4 h-4 text-[#2563EB]" />
            Food Preference
          </div>
          <p className="mt-1.5 text-sm font-semibold text-[#0F172A]">
            {preferences.foodPreference || 'Any Food Preference'}
          </p>
        </div>
      </div>

      {/* Additional Rules */}
      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Property Rules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {rules.map(({ label, allowed, text, Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200/80 p-3 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4 text-slate-500" />
                {allowed ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xs font-semibold text-[#0F172A]">{text}</p>
            </div>
          ))}
        </div>

        {preferences.timingRestrictions && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 px-3.5 py-2.5 text-xs text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Timing Guidelines: </span>
              {preferences.timingRestrictions}
            </div>
          </div>
        )}

        {preferences.otherRules && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200/70 px-3.5 py-2.5 text-xs text-slate-700">
            <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#0F172A]">Additional Notes: </span>
              {preferences.otherRules}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
