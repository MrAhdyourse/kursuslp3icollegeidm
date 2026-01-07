import React, { type ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 font-sans text-slate-800">
      <Navbar />
      
      {/* Main Content Area - flex-1 pushes footer down */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} LP3I College Indramayu. All rights reserved.</p>
          <p className="text-xs mt-1 text-gray-400">System developed with precision & creativity.</p>
        </div>
      </footer>
    </div>
  );
};
