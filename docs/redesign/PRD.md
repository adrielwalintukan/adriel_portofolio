# PRD — Redesign Portofolio Adriel Walintukan

| | |
|---|---|
| **Status** | v1.1 — aksen diputuskan (signal red). Fase 0 berjalan |
| **Tanggal** | 21 Oktober 2026 |
| **Pemilik** | Adriel Walintukan |
| **Referensi** | Template "Matteo — Motion Artist Portfolio" (jiro.build), hanya sebagai inspirasi gaya, bukan disalin |
| **Stack** | React 19 + Vite + Tailwind v4 + Framer Motion + Lenis (sudah ada) |

---

## 1. Ringkasan

Portofolio saat ini sudah lengkap secara konten dan cukup rapi, tapi tampilannya **generik**: ungu-neon dengan glow di mana-mana, font Inter untuk semua teks, dan setiap section memakai pola yang sama (judul di tengah → fade-up → grid kartu). Akibatnya situs ini terlihat seperti "template AI developer" dan tidak punya identitas.

Redesign ini mengubah portofolio menjadi **editorial dan berani**: tipografi display raksasa, satu warna aksen, pergantian section gelap/terang, dan animasi yang **terikat pada scroll** (bukan sekadar fade-in). Arah ini terinspirasi dari Matteo, tetapi disesuaikan dengan identitas Adriel sebagai *developer AI, Web, dan Mobile*, bukan motion artist.

## 2. Tujuan & Ukuran Keberhasilan

| Tujuan | Ukuran |
|---|---|
| Kesan pertama "wow" dan berkarakter | Hero bisa dikenali tanpa membaca teks (nama raksasa + foto + aksen) |
| Project lebih mudah dilihat dan diklik | Project tidak lagi bergerak terus (marquee). Setiap project punya area klik yang diam |
| Ritme halaman lebih hidup | Minimal 2 section berlatar terang. Tidak ada 2 section berurutan dengan layout heading yang sama |
| Tetap cepat | Lighthouse Performance ≥ 90 (mobile), LCP < 2.5s, CLS < 0.05 |
| Aksesibel | Lighthouse Accessibility ≥ 95, `prefers-reduced-motion` dihormati, bisa zoom di mobile |

## 3. Audit Kondisi Sekarang vs Matteo

### 3.1 Perbandingan per area

| Area | Portofolio Adriel sekarang | Matteo | Masalah / peluang |
|---|---|---|---|
| **Tipografi** | Inter untuk semuanya (`--font-display` juga Inter). Judul `text-8xl` bold | Display condensed (Big Shoulders) sangat besar + Geist untuk body | Tanpa font display, judul tidak punya karakter. **Peluang terbesar dan termurah.** |
| **Warna** | Ungu `#6c5ce7` + cyan neon + gradient ungu→pink, glow dan orb di setiap section | 1 aksen oranye + hitam + krem | Terlalu banyak warna dan glow, terasa "cyber template". Perlu satu aksen. |
| **Ritme section** | 7 section semuanya gelap, semua memakai `SectionHeading` di tengah (label/judul/deskripsi) | Selang-seling gelap ↔ terang, layout heading berbeda tiap section | Monoton. Pengguna tidak merasakan "pindah bab". |
| **Loading screen** | Logo "AW." + progress bar palsu 2 detik (+0.8 detik exit) **di setiap kunjungan** | Nama muncul huruf per huruf, singkat | Progress bar palsu menunda konten ~2.8 detik tanpa alasan. |
| **Hero** | Split layout: badge "Available", "Hi, I'm Adriel" (gradient), typewriter, ilustrasi chibi GIF dalam jendela terminal + cincin berputar + tilt 3D. Foto asli hanya muncul di mobile | Foto full-bleed + nama raksasa yang tertimpa foto, info lokasi + jam lokal, daftar layanan, CTA solid | Hero tidak menampilkan wajah Adriel di desktop. Ilustrasi chibi terasa kurang profesional untuk recruiter. |
| **Navigasi** | Navbar glass + link horizontal + tombol "Let's Talk", overlay mobile | Header minimal (lokasi, jam, tombol Menu) → menu fullscreen dengan link besar | Navbar sekarang sudah baik, tapi kurang "statement". |
| **About** | Foto + 3 paragraf + stat card + chip skill + achievement card | 1 paragraf besar yang kata-katanya menyala saat di-scroll | Teks About sekarang panjang dan berat dibaca. |
| **Skills** | Grid ikon per kategori (`TechSkillCard`), replay animasi setiap masuk viewport (`once: false`) | "What I Offer": section sticky, counter 01/05, gambar berganti | Grid ikon sangat umum. Bisa dijadikan section pinned yang bercerita. |
| **Projects** | Marquee berjalan terus + tilt card + modal galeri | (Matteo tidak punya section project, galeri kecil saja) | Marquee membuat project sulit dibaca/diklik dan **project adalah konten terpenting**. |
| **Experience** | Timeline zig-zag dengan garis glow mengikuti scroll | Timeline 2 kolom di kartu terang, titik aksen | Sudah bagus (scroll-linked). Perlu disesuaikan gaya baru saja. |
| **Certificates** | Marquee kedua (arah berlawanan) + modal | "Awards": tabel dengan hover baris berubah aksen | Marquee dobel terasa repetitif. Format tabel lebih rapi dan bisa di-scan. |
| **Stats** | Di dalam About (2+, 13+, 10+) | Section sendiri, angka raksasa, satu angka beraksen | Angka kecil, kurang menonjol. |
| **Proses kerja** | Tidak ada | "How I Work" 4 langkah | Peluang baru: menunjukkan cara Adriel membangun software. |
| **Testimoni** | Tidak ada | Slider dengan Prev/Next | Opsional, butuh konten asli (lihat §11). |
| **CTA penutup** | Contact section (form + modal quick contact) | Kartu miring "Let's bring your ideas to life" | Bisa ditambah kartu CTA sebelum footer. |
| **Footer** | Footer biasa | Footer aksen penuh + nama raksasa + Back to Top | Footer bisa jadi "tanda tangan" yang berkesan. |

