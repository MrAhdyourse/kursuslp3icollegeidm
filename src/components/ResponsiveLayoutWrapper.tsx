import React, { type ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { Layout as DesktopLayout } from './Layout';
import { MobileLayout } from './MobileLayout';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Komponen Cerdas yang otomatis memilih tampilan Layout
 * berdasarkan ukuran layar perangkat pengguna.
 */
export const ResponsiveLayoutWrapper: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
};
