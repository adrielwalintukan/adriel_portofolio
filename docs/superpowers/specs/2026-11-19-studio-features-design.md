# Studio: sembilan fitur baru (desain)

Tanggal: 2026-11-19. Status: menunggu persetujuan Adriel.

## Maksud

Studio 3D (`/studio`) harus terasa lebih hidup dan membuat pengunjung, terutama recruiter, betah dan terkesan.
Sembilan fitur di bawah menambah interaksi, suasana dan cara cepat melihat semua isi portofolio.

## Batasan (tetap berlaku)

- `/studio` tetap chunk lazy; situs utama tidak mengimpor modul studio.
- Tanpa aset eksternal: geometri prosedural, tekstur canvas, suara Web Audio. Tanpa dependency baru.
- Palet teal/amber yang sudah ada; tanpa emoji.
- Semua isi (proyek, pengalaman, sertifikat) dari `src/lib/constants.ts`; tidak ada yang dikarang.
- Lancar di HP: partikel dan efek punya jumlah kecil di layar sentuh, `prefers-reduced-motion` dihormati.
- Selesai = tsc, lint, `npm test`, `npm run build` lolos, plus bukti screenshot.

## Non-goal

- Tombol manual siang/malam, cuaca asli dari API, suara narasi (TTS), leaderboard global, akun pengunjung.

## Pendekatan yang dipertimbangkan

**Penyimpanan guest book** (dipilih Adriel: A)
- A. Upstash Redis lewat Vercel Marketplace: gratis, terpisah dari aplikasi lain, cukup untuk daftar pesan pendek. **Dipilih.**
- B. Tabel di project Supabase CartaAI: cepat, tapi data portofolio bercampur dan ikut mati bila project itu di-pause.
- C. Project Supabase baru: paling rapi, tapi paket gratis sudah penuh (2 project), jadi berbayar.

**Moderasi guest book** (dipilih Adriel: B)
- Pesan langsung tampil, disaring filter kata kasar dan batas kiriman per IP; Adriel menghapus belakangan bila perlu.
  Moderasi manual (setujui dulu) ditolak karena pengunjung tidak langsung melihat catatannya.

## Desain per fitur

Urutan pengerjaan: 1, 8, 6, 3, 9, 2, 4, 7, 5 (dari yang paling kecil dan tanpa server, guest book terakhir).

### 1. Klik sertifikat di dinding membuka modalnya
- `Frames` di `Room.tsx` mendapat callback `onCert(id)`; klik bingkai memanggil `setCertificate(...)` di `StudioPage`
  (modal `CertificateModal` yang sudah dipakai panel), bukan `onPick('certificates')`.
- Label hover menjadi judul sertifikat. Panel daftar tetap terbuka lewat menu Awards.

### 2. Siang/malam mengikuti jam Manado (WITA, UTC+8)
- Fungsi murni `phaseAt(date)` di modul baru `src/studio/daylight.ts`: jam WITA = `getUTCHours() + 8`.
  Fase: fajar 05-06, siang 06-17, senja 17-19, malam 19-05. Mengembalikan fase dan nilai campuran 0..1.
- Diperiksa saat studio dibuka dan setiap menit.
- Jendela: `windowTexture(phase)` melukis langit siang (biru, awan), senja (oranye-ungu) atau malam (kota yang sekarang).
- Cahaya di `Scene.tsx`: intensitas ambient/hemisphere/directional dan warna latar mengikuti fase; lampu dalam ruangan tetap.
- Tes `node --test` untuk `phaseAt` pada beberapa jam UTC.

### 3. LED RGB dinamis
- Strip LED tipis di tepi belakang meja dan di dalam casing PC (fan yang sudah ada), warna HSL bergeser pelan (satu putaran ~20 dtk).
- Saat musik menyala, `sound.ts` mengekspor `musicPulse()` (0..1, naik di tiap kick lalu meluruh); LED menambah terang mengikuti nilai itu.

### 4. Anjing mengikuti karakter
- `Character.tsx` menulis posisinya ke singleton modul `charPos` (pola yang sama dengan `pointerDrag`).
- Anjing sesekali (acak 40-70 dtk) bangun, berjalan mengikuti karakter dengan jarak ~0.8 m selama 15-25 dtk,
  lalu kembali ke karpet dan tiduran. Tidak ada bantal (sudah dihapus atas permintaan sebelumnya); "kembali ke bantal" = kembali ke karpet.
