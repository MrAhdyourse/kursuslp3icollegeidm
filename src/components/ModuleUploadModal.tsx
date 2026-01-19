import React, { useState } from 'react';
import { X, Link, Save, Loader2 } from 'lucide-react';
import { moduleService } from '../services/moduleService';
import toast from 'react-hot-toast';

interface ModuleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  programId: string;
  uploaderId: string;
}

export const ModuleUploadModal: React.FC<ModuleUploadModalProps> = ({ 
  isOpen, onClose, onSuccess, programId, uploaderId 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validasi Input
    if (!linkUrl || !title) {
      toast.error("Judul dan Link Materi wajib diisi!");
      return;
    }
    
    // 2. Validasi Program ID
    if (!programId) {
      toast.error("Sistem Error: Program ID tidak ditemukan.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Menyimpan materi...");

    try {
      // 3. Simpan Data ke Database (Langsung simpan Link, tanpa upload file fisik)
      await moduleService.addModule({
        title,
        description,
        programId,
        fileUrl: linkUrl, // URL dari Google Drive/External
        fileName: "External Link", // Placeholder
        uploadedBy: uploaderId,
        createdAt: Date.now()
      });

      // 4. Sukses
      toast.success("Berhasil! Materi telah terbit.", { id: toastId });
      
      // Reset Form
      setTitle('');
      setDescription('');
      setLinkUrl('');
      
      onSuccess(); // Refresh list
      onClose();   // Tutup modal
      
    } catch (error: any) {
      console.error("Save Error:", error);
      toast.error("Gagal menyimpan data.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <Link size={20} className="text-blue-600" /> Tambah Materi Baru
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Judul Materi</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Modul Excel Basic - Pertemuan 1"
              className="glass-input w-full font-bold text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link Materi (Google Drive / PDF)</label>
            <div className="relative">
               <input 
                type="url" 
                required
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="glass-input w-full text-blue-600 font-medium pl-10"
              />
              <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 italic">
              *Pastikan link Google Drive diset ke mode <b>"Anyone with the link"</b> agar bisa diakses peserta.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi Singkat</label>
            <textarea 
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Jelaskan instruksi pembelajaran..."
              className="glass-input w-full text-sm resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Menyimpan...' : 'Simpan Materi'}
          </button>

        </form>
      </div>
    </div>
  );
};