### 3.2 Temuan teknis

- **Dependensi tidak terpakai**: `gsap`, `three`, `@react-three/fiber`, `@react-three/drei`, `@tsparticles/react`, `@tsparticles/slim` tidak di-import di `src/`. Hapus dari `package.json`.
- **Kode mati**: `CustomCursor` hanya `return null`. `GradientOrb`, `AmbientGlow`, `NoiseOverlay` akan tidak relevan di gaya baru.
- **Aksesibilitas**: `index.html` memakai `maximum-scale=1.0, user-scalable=no` yang memblokir zoom di mobile. Wajib dihapus.
- **Yang dipertahankan**: `Lenis` (`useSmoothScroll`), `AnimatedCounter`, `TextReveal`, `Magnetic`, `InfiniteMarquee` (untuk teks berjalan, bukan project), `ProjectGalleryModal`, `CertificateModal`, `ContactForm`, data di `lib/constants.ts`.
- `react-parallax-tilt` dipakai di `ProjectCard`/`FeaturedProjectCard`. Kemungkinan bisa dihapus setelah kartu project diganti.

## 4. Arah Desain

### 4.1 Prinsip

1. **Tipografi adalah visual utama.** Judul besar dan condensed menggantikan glow dan ilustrasi.
2. **Satu aksen saja.** Semua highlight (link aktif, hover, angka penting, kata kunci) memakai satu warna.
3. **Kontras ritme.** Section gelap dan terang bergantian. Setiap section punya layout heading sendiri.
4. **Gerak bermakna.** Animasi mengikuti scroll atau interaksi pengguna, bukan bergerak terus tanpa alasan.
5. **Wajah dan karya di depan.** Foto asli Adriel dan screenshot project adalah aset visual utama.

### 4.2 Design tokens (usulan)

