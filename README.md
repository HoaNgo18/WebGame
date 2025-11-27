# WebGame - Sword IO

Dự án game IO thời gian thực lấy cảm hứng từ evowar.io. Người chơi điều khiển nhân vật, thu thập tài nguyên và chiến đấu để phát triển kích thước kiếm và chỉ số.

## Công nghệ
- **Frontend**: React, Phaser, Vite
- **Backend**: Node.js, Express, WebSocket (`ws`), MongoDB (`mongoose`)
- **Shared**: Logic dùng chung cho Client và Server

## Tính năng chính
- ⚔️ **PvP thời gian thực**: Chiến đấu mượt mà với người chơi khác.
- 🚀 **Hệ thống nâng cấp**: Tăng kích thước kiếm, tốc độ di chuyển và sức mạnh.
- 📱 **Đa nền tảng**: Hỗ trợ chơi trên cả PC (chuột/phím) và Mobile (cảm ứng).
- 🏆 **Bảng xếp hạng**: Theo dõi thành tích người chơi.
- 🔐 **Hệ thống tài khoản**: Đăng ký và đăng nhập để lưu trữ tiến trình.

## Cài đặt & Chạy

1. **Cài đặt thư viện**:
   Tại thư mục gốc:
   ```bash
   npm run install-all
   ```

2. **Chạy Development**:
   ```bash
   npm run dev
   ```
   Lệnh này sẽ khởi chạy cả Server và Client.

## Cấu trúc dự án
- `client/`: Mã nguồn Game Client (React + Phaser)
- `server/`: Mã nguồn Game Server (Node.js + WebSocket)
- `shared/`: Các hằng số và logic được chia sẻ