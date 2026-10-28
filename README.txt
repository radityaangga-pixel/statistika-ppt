# PPT Aren Head — Website Manajemen Grup & Keuangan

Website ini dibuat menggunakan HTML, CSS, JavaScript, dan `localStorage` browser. Tidak memerlukan instalasi database atau server untuk mencoba versi awal.

## Isi folder
- `index.html` — struktur halaman.
- `style.css` — tampilan dan responsif untuk laptop/ponsel.
- `script.js` — fitur perusahaan, grup, kategori, transaksi, grafik, perbandingan harian, dan ekspor data.

## Cara menjalankan
1. Ekstrak file ZIP ke folder pilihanmu.
2. Buka folder `ppt_aren_head`.
3. Klik dua kali `index.html`, lalu buka dengan Chrome atau browser lain.
4. Website akan menampilkan data contoh agar fitur mudah dicoba.
5. Tambah/edit/hapus grup, perusahaan, kategori, dan transaksi menggunakan tombol di website.

## Fitur utama
- Dashboard ringkasan semua perusahaan.
- Tambah, edit, hapus perusahaan dengan konfirmasi.
- Buat/edit/hapus grup; perusahaan bisa menjadi anggota grup atau berdiri sendiri.
- Tambah/edit/hapus kategori bisnis.
- Filter perusahaan berdasarkan kategori, grup, dan pencarian.
- Dashboard khusus setiap perusahaan dan grup.
- Catat/edit/hapus dana masuk dan pengeluaran.
- Grafik harian 7, 14, atau 30 hari.
- Perbandingan dana masuk dan pengeluaran hari ini dengan hari sebelumnya.
- Saldo = saldo awal + semua dana masuk - semua pengeluaran.
- Ekspor data sebagai file JSON untuk cadangan.

## Catatan penting tentang localStorage
- Data disimpan hanya pada browser dan profil pengguna di perangkat ini.
- Data tidak otomatis tersinkron ke perangkat lain.
- Menghapus data situs/browser dapat menghapus data website. Gunakan tombol **Ekspor data** untuk membuat backup secara berkala.
- Jangan gunakan data keuangan sensitif sungguhan untuk demo sebelum menerapkan perlindungan dan backup yang sesuai.
- Versi ini tidak menyediakan fitur impor backup JSON otomatis; file ekspor bisa dipakai sebagai arsip cadangan.

## Catatan statistik
- Saldo grup menjumlahkan saldo awal dan transaksi semua perusahaan anggota.
- Jika transaksi yang sama dicatat sebagai pengeluaran satu perusahaan sekaligus pemasukan perusahaan lain (transfer internal), total grup bisa terhitung ganda. Untuk pelaporan grup yang akurat, transfer internal perlu diberi perlakuan khusus.
- Data contoh hanya untuk demonstrasi. Hapus atau edit data contoh sebelum mulai mencatat data sendiri.
