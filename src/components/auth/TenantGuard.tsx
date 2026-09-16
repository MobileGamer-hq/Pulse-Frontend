import React, { useEffect, useState } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AccessDeniedScreen } from './AccessDeniedScreen';
import { supabase, getOrgBySlug } from '../../services/supabaseClient';
import { WorkspaceGlassLoader } from '../common/WorkspaceGlassLoader';
import type { Role } from '../../types';

interface TenantGuardProps {
  children: React.ReactNode;
}

export const TenantGuard: React.FC<TenantGuardProps> = ({ children }) => {
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { currentOrgSlug, setCurrentOrgSlug, setActiveRole, updateCurrentUser } = useApp();
  const location = useLocation();

  const targetSlug = (orgSlug || localStorage.getItem('pulse_tenant_slug') || '').toLowerCase().trim();

  const [accessState, setAccessState] = useState<'checking' | 'approved' | 'pending' | 'denied' | 'unauthenticated'>('checking');

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      if (!targetSlug) {
        if (isMounted) setAccessState('denied');
        return;
      }

      // 1. Check active Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        if (isMounted) setAccessState('unauthenticated');
        return;
      }

      const userId = session.user.id;
      const userEmail = session.user.email || '';
      const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0];

      // Sync user info into context
      updateCurrentUser({
        id: userId,
        email: userEmail,
        name: userName,
      });

      // 2. Query Supabase for organization
      try {
        const org = await getOrgBySlug(targetSlug);
        if (!org) {
          if (isMounted) setAccessState('denied');
          return;
        }

        // 3. Query Supabase for membership
        const { data: membership, error: memError } = await supabase
          .from('organization_memberships')
          .select('role, status')
          .eq('org_id', org.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (memError || !membership) {
          if (isMounted) setAccessState('denied');
          return;
        }

        const status = (membership.status || '').toLowerCase();
        const rawRole = membership.role || 'member';
        const formattedRole: Role = (rawRole.charAt(0).toUpperCase() + rawRole.slice(1)) as Role;

        if (status === 'pending') {
          if (isMounted) setAccessState('pending');
        } else if (status === 'approved') {
          if (isMounted) {
            setActiveRole(formattedRole);
            updateCurrentUser({ role: formattedRole });
            if (currentOrgSlug !== targetSlug) {
              setCurrentOrgSlug(targetSlug);
            }
            localStorage.setItem('pulse_tenant_slug', targetSlug);
            setAccessState('approved');
          }
        } else {
          if (isMounted) setAccessState('denied');
        }
      } catch (e) {
        console.warn('[TenantGuard] Supabase verification exception:', e);
        if (isMounted) setAccessState('denied');
      }
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [targetSlug, currentOrgSlug]);

  if (accessState === 'unauthenticated') {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  if (accessState === 'checking') {
    return <WorkspaceGlassLoader />;
  }

  if (accessState === 'denied') {
    return <AccessDeniedScreen orgSlug={targetSlug} />;
  }

  const isWaitingRoom = location.pathname.includes('/waiting-room');
  if (accessState === 'pending' && !isWaitingRoom) {
    return <Navigate to={`/${targetSlug}/waiting-room`} replace />;
  }

  if (accessState === 'approved' && isWaitingRoom) {
    return <Navigate to={`/${targetSlug}/dashboard`} replace />;
  }

  return <>{children}</>;
};


