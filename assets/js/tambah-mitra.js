const TM_KEY = "tambahMitra";
function getTM() {
  return JSON.parse(localStorage.getItem(TM_KEY)) || [];
}
function saveTM(d) {
  localStorage.setItem(TM_KEY, JSON.stringify(d));
}
function renderTM() {
  const tb = document.getElementById("tambahMitraBody");
  if (!tb) return;
  tb.innerHTML = "";
  getTM().forEach((v, i) => {
    tb.innerHTML += `
    <tr>
      <td class="border px-3 py-2 text-center">${i + 1}</td>
      <td class="border px-3 py-2">${v}</td>
      <td class="border px-3 py-2 text-center">
        <button onclick="editTM(${i})">✏️</button>
        <button onclick="deleteTM(${i})">🗑️</button>
      </td>
    </tr>`;
  });
}
function openTambahMitra() {
  tambahMitraIndex.value = "";
  tambahMitraNama.value = "";
  tambahMitraModal.classList.remove("hidden");
}
function closeTambahMitra() {
  tambahMitraModal.classList.add("hidden");
}
function saveTambahMitra() {
  const d = getTM(),
    i = tambahMitraIndex.value;
  if (i === "") d.push(tambahMitraNama.value);
  else d[i] = tambahMitraNama.value;
  saveTM(d);
  closeTambahMitra();
  renderTM();
}
function editTM(i) {
  tambahMitraIndex.value = i;
  tambahMitraNama.value = getTM()[i];
  tambahMitraModal.classList.remove("hidden");
}
function deleteTM(i) {
  if (!confirm("Hapus?")) return;
  const d = getTM();
  d.splice(i, 1);
  saveTM(d);
  renderTM();
}
function initTambahMitra() {
  window.tambahMitraModal = document.getElementById("tambahMitraModal");
  window.tambahMitraIndex = document.getElementById("tambahMitraIndex");
  window.tambahMitraNama = document.getElementById("tambahMitraNama");
  renderTM();
}