- Bila karakter sedang di meja atau sideboard, anjing berhenti dan duduk/tiduran di dekatnya.

### 5. Guest book
- Endpoint `api/guestbook.ts` (Vercel function, `fetch` ke REST Upstash, tanpa dependency). Env:
  `KV_REST_API_URL`/`KV_REST_API_TOKEN` (nama dari integrasi Vercel) dengan fallback `UPSTASH_REDIS_REST_URL`/`_TOKEN`.
- `GET`: 8 pesan terbaru `{name, message, at}`, cache pendek.
- `POST {name, message, website}`: validasi nama 1-24 karakter, pesan 1-80, field `website` honeypot harus kosong,
  filter kata kasar (daftar kecil Indonesia + Inggris, di file sendiri), batas 3 kiriman per IP per jam (`INCR` + `EXPIRE`).
  Simpan `LPUSH` lalu `LTRIM` 0..49.
- Papan gabus baru khusus guest book (dipilih Adriel: B) di dinding kiri, di celah antara rak buku (z -4.4..-1.3)
  dan dinding sertifikat (mulai z ~0.2): bingkai kayu ~1.2 x 0.9 m di x -5.9, z -0.5, y ~2.6, judul "GUEST BOOK".
  Catatan dekoratif di papan tulis tetap ada.
- 8 pesan terbaru tampil sebagai catatan tempel (warna bergantian, sedikit miring, pin) di papan gabus itu.
  Klik papan membuka form kecil (HTML overlay, gaya panel yang ada); setelah terkirim catatan baru langsung muncul.
- Hapus pesan: Data Browser Upstash (`LREM`). Langkahnya ditulis di README.
- Tes untuk validasi dan filter (fungsi murni yang diekspor).

### 6. Game kedua di TV: Breakout
- Breakout dipilih (bukan Snake) karena dikendalikan seperti Pong: pointer/jari menggeser paddle, cocok di HP tanpa keyboard.
- Menu TV menjadi Pong, Breakout, YouTube. Fisika di modul murni `breakout.ts` dengan tes, digambar di canvas TV yang sama.
- Skor tertinggi per pengunjung di `localStorage` (`studio-breakout-best`), ditampilkan di layar.

### 7. Tur otomatis "Take the tour"
- Tombol di header studio. Kamera berpindah: room, projects, experience, skills, certificates, about, kembali ke room; ~6 dtk per stasiun.
- Narasi berupa teks caption di bawah layar, disusun dari `constants` (mis. jumlah proyek, peran terkini).
- Tombol Lewati dan Berhenti; klik/drag/tombol keyboard apa pun menghentikan tur. Caption juga ke `aria-live`.
- Panel samping tidak dibuka selama tur (agar layar bersih); di akhir kembali ke room.

### 8. Easter egg terminal (tidak muncul di `help`)
- `sudo hire adriel`: terminal mencetak kontak dari `CONTACT_INFO`, ruangan berkedip teal dan confetti singkat.
- `matrix`: hujan karakter hijau di kedua monitor dan rona hijau ruangan selama ~8 dtk.
- `bark`: anjing menggonggong. `rain`: hujan di jendela menyala/mati.
- `runCommand` mengembalikan field `effect`; `StudioPage`/`Room` menjalankannya. Tes di `terminal` untuk perintah baru.

### 9. Partikel suasana
- Debu: `THREE.Points` kecil (~120, 40 di HP) melayang pelan di kerucut cahaya spot galeri dan lampu gantung meja.
- Uap mug sudah ada; tidak diubah.
- Hujan di jendela: garis-garis turun di atas tekstur jendela, aktif acak di sebagian kunjungan (1 dari 3) atau lewat perintah `rain`.

## Diputuskan oleh Claude (boleh dikoreksi)

- Breakout, bukan Snake; skor tertinggi lokal per pengunjung.
- Fase siang/malam otomatis tanpa tombol.
- Tur 6 dtk per stasiun, caption teks tanpa suara.
- Hujan acak per kunjungan.

## Pertanyaan terbuka

Tidak ada.
