# Thiệp cưới Lương Sáng & Trần Nhung

Nội dung thiệp nằm trong `content/wedding.json`.

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Mở http://localhost:3000.

- `/` là thiệp cưới.
- `/admin` sửa nội dung và tải ảnh, chỉ mở được khi chạy `npm run dev` trên máy.
- `/quan-ly` xem xác nhận tham dự, khách mời và lời chúc. Cần gắn Redis và đặt `GUESTBOOK_ADMIN_PASSWORD`.
