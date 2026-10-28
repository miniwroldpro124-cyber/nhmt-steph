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

Tất cả trong `assets/js/config.js`: TikTok, Facebook, video YouTube (`music.videoId`), tiêu đề/artist, âm lượng, câu giới thiệu, pronouns, invite server. Card hiển thị TikTok, Facebook, máy chủ Discord và Contact me (mở DM Discord của UID trong config).

## Màn mở đầu video

Video được cắt sẵn thành 3 clip từ file gốc trong `assets/video/`, kèm poster `cyrene-*.jpg`. Mỗi clip có 2 bản: 1920×1080 60fps cho máy tính và 1280×720 cho điện thoại (`*-720.mp4`). Cắt sẵn để không phải tua — `python -m http.server` không hỗ trợ HTTP Range nên seek dễ bị phát lại từ đầu. Cấu hình trong `assets/js/config.js` → `introFilm` (`open`, `loop`, `outro`, mỗi clip có `src` + `srcMobile`).

| clip | đoạn gốc | 1080p | 720p |
| --- | --- | --- | --- |
| `cyrene-open` | 0-5s | 4.2MB | 1.9MB |
| `cyrene-loop` | 10-30s | 9.4MB | 4.9MB |
| `cyrene-outro` | 50.4-53.45s | 3.4MB | 1.5MB |

`srcMobile` được chọn khi `saveData`, mạng 2G/3G, hoặc màn hình cảm ứng nhỏ / máy yếu — máy tính vẫn giữ 1080p.

Clip mở màn tải trước; clip lặp và outro chỉ tải sau khi video bắt đầu chạy để không nghẽn băng thông. Khi vòng lặp hiện, outro được nạp sẵn và phát nóng 1 khung (muted) để cú chạm bật tức thì. Khi video hiển thị, các lớp grain/blur/sheen nặng được tắt và canvas nền tạm dừng để giữ 60fps.

Cả 3 clip được cân âm lượng về cùng mức (−15.6 LUFS) để chuyển cảnh không bị to/nhỏ đột ngột, và có fade ngắn ở mối nối.

- Mở trang: phát 0-5s kèm âm thanh. Nếu trình duyệt chặn tự phát có tiếng thì video chạy im lặng, và mọi tương tác đầu tiên (chạm, phím, cuộn) tự bật lại tiếng cho clip đang chạy — vẫn chỉ cần một lần chạm để mở trang.
- Khách chưa chạm: video lặp đoạn 10-30s.
- Chạm/nhấn space: phát đoạn cuối 3.05s có tiếng, hiệu ứng hôn/tim, rồi mở trang và chạy nhạc nền.

Đặt `open.src: ""` để quay lại cảnh CSS (tim pha lê).

## Logo & hiệu ứng nghiêng

- Logo chữ kim loại (chrome gradient + sheen + 2 ngôi sao lấp lánh) nằm trên bảng, tự đổi theo tên Discord. CSS ở `.brand` trong `assets/css/style.css`.
- Nghiêng bảng 3D theo con trỏ: càng ra rìa màn hình càng nghiêng (tối đa ~9°/12°), chỉ bật sau khi animation mở bảng chạy xong và chỉ trên thiết bị có chuột. Tắt khi rời chuột/scroll hoặc `prefers-reduced-motion`.
- Chạm trên điện thoại dùng `pointerdown` + `touch-action:manipulation` nên mở ngay, không chờ 300ms.

## Ghi chú

- Theo yêu cầu: không có link GitHub và không có nhãn owner.
- Nhạc nền: player YouTube được nạp sẵn (không phát) khi màn mở đầu chuyển sang vòng lặp, chạy nền ở chế độ muted từ lúc chạm, rồi bật tiếng và tua về 0:00 ngay khi màn mở đầu đóng — nhạc vào đúng nhịp, không phải chờ tải. Nếu bị chặn autoplay thì bấm nút play trên player.
- Font lấy từ Google Fonts; nếu offline sẽ dùng font hệ thống.
