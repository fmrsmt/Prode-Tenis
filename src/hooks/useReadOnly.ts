import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useFirebase } from '../components/FirebaseProvider';

const ADMIN_EMAIL = "frankimedinaraed@gmail.com";

export function useIsAdmin() {
  const { user } = useFirebase();
  return useMemo(() => {
    return user?.email === ADMIN_EMAIL;
  }, [user]);
}

export function useReadOnly() {
  const location = useLocation();
  const isAdmin = useIsAdmin();
  
  const isForcedReadOnly = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('view') === '1' || params.get('readonly') === 'true';
  }, [location.search]);

  // Effectively read only if forced OR if not an admin
  const isReadOnly = isForcedReadOnly || !isAdmin;

  return { isReadOnly, isForcedReadOnly };
}