| Token | Nilai usulan | Catatan |
|---|---|---|
| `--color-ink` | `#07080a` | Latar gelap |
| `--color-paper` | `#f2efea` | Latar terang (krem hangat, bukan putih murni) |
| `--color-accent` | **Signal red `#ff3344`** (diputuskan) | Kontras ~5.5:1 di latar gelap, aman untuk teks. Teks di atas latar merah memakai `--color-ink` (hitam) |
| `--color-accent-strong` | `#c8102e` | Merah tua untuk teks kecil di latar krem (`#ff3344` di krem hanya ~3.3:1, cukup untuk judul besar saja) |
| `--color-muted` | `#8a8a8a` | Teks sekunder & kata yang belum "menyala" |
| `--font-display` | **perlu diputuskan**. Rekomendasi: *Big Shoulders Display* (900). Alternatif: *Anton*, *Bebas Neue* | Google Fonts, gratis |
| `--font-sans` | *Geist* (atau tetap *Inter*) | Body text |
| `--font-mono` | *JetBrains Mono* (sudah ada) | Label kecil, nomor section, "[ BASED IN … ]" |
| Skala judul | `clamp(3.5rem, 14vw, 13rem)` untuk hero, `clamp(2.5rem, 8vw, 7rem)` untuk judul section | Uppercase, `leading-[0.85]`, `tracking-tight` |
| Radius | `0.75rem` kartu, `9999px` tombol pill kecil | Tidak ada glow shadow |

### 4.3 Gaya komponen dasar

- **Tombol primer**: latar aksen, teks gelap, uppercase condensed, ikon panah dalam kotak kecil ("START A PROJECT ↗"). Saat hover, ikon bergeser dan teks bertukar huruf per huruf.
- **Label section**: mono kecil uppercase berwarna aksen, posisi di kiri atas (bukan di tengah).
- **Judul dua nada**: sebagian kata berwarna penuh, sebagian abu-abu (mis. "TURNING IDEAS INTO / **WORKING SOFTWARE**").

## 5. Struktur Halaman Baru

| # | Section | Latar | Sumber data | Komponen lama yang diganti |
|---|---|---|---|---|
| 0 | Loader | Gelap | — | `LoadingScreen` |
| 1 | Hero | Aksen / foto | `siteData`, `SOCIAL_LINKS` | `HeroSection`, `HeroCodingAnimation`, `TypewriterText` |
| 2 | About (manifesto) | Gelap | teks baru | `AboutSection` |
| 3 | Selected Work | Terang | `PROJECTS` | `ProjectsSection`, `ProjectCard`, `FeaturedProjectCard` |
| 4 | What I Do (skills) | Terang → gelap | `SKILLS_DATA`, `CORE_STRENGTHS` | `SkillsSection`, `TechSkillCard` |
| 5 | How I Work | Gelap | teks baru | — (baru) |
| 6 | Numbers | Gelap | `ABOUT_STATS` (+ jumlah sertifikat) | `StatCard` |
| 7 | Experience | Terang | `EXPERIENCE_TIMELINE` | `ExperienceSection`, `TimelineCard` |
| 8 | Certificates | Gelap | `CERTIFICATES_DATA` | `CertificatesSection`, `CertificateCard` |
| 9 | Marquee "LET'S BUILD SOMETHING" | Aksen | — | `InfiniteMarquee` (dipakai ulang) |
| 10 | CTA + Contact | Gelap/foto | `CONTACT_INFO` | `ContactSection` |
| 11 | Footer | Aksen | `NAV_LINKS`, `SOCIAL_LINKS` | `Footer` |
| — | Menu fullscreen | Gelap | `NAV_LINKS` | `Navbar` |

## 6. Spesifikasi per Section

> Format: **Tujuan → Layout → Animasi → Kriteria diterima (AC)**

### 6.0 Loader
- **Layout**: layar gelap, nama "ADRIEL" muncul di tengah.
- **Animasi**: huruf muncul satu per satu (stagger ~50ms, naik dari bawah dengan mask). Setelah selesai, layar terbuka ke atas (clip-path) dan nama hero ikut masuk.
- **AC**
  - Total durasi ≤ 1.2 detik. Tidak ada progress bar palsu.
  - Hanya tampil di kunjungan pertama per sesi (`sessionStorage`, dibungkus try/catch).
  - Dengan `prefers-reduced-motion`, loader dilewati.

