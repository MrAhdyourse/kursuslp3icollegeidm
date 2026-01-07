import React, { useState, useEffect } from 'react';
import { X, Save, Upload } from 'lucide-react';
import type { Student } from '../types';
import { studentService } from '../services/studentService';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentToEdit?: Student | null; // Jika null berarti Mode Tambah
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({ 
  isOpen, onClose, onSuccess, studentToEdit 
}) => {
  const [loading, setLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<{id: string, name: string}[]>([]);
  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    email: '',
    phone: '',
    program: '',
    level: 1, 
    batch: new Date().getFullYear().toString(),
    status: 'ACTIVE' as Student['status'],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Load Daftar Kursus dari Firebase
  useEffect(() => {
    if (isOpen) {
      const fetchCourses = async () => {
        const courses = await studentService.getCourseTypes();
        setAvailableCourses(courses);
        
        // Jika mode tambah dan ada kursus tersedia, set default ke kursus pertama
        if (!studentToEdit && courses.length > 0) {
          setFormData(prev => ({ ...prev, program: courses[0].name }));
        }
      };
      fetchCourses();
    }
  }, [isOpen, studentToEdit]);

  // Reset form saat modal dibuka/ganti mode
  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        nis: studentToEdit.nis,
        name: studentToEdit.name,
        email: studentToEdit.email || '',
        phone: studentToEdit.phone || '',
        program: studentToEdit.program,
        level: (studentToEdit as any).level || 1, 
        batch: studentToEdit.batch,
        status: studentToEdit.status,
      });
    } else {
      setFormData({
        nis: '',
        name: '',
        email: '',
        phone: '',
        program: '',
        level: 1,
        batch: new Date().getFullYear().toString(),
        status: 'ACTIVE',
      });
    }
    setPhotoFile(null);
  }, [studentToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = studentToEdit?.avatarUrl;

      // 1. Upload Foto jika ada file baru
      if (photoFile) {
        const uploadRes = await studentService.uploadStudentPhoto(photoFile, formData.name);
        if (uploadRes.success && uploadRes.url) {
          avatarUrl = uploadRes.url;
        }
      }

      const studentData = {
        ...formData,
        avatarUrl,
      };

      // 2. Simpan ke Firestore
      if (studentToEdit) {
        await studentService.updateStudent(studentToEdit.id, studentData);
      } else {
        await studentService.addStudent({
          ...studentData,
          createdAt: Date.now()
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save student", error);
      alert("Gagal menyimpan data. Cek console.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-blue px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold">
            {studentToEdit ? 'Edit Data Peserta' : 'Tambah Peserta Baru'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">NIS</label>
              <input 
                type="text" 
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                value={formData.nis}
                onChange={e => setFormData({...formData, nis: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Angkatan</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                value={formData.batch}
                onChange={e => setFormData({...formData, batch: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No. HP</label>
              <input 
                type="tel" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Program Kursus</label>
              <select 
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                value={formData.program}
                onChange={e => setFormData({...formData, program: e.target.value})}
                disabled={availableCourses.length === 0}
              >
                {availableCourses.length === 0 ? (
                  <option value="">-- Tidak ada program tersedia --</option>
                ) : (
                  <>
                    <option value="">-- Pilih Program --</option>
                    {availableCourses.map(course => (
                      <option key={course.id} value={course.name}>{course.name}</option>
                    ))}
                  </>
                )}
              </select>
              {availableCourses.length === 0 && (
                <p className="text-[10px] text-red-500 mt-1">Sertakan Jenis Kursus di menu Pengaturan dahulu.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tingkatan (Tier)</label>
              <select 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                value={formData.level}
                onChange={e => setFormData({...formData, level: parseInt(e.target.value)})}
              >
                <option value="1">Level 1 (Dasar)</option>
                <option value="2">Level 2 (Menengah)</option>
                <option value="3">Level 3 (Lanjutan)</option>
              </select>
            </div>
          </div>

           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="ACTIVE">Aktif (Active)</option>
              <option value="GRADUATED">Lulus (Graduated)</option>
              <option value="DROPOUT">Keluar (Dropout)</option>
            </select>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-[10px] text-blue-700 leading-tight">
              <b>Info:</b> Data ini hanya untuk keperluan administrasi dan laporan. 
              Pastikan email yang digunakan sudah didaftarkan oleh Admin di Firebase Auth agar siswa bisa login.
            </p>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Foto Profil (Opsional)</label>
             <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 transition relative">
                <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={e => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                />
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Upload size={24} />
                  <span className="text-xs">
                    {photoFile ? photoFile.name : "Klik atau seret foto ke sini"}
                  </span>
                </div>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-2.5 bg-brand-blue text-white rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center gap-2 shadow-lg shadow-blue-200"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save size={18} /> Simpan
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
