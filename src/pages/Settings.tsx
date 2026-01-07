import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-6">
       <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Pengaturan</h1>
        <p className="text-slate-500 mt-2">Konfigurasi sistem dan preferensi akun.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col items-center justify-center text-slate-400">
        <SettingsIcon size={48} className="mb-4 text-slate-300" />
        <p>Halaman konfigurasi sistem akan tampil di sini.</p>
      </div>
    </div>
  );
};

export default Settings;
