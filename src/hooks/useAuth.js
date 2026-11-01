import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

// const { user, selectedInstitute, currentRoleName, can, isSuperAdmin, logout, selectInstitute } = useAuth();
//   can(PERMISSIONS.COURSE_WRITE) -> true / false in the selected institute
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
