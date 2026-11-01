import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import {
  ALL_INSTITUTES,
  setAccessToken,
  setInstituteId,
  setSessionExpiredHandler,
} from '@/api/client';
import { PERMISSION_LIST } from '@/constants/permissions';

// Who is logged in, which institutes they can open, and which one is selected.
// Read it anywhere with:  const { user, selectedInstitute, can, isSuperAdmin } = useAuth();
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

// The Super Admin's switcher starts with "All institutes": lists show every institute together
// (read only; each change is sent to one institute). Admins and staff pick one institute.
const ALL_ENTRY = {
  id: ALL_INSTITUTES,
  name: 'All institutes',
  shortCode: 'ALL',
  unit: null,
  roleName: 'Super Admin',
  permissions: PERMISSION_LIST,
};

const switcherList = (data) =>
  data.user.isSuperAdmin && data.institutes.length > 1
    ? [ALL_ENTRY, ...data.institutes]
    : data.institutes;

// Who owns roles and staff: each unit (sent as one of its institutes) and each separate
// institute. Used by the "Institute / unit" choice in the Super Admin's Add role and Invite forms.
function ownerOptions(institutes) {
  const options = [];
  const seenUnits = new Set();
  institutes.forEach((institute) => {
    if (!institute.unit) {
      options.push({ value: institute.id, label: `${institute.shortCode} · ${institute.name}` });
    } else if (!seenUnits.has(institute.unit.id)) {
      seenUnits.add(institute.unit.id);
      const members = institutes.filter((i) => i.unit?.id === institute.unit.id);
      options.push({
        value: institute.id,
        label: `${institute.unit.name} (${members.map((i) => i.shortCode).join(' + ')})`,
      });
    }
  });
  return options;
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
    const list = switcherList(data);
    const stored = readStoredInstituteId();
    const chosen = list.find((i) => i.id === stored) ?? list[0] ?? null;
    setInstituteId(chosen?.id ?? null);
    setUser(data.user);
    setInstitutes(list);
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
    async (email, password) => {
      const data = await authApi.login(email, password);
      startSession(data);
    },
    [startSession],
  );

  // After setting a password from an invite link, the server answers like a login
  const acceptSession = startSession;

  // Reload the user's institutes and roles, e.g. after the Super Admin combines institutes
  const reloadAccess = useCallback(async () => {
    const data = await authApi.me();
    setUser(data.user);
    setInstitutes(switcherList(data));
  }, []);

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
    const permissions = selectedInstitute?.permissions ?? [];
    const realInstitutes = institutes.filter((i) => i.id !== ALL_INSTITUTES);
    return {
      user,
      institutes, // what the switcher lists (with "All institutes" for the Super Admin)
      realInstitutes, // only real institutes, e.g. for an "Institute" choice in a form
      owners: ownerOptions(realInstitutes),
      selectedInstitute,
      // true in the Super Admin's "All institutes" view: show an Institute column, and ask
      // which institute when adding something
      allInstitutes: selectedInstitute?.id === ALL_INSTITUTES,
      // The user's role and permissions in the selected institute (or its unit)
      currentRoleName: selectedInstitute?.roleName ?? null,
      permissions,
      can: (permission) => permissions.includes(permission),
      isSuperAdmin: Boolean(user?.isSuperAdmin),
      loading,
      login,
      acceptSession,
      reloadAccess,
      logout,
      selectInstitute,
    };
  }, [
    user,
    institutes,
    selectedInstituteId,
    loading,
    login,
    acceptSession,
    reloadAccess,
    logout,
    selectInstitute,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
