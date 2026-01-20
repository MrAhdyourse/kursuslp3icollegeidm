import type { Question } from '../../types/exam';

// --- 5 SOAL ESSAY PRAKTIKUM (DEFINISI AWAL) ---
export const ESSAY_QUESTIONS: Question[] = [
  {
    id: "ESSAY-EXCEL",
    text: "PRAKTIK EXCEL: Unduh file 'Data_Gaji_Kotor.xlsx' (dummy). Rapikan data menggunakan rumus Text, hitung Gaji Bersih, dan buat Pivot Table. Upload file hasil kerja Anda (XLSX).",
    type: "ESSAY",
    options: [],
    correctIndex: 0,
    points: 100
  },
  {
    id: "ESSAY-WORD",
    text: "PRAKTIK WORD: Buat Surat Undangan Rapat Resmi dengan Mail Merge (5 penerima beda). Gunakan Kop Surat resmi. Upload file surat (DOCX) dan sumber data.",
    type: "ESSAY",
    options: [],
    correctIndex: 0,
    points: 100
  },
  {
    id: "ESSAY-PPT",
    text: "PRAKTIK PPT: Buat presentasi profil diri (CV) maksimal 5 slide dengan Slide Master dan transisi Morph. Upload file PPTX.",
    type: "ESSAY",
    options: [],
    correctIndex: 0,
    points: 100
  },
  {
    id: "ESSAY-ARSIP",
    text: "PRAKTIK ARSIP: Simulasikan sistem pengarsipan abjad. Buat folder berisi 5 dokumen fiktif dengan nama sesuai kaidah Indeks Abjad. Upload file ZIP folder tersebut.",
    type: "ESSAY",
    options: [],
    correctIndex: 0,
    points: 100
  },
  {
    id: "ESSAY-FINAL",
    text: "STUDI KASUS INTEGRASI: Anda adalah sekretaris. Buatlah Laporan Keuangan Bulanan di Excel, lalu copy-paste tabel tersebut ke Word sebagai 'Linked Object' dalam Laporan Pertanggungjawaban. Upload kedua file (Excel & Word) dalam satu folder GDrive dan kirim link-nya/Upload ZIP.",
    type: "ESSAY",
    options: [],
    correctIndex: 0,
    points: 100
  }
];

// --- KUMPULAN SOAL PER KATEGORI (MURNI PG) ---

