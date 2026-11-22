import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home,
  Menu,
  X,
  PlusCircle,
  Heart,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Find Rooms', to: '/rooms' },
  { label: 'About Us', to: '/about' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, isAuthenticated, isOwner, isAdmin, favouriteIds, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    toast.info('Logged out successfully');
    navigate('/');
  };

  const listPropertyTarget = isAuthenticated
    ? isOwner
      ? '/owner/add-property'
      : '/owner/dashboard'
    : '/register?role=owner';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-sm shadow-blue-600/20 group-hover:bg-[#1D4ED8] transition-colors">
              <Home className="w-5 h-5 text-white" strokeWidth={2.25} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
                Room<span className="text-[#2563EB]">Khoj</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wide">
                PRAYAGRAJ
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#2563EB] bg-blue-50/80'
                      : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100/70'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to={listPropertyTarget}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              List Your Property
              <span className="ml-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#16A34A] text-white">
                Free
              </span>
            </Link>

            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-sm shadow-blue-600/20 transition-colors"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/favourites"
                  aria-label="Saved favourites"
                  className="relative p-2 rounded-lg text-slate-600 hover:text-[#2563EB] hover:bg-slate-100 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  {favouriteIds.size > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                      {favouriteIds.size}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center uppercase">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left leading-tight">
                      <p className="text-xs font-semibold text-[#0F172A] max-w-[110px] truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 py-1.5 z-50"
                      >
                        <div className="px-3.5 py-2 border-b border-slate-100">
                          <p className="text-xs font-semibold text-[#0F172A] truncate">{user.name}</p>
                          <p className="text-xs text-slate-500">+91 {user.mobile}</p>
                        </div>

                        {isOwner && (
                          <Link
                            to="/owner/dashboard"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2563EB]"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Owner Dashboard
                          </Link>
                        )}

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2563EB]"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}

                        <Link
                          to="/favourites"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2563EB]"
                        >
                          <Heart className="w-4 h-4" />
                          Saved Rooms ({favouriteIds.size})
                        </Link>

                        {!isOwner && (
                          <Link
                            to="/owner/dashboard"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2563EB]"
                          >
                            <UserIcon className="w-4 h-4" />
                            Switch to Owner
                          </Link>
                        )}

                        <div className="my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to={listPropertyTarget}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#2563EB] bg-blue-50 border border-blue-200/70"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              List Free
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Animated Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-slate-200 bg-white"
          >
            <div className="px-4 py-4 space-y-1.5">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <Link
                to={listPropertyTarget}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#2563EB] bg-blue-50/70"
              >
                <span>List Your Property</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#16A34A] text-white">
                  Free
                </span>
              </Link>

              <div className="pt-2 mt-2 border-t border-slate-100 space-y-1.5">
                {!isAuthenticated ? (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-center py-2.5 rounded-lg text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="text-center py-2.5 rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8]"
                    >
                      Register
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="px-3.5 py-2 bg-slate-50 rounded-lg">
                      <p className="text-sm font-semibold text-[#0F172A]">{user.name}</p>
                      <p className="text-xs text-slate-500">
                        +91 {user.mobile} • <span className="capitalize">{user.role}</span>
                      </p>
                    </div>
                    {isOwner && (
                      <Link
                        to="/owner/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
                        Owner Dashboard
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/favourites"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Heart className="w-4 h-4 text-[#2563EB]" />
                      Saved Rooms ({favouriteIds.size})
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
