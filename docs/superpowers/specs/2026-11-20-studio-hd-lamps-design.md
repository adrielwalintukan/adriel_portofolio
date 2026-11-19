# Studio: grafik HD, mulus, cahaya hanya dari lampu, dan detail ruangan (desain)

Tanggal: 2026-11-20. Status: menunggu persetujuan Adriel.

## Maksud

Studio harus terasa lebih tajam (HD), tetap mulus, dan lebih "nyata": cahaya ruangan datang dari lampu-lampu
yang terlihat, bukan dari lampu isi yang meratakan semuanya, dan gaya gambarnya tidak terlalu lembut atau
penuh warna. Referensi: studio milik Tiara (kode publik di `prettyara12/tiara_portofolio`, `src/studio`),
yang dibaca sebagai sumber ide, tidak disalin.

## Keputusan Adriel

- Kerjakan keduanya: bagian "mulus dan HD" dan bagian "detail ruangan".
- Bayangan tidak diubah: bentuk, posisi dan resolusinya tetap seperti sekarang.
- Cahaya ruangan hanya dari lampu; gaya grafik tidak terlalu soft atau colorful.

## Batasan

- `/studio` tetap chunk lazy; efek pasca-proses hanya dimuat di chunk studio.
- Tanpa aset eksternal: geometri prosedural dan tekstur canvas tetap. Isi tetap dari `constants`.
- HP (layar sentuh) tetap mode cepat: tanpa post-processing, bayangan 1024 seperti sekarang.
- Lolos tsc, lint, `npm test`, `npm run build`; bukti screenshot dan ukuran FPS sebelum/sesudah.

## Non-goal

- Mengubah pengaturan bayangan (ukuran, jenis, posisi, bias), model baru, aset gambar.
- Salinan kucing, record player atau kunang-kunang Tiara (sudah ada anjing dan musik lofi; kunang-kunang
  menambah cahaya selain lampu).

## Pendekatan

**Post-processing (HD)**
1. `@react-three/postprocessing` + `postprocessing` (dipilih): Bloom, SMAA, ACES tone mapping, vignette,
   penyesuaian saturasi/kontras, AO setengah resolusi. Dua dependency baru, hanya di chunk studio.
2. Composer sendiri di atas `postprocessing` saja: satu dependency, tapi kode lebih banyak dan lebih mudah salah.
3. Tanpa post-processing (CSS filter + MSAA): paling ringan, tapi tidak ada bloom/AO, jadi tidak HD.

## Desain

### A. Mulus dan HD
- Mode kualitas: **HD** (desktop) atau **Cepat** (HP). Tombol chip "HD" di header; pilihan disimpan di
  `localStorage` (`studio-hd`), dibungkus try/catch.
- HD: renderer `antialias: false`, SMAA; Bloom (ambang tinggi, hanya lampu, layar dan neon yang menyala);
  AO setengah resolusi; vignette tipis; `dpr` = `clamp(devicePixelRatio, 1.5, 2)`.
- Cepat: `antialias: true`, tanpa efek, `dpr` maksimum 1.25 (sekarang `[1.5, 2]` di semua perangkat).
- Kualitas otomatis: penghitung FPS rata-rata 2 detik; bila di bawah 30 FPS dua kali berturut-turut,
  turun bertahap: matikan AO, lalu turunkan dpr ke 1.25, lalu pindah ke mode Cepat. Hanya turun, tidak naik lagi
  dalam kunjungan yang sama, dan hanya bila pengunjung tidak memilih sendiri lewat tombol.
- Bayangan: tidak disentuh.

### B. Cahaya hanya dari lampu, gaya lebih tegas
- Sumber cahaya yang tersisa: lampu gantung meja (utama), lampu lantai, bar galeri (strip), lampu labu di
  sideboard, layar (monitor, TV) yang memantulkan sedikit, strip RGB dan lampu hias (kecil), dan jendela
  (bulan di malam hari, matahari di siang hari menurut jam WITA).
- Dihapus: lampu pengisi dingin/teal di tengah ruangan dan lampu pengisi depan. Ambient dan hemisphere
  turun menjadi sangat rendah (sekitar 0,06 dan 0,08) hanya agar sisi gelap tidak hitam pekat.
- Lampu arah yang satu-satunya penghasil bayangan tetap ada dan tetap menghasilkan bayangan yang sama;
  intensitasnya diturunkan dan warnanya dihangatkan, jadi ia berfungsi sebagai pantulan lampu gantung dari atas.
  Akibatnya bayangan terlihat sedikit lebih dalam karena isian ambient berkurang (bentuknya tetap).
- Gaya: kontras lebih tinggi lewat ACES + `BrightnessContrast`, saturasi turun (sekitar -15 persen) lewat
  `HueSaturation`, vignette. Di mode Cepat memakai ACES bawaan dan intensitas cahaya yang sama.
- Siang/malam WITA tetap, tapi siang hanya menambah cahaya jendela, bukan cahaya ambient.

### C. Detail ruangan (diambil dari ide Tiara)
- **Lampu hias** di sepanjang atas dinding belakang: bohlam instanced yang berkedip pelan, bersinar lewat bloom.
- **Tirai** di sisi jendela: dua bidang kain yang bergoyang pelan.
- **Neon "ADRIEL"** di dinding, teks canvas bercahaya (warna teal redup), bagian dari sumber cahaya lampu.
- **Klik jendela** mengganti siang/malam (menimpa jam WITA sampai halaman ditutup); label hover "Toggle day / night".
- **Shortcut keyboard** dan overlay bantuan: `?` bantuan, `M` musik, `T` tur, `N` siang/malam, `R` ke ruangan,
  `1`-`5` ke stasiun (Projects, Skills, Experience, Awards, About). Tidak aktif saat mengetik di input dan saat
  jendela modal terbuka.

## Diputuskan oleh Claude (boleh dikoreksi)

- Memakai wrapper `@react-three/postprocessing` (pendekatan 1).
- Ambang FPS 30 dan langkah penurunan seperti di atas.
- Neon berwarna teal redup agar tidak menambah warna mencolok.
- Kunang-kunang, kucing dan record player tidak ditiru.

## Pertanyaan terbuka

Tidak ada.