### 6.1 Hero
- **Layout (desktop)**: latar aksen atau gelap dengan foto potret Adriel besar di kanan (full-height, foto diberi duotone/gradient). "ADRIEL / WALINTUKAN" raksasa di kiri, sebagian tertimpa foto. Bar atas: "BASED IN Manado, Indonesia" · "LOCAL TIME 14:05:32 WITA" (live) · tombol "Menu". Kanan tengah: daftar peran (AI Integration, Web Development, Mobile App, Software Testing). Kiri bawah: 1 kalimat tagline + ikon sosial. Kanan bawah: CTA "LET'S TALK ↗" + tautan sekunder "Resume".
- **Layout (mobile)**: foto di atas (aspect 4/5), nama raksasa di bawahnya, CTA full-width.
- **Animasi**: nama masuk per huruf (melanjutkan loader). Foto parallax ringan saat scroll (translateY maks 15%). Saat scroll keluar, nama mengecil/memudar (scroll-linked).
- **AC**
  - Foto asli tampil di desktop **dan** mobile.
  - Jam lokal ber-update tiap detik memakai `Intl.DateTimeFormat` zona `Asia/Makassar`.
  - Tidak ada layout shift saat font dan foto dimuat (font `display=swap` + ukuran foto ditetapkan).
  - Elemen LCP (foto atau nama) tampil < 2.5 detik di mobile 4G.

### 6.2 About (manifesto)
- **Layout**: label "ABOUT ME" kiri, satu paragraf besar (font display, ~3–4 baris) di tengah, foto kecil di kanan bawah.
- **Contoh teks**: "I build AI-powered web & mobile products that solve real problems, from clean architecture to the last pixel."
- **Animasi**: setiap kata berubah dari abu-abu (dan sedikit blur) ke putih sesuai progres scroll (`useScroll` + `useTransform` per kata).
- **AC**
  - Teks tetap terbaca utuh oleh screen reader (satu elemen `<p>`, span per kata `aria-hidden` atau teks asli tetap ada).
  - Dengan reduced-motion, semua kata langsung putih.

### 6.3 Selected Work (projects)
- **Layout**: latar terang. Judul "SELECTED / WORK" + counter. Project ditampilkan sebagai **kartu besar bertumpuk (sticky stack)**: setiap kartu menempel di atas lalu kartu berikutnya menumpuk di atasnya. Isi kartu: nomor (01), nama project, kategori, tag teknologi, screenshot besar, tombol "View Project ↗".
- Tampilkan **4–6 project unggulan**, sisanya di tombol "View all projects" (modal/daftar).
- **Animasi**: kartu sebelumnya mengecil sedikit (scale 0.95) dan menggelap saat tertimpa. Hover screenshot zoom ringan.
- **AC**
  - Project tidak bergerak sendiri. Klik kartu membuka `ProjectGalleryModal` yang sudah ada.
  - Di mobile (< 768px) sticky stack diganti daftar vertikal biasa.
  - Gambar memakai `loading="lazy"` kecuali kartu pertama.

### 6.4 What I Do (skills)
- **Layout**: section pinned setinggi ~4–5 layar. Kiri: "WHAT / I DO" raksasa + counter "01 / 04". Kanan: kartu besar yang berganti per kategori (Fullstack & Backend / AI, Frontend, Mobile, Tools/Testing). Di bawah kartu ada daftar kategori yang aktif berwarna aksen, dan di dalam kartu ada ikon teknologi kategori tersebut.
- **Animasi**: progres scroll menentukan kategori aktif. Counter dan kartu berganti dengan transisi slide/clip.
- **AC**
  - Semua skill dari `SKILLS_DATA` tetap tampil.
  - Di mobile, pinning dimatikan dan diganti accordion atau daftar.
  - Animasi tidak di-replay setiap masuk viewport (hapus `once: false`).

### 6.5 How I Work (baru)
- **Layout**: 4 kolom bergaris tipis: **1. Discover** (pahami masalah & user) · **2. Design** (arsitektur & UI) · **3. Build** (kode, AI integration, testing) · **4. Ship** (deploy & iterasi).
- **Animasi**: kolom masuk berurutan. Nomor menghitung dari 0.
- **AC**: teks final disetujui Adriel. Layout 1 kolom di mobile, 2 kolom di tablet.

### 6.6 Numbers
- **Layout**: kalimat besar "WHY WORK WITH ME" dengan kata kunci abu-abu, baris mono "[ BASED IN MANADO, INDONESIA // OPEN TO REMOTE ]", lalu 4 angka raksasa: Years Experience, Projects Completed, Technologies, Certificates. Satu angka memakai warna aksen.
- **Animasi**: `AnimatedCounter` yang sudah ada.
- **AC**: angka diambil dari data (jumlah sertifikat = `CERTIFICATES_DATA.length`), bukan hard-code.

