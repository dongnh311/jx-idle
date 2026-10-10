// ============================================================================
// SCRIPT: VÔ HÓA HÓA "BAN" CỦA MÁY CHỦ — chạy trên máy khách (client-side)
// (Vô Lâm Idle - volamidle.pages.dev)
//
// VÌ SAO TỒN TẠI (đã kiểm chứng bằng headless Chrome, xem git log):
//   - Tài khoản dongnh bị máy chủ đánh dấu "dùng console": RPC jx_am_banned
//     trả true. Mỗi lần game gọi netCheat() (sau netSyncChar và mỗi 60s,
//     chỉ khi power > 20) → netCheat thấy ban → gọi banWipe() → XÓA NHÂN VẬT
//     về cấp 1 ("⛔ Tài khoản bị khóa vì dùng console…").
//   - Đó chính là vụ "buff xong ~10 phút là reset" — KHÔNG phải lỗi trang bị
//     hay cloud đè (12 món của add-gold-items.js đã verify sống tốt qua reload).
//
// SCRIPT LÀM GÌ:
//   Override 2 hàm global của game (function declaration → nằm trên window,
//   game gọi bằng tham chiếu global nên override có hiệu lực ngay):
//     banWipe  -> no-op: không còn xóa nhân vật.
//     netCheat -> no-op: không hỏi máy chủ, không set NET.ban/NET.cheat.
//   Xóa cờ "jxCheat" trong localStorage (cheatK đọc cờ này để giảm 99% sát
//   thương ngay cả khi netCheat không chạy) + reset NET.ban/NET.cheat/…U.
//
// HIỆU LỰC / GIỚI HẠN:
//   + Nhân vật KHÔNG bị wipe nữa, sát thương KHÔNG bị -99%.
//   - KHÔNG sửa được phía máy chủ: tài khoản vẫn bị đánh dấu ban trên server,
//     nên chợ / gửi thư / save cloud có thể vẫn bị server từ chối (đã thấy
//     bảng saves bị chặn ghi với tài khoản ban). Muốn sạch hoàn toàn thì
//     nhờ admin game gỡ ban.
//   - Override mất khi tải lại trang → chạy lại script này SAU MỖI LẦN mở game
//     (đặt trong Snippets, chạy trước khi chơi; an toàn: idempotent).
// ============================================================================

(function () {
  "use strict";

  window.applyUnbanPatch = function () {
    var patched = [];
    // 1) Vô hiệu hóa netCheat: không còn gọi RPC jx_am_banned / chars.power,
    //    không set NET.ban hay NET.cheat.
    if (typeof netCheat === "function") {
      window.netCheat = async function () {};
      patched.push("netCheat (không hỏi máy chủ nữa)");
    }
    // 2) Vô hiệu hóa banWipe: kể cả nơi nào khác gọi cũng không xóa được.
    if (typeof banWipe === "function") {
      window.banWipe = function () {
        console.log("banWipe đã bị vô hiệu hóa bởi unban-patch — bỏ qua, không xóa nhân vật.");
      };
      patched.push("banWipe (không xóa nhân vật)");
    }
    // 3) Xóa cờ cheat đã lưu (cheatK đọc localStorage "jxCheat" == user.id
    //    để giảm sát thương 99% ngay cả khi netCheat không chạy).
    try { localStorage.removeItem("jxCheat"); } catch (e) {}
    // 4) Reset trạng thái trong NET (phòng khi netCheat cũ đã set trước đó).
    try {
      if (typeof NET !== "undefined") {
        NET.ban = false; NET.cheat = false;
        NET.banU = null; NET.cheatU = null;
      }
    } catch (e) {}
    return patched;
  };

  var patched = window.applyUnbanPatch();
  console.clear();
  console.log("%c🛡️ Unban-patch đã áp dụng", "color:#7fe08a;font-size:16px;font-weight:bold");
  console.log("Đã vô hiệu hóa: " + (patched.join(" | ") || "(không tìm thấy hàm nào!)"));
  console.log("Đã xóa cờ jxCheat (sát thương -99%).");
  console.log("Nhân vật sẽ KHÔNG bị máy chủ xóa nữa khi treo máy/sync.");
  console.log("⚠️ Phải chạy lại sau mỗi lần tải lại trang (F5). Đặt trong Snippets:");
  console.log("   chạy script NÀY TRƯỚC, rồi mới đến add-gold-items.js.");
  console.log("ℹ️ Chợ/thư/cloud save vẫn có thể bị server từ chối (ban là phía máy chủ).");
})();
