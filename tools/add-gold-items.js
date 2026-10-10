// ============================================================================
// SCRIPT: Bonus nhân vật (Vô Lâm Idle - volamidle.pages.dev) — BẢN AN TOÀN v2
// Chạy trong DevTools console của tab Chrome NƠI NHÂN VẬT CỦA BẠN TỒN TẠI
//   (F12 -> Console -> paste -> Enter; nên lưu vào Snippets để chạy lại)
//
// Làm được:
//   - Nâng level nhân vật lên TARGET_LEVEL (mặc định 150; MAX_LEVEL = 200).
//   - Thêm KNB, vàng, điểm tiềm năng (attrPts), điểm kỹ năng (skPts).
//   - Thêm ĐÚNG 2 món: thương + giáp bạch kim [Thiên Tứ] Ma Sát (grp 21).
//   - DỌN DẠC leftovers từ script cũ: ngựa "Phiêu Vũ" tự chế + các món
//     Ma Sát còn lại (đai/nhẫn/uyển) — nếu còn nằm trong hành trang.
//   - Xóa field S.mode="g2" do script cũ ghi bậy (live game không có mode g2).
//
// VÌ SAO BẢN CŨ BỊ RESET DATA (đã kiểm tra source live v527):
//   - Live game validate TỪNG món trong save ở mỗi lần load (save.js →
//     migrate(): setNoData / setRepair / goneConvert / eqRemoved / eqBanned).
//     Món không thuộc bảng dữ liệu live → bị purge.
//   - load() có `catch { S = newSave() }`: chỉ một món lỗi làm migrate()
//     ném exception giữa chừng → XÓA TOÀN BỘ NHÂN VẬT. Ngựa tự chế
//     "Phiêu Vũ" (không có trong J.items[10].list live) chính là thủ nghi.
//   - Do đó: bản này KHÔNG tự chế object lai, và trước khi thêm món nào
//     đều hỏi chính validator của game (itemGone/eqRemoved/eqBanned/setNoData)
//     — game nói "món đã xóa khỏi game" thì KHÔNG thêm.
//
// ĐẢM BẢO: backup _preScript, chỉ thêm không giảm, kiểm chữ ký sau save,
// tự hoàn tác, và netUpload() đẩy lên cloud ngay (kẻo bản cloud cũ đè xuống).
// ============================================================================

