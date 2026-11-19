# Studio: desktop di monitor utama (desain)

Tanggal: 2026-11-19. Status: menunggu persetujuan Adriel.

## Maksud

Monitor utama di `/studio` (tampilan Projects) sekarang hanya grid folder: Enter langsung memutar video
proyek pertama, dan pengunjung tidak merasa sedang memakai komputer. Adriel ingin monitor itu menyala ke
**desktop seperti Windows**: ikon aplikasi, File Explorer, galeri foto, file-file proyek, jendela yang
berfungsi seperti komputer sungguhan. Tujuannya sama dengan studio: pengunjung (terutama recruiter)
terkesan dan betah menjelajah proyek.

## Keputusan Adriel

- Multi-jendela (A): beberapa aplikasi terbuka bersamaan; jendela bisa digeser, ditumpuk, minimize ke
  taskbar, maximize, close; ada Start menu dan jam WITA.
- Cara bangun 1: desktop HTML sungguhan yang dipetakan ke layar 3D (mekanisme overlay yang sudah ada).
- Daftar aplikasi seperti usulan Claude (lihat di bawah).

## Batasan

- Tidak menyalin logo, nama atau tampilan persis Microsoft Windows (merek dagang). OS sendiri bernama
  **AdrielOS**, dengan logo sendiri; nuansa Windows lewat tata letak (taskbar bawah, Start, jendela).
- Semua isi dari `src/lib/constants.ts` (PROJECTS / DESK_PROJECTS, CERTIFICATES_DATA, CONTACT_INFO,
  SKILLS_DATA, EXPERIENCE_TIMELINE). Tidak ada proyek, tanggal atau klaim karangan.
- `/studio` tetap chunk lazy; tanpa dependency baru; palet teal/amber; tanpa emoji.
- Lolos tsc, lint, `npm test`, `npm run build`, plus bukti klik sungguhan di Chrome headless (GPU).

## Non-goal

- Resize jendela dengan menarik tepi (maximize/restore saja), drag file antar folder, rename/hapus file,
  menyimpan susunan jendela antar kunjungan, embed situs luar di iframe.

## Pendekatan yang dipertimbangkan

1. **Desktop HTML yang dipetakan ke layar 3D (dipilih).** Overlay `div` SCREEN_PX (960x532) yang sudah
   dipakai `DeskWindow`, kini selalu terpasang di tampilan Projects. Interaksi DOM normal: klik, drag,
   scroll, video, link.
2. Digambar di canvas 3D dengan hit-test manual: drag, scroll, input dan video harus dibuat ulang. Ditolak.
3. Pop-up layar penuh di atas ruangan: kesan monitor di dalam ruangan hilang. Ditolak.

## Desain

### Struktur kode

- `src/studio/os/` folder baru (chunk studio):
  - `fs.ts` — sistem file virtual murni dari constants: `type Node = Folder | File`, `File.kind`:
    `image | video | text | link | app`. Root: `Desktop`, `Projects/<judul>/` (screenshot dari
    `images`, video dari `video`, `README.txt` dari `longDescription ?? description` + teknologi,
    shortcut `Live site.url` / `Repository.url` bila ada), `Certificates/` (gambar `image` tiap sertifikat),
    `Pictures/` (semua screenshot proyek), `about-me.txt` (nama, kota, availability, pengalaman terkini,
    kategori skill), `Recycle Bin/` (satu `bugs.txt`: lelucon pendek, bukan klaim).
  - `windows.ts` — state manager murni: `open(app, file?)`, `close(id)`, `focus(id)`, `minimize(id)`,
    `toggleMax(id)`, `move(id, x, y)` dengan z-order dan posisi bertingkat (cascade), dibatasi agar title
    bar tidak keluar layar. Diuji `node --test`.
  - `Desktop.tsx` — wallpaper, ikon desktop (klik pilih, dobel-klik/Enter buka), jendela, taskbar, Start menu.
  - `apps/` — `Explorer`, `Photos`, `MediaPlayer`, `Notepad`, `TerminalApp`, `Browser`.
- `StudioPage.tsx`: overlay `Desktop` dipasang selama `view === 'projects'` (menggantikan `DeskWindow`);
  `Room.tsx` tetap memetakan overlay ke layar setiap frame.
- `Room.tsx`: dari ruangan (overlay tidak tampil) tekstur layar menggambar desktop statis yang sama:
  wallpaper, ikon, taskbar dan jam. `paintDesk` (grid folder) diganti.

### Perilaku

- Masuk Projects: desktop tampil (bukan video). Belum ada jendela terbuka.
- Ikon desktop: Explorer, Photos, Projects (folder), about-me.txt, Terminal, Recycle Bin.
- Jendela: title bar (ikon, judul, minimize, maximize, close), drag lewat title bar, klik membawa ke depan,
  dobel-klik title bar = maximize. Close kembali ke desktop (memperbaiki laporan layar hitam).
- Taskbar: tombol Start (logo AdrielOS), satu tombol per jendela terbuka (klik = fokus / minimize bila
  sudah di depan), jam WITA.
- Start menu: daftar aplikasi, tautan cepat ke proyek unggulan (`featured`), "Shut down" = kembali ke ruangan.
- Explorer: sidebar (Desktop, Projects, Certificates, Pictures), breadcrumb, tombol back, tampilan ikon;
  dobel-klik folder masuk, file dibuka di aplikasi sesuai `kind`.
- Photos: grid thumbnail; klik untuk lihat besar, panah kiri/kanan dan tombol keyboard.
- Media Player: `<video controls>` (autoplay saat dibuka); hanya satu video berbunyi: membuka video lain
  mengganti yang lama. Musik ruangan mengecil saat video diputar (logika `videoPlaying` yang ada).
- Notepad: teks hanya-baca, font mono.
- Terminal app: memakai `runCommand` dan efek ruangan yang sama dengan monitor kiri.
- Browser: kartu dengan URL, judul proyek, tombol "Open in new tab" (`target=_blank rel=noopener`).
- Keyboard: Esc menutup jendela teratas; bila tidak ada, kembali ke ruangan. Panah + Enter memilih dan
  membuka ikon desktop. Tab bergerak di dalam desktop.
- Details proyek (`ProjectGalleryModal`) tetap bisa dibuka dari README/Explorer (tombol "Details").

### Aksesibilitas

- Jendela `role="dialog"` dengan judul; tombol title bar berlabel; ikon desktop berupa tombol;
  aria-live mengumumkan aplikasi yang dibuka.

## Diputuskan oleh Claude (boleh dikoreksi)

- Nama dan logo: AdrielOS, logo huruf "A" teal dalam kotak membulat.
- Wallpaper: gradien teal/navy dengan pola halus, digambar CSS (tanpa gambar).
- Tanpa resize tepi jendela; maximize/restore saja.
- Isi `bugs.txt` di Recycle Bin: satu baris lelucon tanpa klaim faktual.
- Di HP, jendela dibuka maximize otomatis.

## Pertanyaan terbuka

Tidak ada.
