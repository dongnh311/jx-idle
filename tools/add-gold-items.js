// ============================================================================
// SCRIPT: Bonus nhân vật (Vô Lâm Idle) — BẢN AN TOÀN
// Chạy trong DevTools console của tab Chrome NƠI NHÂN VẬT CỦA BẠN TỒN TẠI
//   (F12 -> tab Console -> paste -> Enter)
//
// Làm được:
//   - Nâng level nhân vật lên TARGET_LEVEL (mặc định 150; MAX_LEVEL = 200).
//   - Thêm KNB (S.knb).
//   - Thêm vàng (S.gold).
//   - Thêm 1 BẠCH KIM BỘ (platina set) — toàn bộ món cùng bộ (grp).
//   - Thêm 1 con ngựa Phiêu Vũ (trang bị ngựa, thuộc tính được tăng cường).
//
// ĐẢM BẢO KHÔNG XÓA DỮ LIỆU:
//   1) Backup toàn bộ save hiện tại vào key RIÊNG (_preScript) — sống sót cả
//      khi "Xóa nhân vật" (deleteSlot chỉ xóa key save + _bak).
//   2) Chỉ thêm, KHÔNG bao giờ giảm/xóa bất cứ gì.
//   3) Sau save(), KIỂM TRA chữ ký (unpack().ok). Nếu sai -> TỰ HOÀN TÁC.
//   4) Chặn chạy trên nhân vật rỗng (S.fac null).
//
// Đồ sinh bằng makeItem()/makeSetItem() (hàm có sẵn của game) -> đúng schema.
// save() tự tính lại hash nên game KHÔNG báo "chỉnh sửa ngoài".
// ============================================================================

