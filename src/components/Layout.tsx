import React, { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation (Left) */}
      <Sidebar />

      {/* Main Content (Right) */}
      <main className="flex-1 ml-64 p-8 overflow-x-hidden flex flex-col min-h-screen">
        <div className="max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
