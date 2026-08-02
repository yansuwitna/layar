## Layar - Aplikasi Berbagi Layar Guru & Siswa

Layar adalah aplikasi berbagi layar instan berbasis web (Next.js) yang dirancang khusus untuk keperluan edukasi, memungkinkan guru membagikan layar kepada siswa dengan mudah, baik menggunakan infrastruktur server (LiveKit) maupun secara langsung dalam jaringan lokal (Peer-to-Peer / WebRTC).

## Panduan Instalasi dan Deployment di VPS (menggunakan PM2)

Panduan ini akan menjelaskan cara men-deploy aplikasi **Layar** ke VPS (Ubuntu/Debian) menggunakan Node.js, Nginx, dan PM2.

### Prasyarat VPS

1.  **Sistem Operasi:** Ubuntu 20.04 / 22.04 LTS (disarankan).
2.  **Akses:** Root atau user dengan hak akses `sudo`.
3.  **Domain:** (Opsional tapi disarankan) Domain atau subdomain yang sudah diarahkan ke IP VPS Anda.

### Langkah 1: Install Node.js dan NPM

Aplikasi ini membutuhkan Node.js (direkomendasikan versi 18 atau 20).

```plaintext
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js v20 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi instalasi (pastikan muncul versinya)
node -v
npm -v
```

### Langkah 2: Install PM2

PM2 adalah _process manager_ untuk Node.js yang akan menjaga aplikasi tetap berjalan di _background_ dan akan menghidupkannya otomatis jika VPS di-_restart_.

```plaintext
sudo npm install -g pm2
```

### Langkah 3: Upload atau Clone Source Code

Pindahkan source code aplikasi `layar` ke dalam VPS Anda (misalnya di folder `/var/www/layar`).

```plaintext
# Buat direktori (jika belum ada)
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

# Anda bisa menggunakan git clone atau upload file menggunakan SFTP/FileZilla
# git clone <url-repo-anda> layar
cd layar
```

### Langkah 4: Install Dependencies & Setup Database

```plaintext
# Install library yang dibutuhkan
npm install

# Setup Prisma (Database SQLite)
npx prisma generate
npx prisma db push
```

_Catatan: Aplikasi ini menggunakan SQLite secara default (file database ada di_ `_prisma/dev.db_`_). Pastikan folder_ `_prisma/_` _memiliki hak akses tulis (write) agar database bisa diubah oleh aplikasi._

### Langkah 5: Build Aplikasi

Next.js harus di-_build_ terlebih dahulu untuk mengoptimalkan performa produksi (Production Mode).

```plaintext
npm run build
```

### Langkah 6: Jalankan Aplikasi dengan PM2

Setelah _build_ selesai, jalankan aplikasi menggunakan PM2.

```plaintext
# Jalankan aplikasi dengan nama "layar" di port 3400 menggunakan variabel PORT
PORT=3400 pm2 start npm --name "layar" -- start

# Simpan konfigurasi PM2 agar otomatis jalan saat server reboot
pm2 save
pm2 startup
# (Jalankan perintah yang muncul di terminal setelah perintah 'pm2 startup')
```

Untuk melihat status aplikasi:

```plaintext
pm2 status
pm2 logs layar
```

### Langkah 7: Setup Nginx (Reverse Proxy) - Opsional

Sangat disarankan menggunakan Nginx untuk mengarahkan Port 80 (HTTP) ke aplikasi Next.js Anda (Port 3400).

```plaintext
sudo apt install nginx -y
```

Buat konfigurasi Nginx baru:

```plaintext
sudo nano /etc/nginx/sites-available/layar
```

Isi dengan konfigurasi berikut (Ganti `domain-anda.com` dengan domain Anda atau IP VPS Anda):

```plaintext
server {
    listen 80;
    server_name domain-anda.com; # Ganti dengan domain/IP Anda

    location / {
        proxy_pass http://localhost:3400;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi Nginx:

```plaintext
sudo ln -s /etc/nginx/sites-available/layar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Catatan Penting

*   **Login Admin Pertama Kali:** Aplikasi tidak memiliki halaman _register_ admin demi keamanan. Jika tabel Admin kosong, siapapun yang pertama kali melakukan login di halaman `/admin` (dengan username dan password apa pun) otomatis akan terdaftar sebagai Admin pertama. Harap **segera** login ke panel admin setelah deploy selesai.
*   **Local Mode (Peer-to-Peer):** Fitur P2P (WebRTC) membutuhkan protokol koneksi aman. Browser mengharuskan situs menggunakan **HTTPS** agar fitur kamera, mic, atau membagikan layar (_Screen Share_) dapat berfungsi. Gunakan **Certbot (Let's Encrypt)** untuk memasang SSL pada Nginx Anda secara gratis.
*   **Pembaruan Aplikasi:** Jika di masa depan Anda melakukan pembaruan kode, Anda perlu mengulang proses build dan restart PM2:

```plaintext
git pull # atau upload ulang file
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart layar

# Gabungan
git pull && pm2 stop layar && rm -rf .next && npm run build && pm2 start layar
```