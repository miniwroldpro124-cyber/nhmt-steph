# NHM_Tien · profile

Hồ sơ cá nhân phong cách verrni.fun / herindz.dev — thẻ hồ sơ Discord tự đồng bộ, nhạc YouTube, TikTok và server link.

## Chạy local

```bash
python -m http.server 5173
```

Mở `http://localhost:5173`. Deploy: kéo thả cả thư mục lên Netlify / Vercel / Cloudflare Pages, không cần build.

## Tự cập nhật Discord

- UID đặt trong `assets/js/config.js` → `discord.id` (hiện tại `1155329135414087700`).
- Tên, avatar, khung avatar, banner, clan HSR và huy hiệu được lấy từ `japi.rest` mỗi 5 phút — đổi gì trên Discord cũng tự hiện, không cần sửa code. API này cache khoảng 1 giờ nên có thể chậm tối đa 1 giờ.
- Ảnh trong `assets/img/` (avatar, banner, decoration, clan) là bản dự phòng khi API/CDN lỗi; nếu đổi UID nhớ thay ảnh này.
- Số thành viên server lấy trực tiếp từ Discord invite API.

## Trạng thái online / Spotify (tuỳ chọn)

Trạng thái trực tiếp dùng [Lanyard](https://lanyard.rest). Tài khoản Discord phải tham gia server `discord.gg/lanyard` một lần; sau đó chấm trạng thái và thẻ "Đang nghe Spotify" tự hoạt động. Nếu chưa tham gia, chấm hiển thị màu tím với nhãn "Discord". Tắt hẳn bằng `lanyard: false` trong config.

## Lượt xem · star · like

Đếm toàn cầu bằng [Abacus](https://abacus.jasoncameron.dev) — miễn phí, không cần backend. Mỗi lần hôn/mở màn tính 1 lượt xem; star/like mỗi trình duyệt bấm được 1 lần (lưu bằng `localStorage`). Số đếm được cache lại và làm mới khi tải trang. Đổi namespace trong `assets/js/config.js` → `counters.namespace` nếu muốn tách bộ đếm.

## Chỉnh nội dung

Tất cả trong `assets/js/config.js`: TikTok, video YouTube (`music.videoId`), tiêu đề/artist, âm lượng, câu giới thiệu, pronouns, invite server. Card hiển thị TikTok, máy chủ Discord và Contact me (mở DM Discord của UID trong config).

## Màn mở đầu video

Video được cắt sẵn thành 3 clip từ file gốc (1080p60, tổng ~21MB) trong `assets/video/`: `cyrene-open.mp4` (0-5s), `cyrene-loop.mp4` (10-50s) và `cyrene-outro.mp4` (50-55s), kèm poster `cyrene-*.jpg`. Cắt sẵn để không phải tua — `python -m http.server` không hỗ trợ HTTP Range nên seek dễ bị phát lại từ đầu. Cấu hình trong `assets/js/config.js` → `introFilm` (`open`, `loop`, `outro`).

- Mở trang: phát 0-5s kèm âm thanh (nếu trình duyệt chặn tự phát có tiếng, video chạy im lặng).
- Khách chưa chạm: video lặp đoạn 10-50s.
- Chạm lần đầu: phát đoạn 50-55s, bật tiếng, hiệu ứng hôn/tim, rồi mở trang và chạy nhạc nền.

Đặt `open.src: ""` để quay lại cảnh CSS (tim pha lê).

## Ghi chú

- Theo yêu cầu: không có link GitHub và không có nhãn owner.
- Nhạc nền bắt đầu sau khi màn mở đầu đóng lại; player YouTube chỉ tải khi mở màn để trang nhẹ hơn. Trình duyệt có thể chặn autoplay, khi đó bấm nút play trên player.
- Font lấy từ Google Fonts; nếu offline sẽ dùng font hệ thống.