(async function () {
  "use strict";

  // ---- Cấu hình ----
  const TARGET_LEVEL = 150;       // level mục tiêu (MAX_LEVEL = 200)
  const GOLD_ADD = 10_000_000;    // vàng thêm (10 triệu)
  const KNB_ADD = 10_000;         // KNB thêm
  const ATTPTS_ADD = 1000;        // điểm tiềm năng (thuộc tính) thêm
  const SKPTS_ADD = 300;          // điểm kỹ năng thêm
  const SET_GRP = 21;             // bộ [Thiên Tứ] Ma Sát (bạch kim)
  const SET_KEEP_D = [0, 2];      // chỉ 2 slot: 0 = thương, 2 = giáp

  // ---- Guard: phải có nhân vật THẬT ----
  if (typeof S === "undefined" || !S.fac) {
    alert(
      "Chưa có nhân vật thật!\n\n" +
        "Hãy tạo/chọn nhân vật rồi chạy lại.\n" +
        "Script KHÔNG xóa gì, nhưng cũng không thêm vào nhân vật rỗng."
    );
    return;
  }
  if (typeof makeSetItem !== "function") {
    alert("Game chưa load xong (thiếu makeSetItem). Đợi trang load rồi chạy lại.");
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

  // ---- 1) Level ----
  const lvlBefore = S.lvl || 1;
  S.lvl = TARGET_LEVEL;

  // ---- 2) KNB ----
  const knbBefore = S.knb || 0;
  S.knb = knbBefore + KNB_ADD;

  // ---- 3) Điểm tiềm năng + điểm kỹ năng ----
  const attBefore = S.attrPts || 0;
  S.attrPts = attBefore + ATTPTS_ADD;
  const skBefore = S.skPts || 0;
  S.skPts = skBefore + SKPTS_ADD;

  // ---- 4) Vàng ----
  const goldBefore = S.gold || 0;
  S.gold = goldBefore + GOLD_ADD;

  // ---- 5) DỌN leftovers từ script cũ (an toàn: chỉ xóa thứ script cũ thêm) ----
  const removed = [];
  const isScriptHorse = (it) => it && it.d === 10 && it.n === "Phiêu Vũ";
  const isExtraMaSat = (it) =>
    it && it.set && it.set.kind === "platina" && it.set.grp === SET_GRP &&
    !SET_KEEP_D.includes(it.d);
  const junk = (it) => isScriptHorse(it) || isExtraMaSat(it);
  S.inv = (S.inv || []).filter((it) => {
    if (junk(it)) { removed.push(it.n); return false; }
    return true;
  });
  for (const slot of Object.keys(S.eq || {})) {
    if (junk(S.eq[slot])) { removed.push(S.eq[slot].n); delete S.eq[slot]; }
  }
  // Xóa field mode "g2" do script cũ ghi bậy (live game không có mode này)
  if (S.mode === "g2") { delete S.mode; removed.push("(xóa mode g2 sai)"); }

  // ---- 6) Sinh 2 món thương + giáp, KIỂM bằng validator của game ----
  // itemGone / eqRemoved / eqBanned / setNoData là hàm thật của game (sets.js,
  // setfix.js) — dùng chúng để chắc chắn món game KHÔNG purge khi load lại.
  const itemRejected = (it) => {
    try {
      if (typeof itemGone === "function" && itemGone(it)) return true;
      if (typeof eqRemoved === "function" && eqRemoved(it)) return true;
      if (typeof eqBanned === "function" && eqBanned(it)) return true;
      if (typeof setNoData === "function" && setNoData(it)) return true;
      return false;
    } catch (e) { return true; } // chính validator còn lỗi với món này -> bỏ
  };
  const alreadyHas = (name) =>
    (S.inv || []).some((it) => it && it.n === name) ||
    Object.values(S.eq || {}).some((it) => it && it.n === name);

  const rows = ((typeof J !== "undefined" && J.sets && J.sets.platina) || [])
    .filter((r) => r.grp === SET_GRP && SET_KEEP_D.includes(r.d) &&
      (r.n || "").startsWith("[Thiên Tứ]") && (r.n || "").includes("Ma Sát"));
  const bySlot = new Map();
  for (const r of rows) if (!bySlot.has(r.d)) bySlot.set(r.d, r);

  const setItems = [];
  const skipped = [];
  for (const row of bySlot.values()) {
    if (alreadyHas(row.n)) { skipped.push(row.n + " (đã có)"); continue; }
    let it = null;
    try { it = makeSetItem("platina", row, 6); } catch (e) { console.error("makeSetItem lỗi:", e); }
    if (!it) { skipped.push(row.n + " (makeSetItem trả null)"); continue; }
    if (itemRejected(it)) { skipped.push(row.n + " (game coi là đồ đã xóa — KHÔNG thêm)"); continue; }
    setItems.push(it);
  }

  // ---- Đẩy vào túi ----
  const gained = [];
  setItems.forEach((it) => { S.inv.unshift(it); gained.push(it.n); });

  // ---- 7) Lưu + XÁC MINH chữ ký ----
  let ok = false;
  try {
    save();
    const now = localStorage.getItem(key);
    if (now) ok = !!(now && unpack(now) && unpack(now).ok);
  } catch (e) { console.error("save() lỗi:", e); }

  // ---- 8) Nếu save KHÔNG hợp lệ -> TỰ HOÀN TÁC ----
  if (!ok && backupText) {
    try {
      localStorage.setItem(key, backupText);
      console.warn("⚠️ Save sai chữ ký — đã hoàn tác.");
      if (typeof toast === "function") toast("Đã hoàn tác: save không hợp lệ");
    } catch (e) { console.error("Hoàn tác thất bại:", e); }
  }

  // ---- 9) Đẩy lên cloud NGAY (nếu đang đăng nhập online) ----
  let cloudMsg = "";
  if (ok) {
    try {
      if (typeof NET !== "undefined" && NET.user && typeof netUpload === "function") {
        await netUpload();
        cloudMsg = "☁️ Đã lưu lên cloud (Supabase) — sẽ KHÔNG bị bản cloud cũ đè xuống.";
      } else {
        cloudMsg = "ℹ️ Chưa đăng nhập online — changes chỉ nằm ở localStorage.";
      }
    } catch (e) {
      cloudMsg = "⚠️ KHÔNG đẩy được lên cloud: " + (e && e.message ? e.message : e) +
        "\n   → SAI: vào tab 🌐 Tài khoản bấm \"Lưu lên đám mây\" NGAY," +
        "\n     nếu không game sẽ kéo bản cloud cũ về đè.";
    }
  } else {
    cloudMsg = "ℹ️ Save không hợp lệ, đã hoàn tác — không đẩy cloud.";
  }

  // ---- Báo cáo ----
  console.clear();
  console.log("%c✅ Thêm thành công (hoặc hoàn tác an toàn)", "color:#ffb347;font-size:16px;font-weight:bold");
  console.log(`Cấp: ${lvlBefore} → ${S.lvl}  (MAX=${typeof MAX_LEVEL !== "undefined" ? MAX_LEVEL : "?"})`);
  console.log(`KNB: ${knbBefore} → ${S.knb}  (+${KNB_ADD})`);
  console.log(`Vàng: ${goldBefore} → ${S.gold}  (+${GOLD_ADD.toLocaleString()})`);
  console.log(`Điểm tiềm năng: ${attBefore} → ${S.attrPts}  (+${ATTPTS_ADD})`);
  console.log(`Điểm kỹ năng: ${skBefore} → ${S.skPts}  (+${SKPTS_ADD})`);
  console.log(`Thêm ${setItems.length} món:`, gained.join(" | ") || "(không)");
  if (skipped.length) console.log("Bỏ qua:", skipped.join(" | "));
  if (removed.length) console.log(`Dọn ${removed.length} leftovers:`, removed.join(" | "));
  console.log(`Túi hiện: ${S.inv.length} món  |  Chữ ký save: ${ok ? "HỢP LỆ ✓" : "KHÔNG hợp lệ — đã hoàn tác."}`);
  console.log(cloudMsg);
  console.log("Để khôi phục thủ công: localStorage.getItem('" + backupKey + "')");
})();
