const scriptURL = "https://script.google.com/macros/s/AKfycbxFG3il4-dJYmV7iVQxsPfQc_ZZr8-YJ-oBGdmwnAVm5gatNhEy5xPMUN2EXJ0vegh5Xg/exec";
let dataCache = [];
let currentCategory = "all";

// --- LOAD DATA ---
async function loadData() {
  try {
    const res = await fetch(scriptURL);
    let data = await res.json();

    data = data.filter(r => r.nama && r.hrg && r.isi);
    data.sort((a,b) => String(a.nama).localeCompare(String(b.nama)));
    dataCache = data;

    renderTable(dataCache);
    renderCategoryButtons(dataCache);

  } catch (err) { console.error(err); }
}

// --- RENDER TABLE ---
function renderTable(list) {
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";

  const filtered = currentCategory === "all" ? list :
    list.filter(r => (r.kategori||"").toLowerCase() === currentCategory);

  filtered.forEach((row, i) => {
    const pcs = Math.round(Number(row.hrg)/Number(row.isi));
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td class="td-nama">${row.nama}</td>
      <td class="td-harga">${Number(row.hrg).toLocaleString('id-ID')}</td>
      <td class="td-isi">${Number(row.isi).toLocaleString('id-ID')}</td>
      <td class="td-pcs">${pcs.toLocaleString('id-ID')}</td>
      <td class="td-kategori">${row.kategori}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- CATEGORY BUTTONS ---
const filterKategori = document.getElementById("filterKategori");

function populateKategoriDropdown() {
  const kategoriSet = new Set(dataCache.map(row => row.kategori).filter(k => k));
  filterKategori.innerHTML = '<option value="">Semua</option>';
  kategoriSet.forEach(k => {
    const option = document.createElement("option");
    option.value = k;
    option.textContent = k;
    filterKategori.appendChild(option);
  });
}

async function loadData() {
  try {
    const res = await fetch(scriptURL);
    let data = await res.json();
    data = data.filter(row => row.nama && row.hrg && row.isi);
    data.sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
    dataCache = data;
    renderTable(dataCache);
    populateKategoriDropdown(); // isi dropdown kategori
  } catch (err) {
    console.error("Gagal memuat data:", err);
  }
}

filterKategori.addEventListener("change", () => {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const selectedKategori = filterKategori.value;
  
  const filtered = dataCache.filter(row => {
    const nama = row.nama ? String(row.nama).toLowerCase() : "";
    const kategori = row.kategori ? String(row.kategori) : "";
    const matchKeyword = nama.includes(keyword) || kategori.toLowerCase().includes(keyword);
    const matchKategori = !selectedKategori || kategori === selectedKategori;
    return matchKeyword && matchKategori;
  });

  renderTable(filtered);
});


// --- POPUP MODAL ---
const modal = document.getElementById("dataModal");
const addBtn = document.getElementById("addBtn");
const closeBtn = modal.querySelector(".close");

addBtn.onclick = () => modal.style.display = "block";
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if(e.target==modal) modal.style.display="none"; };

// --- SUBMIT FORM ---
document.getElementById("dataForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  btn.textContent = "Mengirim…";

  const payload = {
    nama: document.getElementById("nama").value.trim(),
    hrg: Number(document.getElementById("hrg").value),
    isi: Number(document.getElementById("isi").value),
    kategori: document.getElementById("kategori").value.trim()
  };

  try {
    await fetch(scriptURL,{method:"POST",body:JSON.stringify(payload)});
    dataCache.push(payload);
    dataCache.sort((a,b)=>String(a.nama).localeCompare(String(b.nama)));
    renderTable(dataCache);
    highlightNewRow(payload.nama);
    e.target.reset();
    modal.style.display = "none";
  } catch(err){
    console.error(err);
    alert("❌ Gagal kirim data");
  } finally {
    btn.disabled=false;
    btn.textContent="Kirim Data";
  }
});

// --- HIGHLIGHT NEW ROW ---
function highlightNewRow(nama){
  const rows = document.querySelectorAll("#dataTable tbody tr");
  for(const row of rows){
    if(row.children[1].textContent===nama){
      row.classList.add("new-row");
      setTimeout(()=>row.classList.remove("new-row"),3000);
      break;
    }
  }
}

// --- SEARCH ---
document.getElementById("searchInput").addEventListener("input", ()=>{
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const filtered = dataCache.filter(row=>{
    const nama = row.nama?String(row.nama).toLowerCase():"";
    const kat = row.kategori?String(row.kategori).toLowerCase():"";
    return nama.includes(keyword)||kat.includes(keyword);
  });
  renderTable(filtered);
});

loadData();