### 6.7 Experience
- **Layout**: latar terang. Badge "MY JOURNEY" + judul dua nada. Timeline 2 kolom di dalam kartu besar: kiri judul + periode, tengah titik aksen dan garis, kanan deskripsi + tag teknologi.
- **Animasi**: pertahankan garis progres scroll-linked yang sudah ada, ganti warna glow ke aksen.
- **AC**: semua item `EXPERIENCE_TIMELINE` tampil, filter kategori (Experience/Education/Organization) opsional.

### 6.8 Certificates
- **Layout**: judul "CERTIFIED / SKILLS" bertumpuk dua nada + tombol "View all ↗". Tabel: Issuer · Judul sertifikat · Tahun.
- **Animasi**: hover baris membuat judul berubah aksen dan thumbnail sertifikat muncul mengikuti kursor (desktop).
- **AC**
  - Klik baris membuka `CertificateModal` yang sudah ada.
  - Baris bisa difokus dengan keyboard (Enter membuka modal).
  - Di mobile, thumbnail tampil inline (tanpa follow-cursor).

### 6.9 Marquee
- Teks raksasa "LET'S BUILD SOMETHING ✦" berjalan di pita aksen, memakai `InfiniteMarquee`. Berhenti saat reduced-motion.

### 6.10 CTA + Contact
- **Layout**: kartu terang yang sedikit miring di atas latar gelap/foto: "LET'S BRING / YOUR IDEAS TO LIFE." + paragraf singkat + tombol "Contact Me", lokasi dan jam lokal di sudut. Di bawahnya: `ContactForm` yang sudah ada dengan gaya baru.
- **Animasi**: kartu masuk dengan rotasi dari -6° ke -2° saat scroll.
- **AC**: form tetap berfungsi seperti sekarang (validasi + pengiriman tidak berubah).

### 6.11 Footer
- **Layout**: latar aksen penuh. Foto kecil + "LET'S CHAT" + email. Baris link (Home, About, Work, Contact) + ikon sosial + "BACK TO TOP". "ADRIEL WALINTUKAN" raksasa selebar layar di bawah. Copyright.
- **AC**: "Back to top" memakai Lenis `scrollTo(0)`. Nama raksasa tidak menyebabkan horizontal scroll.

### 6.12 Menu fullscreen
- **Layout**: header tetap minimal (logo AW, jam, tombol "Menu"). Menu membuka overlay gelap fullscreen: kiri link besar uppercase, kanan email, kontak, dan lokasi. Tombol "Close [ESC]".
- **Animasi**: overlay membuka dari atas (clip-path). Link masuk berurutan. Hover membuat link berwarna aksen.
- **AC**
  - **ESC menutup menu** (di template Matteo ini tidak berfungsi saat dicoba, jadi jangan diulang).
  - Fokus terkunci di dalam menu saat terbuka, lalu kembali ke tombol Menu setelah ditutup.
  - Scroll halaman terkunci saat menu terbuka. Klik link menutup menu lalu scroll ke section.
  - Link yang belum di-hover tetap memenuhi kontras WCAG AA (Matteo memakai link yang hampir tidak terlihat, jangan ditiru).

## 7. Sistem Animasi

| Pola | Dipakai di | Implementasi |
|---|---|---|
| Huruf per huruf (mask reveal) | Loader, nama hero, judul section, label tombol saat hover | Komponen `SplitText` baru (gabungkan dengan `TextReveal`) |
| Kata menyala sesuai scroll | About, Numbers | `useScroll` + `useTransform` per kata |
| Sticky stack | Selected Work | CSS `position: sticky` + `useScroll` untuk scale |
| Pinned section + counter | What I Do | Container tinggi + `sticky` + `useScroll` → index aktif |
| Parallax ringan | Foto hero, kartu CTA | `useTransform` translateY / rotate |
| Counter | Numbers, How I Work | `AnimatedCounter` (sudah ada) |
| Marquee | Pita teks | `InfiniteMarquee` (sudah ada) |
| Magnetic | Tombol CTA, tombol Menu | `Magnetic` (sudah ada) |

