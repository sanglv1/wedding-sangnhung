# Nhạc nền

Thêm file nhạc vào đây rồi khai báo đường dẫn ở `music.playlist` trong `content/wedding.json` (hoặc sửa qua trang `/admin`), ví dụ:

```json
"playlist": ["/music/1.mp3", "/music/2.mp3"]
```

Các bài phát tuần tự rồi quay lại bài đầu; một bài thì tự lặp lại. File khai báo nhưng không tồn tại sẽ được bỏ qua.

Nên nén nhạc xuống khoảng 128 kbps (khoảng 1 MB mỗi phút) để khách mở thiệp bằng 4G nhanh hơn.