(function () {
  "use strict";

  // ---- Cấu hình ----
  const TARGET_LEVEL = 150;       // level mục tiêu (MAX_LEVEL = 200)
  const GOLD_ADD = 10_000_000;    // vàng thêm (10 triệu)
  const KNB_ADD = 10_000;         // KNB thêm
  const ATTPTS_ADD = 1500;        // điểm tiềm năng (thuộc tính) thêm
  const SKPTS_ADD = 150;          // điểm kỹ năng thêm
  const SET_GRP = 21;             // bộ [Thiên Tứ] Ma Sát (bạch kim)
  const SET_PREFIX = "[Thiên Tứ]";// ưu tiên tiền tố bộ muốn lấy
  const HORSE_NAME = "Phiêu Vũ";  // tên ngựa
  const HORSE_TIER = 10;          // cấp ngựa
  const HORSE_BOOST = 6;          // hệ số tăng thuộc tính ngựa

  // ---- Guard: phải có nhân vật THẬT ----
  if (typeof S === "undefined" || !S.fac) {
    alert(
      "Chưa có nhân vật thật!\n\n" +
        "Hãy tạo/chọn nhân vật rồi chạy lại.\n" +
        "Script KHÔNG xóa gì, nhưng cũng không thêm vào nhân vật rỗng."
    );
    return;
  }
  if (typeof makeItem !== "function" || typeof makeSetItem !== "function") {
    alert("Game chưa load xong (thiếu makeItem/makeSetItem). đợi trang load rồi chạy lại.");
    return;
  }

  const key = typeof saveKey === "function" ? saveKey() : "jxidle_1";
  const backupKey = key + "_preScript";
  let backupText = null;

  // ---- 0) BACK UP an toàn trước khi sửa đổi ----
  try {
    if (typeof save === "function") save(); // đảm bảo _bak chứa state thật
    const cur = localStorage.getItem(key);
    if (cur) { backupText = cur; localStorage.setItem(backupKey, cur); }
  } catch (e) { console.warn("Không lưu được backup:", e); }

  // ---- Đảm bảo chế độ cho phép bạch kim/hàng kim (g2) ----
  // Nếu slot đang ở CTC/PHLT (không có Bạch Kim) thì makeSetItem("platina") trả null.
  try { S.mode = "g2"; } catch (e) {}

  // ---- 1) Level ----
  const lvlBefore = S.lvl || 1;
  S.lvl = TARGET_LEVEL;

  // ---- 2) KNB ----
  const knbBefore = S.knb || 0;
  S.knb = knbBefore + KNB_ADD;

  // ---- 3a) Điểm tiềm năng (thuộc tính) ----
  const attBefore = S.attrPts || 0;
  S.attrPts = attBefore + ATTPTS_ADD;

  // ---- 3b) Điểm kỹ năng ----
  const skBefore = S.skPts || 0;
  S.skPts = skBefore + SKPTS_ADD;

  // ---- 3) Vàng ----
  const goldBefore = S.gold || 0;
  S.gold = goldBefore + GOLD_ADD;

  // ---- 4) Bạch kim bộ [Thiên Tứ] Ma Sát (grp 21) ----
  function buildSet() {
    const all = (typeof J !== "undefined" && J.sets && J.sets.platina) || [];
    const rows = all.filter((r) => r.grp === SET_GRP && (r.n || "").indexOf("Ma Sát") >= 0);
    const bySlot = new Map();
    for (const r of rows) {
      const ex = bySlot.get(r.d);
      if (!ex) bySlot.set(r.d, r);
      else if ((r.n || "").startsWith(SET_PREFIX) && !(ex.n || "").startsWith(SET_PREFIX)) bySlot.set(r.d, r);
    }
    const items = [];
    for (const row of bySlot.values()) {
      try {
        const it = makeSetItem("platina", row, 10); // luck=10 -> dòng ảo thuật tối đa
        if (it) items.push(it);
      } catch (e) { console.error("Làm món bộ thất bại:", e); }
    }
    return items;
  }
  const setItems = buildSet();

  // ---- 5) Ngựa Phiêu Vũ (tăng thuộc tính) ----
  function buildHorse() {
    let h;
    try { h = makeItem(10, 0, HORSE_TIER, 4); } catch (e) { return null; }
    if (!h) return null;
    h.n = HORSE_NAME;
    if (Array.isArray(h.base)) {
      for (const line of h.base) {
        line[1] *= HORSE_BOOST; line[2] *= HORSE_BOOST; // min,max
        if (line[0] === 150) { line[1] = Math.abs(line[1]); line[2] = Math.abs(line[2]); } // phòng thủ dương
      }
    }
    h.r = 2; // tím — hiển thị cao cấp
    return h;
  }
  const horse = buildHorse();

  // ---- Đẩy vào túi ----
  const gained = [];
  setItems.forEach((it) => { S.inv.unshift(it); gained.push("Bộ " + it.n); });
  if (horse) { S.inv.unshift(horse); gained.push("Ngựa " + horse.n + " (cấp " + horse.lvl + ")"); }

  // ---- 6) Lưu + XÁC MINH chữ ký ----
  let ok = false;
  try {
    save();
    const now = localStorage.getItem(key);
    if (now) ok = !!(now && unpack(now) && unpack(now).ok);
  } catch (e) { console.error("save() lỗi:", e); }

  // ---- 7) Nếu save KHÔNG hợp lệ -> TỰ HOÀN TÁC ----
  if (!ok && backupText) {
    try {
      localStorage.setItem(key, backupText);
      console.warn("⚠️ Save sai chữ ký — đã hoàn tác.");
      if (typeof toast === "function") toast("Đã hoàn tác: save không hợp lệ");
    } catch (e) { console.error("Hoàn tác thất bại:", e); }
  }

  // ---- Báo cáo ----
  console.clear();
  console.log("%c✅ Thêm thành công (hoặc hoàn tác an toàn)", "color:#ffb347;font-size:16px;font-weight:bold");
  console.log(`Cấp: ${lvlBefore} → ${S.lvl}  (MAX=${typeof MAX_LEVEL !== "undefined" ? MAX_LEVEL : "?"})`);
  console.log(`KNB: ${fmt ? fmt(knbBefore) : knbBefore} → ${fmt ? fmt(S.knb) : S.knb}  (+${KNB_ADD})`);
  console.log(`Vàng: ${fmt ? fmt(goldBefore) : goldBefore} → ${fmt ? fmt(S.gold) : S.gold}  (+${GOLD_ADD.toLocaleString()})`);
  console.log(`Điểm tiềm năng: ${attBefore} → ${S.attrPts}  (+${ATTPTS_ADD})`);
  console.log(`Điểm kỹ năng: ${skBefore} → ${S.skPts}  (+${SKPTS_ADD})`);
  console.log(`Bạch kim bộ [Thiên Tứ] Ma Sát: ${setItems.length} món`);
  setItems.forEach((it) => console.log("  •", it.n));
  if (horse) console.log("  • Ngựa " + horse.n + " — " + (horse.base ? horse.base.length : 0) + " thuộc tính");
  console.log(`Túi hiện: ${S.inv.length} món  |  Chữ ký save: ${ok ? "HỢP LỆ ✓" : "KHÔNG hợp lệ — đã hoàn tác."}`);
  console.log("Để khôi phục thủ công: localStorage.getItem('" + backupKey + "')");
})();
