import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export const LocationCard: React.FC = () => {
  // Lokasi: LP3I COLLEGE INDRAMAYU (Updated Coordinate)
  const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.428807375795!2d108.3394395!3d-6.338465299999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6eb951c4d31181%3A0x311702c332079b2c!2sLP3I%20COLLEGE%20INDRAMAYU!5e0!3m2!1sid!2sid!4v1768706447337!5m2!1sid!2sid";

  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <MapPin className="text-red-500 fill-red-500/20" />
            Lokasi Kampus
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            LP3I COLLEGE INDRAMAYU
          </p>
        </div>
        
        <a 
          href="https://www.google.com/maps/search/?api=1&query=LP3I+COLLEGE+INDRAMAYU" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-white hover:bg-white text-blue-600 rounded-xl font-bold text-xs shadow-sm transition-all hover:scale-105"
        >
          <Navigation size={14} />
          Buka Rute
        </a>
      </div>

      {/* Map Container with Glass Border */}
      <div className="w-full h-[350px] rounded-2xl overflow-hidden border-4 border-white/40 shadow-inner relative">
        <iframe 
          src={mapUrl} 
          width="100%" 
          height="100%" 
          style={{ border: 0, filter: 'contrast(1.1) saturate(1.1)' }} 
          allowFullScreen={true} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Peta Lokasi LP3I Indramayu"
          className="w-full h-full"
        ></iframe>
        
        {/* Overlay Gradient for Smooth Blend */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] rounded-2xl"></div>
      </div>

      {/* Address Detail */}
      <div className="mt-6 flex items-start gap-4 p-4 bg-slate-50/50 rounded-xl border border-white/50 backdrop-blur-sm">
         <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
            <MapPin size={20} />
         </div>
         <div>
            <h4 className="font-bold text-slate-800 text-sm">LP3I College Indramayu</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
               Jl. Pahlawan No.9, Lemahmekar, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45212
            </p>
         </div>
      </div>

    </div>
  );
};
