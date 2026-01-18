import React, { useState, useEffect } from 'react';
import { X, Save, Upload, User, BookOpen, Mail, Phone, Layers, GraduationCap, Hash } from 'lucide-react';
import type { Student, ClassGroup, UserProfile } from '../types';
import { studentService } from '../services/studentService';
import { scheduleService } from '../services/scheduleService';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStudentId?: string) => void;
  studentToEdit?: Student | null;
  currentUser?: UserProfile | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({ 
  isOpen, onClose, onSuccess, studentToEdit, currentUser 
}) => {
  const [loading, setLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<{id: string, name: string}[]>([]);
  const [activeClasses, setActiveClasses] = useState<ClassGroup[]>([]);
  
  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    email: '',
    phone: '',
    program: '',
    classId: '', 
    level: 1, 
    batch: new Date().getFullYear().toString(),
    status: 'ACTIVE' as Student['status'],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        let courses = await studentService.getCourseTypes();
        if (currentUser?.role === 'INSTRUCTOR' && currentUser.authorizedPrograms && !currentUser.authorizedPrograms.includes('ALL')) {
           const allowedKeywords = currentUser.authorizedPrograms;
           courses = courses.filter(c => 
             allowedKeywords.some(k => c.name.toUpperCase().includes(k.toUpperCase()))
           );
        }
        setAvailableCourses(courses);
        const classes = await scheduleService.getActiveSchedules();
        setActiveClasses(classes);

        if (!studentToEdit) {
           if (courses.length > 0) {
             setFormData(prev => ({ ...prev, program: courses[0].name }));
           } else if (currentUser?.role === 'INSTRUCTOR' && currentUser.authorizedPrograms) {
             setFormData(prev => ({ ...prev, program: currentUser.authorizedPrograms![0] || '' }));
           }
        }
      };
      fetchData();
    }
  }, [isOpen, studentToEdit, currentUser]);

  // Reset & Populate Form
  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        nis: studentToEdit.nis,
        name: studentToEdit.name,
        email: studentToEdit.email || '',
        phone: studentToEdit.phone || '',
        program: studentToEdit.program,
        classId: studentToEdit.classId || '',
        level: (studentToEdit as any).level || 1, 
        batch: studentToEdit.batch,
        status: studentToEdit.status,
      });
      setPreviewUrl(studentToEdit.avatarUrl || null);
    } else {
      setFormData(prev => ({
        nis: '',
        name: '',
        email: '',
        phone: '',
        program: prev.program,
        classId: '',
        level: 1,
        batch: new Date().getFullYear().toString(),
        status: 'ACTIVE',
      }));
      setPreviewUrl(null);
    }
    setPhotoFile(null);
  }, [studentToEdit, isOpen]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = studentToEdit?.avatarUrl || null;
      if (photoFile) {
        const uploadRes = await studentService.uploadStudentPhoto(photoFile, formData.name);
        if (uploadRes.success && uploadRes.url) avatarUrl = uploadRes.url;
      }

      const studentData = {
        ...formData,
        avatarUrl,
        instructorId: currentUser?.uid || 'SYSTEM',
        createdBy: currentUser?.uid || 'SYSTEM',
      };

      if (studentToEdit) {
        await studentService.updateStudent(studentToEdit.id, studentData);
        onSuccess();
      } else {
        // Hapus customUid, biarkan sistem menghandle via pencocokan email nanti
        const res = await studentService.addStudent({
          ...studentData,
          createdAt: Date.now()
        });
        
        if (!res.success) {
          throw new Error(res.error instanceof Error ? res.error.message : "Gagal menyimpan ke database");
        }

        onSuccess(res.id); 
      }
      onClose();
    } catch (error) {
      console.error("Failed to save", error);
      alert("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {studentToEdit ? 'Edit Data Peserta' : 'Registrasi Peserta Baru'}
            </h2>
            <p className="text-blue-200 text-sm mt-0.5">Lengkapi profil dan data akademik siswa</p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition backdrop-blur-md">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <form id="studentForm" onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8">
            
            {/* COLUMN LEFT: IDENTITY */}
            <div className="md:w-1/3 space-y-6">
              
              {/* Photo Upload Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 group">
                  <div className={`w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg ${!previewUrl ? 'bg-slate-100 flex items-center justify-center' : ''}`}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-slate-300" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-all duration-300">
                    <Upload size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                </div>
                <p className="text-xs text-slate-500 font-medium">Klik foto untuk mengganti</p>
              </div>

              {/* Basic Info */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b pb-2 mb-4 flex items-center gap-2">
                  <User size={16} className="text-blue-600" /> Identitas Diri
                </h3>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nama Lengkap</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium text-slate-700"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">NIS</label>
                        <div className="relative">
                            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" required value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} 
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                placeholder="2024..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Angkatan</label>
                        <input type="text" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} 
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-center"
                        />
                    </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Kontak</label>
                  <div className="space-y-2">
                    <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Email Address"
                        />
                    </div>
                    {/* INFO INTEGRASI EMAIL DISINI */}
                    <div className="bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                        <p className="text-[10px] text-indigo-600 leading-tight">
                            <b>Penting:</b> Pastikan email ini sesuai dengan akun Google/Login siswa agar data terhubung otomatis.
                        </p>
                    </div>

                    <div className="relative pt-2">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 mt-1" />
                        <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            placeholder="No. WhatsApp"
                        />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN RIGHT: ACADEMIC */}
            <div className="md:w-2/3 space-y-6">
              
              {/* Academic Info */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b pb-2 mb-6 flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-600" /> Data Akademik
                </h3>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Program Kursus</label>
                        {availableCourses.length > 0 ? (
                            <select required value={formData.program} onChange={e => setFormData({...formData, program: e.target.value, classId: ''})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
                            >
                                <option value="">-- Pilih Program --</option>
                                {availableCourses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        ) : (
                            <input type="text" required placeholder="Nama Program" value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Kelas / Jadwal</label>
                        <select value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} disabled={!formData.program}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                        >
                            <option value="">-- Pilih Kelas (Opsional) --</option>
                            {activeClasses
                              .filter(cls => !formData.program || cls.programId.includes(formData.program) || cls.name.includes(formData.program))
                              .map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Tingkatan (Level)</label>
                        <div className="relative">
                            <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select value={formData.level} onChange={e => setFormData({...formData, level: parseInt(e.target.value)})}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="1">Level 1 (Basic)</option>
                                <option value="2">Level 2 (Intermediate)</option>
                                <option value="3">Level 3 (Advanced)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Status Siswa</label>
                        <div className="relative">
                            <GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="ACTIVE">Aktif (Active)</option>
                                <option value="GRADUATED">Lulus (Graduated)</option>
                                <option value="DROPOUT">Keluar (Dropout)</option>
                            </select>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="bg-white px-8 py-5 border-t border-slate-200 flex justify-end gap-4 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition"
          >
            Batal
          </button>
          <button 
            type="submit"
            form="studentForm"
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <span className="animate-spin text-xl">◌</span> : <Save size={18} />}
            Simpan Data
          </button>
        </div>

      </div>
    </div>
  );
};
