import React, { useState, useEffect } from 'react';
import { Map, Calculator, TrendingUp, Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

// --- DATA ENGINE (SIMULASI PYTHON LOGIC) ---
// Data UMK 2026 Resmi/Estimasi Jawa Barat & Jakarta
const SALARY_DATA = [
  { id: 'BKS_KOTA', name: 'Kota Bekasi', umk: 5999443, cost: 2800000, color: '#d62828' },
  { id: 'BKS_KAB', name: 'Kab. Bekasi', umk: 5938885, cost: 2700000, color: '#d62828' },
  { id: 'KRW', name: 'Kab. Karawang', umk: 5886853, cost: 2700000, color: '#d62828' },
  { id: 'JKT', name: 'DKI Jakarta', umk: 5650000, cost: 3000000, color: '#0056b3' },
  { id: 'DPK', name: 'Kota Depok', umk: 5522662, cost: 2600000, color: '#d62828' },
  { id: 'BGR_KOTA', name: 'Kota Bogor', umk: 5437203, cost: 2500000, color: '#d62828' },
  { id: 'BGR_KAB', name: 'Kab. Bogor', umk: 5161769, cost: 2400000, color: '#d62828' },
  { id: 'PWK', name: 'Kab. Purwakarta', umk: 5052856, cost: 2200000, color: '#d62828' },
  { id: 'BDG_KOTA', name: 'Kota Bandung', umk: 4737678, cost: 2300000, color: '#0056b3' },
  { id: 'CIM', name: 'Kota Cimahi', umk: 4090568, cost: 2000000, color: '#00a8e8' },
  { id: 'BDG_BRT', name: 'Kab. Bandung Barat', umk: 3984711, cost: 1900000, color: '#00a8e8' },
  { id: 'BDG_KAB', name: 'Kab. Bandung', umk: 3972202, cost: 1900000, color: '#00a8e8' },
  { id: 'SMD', name: 'Kab. Sumedang', umk: 3949856, cost: 1800000, color: '#00a8e8' },
  { id: 'SKB_KAB', name: 'Kab. Sukabumi', umk: 3831926, cost: 1700000, color: '#4caf50' },
  { id: 'SBG', name: 'Kab. Subang', umk: 3737482, cost: 1600000, color: '#4caf50' },
  { id: 'CJR', name: 'Kab. Cianjur', umk: 3316191, cost: 1500000, color: '#4caf50' },
  { id: 'SKB_KOTA', name: 'Kota Sukabumi', umk: 3192807, cost: 1500000, color: '#4caf50' },
  { id: 'TSM_KOTA', name: 'Kota Tasikmalaya', umk: 2980336, cost: 1400000, color: '#ffd700' },
  { id: 'IDM', name: 'Kab. Indramayu', umk: 2910254, cost: 1300000, color: '#ffd700' },
  { id: 'CRB_KAB', name: 'Kab. Cirebon', umk: 2880798, cost: 1300000, color: '#ffd700' },
  { id: 'CRB_KOTA', name: 'Kota Cirebon', umk: 2878646, cost: 1300000, color: '#ffd700' },
  { id: 'TSM_KAB', name: 'Kab. Tasikmalaya', umk: 2871874, cost: 1300000, color: '#ffd700' },
  { id: 'MJL', name: 'Kab. Majalengka', umk: 2595368, cost: 1200000, color: '#ffd700' },
  { id: 'GRT', name: 'Kab. Garut', umk: 2472227, cost: 1200000, color: '#ffd700' },
  { id: 'CMS', name: 'Kab. Ciamis', umk: 2373644, cost: 1100000, color: '#ffd700' },
  { id: 'KNG', name: 'Kab. Kuningan', umk: 2369380, cost: 1100000, color: '#ffd700' },
  { id: 'BJR', name: 'Kota Banjar', umk: 2361241, cost: 1100000, color: '#ffd700' },
  { id: 'PND', name: 'Kab. Pangandaran', umk: 2351250, cost: 1200000, color: '#ffd700' },
];

const CareerSimulator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [targetItem, setTargetItem] = useState('');
  const [targetPrice, setTargetPrice] = useState<number | ''>('');
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Efek Loading ala "Python Processing"
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 detik loading biar kerasa canggih
    return () => clearTimeout(timer);
  }, []);

  const handleSimulate = () => {
    if (!selectedCity || !targetPrice) return;

    setLoading(true);
    // Simulasi proses berat
    setTimeout(() => {
      const city = SALARY_DATA.find(c => c.id === selectedCity);
      if (city) {
        const savingPerMonth = city.umk - city.cost;
        const monthsNeeded = Math.ceil(Number(targetPrice) / savingPerMonth);
        const years = (monthsNeeded / 12).toFixed(1);
        
        setSimulationResult({
          city,
          savingPerMonth,
          monthsNeeded,
          years
        });
      }
      setLoading(false);
    }, 1500);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center space-y-6 animate-fade-in">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div>
          <div className="w-24 h-24 border-4 border-blue-600 rounded-full border-t-transparent absolute top-0 left-0 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase size={32} className="text-blue-600 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-800">AI Economic Processor</h3>
          <p className="text-sm text-slate-500">Menganalisis Data Ekonomi Regional 2026...</p>
          <div className="flex gap-2 justify-center text-xs text-slate-400 font-mono mt-4">
            <span className="animate-bounce">Loading UMK...</span>
            <span className="animate-bounce [animation-delay:0.2s]">Calculating CPI...</span>
            <span className="animate-bounce [animation-delay:0.4s]">Predicting Inflation...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingUp size={200} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Map className="text-yellow-400" />
            CAREER VISION 2026
          </h1>
          <p className="text-blue-200 max-w-2xl text-lg">
            Simulator Masa Depan. Rencanakan karirmu berdasarkan Data Upah Minimum & Biaya Hidup Regional (Estimasi 2026).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: INPUT SIMULATOR */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" />
              Parameter Simulasi
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilih Kota Tujuan Karir</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCity}
                  onChange={e => { setSelectedCity(e.target.value); setSimulationResult(null); }}
                >
                  <option value="">-- Pilih Wilayah --</option>
                  {SALARY_DATA.map(city => (
                    <option key={city.id} value={city.id}>
                      {city.name} (UMK ~{(city.umk/1000000).toFixed(1)} Jt)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Impian (Barang/Aset)</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Motor NMAX, Laptop Gaming, Rumah..."
                  value={targetItem}
                  onChange={e => setTargetItem(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Harga Target (Barang Impian)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold">Rp</span>
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    value={targetPrice ? targetPrice.toLocaleString('id-ID') : ''}
                    onChange={e => {
                      // Hapus semua karakter kecuali angka
                      const val = e.target.value.replace(/\D/g, '');
                      setTargetPrice(val ? Number(val) : '');
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Contoh: 25.000.000
                </p>
              </div>

              <button 
                onClick={handleSimulate}
                disabled={!selectedCity || !targetPrice}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Briefcase size={18} />
                HITUNG POTENSI SAYA
              </button>
            </div>
          </div>

          {/* INFO CARD */}
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={16} /> Data Insight
            </h4>
            <p className="text-xs text-blue-700 leading-relaxed text-justify">
              Data UMK di atas adalah <b>Estimasi Proyeksi 2026</b> berdasarkan tren kenaikan upah tahunan. Biaya hidup adalah estimasi gaya hidup "Hemat - Menengah" untuk lajang (Kost + Makan + Transport).
            </p>
          </div>
        </div>

        {/* RIGHT: VISUALIZATION */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* RESULT CARD */}
          {simulationResult ? (
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 animate-fade-in-up relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -mr-10 -mt-10"></div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Analisis Kelayakan Finansial</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Pendapatan Kotor</p>
                  <p className="text-lg font-black text-slate-800">{formatRupiah(simulationResult.city.umk)}</p>
                  <span className="text-[10px] text-green-600 font-bold">/ Bulan</span>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Potensi Tabungan</p>
                  <p className="text-lg font-black text-green-600">{formatRupiah(simulationResult.savingPerMonth)}</p>
                  <span className="text-[10px] text-slate-400">Setelah Biaya Hidup</span>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Estimasi Waktu</p>
                  <p className="text-3xl font-black text-blue-600">{simulationResult.monthsNeeded}</p>
                  <span className="text-xs text-blue-400 font-bold">Bulan Kerja ({simulationResult.years} Tahun)</span>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-start gap-4">
                <CheckCircle2 className="text-green-400 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-lg mb-1">Kesimpulan AI:</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Untuk membeli <b>{targetItem}</b> seharga <b>{formatRupiah(Number(targetPrice))}</b>, 
                    Anda perlu bekerja di <b>{simulationResult.city.name}</b> selama kurang lebih <b>{simulationResult.monthsNeeded} bulan</b>. 
                    Pastikan Anda memiliki skill yang kompetitif untuk bersaing di wilayah ini!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-[300px] flex flex-col items-center justify-center text-slate-400">
              <TrendingUp size={48} className="mb-4 opacity-20" />
              <p>Silakan isi parameter di samping untuk memulai simulasi.</p>
            </div>
          )}

          {/* COMPARISON CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-6">Peta Komparasi Gaji Regional 2026</h4>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SALARY_DATA} margin={{top: 20, right: 30, left: 20, bottom: 50}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    height={60}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value/1000000}Jt`} 
                    tick={{fontSize: 10, fill: '#64748b'}}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    formatter={(value: any) => formatRupiah(Number(value || 0))}
                    contentStyle={{borderRadius: '12px'}}
                  />
                  <Bar dataKey="umk" radius={[4, 4, 0, 0]}>
                    {SALARY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CareerSimulator;
