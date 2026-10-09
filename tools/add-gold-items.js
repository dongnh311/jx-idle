// ============================================================================
// SCRIPT: Thêm vàng + đồ cho nhân vật (Vô Lâm Idle) — BẢN AN TOÀN
// Chạy trong DevTools console của tab Chrome NƠI NHÂN VẬT CỦA BẠN TỒN TẠI
//   (F12 -> tab Console -> paste -> Enter)
//
// ĐẢM BẢO KHÔNG XÓA DỮ LIỆU:
//   1) Backup toàn bộ save hiện tại vào key RIÊNG (_preScript) — key này sống
//      sót cả khi người dùng nhấn "Xóa nhân vật" (deleteSlot chỉ xóa key save
//      + _bak, không xóa _preScript).
//   2) Chỉ thêm vàng/đồ, KHÔNG bao giờ giảm/xóa bất cứ gì.
//   3) Sau khi save(), KIỂM TRA chữ ký (unpack().ok). Nếu save mới sai ->
//      TỰ HOÀN TÁC về backup, không để nhân vật bị hỏng.
//   4) Chặn chạy trên nhân vật rỗng (S.fac null = newSave chưa có thật).
//
// Đồ sinh bằng makeItem() (hàm có sẵn của game) -> đúng schema, rarity tự động.
// save() tự tính lại hash nên game KHÔNG báo "chỉnh sửa ngoài".
// ============================================================================

(function () {
  "use strict";

  // ---- Cấu hình ----
  const GOLD_ADD = 10_000_000;          // số vàng thêm (10 triệu)
  const ITEM_COUNT = 15;                 // số món đồ random
  const ITEM_MAGICS = 4;                 // dòng ảo thuật: 3-4 -> rarity cao (tím)
  const ITEM_TIER = null;                // cấp đồ: null = tự tính theo cấp nhân vật

  // ---- Guard: phải có nhân vật THẬT (S.fac), không phải newSave() rỗng ----
  if (typeof S === "undefined" || !S.fac) {
    alert(
      "Chưa có nhân vật thật!\n\n" +
        "Nhân vật hiện tại chưa tạo (fac=null). Hãy tạo/chọn nhân vật rồi chạy lại.\n" +
        "Script sẽ KHÔNG xóa gì cả, nhưng cũng không thêm vào nhân vật rỗng."
    );
    return;
  }
  if (typeof makeItem !== "function") {
    alert("Game chưa load xong (thiếu makeItem). đợi trang load rồi chạy lại.");
    return;
  }

  const key = typeof saveKey === "function" ? saveKey() : "jxidle_1";
  const backupKey = key + "_preScript";
  let backupText = null;

  // ---- 0) BACK UP an toàn trước khi sửa đổi ----
  try {
    // Đảm bảo _bak đang chứa state thật hiện tại (save() tự động lưu _bak)
    if (typeof save === "function") save();
    const cur = localStorage.getItem(key);
    if (cur) {
      backupText = cur;
      localStorage.setItem(backupKey, cur); // key riêng, sống sót sau deleteSlot
    }
  } catch (e) {
    console.warn("Không lưu được backup:", e);
  }

  // ---- 1) Thêm vàng (không bao giờ giảm) ----
  const goldBefore = S.gold || 0;
  S.gold = goldBefore + GOLD_ADD;

  // ---- 2) Tính cấp đồ theo nhân vật ----
  const tierOf = () => {
    if (ITEM_TIER != null) return Math.min(10, Math.max(1, ITEM_TIER));
    const lvl = S.lvl || 1;
    return Math.min(10, Math.max(1, Math.floor(lvl / 20) + 1));
  };

  // ---- 3) Thêm đồ random (chỉ unshift lên đầu túi, KHÔNG xóa gì) ----
  const details = Object.keys(typeof J !== "undefined" && J.items ? J.items : {});
  const gained = [];
  for (const detail of details) {
    if (gained.length >= ITEM_COUNT) break;
    const rows = (J.items[detail] && J.items[detail].list) || [];
    if (!rows.length) continue;
    const particular = rows[0].k; // particular hợp lệ đầu tiên của slot
    const it = makeItem(Number(detail), particular, tierOf(), ITEM_MAGICS);
    if (it) {
      S.inv.unshift(it); // đẩy lên đầu túi (ưu tiên nhìn thấy)
      gained.push(it.n + " [" + it.d + "]");
    }
  }

  // ---- 4) Lưu + XÁC MINH chữ ký ----
  let ok = false;
  try {
    save();
    const now = localStorage.getItem(key);
    if (now) ok = !!(now && unpack(now) && unpack(now).ok);
  } catch (e) {
    console.error("save() lỗi:", e);
  }

  // ---- 5) Nếu save KHÔNG hợp lệ -> TỰ HOÀN TÁC về backup ----
  if (!ok && backupText) {
    try {
      localStorage.setItem(key, backupText);
      console.warn("⚠️ Save mới sai chữ ký — đã hoàn tác về trạng thái trước script.");
      if (typeof toast === "function") toast("Đã hoàn tác: save không hợp lệ");
    } catch (e) {
      console.error("Hoàn tác thất bại:", e);
    }
  }

  // ---- Báo cáo ----
  console.clear();
  console.log("%c✅ Đã thêm thành công (hoặc đã hoàn tác an toàn)", "color:#ffb347;font-size:16px;font-weight:bold");
  console.log(`Vàng: ${fmt ? fmt(goldBefore) : goldBefore} → ${fmt ? fmt(S.gold) : S.gold}`);
  console.log(`(+${GOLD_ADD.toLocaleString()} vàng)`);
  console.log(`Đồ mới: ${gained.length} món  |  Túi hiện: ${S.inv.length} món`);
  gained.slice(0, 8).forEach((n) => console.log("  •", n));
  if (gained.length > 8) console.log(`  …(+${gained.length - 8} món khác)`);
  console.log(ok ? "Chữ ký save: HỢP LỆ ✓" : "Chữ ký save: KHÔNG hợp lệ — đã hoàn tác.");
  console.log(
    "Ghi chú: mở tab Hành trang (Inv) để xem đồ. Để khôi phục thủ công: " +
      "localStorage.getItem('" + backupKey + "')"
  );
})();
