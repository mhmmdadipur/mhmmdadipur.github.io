# Mhmmd.Adipur Portfolio Website

> Personal portfolio website with built-in admin panel, hosted on GitHub Pages.

**Version:** 1.0.0  
**Live:** [mhmmdadipur.github.io](https://mhmmdadipur.github.io)  
**Admin:** [mhmmdadipur.github.io/admin.html](https://mhmmdadipur.github.io/admin.html)

---

## 📁 Project Structure

```
mhmmdadipur.github.io/
├── index.html              # Halaman utama portfolio
├── admin.html              # Admin panel (CRUD management)
├── data.json               # Database utama (profile, education, dll)
├── version.json            # Version tracking & changelog
├── assets/
│   ├── css/
│   │   ├── style.css       # Styling halaman utama
│   │   ├── admin.css       # Styling admin panel
│   │   └── meyawo.css      # Legacy CSS (bootstrap base)
│   ├── js/
│   │   ├── app.js          # Logic render data.json ke halaman utama
│   │   ├── admin.js        # Logic admin panel (CRUD + GitHub API)
│   │   └── meyawo.js       # Navbar toggle & scroll behavior
│   ├── imgs/               # Gambar (avatar, portfolio, certificates)
│   ├── vendors/            # Libraries (jQuery, Bootstrap, Themify Icons)
│   └── scss/               # Source SCSS (legacy, tidak aktif digunakan)
└── README.md               # File ini
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  GITHUB PAGES                    │
│              (Static File Hosting)               │
├─────────────────────────────────────────────────┤
│                                                 │
│   index.html ──── app.js ──── data.json         │
│   (Frontend)      (Render)    (Database)        │
│                                                 │
│   admin.html ──── admin.js ──── GitHub API      │
│   (Admin UI)      (CRUD)        (Read/Write)    │
│                                                 │
│   version.json                                  │
│   (Changelog)                                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Flow:**
1. `index.html` memuat `app.js`
2. `app.js` fetch `data.json` → render semua section secara dinamis
3. `admin.html` memuat `admin.js`
4. `admin.js` login via GitHub Token → read/write `data.json` via GitHub API
5. Setiap "Save & Push" = commit langsung ke repo → GitHub Pages auto-rebuild

---

## 🔑 Admin Panel

### Login
- Buka `/admin.html`
- Masukkan **GitHub Personal Access Token** (scope: `repo`)
- Repository: `mhmmdadipur/mhmmdadipur.github.io`

### Fitur
| Menu | Fungsi |
|------|--------|
| Profile | Edit nama, bio, avatar, social media, CV link |
| Education | Add/Edit/Remove riwayat pendidikan |
| Experience | Add/Edit/Remove pengalaman kerja |
| Portfolio | Add/Edit/Remove project (dengan upload gambar) |
| Certificates | Add/Edit/Remove sertifikat (dengan link verifikasi) |
| Skills | Add/Edit/Remove skill dengan level percentage |
| Versioning | Bump version, tulis release notes, lihat changelog |

### Image Upload
- Max **2MB** per file
- Format: JPG, PNG, WebP, GIF
- Gambar di-upload ke repo via GitHub API saat "Save & Push"
- Otomatis replace file lama jika path sama

### Mode
| Mode | Kapan | Save ke |
|------|-------|---------|
| Online | Di production / setelah push | GitHub repo (commit) |
| Offline | Di localhost testing | localStorage browser |

> Tombol Offline Mode otomatis tersembunyi di `*.github.io`

---

## 🎨 Sections di Website Utama

1. **Header** — Nama + typing animation roles
2. **About** — Bio, info, social links
3. **Skills** — Progress bars
4. **Education** — Cards dengan tahun
5. **Experience** — Cards dengan periode
6. **Portfolio** — Grid dengan Load More (max 6 awal)
7. **Certificates** — Grid dengan link verifikasi + Load More
8. **Contact** — Alamat, phone, email, LinkedIn
9. **Footer** — Copyright + version badge

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Hosting | GitHub Pages (static) |
| Frontend | Vanilla HTML/CSS/JS |
| CSS | Custom properties, Flexbox, Grid |
| Fonts | Inter (body), Baloo Paaji (header), Open Sans (subtitle) |
| Icons | Themify Icons |
| JS Libraries | jQuery 3.4.1 (legacy support) |
| Data | JSON flat file |
| API | GitHub REST API v3 |
| Auth | Personal Access Token (sessionStorage) |

---

## 🔒 Security

- Token **TIDAK** disimpan di repo — hanya di `sessionStorage` browser
- `admin.html` punya `<meta name="robots" content="noindex">` (tidak diindex Google)
- Image upload divalidasi (type + size)
- Semua output di-escape untuk mencegah XSS
- Foto dilindungi dari right-click save (CSS + JS)

### Best Practices:
1. Gunakan **Fine-grained Personal Access Token** dengan expiration
2. Hanya beri akses ke repository ini saja
3. Jangan pernah commit token ke repo
4. Revoke token jika dicurigai bocor

---

## 🚀 Deployment

### Pertama kali:
```bash
cd mhmmdadipur.github.io
git add .
git commit -m "Initial release v1.0.0"
git push origin main
```

### Update konten via Admin:
1. Buka `https://mhmmdadipur.github.io/admin.html`
2. Login dengan token
3. Edit data → Save & Push
4. Tunggu 1-2 menit untuk GitHub Pages rebuild

### Update code manual:
```bash
git add .
git commit -m "description of changes"
git push origin main
```

---

## 📝 Versioning

Format: **MAJOR.MINOR.PATCH** (Semantic Versioning)

| Type | Kapan |
|------|-------|
| Patch (x.x.+1) | Fix kecil, typo, update data |
| Minor (x.+1.0) | Fitur baru, section baru |
| Major (+1.0.0) | Redesign, breaking changes |

Kelola versi di Admin Panel → menu "Versioning"

---

## 🛠️ Development (Local)

```bash
# Start local server
cd mhmmdadipur.github.io
python3 -m http.server 8080

# Buka di browser
# Website: http://localhost:8080
# Admin:   http://localhost:8080/admin.html (gunakan Offline Mode)
```

---

## 📋 Data Schema (data.json)

```json
{
  "version": "1.0.0",
  "profile": {
    "name": "string",
    "subtitles": ["ROLE 1", "ROLE 2"],
    "avatar": "path/to/image",
    "bio": "string",
    "info": { "name", "dob", "address", "zip", "email", "phone" },
    "social": { "github", "linkedin", "instagram", "twitter", "facebook", "youtube", "whatsapp" },
    "cv_link": "url"
  },
  "education": [{ "id", "institution", "degree", "description", "year_start", "year_end", "icon" }],
  "experience": [{ "id", "company", "position", "period", "description", "icon" }],
  "portfolio": [{ "id", "title", "category", "description", "image", "link" }],
  "certificates": [{ "id", "title", "issuer", "date", "image", "verify_link" }],
  "skills": [{ "name", "level" }]
}
```

---

## 🐛 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "Invalid token" | Pastikan token punya scope `repo`, belum expired |
| Data tidak update | Tunggu 1-2 menit (GitHub Pages cache) |
| Upload gagal | Cek file < 2MB dan format valid |
| Admin tidak connect | Cek nama repo case-sensitive |
| Halaman kosong | Pastikan `data.json` valid JSON |

---

## 📄 License

Personal portfolio project. Template base: Meyawo by DevCRUD.
