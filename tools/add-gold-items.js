// ============================================================================
// SCRIPT: Thêm vàng + đồ cho nhân vật (Vô Lâm Idle)
// Chạy trong DevTools console của tab Chrome NƠI NHÂN VẬT CỦA BẠN TỒN TẠI
//   (F12 -> tab Console -> paste -> Enter)
//
// - Vàng/đồ được thêm vào S (nhân vật đang mở) rồi gọi save().
// - save() tự tính lại chữ ký (hash) nên game KHÔNG báo "chỉnh sửa ngoài".
// - Đồ sinh bằng makeItem() (hàm có sẵn của game) -> đúng schema, rarity tự động.
// ============================================================================

(function () {
  "use strict";

  // ---- Cấu hình ----
  const GOLD_ADD = 10_000_000;          // số vàng thêm (10 triệu)
  const ITEM_COUNT = 15;                 // số món đồ random
  const ITEM_MAGICS = 4;                 // dòng ảo thuật: 3-4 -> rarity cao (tím)
  const ITEM_TIER = null;                // cấp đồ: null = tự tính theo cấp nhân vật

  if (typeof S === "undefined" || !S.fac) {
    alert("Chưa có nhân vật! Hãy tạo hoặc chọn nhân vật rồi mới chạy script.");
    return;
  }
  if (typeof makeItem !== "function") {
    alert("Game chưa load xong (thiếu makeItem). đợi trang load rồi chạy lại.");
    return;
  }

  // ---- 1) Thêm vàng ----
  const goldBefore = S.gold || 0;
  S.gold = goldBefore + GOLD_ADD;

  // ---- 2) Tính cấp đồ theo nhân vật ----
  const tierOf = () => {
    if (ITEM_TIER != null) return Math.min(10, Math.max(1, ITEM_TIER));
    const lvl = S.lvl || 1;
    return Math.min(10, Math.max(1, Math.floor(lvl / 20) + 1));
  };

  // ---- 3) Thêm đồ random từ makeItem ----
  // Duyệt qua các slot hợp lệ (J.items) để lấy đa dạng trang bị.
  const details = Object.keys(typeof J !== "undefined" && J.items ? J.items : {});
  const gained = [];
  let invFull = false;

  for (const detail of details) {
    if (gained.length >= ITEM_COUNT) break;
    const rows = (J.items[detail] && J.items[detail].list) || [];
    if (!rows.length) continue;
    const particular = rows[0].k; // particular hợp lệ đầu tiên của slot
    const it = makeItem(Number(detail), particular, tierOf(), ITEM_MAGICS);
    if (it) {
      // Đẩy lên đầu túi (ưu tiên nhìn thấy). Nếu túi đầy, thêm được bao nhiêu tùy.
      S.inv.unshift(it);
      gained.push(it.n + " [" + it.d + "]");
    }
  }

  // ---- 4) Lưu (tự tính hash) ----
  try {
    save();
  } catch (e) {
    console.error("save() lỗi:", e);
  }

  // ---- Báo cáo ----
  console.clear();
  console.log("%c✅ Đã thêm thành công!", "color:#ffb347;font-size:16px;font-weight:bold");
  console.log(`Vàng: ${fmt ? fmt(goldBefore) : goldBefore} → ${fmt ? fmt(S.gold) : S.gold}`);
  console.log(`(+${GOLD_ADD.toLocaleString()} vàng)`);
  console.log(`Đồ mới: ${gained.length} món`);
  gained.forEach((n) => console.log("  •", n));
  if (typeof toast === "function")
    toast(`+${(GOLD_ADD / 10000 | 0)} vạn vàng + ${gained.length} đồ`);
  console.log(
    "Ghi chú: mở tab Hành trang (Inv) để xem đồ. Nếu túi đầy, đồ nằm ở đầu danh sách."
  );
})();
