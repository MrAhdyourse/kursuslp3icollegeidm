import React, { useState } from 'react';
import { X, Upload, FileText, Save, Loader2 } from 'lucide-react';
import { moduleService } from '../services/moduleService';

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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setLoading(true);
    try {
      // 1. Upload PDF
      const url = await moduleService.uploadPDF(file);

      // 2. Simpan Data
      await moduleService.addModule({
        title,
        description,
        programId,
        fileUrl: url,
        fileName: file.name,
        uploadedBy: uploaderId,
        createdAt: Date.now()
      });

      // 3. Reset & Close
      setTitle('');
      setDescription('');
      setFile(null);
      onSuccess();
      onClose();
    } catch (error) {
      alert("Gagal mengupload modul.");
      console.error(error);
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
            <Upload size={20} className="text-blue-600" /> Upload Materi Baru
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* File Input */}
          <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center hover:bg-blue-50/50 transition-colors group cursor-pointer relative">
            <input 
              type="file" 
              accept="application/pdf"
              required
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${file ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500 group-hover:scale-110'}`}>
                <FileText size={24} />
              </div>
              {file ? (
                <div>
                  <p className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{file.name}</p>
                  <p className="text-[10px] text-green-600 font-bold mt-1">Siap diupload</p>
                </div>
              ) : (
                <>
                  <p className="font-bold text-slate-600 text-sm">Klik untuk pilih file PDF</p>
                  <p className="text-[10px] text-slate-400 mt-1">Maksimal 5MB</p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Judul Materi</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Pengenalan Microsoft Word - Part 1"
              className="glass-input w-full font-bold text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi Singkat</label>
            <textarea 
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Jelaskan isi materi secara singkat..."
              className="glass-input w-full text-sm resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Mengupload...' : 'Simpan & Publish'}
          </button>

        </form>
      </div>
    </div>
  );
};
