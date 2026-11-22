import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Trash2,
  Star,
  ShieldCheck,
  Save,
  Send,
  CheckCircle2,
  MapPin,
  IndianRupee,
  Loader2,
} from 'lucide-react';
import Seo from '../components/common/Seo';
import TenantPreferencesStep from '../components/listing-form/TenantPreferencesStep';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localityApi, propertyApi, uploadApi } from '../services/api';
import {
  PROPERTY_TYPES,
  FURNISHING_TYPES,
  KITCHEN_TYPES,
  WATER_SUPPLY_TYPES,
  FLOOR_OPTIONS,
  AMENITIES_META,
} from '../utils/constants';
import { formatINR, optimizeImageUrl, extractApiError } from '../utils/formatters';

const STEPS = [
  { number: 1, title: 'Basic Info' },
  { number: 2, title: 'Location' },
  { number: 3, title: 'Rent & Details' },
  { number: 4, title: 'Amenities' },
  { number: 5, title: 'Tenant Preferences' },
  { number: 6, title: 'Photos & Contact' },
  { number: 7, title: 'Preview & Submit' },
];

const DRAFT_STORAGE_KEY = 'roomkhoj_listing_draft_v1';
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function getDefaultValues(userMobile = '') {
  return {
    title: '',
    propertyType: 'Single Room',
    description: '',
    isDirectOwner: true,
    city: 'Prayagraj',
    locality: '',
    address: {
      publicArea: '',
      landmark: '',
      exactAddress: '',
      pincode: '',
    },
    monthlyRent: '',
    securityDeposit: 0,
    negotiable: false,
    brokerage: 0,
    furnishing: 'Semi-Furnished',
    rooms: 1,
    bathrooms: 1,
    kitchen: 'No Kitchen',
    floor: 'Ground Floor',
    areaSqFt: '',
    availableFrom: new Date().toISOString().split('T')[0],
    amenities: {
      attachedBathroom: false,
      parking: false,
      wifi: false,
      ac: false,
      waterSupply: '24x7',
      powerBackup: false,
      geyser: false,
      roWater: false,
      cctv: false,
      lift: false,
      washingMachine: false,
      refrigerator: false,
      balcony: false,
      studyTable: false,
      wardrobe: false,
      bed: false,
    },
    tenantPreferences: {
      tenantTypes: ['Any Tenant'],
      genderPreference: 'Any Gender',
      occupancy: ['Single Occupancy'],
      foodPreference: 'Any Food Preference',
      smokingAllowed: false,
      petsAllowed: false,
      visitorsAllowed: 'Allowed',
      couplesAllowed: false,
      timingRestrictions: '',
      otherRules: '',
    },
    photos: [],
    contactPhone: userMobile,
    whatsappNumber: userMobile,
  };
}

