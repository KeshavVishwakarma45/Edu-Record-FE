import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

// const { user, institutes, selectedInstitute, currentRole, login, logout, selectInstitute } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
