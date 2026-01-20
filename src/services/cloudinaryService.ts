// SERVICE UPLOAD FILE KE CLOUDINARY
// Pastikan Anda sudah membuat 'Upload Preset' dengan mode 'Unsigned' di Dashboard Cloudinary.

const CLOUD_NAME = 'dxxbegnoz'; 
const UPLOAD_PRESET = 'project_kursuslp3i'; 

export const cloudinaryService = {
  uploadFile: async (file: File): Promise<string> => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    // Folder khusus di Cloudinary (Opsional)
    formData.append('folder', 'ujikom_lp3i_submissions'); 

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary Error Detail:", errorData);
        throw new Error(errorData.error?.message || 'Gagal upload ke Cloudinary');
      }

      const data = await response.json();
      // Kembalikan Secure URL (HTTPS)
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw error;
    }
  }
};