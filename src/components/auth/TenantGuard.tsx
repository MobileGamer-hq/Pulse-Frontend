import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AccessDeniedScreen } from './AccessDeniedScreen';

interface TenantGuardProps {
  children: React.ReactNode;
}

export const TenantGuard: React.FC<TenantGuardProps> = ({ children }) => {
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { currentOrgSlug, setCurrentOrgSlug } = useApp();

  const targetSlug = (orgSlug || localStorage.getItem('pulse_tenant_slug') || 'epicordia').toLowerCase();
  const isAuthorized = Boolean(targetSlug && targetSlug.length > 0);

  useEffect(() => {
    if (isAuthorized && currentOrgSlug !== targetSlug) {
      setCurrentOrgSlug(targetSlug);
    }
  }, [targetSlug, isAuthorized, currentOrgSlug, setCurrentOrgSlug]);

  if (!isAuthorized) {
    return <AccessDeniedScreen orgSlug={targetSlug} />;
  }

  return <>{children}</>;
};
