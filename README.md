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

## Chỉnh nội dung

Tất cả trong `assets/js/config.js`: TikTok, video YouTube (`music.videoId`), tiêu đề/artist, âm lượng, câu giới thiệu, pronouns, invite server. Link TikTok/YouTube/Discord trong card cũng đọc từ file này.

## Ghi chú

- Theo yêu cầu: không có link GitHub và không có nhãn owner.
- Nhạc tự phát sau khi bấm "Bước vào"; trình duyệt có thể chặn autoplay, khi đó bấm nút play trên player.
- Font lấy từ Google Fonts; nếu offline sẽ dùng font hệ thống.