**Aturan:**
- Library: **Framer Motion + Lenis saja.** Tidak perlu GSAP.
- Hanya animasikan `transform`, `opacity`, `clip-path`. Hindari animasi `filter: blur` besar dan `height`.
- Easing standar: `cubic-bezier(0.16, 1, 0.3, 1)`. Durasi 0.4–0.9 detik.
- Hapus animasi tak berujung yang dekoratif (orbit berputar, foto melayang, ping badge).
- `prefers-reduced-motion: reduce` → semua reveal langsung tampil, sticky/pinned tetap jalan tanpa transisi, marquee berhenti.

## 8. Kebutuhan Non-Fungsional

- **Performa**: Lighthouse mobile ≥ 90. Foto hero dalam format WebP/AVIF ≤ 200KB dengan `fetchpriority="high"`. Font display di-preload (1 weight saja).
- **Aksesibilitas**: hapus `user-scalable=no` & `maximum-scale`. Semua tombol ikon punya `aria-label`. Fokus terlihat (outline aksen). Kontras teks ≥ 4.5:1, termasuk teks abu-abu di latar krem.
- **Responsif**: diuji di 375px, 768px, 1280px, 1920px. Tidak ada horizontal scroll (khususnya teks raksasa, pakai `clamp()` + `overflow-hidden` di section).
- **SEO**: `<title>` dan meta description diperbarui. Tambah Open Graph image.

## 9. Rencana Tahapan

| Fase | Isi | Hasil |
|---|---|---|
| **0. Fondasi** | Token warna/font baru di `globals.css`, font di `index.html`, perbaikan viewport, hapus dependensi & komponen mati, komponen `SplitText` + tombol baru | Halaman lama dengan font/warna baru |
| **1. Pembuka** | Loader, Hero, Menu fullscreen | Kesan pertama selesai |
| **2. Inti** | About manifesto, Selected Work, What I Do | Konten utama selesai |
| **3. Pendukung** | How I Work, Numbers, Experience, Certificates | Semua section isi |
| **4. Penutup** | Marquee, CTA + Contact, Footer | Halaman lengkap |
| **5. Poles** | Reduced-motion, cek mobile, Lighthouse, aksesibilitas keyboard | Siap rilis |

Setiap fase di-commit terpisah, dan situs tetap bisa di-build di akhir setiap fase.

## 10. Di Luar Lingkup

- Halaman terpisah per project (case study), bisa jadi fase berikutnya.
- Mode terang/gelap yang bisa diganti pengguna (desain ini sengaja punya ritme gelap/terang sendiri).
- Video background (Matteo memakai tag "video background", tapi aset video belum ada dan berat untuk performa).
- CMS / backend baru.

## 11. Keputusan Terbuka

| # | Pertanyaan | Rekomendasi |
|---|---|---|
| 1 | ~~Warna aksen?~~ | **Diputuskan: Signal red `#ff3344`** (21 Okt 2026) |
| 2 | Font display? | Dipakai di Fase 0: Big Shoulders Display (+ Geist untuk body). Masih bisa diganti ke Anton |
| 3 | Foto hero: foto yang mana? | Butuh foto potret resolusi tinggi dengan pencahayaan dramatis. `adriel_profile.png` yang sekarang perlu dicek kualitasnya di ukuran besar |
| 4 | Ilustrasi chibi dihapus atau dipindah? | Dihapus dari hero. Bisa dipakai kecil di 404 atau footer sebagai easter egg |
| 5 | Section testimoni? | Lewati, kecuali ada 2–3 testimoni asli (dosen, rekan UVICS, atasan magang LLDIKTI). Jangan pakai testimoni karangan |
| 6 | Project unggulan mana saja (4–6)? | Pilih dari `PROJECTS`: yang paling kuat visualnya & paling relevan untuk posisi yang dicari |
| 7 | Bahasa situs? | Tetap Inggris (sesuai sekarang) |

## 12. Risiko

| Risiko | Mitigasi |
|---|---|
| Section pinned/sticky macet atau patah di Safari iOS | Matikan pinning < 768px, uji di perangkat asli |
| Teks raksasa membuat horizontal scroll | `clamp()` + `overflow-x: clip` di section + uji 320px |
| Animasi scroll per kata berat jika paragraf panjang | Batasi ±40 kata, pakai satu `useScroll` per paragraf |
| Gaya terlalu mirip Matteo | Beda aksen, beda konten section (Work, Skills, Certificates), copywriting sendiri, tidak memakai aset atau kode template |
