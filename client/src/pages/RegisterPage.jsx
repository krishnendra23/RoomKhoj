import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Home,
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Search,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import Seo from '../components/common/Seo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractApiError } from '../utils/formatters';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'seeker' ? 'seeker' : 'owner';
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      role: initialRole,
      isDirectOwnerDeclared: initialRole === 'owner',
    },
  });

  const selectedRole = watch('role');
  const passwordValue = watch('password');

  const onSubmit = async (values) => {
    try {
      const user = await registerUser({
        name: values.name.trim(),
        mobile: values.mobile.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
        role: values.role,
        isDirectOwnerDeclared: values.role === 'owner' ? Boolean(values.isDirectOwnerDeclared) : false,
      });
      toast.success('Account created successfully!');
      if (user.role === 'owner') {
        navigate('/owner/dashboard', { replace: true });
      } else {
        navigate('/rooms', { replace: true });
      }
    } catch (err) {
      toast.error(extractApiError(err, 'Registration failed'));
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <Seo
        title="Register"
        description="Create a free RoomKhoj account as a direct property owner or room seeker in Prayagraj."
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-8">
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-[#0F172A]">
                Room<span className="text-[#2563EB]">Khoj</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-[#0F172A]">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">
              Free for direct property owners and room seekers
            </p>
          </div>

          {/* Account Type Selector */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => {
                setValue('role', 'owner', { shouldValidate: true });
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedRole === 'owner'
                  ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <Building2
                className={`w-5 h-5 mb-1.5 ${
                  selectedRole === 'owner' ? 'text-[#2563EB]' : 'text-slate-400'
                }`}
              />
              <p className="text-xs font-bold text-[#0F172A]">Property Owner</p>
              <p className="text-[11px] text-slate-500">Post rooms for free</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setValue('role', 'seeker', { shouldValidate: true });
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedRole === 'seeker'
                  ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <Search
                className={`w-5 h-5 mb-1.5 ${
                  selectedRole === 'seeker' ? 'text-[#2563EB]' : 'text-slate-400'
                }`}
              />
              <p className="text-xs font-bold text-[#0F172A]">Room Seeker</p>
              <p className="text-[11px] text-slate-500">Save favourite rooms</p>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit Indian mobile number"
                  {...register('mobile', {
                    required: 'Mobile number is required',
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: 'Enter a valid 10-digit Indian mobile number',
                    },
                  })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
                />
              </div>
              {errors.mobile && (
                <p className="mt-1 text-xs text-red-600">{errors.mobile.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters (letters + numbers)"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    validate: (v) =>
                      (/[A-Za-z]/.test(v) && /\d/.test(v)) ||
                      'Include both letters and numbers in your password',
                  })}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (v) => v === passwordValue || 'Passwords do not match',
                  })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Direct Owner Anti-Broker Declaration */}
            {selectedRole === 'owner' && (
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    {...register('isDirectOwnerDeclared', {
                      validate: (v) =>
                        selectedRole !== 'owner' ||
                        v === true ||
                        'You must confirm you are a direct property owner and not a broker/agent',
                    })}
                    className="mt-0.5 w-4 h-4 rounded border-emerald-400 text-[#16A34A] focus:ring-[#16A34A]"
                  />
                  <span className="leading-relaxed">
                    <strong className="text-[#0F172A] inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" /> Direct Owner
                      Declaration:
                    </strong>{' '}
                    I confirm I am a direct property owner and NOT a broker or property agent.
                    Accounts found charging brokerage will be permanently suspended.
                  </span>
                </label>
                {errors.isDirectOwnerDeclared && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.isDirectOwnerDeclared.message}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Creating account...' : 'Create Free Account'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#2563EB] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
