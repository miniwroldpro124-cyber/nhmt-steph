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

Video được cắt sẵn thành 3 clip từ file gốc trong `assets/video/`, kèm poster `cyrene-*.jpg`. Mỗi clip có 3 bản: 1920×1080 60fps cho máy tính (`src`), 1280×720 cho điện thoại nằm ngang (`srcMobile`), và 720×1280 dọc 9:16 cho điện thoại cầm dọc (`srcPortrait` + `posterPortrait`). Cắt sẵn để không phải tua — `python -m http.server` không hỗ trợ HTTP Range nên seek dễ bị phát lại từ đầu. Cấu hình trong `assets/js/config.js` → `introFilm`.

| clip | đoạn gốc | 1080p | 720p | 9:16 |
| --- | --- | --- | --- | --- |
| `cyrene-open` | 0-5s | 4.2MB | 1.9MB | 2.4MB |
| `cyrene-loop` | 10-30s | 9.4MB | 4.9MB | 4.6MB |
| `cyrene-outro` | 49.90-53.32s, làm chậm 1.32x | 3.3MB | 2.5MB | 2.4MB |

`srcMobile` được chọn khi `saveData`, mạng 2G/3G, hoặc màn hình cảm ứng nhỏ / máy yếu — máy tính vẫn giữ 1080p. `srcPortrait` được chọn khi máy đó cầm dọc: clip 9:16 phủ kín màn hình nên không bị `object-fit: cover` cắt mất nhân vật (bản ngang trên màn dọc chỉ giữ lại khoảng 26% chiều rộng khung hình). Xoay máy khi còn ở màn mở đầu sẽ tải lại trang để đổi bản.

Clip mở màn tải trước; clip lặp và outro chỉ tải sau khi video bắt đầu chạy để không nghẽn băng thông. Khi vòng lặp hiện, outro được nạp sẵn và phát nóng 1 khung (muted) để cú chạm bật tức thì. Khi video hiển thị, các lớp grain/blur/sheen nặng được tắt và canvas nền tạm dừng để giữ 60fps.

Chuyển sang outro không dừng vòng lặp ngay: vòng lặp vẫn chạy tới khi outro vẽ xong khung đầu, nên máy yếu cũng không thấy khung hình đứng. Trang hồ sơ bị ẩn khỏi khâu vẽ (`body.film-live .stage`) trong suốt đoạn film và chỉ hiện lại lúc intro bắt đầu mờ: để nguyên thì bảng hồ sơ vẽ ngầm sau lớp video đục, đo được 14 khung/2s thay vì 98 khung/2s. Player nhạc được nạp từ clip mở màn (không phải lúc bấm) vì tạo iframe YouTube tốn ~700ms main thread — để tới cú chạm thì outro sẽ khựng.

Ba chỗ từng làm khúc chuyển cảnh rớt khung, đều đã bỏ sau khi đo bằng Chrome DevTools trên Intel UHD 630 (khung hình 13.7ms khi chạy clip):

- `filter:blur()` trong animation mở bảng: filter toàn bề mặt buộc vẽ lại cả bảng mỗi khung, bán kính nào cũng tốn như nhau. Bảng mở ra mất 42ms/khung (~24 khung/giây); bỏ blur còn 20ms (~50 khung/giây).
- `backdrop-filter` của `.card`: bảng đặc gần kín nên lớp mờ phía sau gần như không thấy (chụp màn hình so hai bản lệch 0,37/255), nhưng canvas hạt phía sau chạy liên tục nên Chrome phải làm mờ lại toàn bảng mỗi khung — 32ms/khung so với 14ms.
- Bóng đổ ba lớp của `.card`: quầng sáng 90px + bóng 120px phải vẽ lại theo bảng; đây là phần lớn chi phí còn lại sau khi trang đã mở xong.

Đoạn cuối của video kết ở đỉnh flash trắng, và khung cuối là xám trung tính (~187,183,188) — phai thẳng xuống nền `#08050f` sẽ thấy một mảng xám lạnh lạc tông. Lớp `.intro__wash` phủ lên giây cuối, giữ độ chói của cú flash nhưng nhuộm thành quầng hồng pha lê → tím oải hương → tím than, cùng hướng với quầng sáng của `.bg__glow`, nên lúc intro mờ đi thì khung hình đã sẵn đúng tông nền hồ sơ.

Cả 3 clip được cân âm lượng về cùng mức (−15.6 LUFS) để chuyển cảnh không bị to/nhỏ đột ngột, và có fade ngắn ở mối nối.

- Mở trang: phát 0-5s kèm âm thanh. Trình duyệt chỉ cho bật tiếng trong một tương tác thật, nên nếu chưa chạm thì clip chạy im lặng tạm thời; **mọi** tương tác đầu tiên (chạm vào bất kỳ đâu, phím, cuộn) bật tiếng ngay cho clip đang chạy — không cần bấm đúng nút enter. Với trình duyệt cho tự phát có tiếng thì clip có tiếng ngay từ đầu, không cần chạm.
- Khách chưa chạm: video lặp đoạn 10-30s.
- Chạm/nhấn space: phát đoạn cuối ở tốc độ 0.7604x (4.49s, tiếng giữ nguyên cao độ) có tiếng, hiệu ứng hôn/tim, rồi mở trang và chạy nhạc nền.

Đặt `open.src: ""` để quay lại cảnh CSS (tim pha lê).

## Logo & hiệu ứng nghiêng

- Logo chữ kim loại (chrome gradient + sheen + 2 ngôi sao lấp lánh) nằm trên bảng, tự đổi theo tên Discord. CSS ở `.brand` trong `assets/css/style.css`.
- Nghiêng bảng 3D theo con trỏ: càng ra rìa màn hình càng nghiêng (tối đa ~9°/12°), chỉ bật sau khi animation mở bảng chạy xong và chỉ trên thiết bị có chuột. Tắt khi rời chuột/scroll hoặc `prefers-reduced-motion`.
- Chạm trên điện thoại dùng `pointerdown` + `touch-action:manipulation` nên mở ngay, không chờ 300ms.

## Ghi chú

- Theo yêu cầu: không có link GitHub và không có nhãn owner.
- Nhạc nền: player YouTube được nạp sẵn (không phát) khi màn mở đầu chuyển sang vòng lặp, chạy nền ở chế độ muted từ lúc chạm, rồi bật tiếng và tua về 0:00 ngay khi màn mở đầu đóng — nhạc vào đúng nhịp, không phải chờ tải. Nếu bị chặn autoplay thì bấm nút play trên player.
- Font lấy từ Google Fonts; nếu offline sẽ dùng font hệ thống.
