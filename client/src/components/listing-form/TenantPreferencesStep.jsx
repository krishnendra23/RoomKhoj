import { useState } from 'react';
import { ShieldAlert, Info } from 'lucide-react';
import {
  TENANT_TYPES,
  GENDER_PREFERENCES,
  OCCUPANCY_TYPES,
  FOOD_PREFERENCES,
  VISITOR_POLICIES,
} from '../../utils/constants';

export default function TenantPreferencesStep({ watch, setValue, errors }) {
  const tp = watch('tenantPreferences') || {};
  const [hasTimingRule, setHasTimingRule] = useState(Boolean(tp.timingRestrictions));

  const genderPref = tp.genderPreference || 'Any Gender';
  const isGenderRestricted = genderPref === 'Girls Only' || genderPref === 'Boys Only';
  const tenantTypes = tp.tenantTypes || ['Any Tenant'];
  const occupancy = tp.occupancy || ['Single Occupancy'];

  const handleGenderChange = (nextGender) => {
    setValue('tenantPreferences.genderPreference', nextGender, { shouldValidate: true });

    // Prevent contradictory combinations automatically
    if (nextGender === 'Girls Only' || nextGender === 'Boys Only') {
      setValue('tenantPreferences.couplesAllowed', false);
      const filteredTypes = tenantTypes.filter((t) => t !== 'Couples' && t !== 'Families');
      setValue(
        'tenantPreferences.tenantTypes',
        filteredTypes.length ? filteredTypes : ['Students'],
        { shouldValidate: true }
      );
    }
  };

  const toggleTenantType = (type) => {
    if (isGenderRestricted && (type === 'Couples' || type === 'Families')) return;

    if (type === 'Any Tenant') {
      setValue('tenantPreferences.tenantTypes', ['Any Tenant'], { shouldValidate: true });
      return;
    }

    const withoutAny = tenantTypes.filter((t) => t !== 'Any Tenant');
    const exists = withoutAny.includes(type);
    const next = exists ? withoutAny.filter((t) => t !== type) : [...withoutAny, type];
    setValue('tenantPreferences.tenantTypes', next.length ? next : ['Any Tenant'], {
      shouldValidate: true,
    });

    if (next.includes('Couples')) {
      setValue('tenantPreferences.couplesAllowed', true);
    }
  };

  const toggleOccupancy = (item) => {
    const exists = occupancy.includes(item);
    const next = exists ? occupancy.filter((o) => o !== item) : [...occupancy, item];
    if (next.length > 0) {
      setValue('tenantPreferences.occupancy', next, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-[#0F172A]">Who Can Rent This Property?</h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Specify clear, factual rental eligibility so only suitable tenants contact you.
            Contradictory options (such as Girls Only and Boys Only together, or Couples in a
            single-gender listing) are automatically prevented.
          </p>
        </div>
      </div>

      {/* 1. Gender Preference (Single-select — prevents Girls Only + Boys Only contradiction) */}
      <div>
        <label className="block text-sm font-semibold text-[#0F172A] mb-2">
          Gender Preference <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {GENDER_PREFERENCES.map((option) => {
            const selected = genderPref === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleGenderChange(option)}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left flex items-center justify-between ${
                  selected
                    ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] ring-2 ring-[#2563EB]/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{option}</span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selected ? 'border-[#2563EB]' : 'border-slate-300'
                  }`}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-[#2563EB]" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tenant Type (Multi-select with contradiction guards) */}
      <div>
        <label className="block text-sm font-semibold text-[#0F172A] mb-1">
          Tenant Type <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500 mb-2.5">
          Select all applicable tenant categories (or choose &ldquo;Any Tenant&rdquo;).
        </p>
        <div className="flex flex-wrap gap-2">
          {TENANT_TYPES.map((type) => {
            const disabled = isGenderRestricted && (type === 'Couples' || type === 'Families');
            const selected = tenantTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => toggleTenantType(type)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  disabled
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through'
                    : selected
                    ? 'border-[#2563EB] bg-[#2563EB] text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
        {isGenderRestricted && (
          <p className="mt-1.5 text-[11px] text-slate-500">
            Families and Couples are disabled while &ldquo;{genderPref}&rdquo; is selected.
          </p>
        )}
        {errors?.tenantPreferences?.tenantTypes && (
          <p className="mt-1 text-xs text-red-600">
            {errors.tenantPreferences.tenantTypes.message}
          </p>
        )}
      </div>

      {/* 3. Occupancy */}
      <div>
        <label className="block text-sm font-semibold text-[#0F172A] mb-2">
          Occupancy Options <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {OCCUPANCY_TYPES.map((item) => {
            const selected = occupancy.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleOccupancy(item)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  selected
                    ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Food Preference */}
      <div>
        <label className="block text-sm font-semibold text-[#0F172A] mb-2">Food Preference</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {FOOD_PREFERENCES.map((option) => {
            const selected = (tp.foodPreference || 'Any Food Preference') === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setValue('tenantPreferences.foodPreference', option)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  selected
                    ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Additional Property Rules */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <h4 className="text-sm font-bold text-[#0F172A]">Additional Property Rules</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Smoking */}
          <div className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
            <span className="text-sm font-medium text-[#0F172A]">Smoking</span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setValue('tenantPreferences.smokingAllowed', true)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tp.smokingAllowed ? 'bg-white text-[#0F172A] shadow-2xs' : 'text-slate-500'
                }`}
              >
                Allowed
              </button>
              <button
                type="button"
                onClick={() => setValue('tenantPreferences.smokingAllowed', false)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  !tp.smokingAllowed ? 'bg-white text-[#0F172A] shadow-2xs' : 'text-slate-500'
                }`}
              >
                Not Allowed
              </button>
            </div>
          </div>

          {/* Pets */}
          <div className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
            <span className="text-sm font-medium text-[#0F172A]">Pets</span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setValue('tenantPreferences.petsAllowed', true)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tp.petsAllowed ? 'bg-white text-[#0F172A] shadow-2xs' : 'text-slate-500'
                }`}
              >
                Allowed
              </button>
              <button
                type="button"
                onClick={() => setValue('tenantPreferences.petsAllowed', false)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  !tp.petsAllowed ? 'bg-white text-[#0F172A] shadow-2xs' : 'text-slate-500'
                }`}
              >
                Not Allowed
              </button>
            </div>
          </div>

          {/* Visitors */}
          <div className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
            <span className="text-sm font-medium text-[#0F172A]">Visitors</span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              {VISITOR_POLICIES.map((pol) => (
                <button
                  key={pol}
                  type="button"
                  onClick={() => setValue('tenantPreferences.visitorsAllowed', pol)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    (tp.visitorsAllowed || 'Allowed') === pol
                      ? 'bg-white text-[#0F172A] shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  {pol}
                </button>
              ))}
            </div>
          </div>

          {/* Couples */}
          <div className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-[#0F172A]">Couples</span>
              {isGenderRestricted && (
                <p className="text-[10px] text-slate-400">Disabled for {genderPref}</p>
              )}
            </div>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                disabled={isGenderRestricted}
                onClick={() => setValue('tenantPreferences.couplesAllowed', true)}
                className={`px-3 py-1 rounded-md transition-colors disabled:opacity-40 ${
                  tp.couplesAllowed ? 'bg-white text-[#0F172A] shadow-2xs' : 'text-slate-500'
                }`}
              >
                Allowed
              </button>
              <button
                type="button"
                onClick={() => setValue('tenantPreferences.couplesAllowed', false)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  !tp.couplesAllowed ? 'bg-white text-[#0F172A] shadow-2xs' : 'text-slate-500'
                }`}
              >
                Not Allowed
              </button>
            </div>
          </div>
        </div>

        {/* Conditional Timing Restrictions */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <label className="flex items-center gap-2.5 text-sm font-medium text-[#0F172A] cursor-pointer">
            <input
              type="checkbox"
              checked={hasTimingRule}
              onChange={(e) => {
                setHasTimingRule(e.target.checked);
                if (!e.target.checked) setValue('tenantPreferences.timingRestrictions', '');
              }}
              className="w-4 h-4 rounded text-[#2563EB]"
            />
            Specify entry / gate timing guidelines (optional)
          </label>
          {hasTimingRule && (
            <input
              type="text"
              maxLength={160}
              value={tp.timingRestrictions || ''}
              onChange={(e) => setValue('tenantPreferences.timingRestrictions', e.target.value)}
              placeholder="e.g., Main gate closes at 10:00 PM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
            />
          )}
        </div>

        {/* Other Rules */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Other Property Rules (optional)
          </label>
          <textarea
            rows={3}
            maxLength={500}
            value={tp.otherRules || ''}
            onChange={(e) => setValue('tenantPreferences.otherRules', e.target.value)}
            placeholder="e.g., Electricity bill as per sub-meter, valid ID card required at move-in..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] resize-none"
          />
        </div>
      </div>

      {/* Legal Compliance Note */}
      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <span>
          <strong>Policy Notice:</strong> Owner-stated rental guidelines are displayed factually to
          help tenants make informed choices. Please ensure all house rules comply with applicable
          Indian and Uttar Pradesh laws.
        </span>
      </div>
    </div>
  );
}
