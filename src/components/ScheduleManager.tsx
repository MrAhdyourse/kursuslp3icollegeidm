import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, EyeOff, Save, X, Loader2 } from 'lucide-react';
import type { ClassGroup } from '../types';
import { scheduleService } from '../services/scheduleService';
import { studentService } from '../services/studentService';

const ScheduleManager: React.FC = () => {
  const [schedules, setSchedules] = useState<ClassGroup[]>([]);
  const [availableCourses, setAvailableCourses] = useState<{id: string, name: string}[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<ClassGroup>>({
    name: '',
    programId: '',
    level: 1,
    schedule: '',
    instructorId: 'Ahdi Yourse',
    isActive: true
  });

  useEffect(() => {
    loadSchedules();
    loadCourses();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await scheduleService.getAllSchedules();
      setSchedules(data);
    } catch (error) {
      alert("Gagal memuat jadwal.");
    }
  };

  const loadCourses = async () => {
    const courses = await studentService.getCourseTypes();
    setAvailableCourses(courses);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.schedule || !formData.programId) {
      alert('Mohon lengkapi Nama Kelas, Program, dan Jadwal');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && formData.id) {
        await scheduleService.updateSchedule(formData as ClassGroup);
      } else {
        await scheduleService.addSchedule(formData as Omit<ClassGroup, 'id'>);
      }
      
      resetForm();
      await loadSchedules();
    } catch (error) {
      alert("Gagal menyimpan data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: ClassGroup) => {
    setFormData(item);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
      try {
        await scheduleService.deleteSchedule(id);
        await loadSchedules();
      } catch (error) {
        alert("Gagal menghapus.");
      }
    }
  };

  const handleToggleStatus = async (item: ClassGroup) => {
    try {
      await scheduleService.toggleStatus(item.id, item.isActive);
      await loadSchedules();
    } catch (error) {
      alert("Gagal mengubah status.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      programId: '',
      level: 1,
      schedule: '',
      instructorId: 'Ahdi Yourse',
      isActive: true
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        Manajemen Jadwal Kelas
      </h2>

      {/* FORM INPUT */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-8">
        <h3 className="font-semibold text-slate-700 mb-4">{isEditing ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nama Kelas (Grup)</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-blue"
              placeholder="Contoh: Ms Office - Pagi A"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Program Kursus</label>
            <select 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-blue bg-white"
              value={formData.programId}
              onChange={e => setFormData({...formData, programId: e.target.value})}
            >
              <option value="">-- Pilih Program --</option>
              {availableCourses.map(course => (
                <option key={course.id} value={course.name}>{course.name}</option>
              ))}
            </select>
            {availableCourses.length === 0 && (
              <span className="text-[10px] text-red-500">Belum ada Jenis Kursus di menu Pengaturan.</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Jadwal (Hari & Jam)</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-blue"
              placeholder="Senin & Rabu, 08:00 - 10:00"
              value={formData.schedule}
              onChange={e => setFormData({...formData, schedule: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nama Instruktur</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-blue"
              placeholder="Contoh: Ahdi Aghni"
              value={formData.instructorId}
              onChange={e => setFormData({...formData, instructorId: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Level</label>
            <select 
              className="w-full p-2 border rounded-lg"
              value={formData.level}
              onChange={e => setFormData({...formData, level: Number(e.target.value)})}
            >
              <option value={1}>Level 1</option>
              <option value={2}>Level 2</option>
              <option value={3}>Level 3</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          {isEditing && (
            <button onClick={resetForm} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg flex items-center gap-2">
              <X size={18} /> Batal
            </button>
          )}
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-brand-blue text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            {isEditing ? 'Simpan Perubahan' : 'Publish Jadwal'}
          </button>
        </div>
      </div>

      {/* LIST TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-sm">
              <th className="p-3 rounded-tl-lg">Nama Kelas</th>
              <th className="p-3">Program</th>
              <th className="p-3">Jadwal</th>
              <th className="p-3">Status</th>
              <th className="p-3 rounded-tr-lg text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">{item.name}</td>
                <td className="p-3 text-slate-600 text-sm">{item.programId}</td>
                <td className="p-3 text-slate-600 text-sm">{item.schedule}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {item.isActive ? 'PUBLISHED' : 'DRAFT / HIDDEN'}
                  </span>
                </td>
                <td className="p-3 flex justify-center gap-2">
                  <button 
                    onClick={() => handleToggleStatus(item)}
                    className={`p-2 rounded-lg transition ${item.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                    title={item.isActive ? "Sembunyikan" : "Tampilkan"}
                  >
                    {item.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  Belum ada jadwal.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleManager;