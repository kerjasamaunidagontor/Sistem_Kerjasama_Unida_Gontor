/* ===============================
   GLOBAL API CONFIG
=============================== */
window.API_BASE =
  "https://script.google.com/macros/s/AKfycbwtE5ogheySQt3ddSjHlUf1y85jJw7shVUHgS4-K5wWKUozqUlcDWzhbhPfd4Xwnmas/exec";

window.API = {
  kerjasama: `${window.API_BASE}?sheet=INPUT%20KERJASAMA`,
  kegiatan: `${window.API_BASE}?sheet=INPUT%20KEGIATAN`,
  pendanaan: `${window.API_BASE}?sheet=PENDANAAN`,
  prodi: `${window.API_BASE}?sheet=PRODISATKER`,
  fakultas: `${window.API_BASE}?sheet=FAKULTASSATKER`,
  auth: window.API_BASE,
  // 🔥 TAMBAHKAN INI
  template: `${window.API_BASE}?sheet=TEMPLATE`
};
