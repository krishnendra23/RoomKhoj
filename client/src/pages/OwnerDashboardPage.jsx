import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  KeyRound,
  Eye,
  PhoneCall,
  MessageCircle,
  Edit3,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import Seo from '../components/common/Seo';
import AnimatedCounter from '../components/common/AnimatedCounter';
import { StatCardSkeleton } from '../components/common/Skeletons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi, propertyApi } from '../services/api';
import { formatINR, formatDate, optimizeImageUrl, extractApiError } from '../utils/formatters';

const STATUS_TABS = [
  { id: 'all', label: 'All Listings' },
  { id: 'approved', label: 'Approved' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'draft', label: 'Drafts' },
  { id: 'rented', label: 'Rented' },
];

export default function OwnerDashboardPage() {
  const { user, isOwner, otpEnabled, refreshProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // Upgrade seeker -> owner state
  const [declaredOwner, setDeclaredOwner] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Genuine OTP verification state (only active if server OTP provider is configured)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);

  const loadListings = async (tab = activeTab) => {
    if (!isOwner) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await propertyApi.getMyListings(tab);
      setStats(res.data?.stats || null);
      setProperties(res.data?.properties || []);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load your listings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOwner]);

  const handleUpgradeToOwner = async () => {
    if (!declaredOwner) {
      toast.error('Please confirm you are a direct property owner and not a broker.');
      return;
    }
    setUpgrading(true);
    try {
      await authApi.updateProfile({ upgradeToOwner: true, isDirectOwnerDeclared: true });
      await refreshProfile();
      toast.success('Account upgraded to Direct Property Owner!');
    } catch (err) {
      toast.error(extractApiError(err, 'Could not upgrade account'));
    } finally {
      setUpgrading(false);
    }
  };

  const handleToggleAvailability = async (property) => {
    const next = property.availability === 'available' ? 'rented' : 'available';
    setBusyId(property.id);
    try {
      await propertyApi.updateAvailability(property.id, next);
      toast.success(
        next === 'rented' ? 'Listing marked as Rented' : 'Listing marked as Available again'
      );
      await loadListings(activeTab);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to update availability'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (property) => {
    if (
      !window.confirm(
        `Delete "${property.title}" permanently? This action cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(property.id);
    try {
      await propertyApi.remove(property.id);
      toast.success('Property deleted permanently');
      await loadListings(activeTab);
    } catch (err) {
      toast.error(extractApiError(err, 'Could not delete property'));
    } finally {
      setBusyId(null);
    }
  };

  const handleSendOtp = async () => {
    setOtpBusy(true);
    try {
      await authApi.sendOtp();
      setOtpSent(true);
      toast.success('OTP sent to your registered mobile number');
    } catch (err) {
      toast.error(extractApiError(err, 'Could not send OTP'));
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpBusy(true);
    try {
      await authApi.verifyOtp(otpCode);
      await refreshProfile();
      setOtpSent(false);
      setOtpCode('');
      toast.success('Mobile number verified!');
    } catch (err) {
      toast.error(extractApiError(err, 'Invalid OTP'));
    } finally {
      setOtpBusy(false);
    }
  };

  // Seeker Upgrade View
  if (!isOwner) {
    return (
      <div className="min-h-[75vh] bg-[#F8FAFC] py-12 px-4">
        <Seo title="Become a Property Owner" />
        <div className="max-w-lg mx-auto rounded-2xl bg-white border border-slate-200 p-7 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A]">Switch to Direct Property Owner</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Your account is currently registered as a Room Seeker. To publish rooms on RoomKhoj for
            free, confirm our Direct Owner policy below.
          </p>

          <label className="mt-5 flex items-start gap-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={declaredOwner}
              onChange={(e) => setDeclaredOwner(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#16A34A]"
            />
            <span>
              I confirm that I am a direct property owner and NOT a broker or agent. I will not
              charge any brokerage fee to RoomKhoj tenants.
            </span>
          </label>

          <button
            type="button"
            disabled={upgrading}
            onClick={handleUpgradeToOwner}
            className="mt-5 w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold disabled:opacity-60"
          >
            {upgrading ? 'Upgrading...' : 'Enable Owner Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Listings', value: stats?.total || 0, icon: Building2, color: 'text-[#2563EB] bg-blue-50' },
    { label: 'Approved Live', value: stats?.approved || 0, icon: CheckCircle2, color: 'text-[#16A34A] bg-emerald-50' },
    { label: 'Pending Review', value: stats?.pending || 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Rejected', value: stats?.rejected || 0, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { label: 'Rented Out', value: stats?.rented || 0, icon: KeyRound, color: 'text-slate-700 bg-slate-100' },
    { label: 'Total Views', value: stats?.totalViews || 0, icon: Eye, color: 'text-indigo-600 bg-indigo-50' },
  ];

  const statusBadge = (status) => {
    if (status === 'approved')
      return 'bg-emerald-50 text-[#16A34A] border-emerald-200';
    if (status === 'pending')
      return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'rejected')
      return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <Seo title="Owner Dashboard" description="Manage your RoomKhoj rental property listings." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Owner Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome, <span className="font-semibold text-[#0F172A]">{user.name}</span> (+91{' '}
              {user.mobile}) •{' '}
              <span className="inline-flex items-center gap-1 text-[#16A34A] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Direct Owner
              </span>
            </p>
          </div>
          <Link
            to="/owner/add-property"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold shadow-sm shadow-blue-600/20 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Property
          </Link>
        </div>

        {/* Genuine OTP Verification Banner (only interactive when OTP provider is configured) */}
        {!user.phoneVerified && otpEnabled && (
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#0F172A]">Verify your mobile number</p>
                <p className="text-xs text-slate-600">
                  Verified owners build higher trust with room seekers in Prayagraj.
                </p>
              </div>
            </div>
            {!otpSent ? (
              <button
                type="button"
                disabled={otpBusy}
                onClick={handleSendOtp}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] shrink-0"
              >
                {otpBusy ? 'Sending...' : 'Send OTP'}
              </button>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-32 px-3 py-2 rounded-xl border border-blue-300 bg-white text-sm"
                />
                <button
                  type="submit"
                  disabled={otpBusy}
                  className="px-4 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-semibold"
                >
                  Verify
                </button>
              </form>
            )}
          </div>
        )}

        {/* Animated Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading && !stats
            ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
            : statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">{card.label}</span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="mt-3 text-2xl font-extrabold text-[#0F172A]">
                      <AnimatedCounter value={card.value} />
                    </p>
                  </motion.div>
                );
              })}
        </div>

        {/* Performance Summary Strip */}
        {stats && (
          <div className="rounded-2xl bg-white border border-slate-200/80 px-5 py-3.5 flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <span className="font-semibold text-[#0F172A]">Tenant Inquiries:</span>
            <span className="inline-flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-[#2563EB]" />
              <strong className="text-[#0F172A]">{stats.totalCalls}</strong> Direct Call clicks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#16A34A]" />
              <strong className="text-[#0F172A]">{stats.totalWhatsapp}</strong> WhatsApp clicks
            </span>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Properties List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-36 rounded-2xl rk-skeleton" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200/80 p-12 text-center shadow-xs">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-[#0F172A]">No listings in this category</h2>
            <p className="mt-1 text-sm text-slate-500">
              Publish your vacant room, 1BHK, 2BHK, or PG for free to reach Prayagraj tenants.
            </p>
            <Link
              to="/owner/add-property"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              Post Your First Room
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((prop) => {
              const cover = prop.photos?.find((p) => p.isPrimary)?.url || prop.photos?.[0]?.url;
              return (
                <div
                  key={prop.id}
                  className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-4"
                >
                  <img
                    src={optimizeImageUrl(cover, 400)}
                    alt={prop.title}
                    className="w-full md:w-48 h-36 rounded-xl object-cover bg-slate-100 shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase border ${statusBadge(
                          prop.status
                        )}`}
                      >
                        {prop.status}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          prop.availability === 'rented'
                            ? 'bg-slate-800 text-white'
                            : 'bg-blue-50 text-[#2563EB]'
                        }`}
                      >
                        {prop.availability === 'rented' ? 'Rented' : 'Available'}
                      </span>
                      <span className="text-xs text-slate-400">
                        Updated {formatDate(prop.updatedAt)}
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-bold text-[#0F172A] truncate">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {prop.propertyType} • {prop.locality}, {prop.city} •{' '}
                      <strong className="text-[#0F172A]">
                        {formatINR(prop.monthlyRent)}/month
                      </strong>
                    </p>

                    {/* Rejection Reason */}
                    {prop.status === 'rejected' && prop.rejectionReason && (
                      <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          <strong>Moderation Note:</strong> {prop.rejectionReason}
                        </span>
                      </div>
                    )}

                    {/* Performance Stats */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {prop.stats?.views || 0} views
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <PhoneCall className="w-3.5 h-3.5" /> {prop.stats?.callClicks || 0} calls
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> {prop.stats?.whatsappClicks || 0}{' '}
                        WhatsApp
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <Link
                        to={`/rooms/${prop.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Preview
                      </Link>
                      <Link
                        to={`/owner/edit-property/${prop.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-xs font-semibold text-[#2563EB]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === prop.id}
                        onClick={() => handleToggleAvailability(prop)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        {prop.availability === 'available'
                          ? 'Mark as Rented'
                          : 'Mark as Available'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === prop.id}
                        onClick={() => handleDelete(prop)}
                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
