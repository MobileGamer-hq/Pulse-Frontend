import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface TenantGuardProps {
  children: React.ReactNode;
}

export const TenantGuard: React.FC<TenantGuardProps> = ({ children }) => {
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { currentOrgSlug, setCurrentOrgSlug } = useApp();

  const targetSlug = (orgSlug || localStorage.getItem('pulse_tenant_slug') || 'epicordia').toLowerCase();

  useEffect(() => {
    if (currentOrgSlug !== targetSlug) {
      setCurrentOrgSlug(targetSlug);
    }
  }, [targetSlug, currentOrgSlug, setCurrentOrgSlug]);

  return <>{children}</>;
};
