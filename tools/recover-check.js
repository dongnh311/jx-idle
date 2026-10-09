// ============================================================================
// SCRIPT: Kiểm tra + khôi phục nhân vật (Vô Lâm Idle - pages.dev)
// Chạy trong DevTools console của tab Chrome BẠN ĐANG CHƠI trên https://volamidle.pages.dev/
//   (F12 -> tab Console -> paste -> Enter)
//
// Script này CHỈ ĐỌC, KHÔNG sửa/xóa gì. Nó báo cho bạn biết:
//   1) Bạn có đang đăng nhập online (Supabase) không? -> nếu có, nhân vật nằm trên đám mây.
//   2) localStorage còn save / _bak không? -> còn thì khôi phục được.
//   3) Có thể khôi phục bằng cách nào.
// ============================================================================

(function () {
  "use strict";
  console.clear();
  console.log("%c🔍 Đang kiểm tra trạng thái nhân vật...", "color:#ffb347;font-size:15px;font-weight:bold");

  // 1) Đăng Trực online (Supabase) ?
  let loggedIn = false, loginDetail = "";
  try {
    if (typeof NET !== "undefined" && NET.user) {
      loggedIn = true;
      loginDetail = "Tài khoản: " + (NET.user.name || NET.user.id || "unknown");
    } else if (typeof netOn === "function" && netOn()) {
      loginDetail = "Online đã bật, nhưng chưa đăng nhập (NET.user rỗng).";
    } else {
      loginDetail = "Online chưa bật.";
    }
  } catch (e) { loginDetail = "Không đọc được trạng thái online: " + e.message; }

  // 2) localStorage: save keys + _bak
  const saves = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k === "jxidle_cid" || k === "jxidle_slot" || k === "jxidle_ptr") continue;
    const v = localStorage.getItem(k);
    if (/^jxidle_/.test(k) || k === "jxidle") {
      let short = v;
      if (short.length > 80) short = short.slice(0, 80) + "…(" + v.length + " chars)";
      saves.push({ k, v: short });
    }
  }

  console.log("\n%c— Đăng nhập online —", "color:#4fc3f7;font-weight:bold");
  console.log(loggedIn ? "✅ ĐÃ đăng nhập online (" + loginDetail + ")" : "❌ Chưa đăng nhập online");
  console.log(loginDetail);

  console.log("\n%c— Lưu cục bộ (localStorage) —", "color:#4fc3f7;font-weight:bold");
  if (!saves.length) {
    console.log("⚠️ KHÔNG có key lưu nào trong localStorage (đã bị xóa/trống).");
  } else {
    saves.forEach((s) => console.log("•", s.k, "=>", s.v));
  }

  // 3) Nhân vật hiện tại (S)
  try {
    console.log("\n%c— Nhân vật đang active (S) —", "color:#4fc3f7;font-weight:bold");
    console.log("Tên: " + (S && S.name) + " | Phái: " + (S && S.fac) + " | Cấp: " + (S && S.lvl) +
      " | Vàng: " + (S && S.gold) + " | Túi: " + (S && S.inv ? S.inv.length : "?") +
      " | Có fac: " + !!(S && S.fac));
  } catch (e) { console.log("Không đọc được S: " + e.message); }

  // 4) Kết luận khôi phục
  console.log("\n%c— Có khôi phục được không? —", "color:#ffb347;font-weight:bold");
  if (loggedIn) {
    console.log("✅ CƠ HỘI CAO: Bạn đã đăng nhập online. Nhân vật có thể trên đám mây Supabase.");
    console.log("   → Đăng xuất rồi đăng nhập lại cùng tài khoản. Game sẽ sync nhân vật về tự động.");
  } else if (saves.some((s) => s.k.includes("_bak"))) {
    console.log("✅ Có bản lưu _bak. Mở tab Hành trang hoặc reload trang — game sẽ dùng _bak nếu save chính sai chữ ký.");
  } else if (saves.length) {
    console.log("✅ Còn save cục bộ. Chỉ cần reload trang (F5) — game sẽ nạp lại.");
  } else {
    console.log("⚠️ localStorage TRỐNG, chưa đăng online, không có _bak.");
    console.log("   → Nhân vật cục bộ đã mất. Chỉ còn 2 cách:");
    console.log("      a) Nếu từng đăng online: đăng nhập lại để sync từ đám mây.");
    console.log("      b) Nếu từng 'Xuất lưu' (tab Dữ liệu) và lưu file .jxsave: nạp lại file đó.");
    console.log("      c) Không còn cách nào -> chơi lại từ đầu.");
  }

  console.log("\n%cGhi chú: Script này chỉ đọc, an toàn. Không xóa dữ liệu.", "color:#999");
})();
