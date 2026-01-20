import React, { type ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation (Left) */}
      <Sidebar isCollapsed={isCollapsed} toggle={() => setIsCollapsed(!isCollapsed)} />

      {/* Main Content (Right) */}
      <main 
        className={`flex-1 p-8 overflow-x-hidden flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