export const EXCEL_QUESTIONS: Question[] = [
  {
    id: "EXCEL-001",
    text: "Perhatikan tabel data karyawan berikut. HRD ingin mencari 'NIK' berdasarkan 'Nama Lengkap' (Kolom C ke Kolom B). Mengapa rumus VLOOKUP standar tidak bisa digunakan dalam kasus ini?",
    type: "MULTIPLE_CHOICE",
    spreadsheetData: [
      ["", "A", "B", "C", "D"],
      ["1", "NO", "NIK", "NAMA LENGKAP", "JABATAN"],
      ["2", "1", "2024001", "Budi Santoso", "Staff"],
      ["3", "2", "2024002", "Siti Aminah", "Supervisor"],
      ["4", "3", "2024003", "Andi Wijaya", "Manager"]
    ],
    options: [
      "Karena data tidak urut abjad",
      "Karena VLOOKUP hanya bisa mencari data ke arah Kanan (Left-to-Right)",
      "Karena kolom NIK berupa angka",
      "Karena judul tabel (Header) tidak boleh diblok",
      "Karena harus menggunakan HLOOKUP"
    ],
    correctIndex: 1,
    points: 10
  },
  {
    id: "EXCEL-002",
    text: "Anda memiliki data 'Nama Kota' yang berantakan (lihat sel A2). Rumus apa yang paling tepat digunakan di sel B2 untuk merapikan teks tersebut menjadi standar?",
    type: "MULTIPLE_CHOICE",
    spreadsheetData: [
      ["", "A", "B"],
      ["1", "DATA KOTOR", "HASIL BERSIH"],
      ["2", "   Jakarta   Selatan   ", "?"],
      ["3", " Bandung ", "Bandung"]
    ],
    options: [
      "=CLEAN(A2)",
      "=TRIM(A2)",
      "=PROPER(A2)",
      "=UPPER(A2)",
      "=SUBSTITUTE(A2, \" \", \"\")"
    ],
    correctIndex: 1,
    points: 10
  },
  {
    id: "EXCEL-003",
    text: "Dalam analisis data besar, Anda diminta merangkum total penjualan per wilayah dari 10.000 baris data transaksi tanpa menggunakan rumus yang kompleks. Fitur apa yang paling cepat digunakan?",
    type: "MULTIPLE_CHOICE",
    options: ["Conditional Formatting", "Data Validation", "Pivot Table", "Goal Seek", "Consolidate"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "EXCEL-004",
    text: "Fungsi logika 'IF' bertingkat seringkali rumit. Jika Anda ingin mengkategorikan nilai 90-100='A', 80-89='B', 70-79='C' tanpa IF yang panjang pada Excel versi terbaru (2019/365), fungsi alternatif apa yang lebih bersih?",
    type: "MULTIPLE_CHOICE",
    options: ["IFS", "SWITCH", "CHOOSE", "VLOOKUP (Range Lookup)", "IFERROR"],
    correctIndex: 0,
    points: 10
  },
  {
    id: "EXCEL-005",
    text: "Manajer meminta laporan visual tren penjualan selama 5 tahun terakhir yang bisa berubah otomatis saat data bulan baru diinput. Grafik tipe apa yang paling cocok untuk menunjukkan tren waktu (time-series)?",
    type: "MULTIPLE_CHOICE",
    options: ["Pie Chart", "Line Chart", "Radar Chart", "Scatter Plot", "Tree Map"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "EXCEL-006",
    text: "Saat menyalin rumus '=A1*B1' dari sel C1 ke sel C2, Anda ingin sel A1 tetap terkunci (tidak berubah menjadi A2). Bagaimana penulisan rumus yang benar di C1?",
    type: "MULTIPLE_CHOICE",
    options: ["=$A1*B1", "=A$1*B1", "=$A$1*B1", "=[A1]*B1", "=(A1)*B1"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "EXCEL-007",
    text: "Anda ingin menghitung berapa banyak sel dalam rentang A1:A10 yang berisi teks maupun angka (sel yang tidak kosong). Fungsi apa yang paling tepat?",
    type: "MULTIPLE_CHOICE",
    options: ["COUNT", "COUNTA", "COUNTIF", "COUNTBLANK", "SUMPRODUCT"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "EXCEL-008",
    text: "Perhatikan tabel diskon berikut. Jika total belanja (A2) di atas 500.000, diskon 10%. Jika di atas 200.000, diskon 5%. Selain itu 0. Rumus mana yang logikanya paling aman?",
    type: "MULTIPLE_CHOICE",
    spreadsheetData: [["", "A"], ["1", "TOTAL BELANJA"], ["2", "600000"]],
    options: [
      "=IF(A2>500000, 10%, IF(A2>200000, 5%, 0))",
      "=IF(A2>200000, 5%, IF(A2>500000, 10%, 0))",
      "=IF(A2<200000, 0, 5%)",
      "=SUMIF(A2, \">500000\", 10%)",
      "=VLOOKUP(A2, DiskonTable, 2)"
    ],
    correctIndex: 0,
    points: 10
  },
  {
    id: "EXCEL-009",
    text: "Untuk mencegah pengguna salah memasukkan data (misal: harus memilih nama kota dari daftar), fitur Excel apa yang digunakan?",
    type: "MULTIPLE_CHOICE",
    options: ["Data Sorting", "Data Filtering", "Data Validation", "Data Consolidation", "Text to Columns"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "EXCEL-010",
    text: "Anda memiliki tabel dengan banyak data ganda (duplicate). Tombol mana yang digunakan untuk menghapus baris yang sama secara otomatis di tab Data?",
    type: "MULTIPLE_CHOICE",
    options: ["Flash Fill", "Remove Duplicates", "Consolidate", "Clear All", "Filter"],
    correctIndex: 1,
    points: 10
  }
];

export const WORD_QUESTIONS: Question[] = [
  {
    id: "WORD-001",
    text: "Sekretaris perlu membuat 100 surat undangan rapat dengan nama dan alamat penerima yang berbeda-beda. Data penerima sudah ada di Excel. Fitur apa yang paling efisien digunakan?",
    type: "MULTIPLE_CHOICE",
    options: ["Copy-Paste Manual", "Find and Replace", "Mail Merge", "Track Changes", "Cross-Reference"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "WORD-002",
    text: "Agar Kop Surat (Header) selalu muncul otomatis di setiap halaman baru dokumen laporan tahunan, di area mana Anda harus mengeditnya?",
    type: "MULTIPLE_CHOICE",
    options: ["Top Margin Area", "Footer Area", "Header Area (Double Click bagian atas)", "Page Layout Menu", "Watermark Settings"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "WORD-003",
    text: "Anda sedang menyusun skripsi. Bab 1 menggunakan nomor halaman Romawi (i, ii), sedangkan Bab 2 menggunakan Angka (1, 2). Fitur apa yang digunakan untuk membedakan format halaman dalam satu file?",
    type: "MULTIPLE_CHOICE",
    options: ["Page Break", "Section Break (Next Page)", "Column Break", "Text Wrapping", "Paragraph Spacing"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "WORD-004",
    text: "Bagaimana cara membuat Daftar Isi otomatis yang bisa di-update jika nomor halaman berubah?",
    type: "MULTIPLE_CHOICE",
    options: ["Ketik manual dan pakai titik-titik (tabs)", "Gunakan fitur Table of Contents dengan Heading Styles", "Gunakan fitur Bibliography", "Gunakan fitur Caption", "Gunakan fitur Index"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "WORD-005",
    text: "Dalam penulisan surat bisnis resmi, format paragraf yang rata kiri dan kanan sekaligus agar terlihat rapi disebut...",
    type: "MULTIPLE_CHOICE",
    options: ["Align Left", "Align Right", "Center", "Justify", "Distributed"],
    correctIndex: 3,
    points: 10
  },
  {
    id: "WORD-006",
    text: "Untuk memberikan tanda samar di latar belakang halaman (seperti tulisan 'CONFIDENTIAL' atau logo perusahaan), fitur apa yang digunakan?",
    type: "MULTIPLE_CHOICE",
    options: ["Page Color", "Watermark", "Page Border", "Themes", "SmartArt"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "WORD-007",
    text: "Saat bekerja dalam tim, Anda ingin melihat setiap perubahan yang dibuat oleh rekan kerja (siapa yang menghapus atau menambah kata). Fitur apa yang harus diaktifkan?",
    type: "MULTIPLE_CHOICE",
    options: ["Compare", "Track Changes", "Restrict Editing", "Macros", "Protect Document"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "WORD-008",
    text: "Di tab mana Anda mengatur orientasi kertas (Portrait/Landscape) dan ukuran kertas (A4/Legal)?",
    type: "MULTIPLE_CHOICE",
    options: ["Home", "Insert", "Layout / Page Layout", "References", "View"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "WORD-009",
    text: "Anda ingin membuat teks dalam format koran (terbagi menjadi 2 atau 3 kolom dalam satu halaman). Tombol apa yang Anda cari di tab Layout?",
    type: "MULTIPLE_CHOICE",
    options: ["Orientation", "Margins", "Columns", "Breaks", "Line Numbers"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "WORD-010",
    text: "Manakah cara terbaik untuk mengatur format teks yang konsisten (Judul, Sub-judul, Isi) di seluruh dokumen panjang?",
    type: "MULTIPLE_CHOICE",
    options: ["Gunakan Format Painter berulang kali", "Gunakan fitur Styles (Heading 1, Heading 2, Normal)", "Ubah Font secara manual setiap kali membuat judul", "Copy-paste format dari dokumen lain", "Gunakan fitur WordArt"],
    correctIndex: 1,
    points: 10
  }
];

export const PPT_QUESTIONS: Question[] = [
  {
    id: "PPT-001",
    text: "Anda ingin mengubah font judul di SEMUA 50 slide presentasi sekaligus tanpa mengedit satu per satu. Fitur apa yang harus digunakan?",
    type: "MULTIPLE_CHOICE",
    options: ["Slide Sorter", "Slide Master", "Outline View", "Reading View", "Notes Master"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "PPT-002",
    text: "Efek transisi modern yang memungkinkan perpindahan objek secara halus dan organik (seperti animasi perpindahan posisi) dari satu slide ke slide berikutnya disebut...",
    type: "MULTIPLE_CHOICE",
    options: ["Fade", "Wipe", "Morph", "Zoom", "Push"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "PPT-003",
    text: "Guy Kawasaki mempopulerkan aturan 10/20/30 untuk presentasi. Apa arti angka '30' dalam aturan tersebut?",
    type: "MULTIPLE_CHOICE",
    options: ["Maksimal 30 Slide", "Maksimal 30 Menit bicara", "Ukuran Font minimal 30 pt", "30 detik per slide", "30 audiens maksimal"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "PPT-004",
    text: "Fitur apa yang memungkinkan Presenter melihat catatan (notes), slide berikutnya, dan waktu berjalan di laptop, sementara audiens hanya melihat slide presentasi di proyektor?",
    type: "MULTIPLE_CHOICE",
    options: ["Slide Show View", "Presenter View", "Dual Monitor Mode", "Custom Show", "Rehearse Timings"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "PPT-005",
    text: "Untuk menyisipkan grafik Excel ke dalam PowerPoint agar data di PPT ikut berubah otomatis saat data Excel diedit, metode paste apa yang digunakan?",
    type: "MULTIPLE_CHOICE",
    options: ["Paste as Picture", "Keep Source Formatting", "Paste Special > Paste Link", "Use Destination Theme", "Paste as Text"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "PPT-006",
    text: "Dalam PowerPoint, perbedaan antara 'Transition' dan 'Animation' adalah...",
    type: "MULTIPLE_CHOICE",
    options: ["Transition untuk objek, Animation untuk slide", "Transition untuk antar slide, Animation untuk objek di dalam slide", "Keduanya sama saja", "Transition hanya untuk suara, Animation untuk gambar", "Transition lebih lambat daripada Animation"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "PPT-007",
    text: "Anda ingin membuat tombol yang jika diklik akan langsung pindah ke slide terakhir. Fitur apa yang digunakan?",
    type: "MULTIPLE_CHOICE",
    options: ["Action Buttons / Hyperlink", "Trigger", "Animation Pane", "Slide Master", "Section"],
    correctIndex: 0,
    points: 10
  },
  {
    id: "PPT-008",
    text: "File presentasi Anda terlalu besar (misal 50MB) karena banyak gambar. Apa cara tercepat untuk memperkecil ukuran file tanpa menghapus slide?",
    type: "MULTIPLE_CHOICE",
    options: ["Hapus animasi", "Compress Pictures", "Ubah font ke Arial", "Simpan sebagai PDF", "Hapus Slide Master"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "PPT-009",
    text: "Jika Anda ingin mengubah presentasi PowerPoint menjadi file video (MP4) agar bisa diputar di TV tanpa laptop, menu apa yang digunakan?",
    type: "MULTIPLE_CHOICE",
    options: ["Print", "Save As > Video", "Export > Create a Video", "Share", "Protect Presentation"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "PPT-010",
    text: "Fitur untuk membuat bagan organisasi, siklus proses, atau hirarki secara cepat dan rapi adalah...",
    type: "MULTIPLE_CHOICE",
    options: ["Shapes", "Charts", "SmartArt", "Icons", "3D Models"],
    correctIndex: 2,
    points: 10
  }
];

export const ARSIP_QUESTIONS: Question[] = [
  {
    id: "ARSIP-001",
    text: "Dokumen transaksi tahun berjalan yang masih sering digunakan setiap hari untuk operasional kantor dikategorikan sebagai arsip...",
    type: "MULTIPLE_CHOICE",
    options: ["Arsip Inaktif", "Arsip Statis", "Arsip Aktif", "Arsip Vital", "Arsip Musnah"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "ARSIP-002",
    text: "Sistem penyimpanan arsip yang menyusun dokumen berdasarkan wilayah geografi (misal: Jakarta, Bandung, Surabaya) disebut...",
    type: "MULTIPLE_CHOICE",
    options: ["Sistem Abjad", "Sistem Nomor", "Sistem Wilayah (Geografis)", "Sistem Subjek", "Sistem Kronologis"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "ARSIP-003",
    text: "Alat penyimpanan arsip berlubang yang terbuat dari karton keras dan memiliki besi penjepit di dalamnya disebut...",
    type: "MULTIPLE_CHOICE",
    options: ["Stopmap", "Ordner", "Guide", "Filling Cabinet", "Rak Arsip"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "ARSIP-004",
    text: "Proses memindahkan data fisik (kertas) menjadi format digital (PDF/Gambar) untuk efisiensi penyimpanan dan keamanan disebut...",
    type: "MULTIPLE_CHOICE",
    options: ["E-Filing / Digitalisasi Arsip", "Fotokopi", "Laminating", "Binding", "Shredding"],
    correctIndex: 0,
    points: 10
  },
  {
    id: "ARSIP-005",
    text: "Dalam siklus hidup arsip, tahap terakhir bagi arsip yang sudah tidak memiliki nilai guna adalah...",
    type: "MULTIPLE_CHOICE",
    options: ["Penciptaan", "Penggunaan", "Pemeliharaan", "Penyusutan / Pemusnahan", "Distribusi"],
    correctIndex: 3,
    points: 10
  },
  {
    id: "ARSIP-006",
    text: "Penyimpanan arsip berdasarkan urutan waktu (Tahun, Bulan, Tanggal) disebut...",
    type: "MULTIPLE_CHOICE",
    options: ["Sistem Abjad", "Sistem Nomor", "Sistem Kronologis (Tanggal)", "Sistem Subjek", "Sistem Wilayah"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "ARSIP-007",
    text: "Daftar yang memuat jangka waktu penyimpanan arsip dan menentukan apakah arsip tersebut boleh dimusnahkan atau tidak disebut...",
    type: "MULTIPLE_CHOICE",
    options: ["Daftar Inventaris", "Jadwal Retensi Arsip (JRA)", "Buku Agenda", "Klasifikasi Arsip", "Indeks Arsip"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "ARSIP-008",
    text: "Alat yang digunakan untuk memotong-motong kertas arsip yang sudah tidak terpakai agar informasinya tidak disalahgunakan disebut...",
    type: "MULTIPLE_CHOICE",
    options: ["Perforator", "Stapler", "Paper Shredder", "Guillotine", "Scanner"],
    correctIndex: 2,
    points: 10
  },
  {
    id: "ARSIP-009",
    text: "Kartu penunjuk yang digunakan untuk membatasi atau memberi sekat antara kelompok arsip yang satu dengan yang lain disebut...",
    type: "MULTIPLE_CHOICE",
    options: ["Folder", "Guide", "Label", "Tickler File", "Snelhechter"],
    correctIndex: 1,
    points: 10
  },
  {
    id: "ARSIP-010",
    text: "Arsip yang merupakan persyaratan dasar bagi kelangsungan operasional pencipta arsip dan tidak dapat diperbarui jika hilang (misal: Sertifikat Tanah, Akta Pendirian) disebut...",
    type: "MULTIPLE_CHOICE",
    options: ["Arsip Penting", "Arsip Vital", "Arsip Berguna", "Arsip Statis", "Arsip Inaktif"],
    correctIndex: 1,
    points: 10
  }
];

// OMNIBUS COLLECTION (PG + ESSAY JADI LEVEL 5)
export const OMNIBUS_EXAM_QUESTIONS: Question[] = [
  ...EXCEL_QUESTIONS,
  ...WORD_QUESTIONS,
  ...PPT_QUESTIONS,
  ...ARSIP_QUESTIONS,
  ...ESSAY_QUESTIONS
];