export default function PropertyFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [localities, setLocalities] = useState([]);
  const [cities, setCities] = useState(['Prayagraj']);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedProperty, setSubmittedProperty] = useState(null);

  const {
    register,
    watch,
    setValue,
    reset,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: getDefaultValues(user?.mobile || ''),
    mode: 'onBlur',
  });

  const formValues = watch();

  // Load localities catalog
  useEffect(() => {
    localityApi
      .getAll()
      .then((res) => {
        setLocalities(res.data?.localities || []);
        if (res.data?.cities?.length) setCities(res.data.cities);
      })
      .catch(() => {});
  }, []);

  // Load existing property in edit mode OR restore local draft in create mode
  useEffect(() => {
    if (isEditMode) {
      propertyApi
        .getOwnerPropertyById(id)
        .then((res) => {
          const p = res.data?.property;
          if (!p) return;
          reset({
            ...getDefaultValues(user?.mobile || ''),
            ...p,
            availableFrom: p.availableFrom
              ? new Date(p.availableFrom).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            areaSqFt: p.areaSqFt || '',
          });
        })
        .catch((err) => {
          toast.error(extractApiError(err, 'Could not load property for editing'));
          navigate('/owner/dashboard');
        })
        .finally(() => setInitialLoading(false));
    } else {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          reset({ ...getDefaultValues(user?.mobile || ''), ...parsed });
        }
      } catch {
        // Ignore corrupted local draft
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const handleSaveLocalDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(getValues()));
      toast.success('Draft saved on this device');
    } catch {
      toast.error('Could not save draft locally');
    }
  };

  const validateCurrentStep = async () => {
    const stepFields = {
      1: ['title', 'propertyType', 'description', 'isDirectOwner'],
      2: ['city', 'locality', 'address.publicArea', 'address.pincode'],
      3: ['monthlyRent', 'securityDeposit', 'furnishing', 'rooms', 'bathrooms'],
      4: [],
      5: [],
      6: ['contactPhone', 'whatsappNumber'],
    };
    const fields = stepFields[step] || [];
    const valid = fields.length > 0 ? await trigger(fields) : true;
    if (!valid) return false;

    if (step === 6 && (!formValues.photos || formValues.photos.length === 0)) {
      toast.error('Please upload at least 1 property photo (up to 10 allowed).');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    setStep((s) => Math.min(7, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhotoUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = '';
    if (!selectedFiles.length) return;

    const currentPhotos = getValues('photos') || [];
    if (currentPhotos.length + selectedFiles.length > 10) {
      toast.error(`Maximum 10 photos allowed. You can add ${10 - currentPhotos.length} more.`);
      return;
    }

    for (const file of selectedFiles) {
      if (!ALLOWED_MIME.has(file.type)) {
        toast.error(`"${file.name}" is not a supported format. Use JPEG, PNG, or WEBP.`);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`"${file.name}" exceeds the 5 MB image size limit.`);
        return;
      }
    }

    setUploading(true);
    try {
      const res = await uploadApi.uploadPropertyPhotos(selectedFiles);
      const uploaded = (res.data?.photos || []).map((photo, idx) => ({
        ...photo,
        isPrimary: currentPhotos.length === 0 && idx === 0,
      }));
      setValue('photos', [...currentPhotos, ...uploaded], { shouldValidate: true });
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} uploaded`);
    } catch (err) {
      toast.error(extractApiError(err, 'Photo upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (index) => {
    const current = [...(getValues('photos') || [])];
    const [removed] = current.splice(index, 1);
    if (removed?.isPrimary && current.length > 0) {
      current[0].isPrimary = true;
    }
    setValue('photos', current);
    if (removed?.publicId) {
      uploadApi.deletePhoto(removed.publicId).catch(() => {});
    }
  };

  const handleSetPrimary = (index) => {
    const current = (getValues('photos') || []).map((p, idx) => ({
      ...p,
      isPrimary: idx === index,
    }));
    setValue('photos', current);
  };

  const submitListing = async ({ saveAsDraft = false } = {}) => {
    const values = getValues();
    if (!saveAsDraft && (!values.photos || values.photos.length === 0)) {
      toast.error('Please upload at least 1 photo before submitting for approval.');
      setStep(6);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...values,
        monthlyRent: Number(values.monthlyRent),
        securityDeposit: Number(values.securityDeposit || 0),
        brokerage: 0,
        rooms: Number(values.rooms || 1),
        bathrooms: Number(values.bathrooms || 1),
        areaSqFt: values.areaSqFt ? Number(values.areaSqFt) : undefined,
        whatsappNumber: values.whatsappNumber || values.contactPhone,
        saveAsDraft,
      };

      const res = isEditMode
        ? await propertyApi.update(id, payload)
        : await propertyApi.create(payload);

      if (!isEditMode) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }

      if (saveAsDraft) {
        toast.success('Listing saved as draft in your Owner Dashboard');
        navigate('/owner/dashboard');
      } else {
        setSubmittedProperty(res.data?.property);
        toast.success('Property submitted for admin approval!');
      }
    } catch (err) {
      toast.error(extractApiError(err, 'Could not submit property listing'));
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      </div>
    );
  }

  // Final Submission Confirmation Screen
  if (submittedProperty) {
    return (
      <div className="min-h-[75vh] bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
        <Seo title="Property Submitted" />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-lg"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">
            Property Submitted for Approval
          </h1>
          <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
            Your listing <strong className="text-[#0F172A]">{submittedProperty.title}</strong> is
            now in our moderation queue with status{' '}
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-xs uppercase">
              Pending
            </span>
            . Once approved by a RoomKhoj administrator, it will go live publicly for Prayagraj room
            seekers.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/owner/dashboard"
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold"
            >
              Go to Owner Dashboard
            </Link>
            <Link
              to={`/rooms/${submittedProperty.slug}`}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#0F172A] text-sm font-semibold"
            >
              Preview Listing
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const cityLocalities = localities.filter(
    (l) => !formValues.city || l.city.toLowerCase() === formValues.city.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <Seo
        title={isEditMode ? 'Edit Property Listing' : 'List Your Property Free'}
        description="Post your rental room, 1BHK, 2BHK, flat or PG directly as a property owner on RoomKhoj."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {isEditMode ? 'Edit Property Listing' : 'List Your Property Free'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Step {step} of {STEPS.length}: <strong className="text-[#0F172A]">{STEPS[step - 1].title}</strong>
            </p>
          </div>
          {!isEditMode && (
            <button
              type="button"
              onClick={handleSaveLocalDraft}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 self-start"
            >
              <Save className="w-3.5 h-3.5 text-[#2563EB]" />
              Save Draft
            </button>
          )}
        </div>

        {/* 7-Step Progress Indicator */}
        <div className="mb-6 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {STEPS.map((s) => {
              const completed = s.number < step;
              const current = s.number === step;
              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => {
                    if (s.number < step) setStep(s.number);
                  }}
                  className="flex flex-col items-center min-w-[76px] group"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      completed
                        ? 'bg-[#16A34A] text-white'
                        : current
                        ? 'bg-[#2563EB] text-white ring-4 ring-blue-100'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {completed ? <Check className="w-4 h-4" /> : s.number}
                  </div>
                  <span
                    className={`mt-1.5 text-[11px] font-medium text-center leading-tight ${
                      current ? 'text-[#2563EB] font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#2563EB] transition-all duration-300 rounded-full"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
            >
              {/* STEP 1: BASIC INFORMATION */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                      Property Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Spacious Semi-Furnished 1BHK Near MNNIT Teliarganj"
                      {...register('title', {
                        required: 'Property title is required',
                        minLength: { value: 8, message: 'Title must be at least 8 characters' },
                        maxLength: { value: 120, message: 'Title cannot exceed 120 characters' },
                      })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {PROPERTY_TYPES.map((type) => {
                        const selected = formValues.propertyType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setValue('propertyType', type, { shouldValidate: true })}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                              selected
                                ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] ring-2 ring-[#2563EB]/20'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                      Property Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Describe room ventilation, sunlight, nearby colleges/markets, separate entrance, electricity meter details, etc."
                      {...register('description', {
                        required: 'Description is required',
                        minLength: {
                          value: 20,
                          message: 'Please write at least 20 characters describing your property',
                        },
                      })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        {...register('isDirectOwner', {
                          validate: (v) =>
                            v === true || 'Only direct property owners can publish on RoomKhoj',
                        })}
                        className="mt-0.5 w-4 h-4 rounded text-[#16A34A]"
                      />
                      <span>
                        <strong className="text-[#0F172A]">Direct Property Owner Guarantee:</strong>{' '}
                        I am the direct owner of this property and will not charge any brokerage fee.
                      </span>
                    </label>
                    {errors.isDirectOwner && (
                      <p className="mt-1 text-xs text-red-600">{errors.isDirectOwner.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('city', { required: 'City is required' })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        {cities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                        Locality <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('locality', { required: 'Please select a locality' })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        <option value="">Select Prayagraj Locality</option>
                        {cityLocalities.map((loc) => (
                          <option key={loc.id || loc.localityName} value={loc.localityName}>
                            {loc.localityName}
                          </option>
                        ))}
                      </select>
                      {errors.locality && (
                        <p className="mt-1 text-xs text-red-600">{errors.locality.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                      Street / Sector / Area (Publicly Visible) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Sector E, ADA Colony or Shivkuti Road"
                      {...register('address.publicArea', {
                        required: 'Street / sector / area is required',
                        minLength: { value: 3, message: 'Enter at least 3 characters' },
                      })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                    {errors.address?.publicArea && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.address.publicArea.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                        Nearby Landmark
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 200m from MNNIT Main Gate"
                        {...register('address.landmark')}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                        Pincode
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g., 211001"
                        {...register('address.pincode', {
                          pattern: {
                            value: /^(\d{6})?$/,
                            message: 'Pincode must be a 6-digit number',
                          },
                        })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                      {errors.address?.pincode && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.address.pincode.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-1">
                      Exact House / Flat Number (Private — Admin Verification Only)
                    </label>
                    <p className="text-xs text-slate-500 mb-1.5">
                      For your privacy, exact house/flat numbers are hidden from public listing pages.
                    </p>
                    <input
                      type="text"
                      placeholder="e.g., House No. 42-B, Lane 3"
                      {...register('address.exactAddress')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: RENT & PROPERTY DETAILS */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                        Monthly Rent (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="500"
                          max="500000"
                          placeholder="e.g., 5500"
                          {...register('monthlyRent', {
                            required: 'Monthly rent is required',
                            min: { value: 500, message: 'Minimum monthly rent is ₹500' },
                          })}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                      {errors.monthlyRent && (
                        <p className="mt-1 text-xs text-red-600">{errors.monthlyRent.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                        Security Deposit (₹)
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="0"
                          placeholder="0 if no deposit"
                          {...register('securityDeposit', {
                            min: { value: 0, message: 'Deposit cannot be negative' },
                          })}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#0F172A]">Rent Terms</span>
                      <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setValue('negotiable', false)}
                          className={`px-3 py-1 rounded-md ${
                            !formValues.negotiable ? 'bg-white text-[#0F172A] shadow-2xs' : 'text-slate-500'
                          }`}
                        >
                          Fixed
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('negotiable', true)}
                          className={`px-3 py-1 rounded-md ${
                            formValues.negotiable ? 'bg-white text-[#0F172A] shadow-2xs' : 'text-slate-500'
                          }`}
                        >
                          Negotiable
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-900">Brokerage Fee</span>
                      <span className="font-bold text-[#16A34A]">₹0 (Locked — Direct Owner)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                      Furnishing Status <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {FURNISHING_TYPES.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setValue('furnishing', f)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                            formValues.furnishing === f
                              ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Rooms
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        {...register('rooms', { min: 1, max: 20 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        {...register('bathrooms', { min: 1, max: 10 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kitchen
                      </label>
                      <select
                        {...register('kitchen')}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        {KITCHEN_TYPES.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Floor
                      </label>
                      <select
                        {...register('floor')}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        {FLOOR_OPTIONS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Approximate Area (sq.ft, optional)
                      </label>
                      <input
                        type="number"
                        min="50"
                        placeholder="e.g., 200"
                        {...register('areaSqFt')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Available From
                      </label>
                      <input
                        type="date"
                        {...register('availableFrom')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: FACILITIES & AMENITIES */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                      Water Supply
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {WATER_SUPPLY_TYPES.map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setValue('amenities.waterSupply', w)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                            formValues.amenities?.waterSupply === w
                              ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0F172A] mb-3">
                      Select Available Facilities &amp; Amenities
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {AMENITIES_META.map((item) => {
                        const checked = Boolean(formValues.amenities?.[item.key]);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setValue(`amenities.${item.key}`, !checked)}
                            className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                              checked
                                ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span>{item.label}</span>
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                checked
                                  ? 'bg-[#2563EB] border-[#2563EB] text-white'
                                  : 'border-slate-300'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: TENANT PREFERENCES */}
              {step === 5 && (
                <TenantPreferencesStep watch={watch} setValue={setValue} errors={errors} />
              )}

              {/* STEP 6: PHOTOS & OWNER CONTACT */}
              {step === 6 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-[#0F172A]">
                        Property Photos ({formValues.photos?.length || 0} / 10){' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs text-slate-500">JPEG, PNG, WEBP • Max 5 MB each</span>
                    </div>

                    <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#2563EB] bg-slate-50/70 hover:bg-blue-50/30 p-8 cursor-pointer transition-colors">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mb-2" />
                      ) : (
                        <UploadCloud className="w-9 h-9 text-[#2563EB] mb-2" />
                      )}
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {uploading ? 'Uploading photos...' : 'Click to upload room photos'}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        Clear photos of room, washroom, kitchen, and exterior get 3× more calls
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploading || (formValues.photos?.length || 0) >= 10}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Photo Previews */}
                    {formValues.photos?.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {formValues.photos.map((photo, idx) => (
                          <div
                            key={photo.publicId || idx}
                            className={`relative rounded-xl overflow-hidden border-2 group ${
                              photo.isPrimary ? 'border-[#2563EB]' : 'border-slate-200'
                            }`}
                          >
                            <img
                              src={optimizeImageUrl(photo.url, 400)}
                              alt={`Room photo ${idx + 1}`}
                              className="w-full h-28 object-cover"
                            />
                            {photo.isPrimary && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#2563EB] text-white text-[10px] font-bold">
                                Cover
                              </span>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-center justify-between">
                              {!photo.isPrimary ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(idx)}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-white hover:text-blue-200"
                                >
                                  <Star className="w-3 h-3" /> Set Cover
                                </button>
                              ) : (
                                <span />
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(idx)}
                                aria-label="Remove photo"
                                className="p-1 rounded bg-red-600/90 hover:bg-red-600 text-white"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contact Numbers */}
                  <div className="pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                        Owner Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        {...register('contactPhone', {
                          required: 'Contact phone is required',
                          pattern: {
                            value: /^[6-9]\d{9}$/,
                            message: 'Enter a valid 10-digit Indian mobile number',
                          },
                        })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                      {errors.contactPhone && (
                        <p className="mt-1 text-xs text-red-600">{errors.contactPhone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                        WhatsApp Number (defaults to phone)
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit WhatsApp number"
                        {...register('whatsappNumber', {
                          pattern: {
                            value: /^([6-9]\d{9})?$/,
                            message: 'Enter a valid 10-digit Indian mobile number',
                          },
                        })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                      {errors.whatsappNumber && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.whatsappNumber.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: PREVIEW & SUBMIT */}
              {step === 7 && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-4 text-xs text-slate-700 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#0F172A]">Ready for Admin Review</p>
                      <p className="mt-0.5">
                        Review your listing summary below. New listings enter{' '}
                        <strong>Pending</strong> status until approved by a RoomKhoj admin.
                      </p>
                    </div>
                  </div>

                  {/* Preview Summary Card */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    {formValues.photos?.[0]?.url && (
                      <img
                        src={optimizeImageUrl(
                          formValues.photos.find((p) => p.isPrimary)?.url ||
                            formValues.photos[0].url,
                          1000
                        )}
                        alt="Cover preview"
                        className="w-full h-56 object-cover bg-slate-100"
                      />
                    )}
                    <div className="p-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold">
                            {formValues.propertyType} • {formValues.furnishing}
                          </span>
                          <h2 className="mt-2 text-lg font-bold text-[#0F172A]">
                            {formValues.title}
                          </h2>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                            {formValues.address?.publicArea}, {formValues.locality},{' '}
                            {formValues.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-extrabold text-[#0F172A]">
                            {formatINR(formValues.monthlyRent)}
                            <span className="text-xs font-normal text-slate-500">/mo</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            Deposit: {formatINR(formValues.securityDeposit || 0)} •{' '}
                            {formValues.negotiable ? 'Negotiable' : 'Fixed'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <p className="text-slate-500 font-medium">Who Can Rent:</p>
                          <p className="font-semibold text-[#0F172A] mt-0.5">
                            {formValues.tenantPreferences?.genderPreference} •{' '}
                            {(formValues.tenantPreferences?.tenantTypes || []).join(', ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Occupancy &amp; Food:</p>
                          <p className="font-semibold text-[#0F172A] mt-0.5">
                            {(formValues.tenantPreferences?.occupancy || []).join(', ')} •{' '}
                            {formValues.tenantPreferences?.foodPreference}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Owner Contact:</p>
                          <p className="font-semibold text-[#0F172A] mt-0.5">
                            +91 {formValues.contactPhone} (WhatsApp: +91{' '}
                            {formValues.whatsappNumber || formValues.contactPhone})
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Photos Attached:</p>
                          <p className="font-semibold text-[#0F172A] mt-0.5">
                            {formValues.photos?.length || 0} photos
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <Link
                to="/owner/dashboard"
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Cancel
              </Link>
            )}

            {step < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold shadow-sm transition-colors"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => submitListing({ saveAsDraft: true })}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => submitListing({ saveAsDraft: false })}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitting
                    ? 'Submitting...'
                    : isEditMode
                    ? 'Update & Resubmit for Approval'
                    : 'Submit for Admin Approval'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
