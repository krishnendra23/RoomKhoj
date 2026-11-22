import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShieldCheck,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  KeyRound,
  Flag,
  MapPin,
  Eye,
  Trash2,
  Ban,
  Check,
  Plus,
  Search,
  X,
} from 'lucide-react';
import Seo from '../components/common/Seo';
import AnimatedCounter from '../components/common/AnimatedCounter';
import { StatCardSkeleton } from '../components/common/Skeletons';
import { adminApi, localityApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatINR, formatDate, optimizeImageUrl, extractApiError } from '../utils/formatters';

const MAIN_TABS = [
  { id: 'properties', label: 'Property Moderation', icon: Building2 },
  { id: 'reports', label: 'Reported Listings', icon: Flag },
  { id: 'users', label: 'Users & Owners', icon: Users },
  { id: 'localities', label: 'Cities & Localities', icon: MapPin },
];

export default function AdminDashboardPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('properties');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Properties moderation state
  const [propStatus, setPropStatus] = useState('pending');
  const [propSearch, setPropSearch] = useState('');
  const [properties, setProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [inspectProperty, setInspectProperty] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Reports state
  const [reportStatus, setReportStatus] = useState('open');
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Users state
  const [userRole, setUserRole] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Localities state
  const [localities, setLocalities] = useState([]);
  const [loadingLocs, setLoadingLocs] = useState(false);
  const [newLoc, setNewLoc] = useState({
    city: 'Prayagraj',
    localityName: '',
    isPopular: false,
  });

  const [busyId, setBusyId] = useState(null);

  const loadStats = async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load admin statistics'));
    } finally {
      setLoadingStats(false);
    }
  };

  const loadProperties = async () => {
    setLoadingProps(true);
    try {
      const res = await adminApi.getProperties({
        status: propStatus,
        q: propSearch.trim() || undefined,
        limit: 30,
      });
      setProperties(res.data?.properties || []);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load properties'));
    } finally {
      setLoadingProps(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await adminApi.getReports({ status: reportStatus, limit: 30 });
      setReports(res.data?.reports || []);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load reports'));
    } finally {
      setLoadingReports(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await adminApi.getUsers({
        role: userRole,
        q: userSearch.trim() || undefined,
        limit: 30,
      });
      setUsers(res.data?.users || []);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load users'));
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadLocalities = async () => {
    setLoadingLocs(true);
    try {
      const res = await localityApi.getAll({ includeInactive: 'true' });
      setLocalities(res.data?.localities || []);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load localities'));
    } finally {
      setLoadingLocs(false);
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'properties') loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, propStatus]);

  useEffect(() => {
    if (activeTab === 'reports') loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, reportStatus]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userRole]);

  useEffect(() => {
    if (activeTab === 'localities') loadLocalities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleApprove = async (propertyId) => {
    setBusyId(propertyId);
    try {
      await adminApi.moderateProperty(propertyId, { action: 'approve' });
      toast.success('Listing approved and published live');
      setInspectProperty(null);
      await Promise.all([loadProperties(), loadStats()]);
    } catch (err) {
      toast.error(extractApiError(err, 'Approval failed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) {
      toast.error('Please enter a clear rejection reason (min 5 characters)');
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await adminApi.moderateProperty(rejectTarget.id, {
        action: 'reject',
        rejectionReason: rejectReason.trim(),
      });
      toast.success('Listing rejected');
      setRejectTarget(null);
      setRejectReason('');
      setInspectProperty(null);
      await Promise.all([loadProperties(), loadStats()]);
    } catch (err) {
      toast.error(extractApiError(err, 'Rejection failed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Permanently delete this listing from RoomKhoj?')) return;
    setBusyId(propertyId);
    try {
      await adminApi.deleteProperty(propertyId);
      toast.success('Fake/invalid listing removed');
      setInspectProperty(null);
      await Promise.all([loadProperties(), loadStats(), activeTab === 'reports' && loadReports()]);
    } catch (err) {
      toast.error(extractApiError(err, 'Could not delete property'));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleUserStatus = async (userObj) => {
    const nextStatus = userObj.accountStatus === 'active' ? 'suspended' : 'active';
    const msg =
      nextStatus === 'suspended'
        ? `Suspend ${userObj.name}? Their active/pending listings will also be hidden.`
        : `Reactivate ${userObj.name}'s account?`;
    if (!window.confirm(msg)) return;

    setBusyId(userObj.id);
    try {
      await adminApi.updateUserStatus(userObj.id, nextStatus);
      toast.success(`User ${nextStatus === 'suspended' ? 'suspended' : 'reactivated'}`);
      await Promise.all([loadUsers(), loadStats()]);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to update user status'));
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateReport = async (reportId, status) => {
    setBusyId(reportId);
    try {
      await adminApi.updateReport(reportId, { status });
      toast.success(`Report marked as ${status}`);
      await Promise.all([loadReports(), loadStats()]);
    } catch (err) {
      toast.error(extractApiError(err, 'Could not update report'));
    } finally {
      setBusyId(null);
    }
  };

  const handleAddLocality = async (e) => {
    e.preventDefault();
    if (!newLoc.localityName.trim()) {
      toast.error('Enter a locality name');
      return;
    }
    try {
      await localityApi.create({
        city: newLoc.city.trim() || 'Prayagraj',
        localityName: newLoc.localityName.trim(),
        isPopular: newLoc.isPopular,
        active: true,
      });
      toast.success(`Added ${newLoc.localityName}`);
      setNewLoc({ city: newLoc.city, localityName: '', isPopular: false });
      await loadLocalities();
    } catch (err) {
      toast.error(extractApiError(err, 'Could not add locality'));
    }
  };

  const handleToggleLocalityField = async (loc, field) => {
    try {
      await localityApi.update(loc.id, { [field]: !loc[field] });
      toast.success('Locality updated');
      await loadLocalities();
    } catch (err) {
      toast.error(extractApiError(err, 'Update failed'));
    }
  };

  const kpiCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, cls: 'text-[#2563EB] bg-blue-50' },
    { label: 'Total Listings', value: stats?.totalListings || 0, icon: Building2, cls: 'text-indigo-600 bg-indigo-50' },
    { label: 'Pending Approval', value: stats?.pendingListings || 0, icon: Clock, cls: 'text-amber-600 bg-amber-50' },
    { label: 'Approved Live', value: stats?.approvedListings || 0, icon: CheckCircle2, cls: 'text-[#16A34A] bg-emerald-50' },
    { label: 'Rejected', value: stats?.rejectedListings || 0, icon: XCircle, cls: 'text-red-600 bg-red-50' },
    { label: 'Rented Out', value: stats?.rentedListings || 0, icon: KeyRound, cls: 'text-slate-700 bg-slate-100' },
    { label: 'Open Reports', value: stats?.openReports || 0, icon: Flag, cls: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <Seo title="Admin Moderation Panel" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              RoomKhoj Moderation Console
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Admin Dashboard</h1>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
          {loadingStats
            ? Array.from({ length: 7 }).map((_, i) => <StatCardSkeleton key={i} />)
            : kpiCards.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={kpi.label}
                    className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-2xs"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.cls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="mt-3 text-2xl font-extrabold text-[#0F172A]">
                      <AnimatedCounter value={kpi.value} />
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{kpi.label}</p>
                  </div>
                );
              })}
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-[#2563EB] text-[#2563EB] bg-white'
                    : 'border-transparent text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'properties' && stats?.pendingListings > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    {stats.pendingListings}
                  </span>
                )}
                {tab.id === 'reports' && stats?.openReports > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                    {stats.openReports}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROPERTY MODERATION */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {['pending', 'approved', 'rejected', 'rented', 'all'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPropStatus(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize ${
                      propStatus === st
                        ? 'bg-[#0F172A] text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadProperties();
                }}
                className="flex gap-2"
              >
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={propSearch}
                    onChange={(e) => setPropSearch(e.target.value)}
                    placeholder="Title, locality or phone..."
                    className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs w-56"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
                >
                  Search
                </button>
              </form>
            </div>

            {loadingProps ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl rk-skeleton" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
                No listings found in &ldquo;{propStatus}&rdquo; queue.
              </div>
            ) : (
              <div className="space-y-3.5">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col md:flex-row gap-4 shadow-2xs"
                  >
                    <img
                      src={optimizeImageUrl(prop.photos?.[0]?.url, 320)}
                      alt={prop.title}
                      className="w-full md:w-40 h-28 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {prop.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          {prop.propertyType} • {prop.locality}, {prop.city}
                        </span>
                        <span className="text-xs font-bold text-[#0F172A]">
                          {formatINR(prop.monthlyRent)}/mo
                        </span>
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-[#0F172A] truncate">
                        {prop.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Owner:{' '}
                        <strong className="text-[#0F172A]">
                          {prop.ownerAccount?.name || 'Unknown'}
                        </strong>{' '}
                        (+91 {prop.ownerAccount?.mobile || prop.contactPhone}) • Submitted{' '}
                        {formatDate(prop.createdAt)}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectProperty(prop)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect Details
                        </button>
                        {prop.status !== 'approved' && (
                          <button
                            type="button"
                            disabled={busyId === prop.id}
                            onClick={() => handleApprove(prop.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {prop.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={busyId === prop.id}
                            onClick={() => {
                              setRejectTarget(prop);
                              setRejectReason('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === prop.id}
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REPORTED LISTINGS */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['open', 'reviewed', 'resolved', 'dismissed', 'all'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setReportStatus(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize ${
                    reportStatus === st
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {loadingReports ? (
              <div className="h-32 rounded-2xl rk-skeleton" />
            ) : reports.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
                No reports in this queue.
              </div>
            ) : (
              <div className="space-y-3.5">
                {reports.map((rep) => (
                  <div
                    key={rep._id}
                    className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        {rep.reason}
                      </span>
                      <span className="text-xs text-slate-500">
                        Status: <strong className="uppercase">{rep.status}</strong> •{' '}
                        {formatDate(rep.createdAt)}
                      </span>
                    </div>
                    {rep.description && (
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">
                        {rep.description}
                      </p>
                    )}
                    <div className="text-xs text-slate-600 flex flex-wrap gap-4">
                      <span>
                        Listing:{' '}
                        <strong className="text-[#0F172A]">
                          {rep.propertyId?.title || 'Deleted Property'}
                        </strong>{' '}
                        ({rep.propertyId?.locality})
                      </span>
                      {rep.propertyId?.ownerId && (
                        <span>
                          Owner: <strong>{rep.propertyId.ownerId.name}</strong> (+91{' '}
                          {rep.propertyId.ownerId.mobile})
                        </span>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      {rep.status !== 'resolved' && (
                        <button
                          type="button"
                          disabled={busyId === rep._id}
                          onClick={() => handleUpdateReport(rep._id, 'resolved')}
                          className="px-3 py-1.5 rounded-lg bg-[#16A34A] text-white text-xs font-semibold"
                        >
                          Mark Resolved
                        </button>
                      )}
                      {rep.status !== 'dismissed' && (
                        <button
                          type="button"
                          disabled={busyId === rep._id}
                          onClick={() => handleUpdateReport(rep._id, 'dismissed')}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                        >
                          Dismiss
                        </button>
                      )}
                      {rep.propertyId?._id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteProperty(rep.propertyId._id)}
                          className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Reported Listing
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USERS & OWNERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {['all', 'owner', 'seeker', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUserRole(r)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize ${
                      userRole === r
                        ? 'bg-[#0F172A] text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadUsers();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Name or mobile..."
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs w-52"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/80 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Listings</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Loading users...
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-[#0F172A]">{u.name}</td>
                        <td className="px-4 py-3">+91 {u.mobile}</td>
                        <td className="px-4 py-3 capitalize">{u.role}</td>
                        <td className="px-4 py-3">{u.listingCount}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.accountStatus === 'active'
                                ? 'bg-emerald-50 text-[#16A34A]'
                                : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {u.accountStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              disabled={busyId === u.id}
                              onClick={() => handleToggleUserStatus(u)}
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold ${
                                u.accountStatus === 'active'
                                  ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border border-emerald-200 text-[#16A34A] hover:bg-emerald-50'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              {u.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CITIES & LOCALITIES */}
        {activeTab === 'localities' && (
          <div className="space-y-6">
            <form
              onSubmit={handleAddLocality}
              className="rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col sm:flex-row items-end gap-3"
            >
              <div className="w-full sm:w-44">
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={newLoc.city}
                  onChange={(e) => setNewLoc((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Locality Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., George Town, Bamrauli, Phaphamau"
                  value={newLoc.localityName}
                  onChange={(e) =>
                    setNewLoc((prev) => ({ ...prev, localityName: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 pb-2.5">
                <input
                  type="checkbox"
                  checked={newLoc.isPopular}
                  onChange={(e) => setNewLoc((prev) => ({ ...prev, isPopular: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#2563EB]"
                />
                Popular
              </label>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" /> Add Locality
              </button>
            </form>

            <div className="rounded-2xl bg-white border border-slate-200/80 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Locality</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Live Listings</th>
                    <th className="px-4 py-3">Popular</th>
                    <th className="px-4 py-3">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingLocs ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Loading localities...
                      </td>
                    </tr>
                  ) : (
                    localities.map((loc) => (
                      <tr key={loc.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-[#0F172A]">
                          {loc.localityName}
                        </td>
                        <td className="px-4 py-3">{loc.city}</td>
                        <td className="px-4 py-3">{loc.listingCount}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleLocalityField(loc, 'isPopular')}
                            className={`px-2.5 py-1 rounded-lg font-semibold ${
                              loc.isPopular
                                ? 'bg-blue-50 text-[#2563EB]'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {loc.isPopular ? 'Popular' : 'Standard'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleLocalityField(loc, 'active')}
                            className={`px-2.5 py-1 rounded-lg font-semibold ${
                              loc.active
                                ? 'bg-emerald-50 text-[#16A34A]'
                                : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {loc.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Property Details Modal (Before Approval) */}
      <AnimatePresence>
        {inspectProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setInspectProperty(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">{inspectProperty.title}</h2>
                  <p className="text-xs text-slate-500">
                    {inspectProperty.propertyType} • {inspectProperty.locality},{' '}
                    {inspectProperty.city} • {formatINR(inspectProperty.monthlyRent)}/month
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectProperty(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Photos */}
              <div className="grid grid-cols-3 gap-2">
                {(inspectProperty.photos || []).map((p, idx) => (
                  <img
                    key={idx}
                    src={optimizeImageUrl(p.url, 400)}
                    alt={`Listing ${idx + 1}`}
                    className="w-full h-28 object-cover rounded-xl bg-slate-100"
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 rounded-xl p-4">
                <div>
                  <p className="text-slate-500">Owner Account</p>
                  <p className="font-semibold text-[#0F172A]">
                    {inspectProperty.ownerAccount?.name} (+91{' '}
                    {inspectProperty.ownerAccount?.mobile})
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Listing Contact Phone</p>
                  <p className="font-semibold text-[#0F172A]">
                    +91 {inspectProperty.contactPhone}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Public Area &amp; Landmark</p>
                  <p className="font-semibold text-[#0F172A]">
                    {inspectProperty.address?.publicArea}{' '}
                    {inspectProperty.address?.landmark
                      ? `(${inspectProperty.address.landmark})`
                      : ''}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Private Exact Address</p>
                  <p className="font-semibold text-[#0F172A]">
                    {inspectProperty.address?.exactAddress || 'Not provided'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-slate-500">Tenant Preferences</p>
                  <p className="font-semibold text-[#0F172A]">
                    {inspectProperty.tenantPreferences?.genderPreference} •{' '}
                    {(inspectProperty.tenantPreferences?.tenantTypes || []).join(', ')} •{' '}
                    {inspectProperty.tenantPreferences?.foodPreference}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {inspectProperty.description}
              </p>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                {inspectProperty.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(inspectProperty.id)}
                    className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    Approve &amp; Publish
                  </button>
                )}
                {inspectProperty.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectTarget(inspectProperty);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold"
                  >
                    Reject with Reason
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-[#0F172A]/60 flex items-center justify-center p-4"
            onClick={() => setRejectTarget(null)}
          >
            <form
              onSubmit={handleRejectSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-[#0F172A]">Reject Listing</h3>
              <p className="text-xs text-slate-500">
                Provide a clear reason for rejecting{' '}
                <strong className="text-[#0F172A]">{rejectTarget.title}</strong>. This note will be
                shown to the owner in their dashboard.
              </p>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Blurry photos, suspected broker contact, incomplete address..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
