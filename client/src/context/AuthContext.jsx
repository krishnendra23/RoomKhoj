import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, favouriteApi, getStoredToken, setStoredToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const loadFavourites = useCallback(async () => {
    try {
      const res = await favouriteApi.getIds();
      setFavouriteIds(new Set(res.data?.favouriteIds || []));
    } catch {
      setFavouriteIds(new Set());
    }
  }, []);

  const hydrateSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setFavouriteIds(new Set());
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getProfile();
      setUser(res.data?.user || null);
      setOtpEnabled(Boolean(res.data?.otpEnabled));
      await loadFavourites();
    } catch {
      setStoredToken(null);
      setUser(null);
      setFavouriteIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [loadFavourites]);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  const login = useCallback(
    async (credentials) => {
      const res = await authApi.login(credentials);
      setStoredToken(res.data.token);
      setUser(res.data.user);
      setOtpEnabled(Boolean(res.data.otpEnabled));
      await loadFavourites();
      return res.data.user;
    },
    [loadFavourites]
  );

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    setStoredToken(res.data.token);
    setUser(res.data.user);
    setOtpEnabled(Boolean(res.data.otpEnabled));
    setFavouriteIds(new Set());
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    setFavouriteIds(new Set());
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await authApi.getProfile();
    setUser(res.data?.user || null);
    setOtpEnabled(Boolean(res.data?.otpEnabled));
    return res.data?.user;
  }, []);

  const toggleFavourite = useCallback(async (propertyId) => {
    const res = await favouriteApi.toggle(propertyId);
    const isFavourited = Boolean(res.data?.isFavourited);
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (isFavourited) next.add(String(propertyId));
      else next.delete(String(propertyId));
      return next;
    });
    return isFavourited;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        otpEnabled,
        loading,
        isAuthenticated: Boolean(user),
        isOwner: user?.role === 'owner' || user?.role === 'admin',
        isAdmin: user?.role === 'admin',
        favouriteIds,
        login,
        register,
        logout,
        refreshProfile,
        toggleFavourite,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
