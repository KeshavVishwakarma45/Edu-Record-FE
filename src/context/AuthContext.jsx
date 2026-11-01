import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { setAccessToken, setInstituteId, setSessionExpiredHandler } from '@/api/client';

// Who is logged in, which institutes they can open, and which one is selected.
// Read it anywhere with:  const { user, selectedInstitute, currentRole } = useAuth();
// eslint-disable-next-line react-refresh/only-export-components -- the context and its provider belong together
export const AuthContext = createContext(null);

// The selected institute survives a page refresh, but not closing the browser tab
const STORAGE_KEY = 'edurecords.instituteId';

function readStoredInstituteId() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage can be blocked (private mode); the first institute is used instead
  }
}

function storeInstituteId(id) {
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Not critical: only the "remember my institute" convenience is lost
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstituteId, setSelectedInstituteId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Save the login result and pick the institute: the remembered one if allowed, else the first
  const startSession = useCallback((data) => {
    if (data.accessToken) setAccessToken(data.accessToken);
    const stored = readStoredInstituteId();
    const chosen = data.institutes.find((i) => i.id === stored) ?? data.institutes[0] ?? null;
    setInstituteId(chosen?.id ?? null);
    setUser(data.user);
    setInstitutes(data.institutes);
    setSelectedInstituteId(chosen?.id ?? null);
  }, []);

  const endSession = useCallback(() => {
    setAccessToken(null);
    setInstituteId(null);
    setUser(null);
    setInstitutes([]);
    setSelectedInstituteId(null);
  }, []);

  // On app start: if the refresh cookie is still valid, the user stays logged in
  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        await authApi.refresh();
        const data = await authApi.me();
        if (active) startSession(data);
      } catch {
        // No valid session: the user will see the login page
      } finally {
        if (active) setLoading(false);
      }
    }
    restoreSession();
    return () => {
      active = false;
    };
  }, [startSession]);

  // When a token refresh fails mid-session, api/client.js calls this
  useEffect(() => {
    setSessionExpiredHandler(() => {
      endSession();
      navigate('/login', { replace: true });
    });
  }, [endSession, navigate]);

  const login = useCallback(
    async (mobile, password) => {
      const data = await authApi.login(mobile, password);
      startSession(data);
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      endSession();
      navigate('/login', { replace: true });
    }
  }, [endSession, navigate]);

  const selectInstitute = useCallback((id) => {
    storeInstituteId(id);
    setInstituteId(id); // before the state change, so the next requests already carry it
    setSelectedInstituteId(id);
  }, []);

  const value = useMemo(() => {
    const selectedInstitute = institutes.find((i) => i.id === selectedInstituteId) ?? null;
    return {
      user,
      institutes,
      selectedInstitute,
      currentRole: selectedInstitute?.role ?? null, // the user's role in the selected institute
      loading,
      login,
      logout,
      selectInstitute,
    };
  }, [user, institutes, selectedInstituteId, loading, login, logout, selectInstitute]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
