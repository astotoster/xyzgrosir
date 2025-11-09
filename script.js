const scriptURL = "https://script.google.com/macros/s/AKfycbzjWjdmlCZJTDRfMZ4FiVfpWI5Pt3UapZUHbXVwNQm1h-yiPru6_6bjH70rNzbglgKq/exec";
let dataCache = [];
let currentCategory = "all";
let displayedData = [];

// Ambil elemen loading
const loadingIndicator = document.getElementById("loadingIndicator");

// Fungsi untuk menampilkan loading
function showLoading() {
  if (loadingIndicator) {
    loadingIndicator.classList.remove("hidden");
  }
}

// Fungsi untuk menyembunyikan loading
function hideLoading() {
  if (loadingIndicator) {
    loadingIndicator.classList.add("hidden");
  }
}

// --- LOAD DATA ---
async function loadData() {
  try {
    const res = await fetch(scriptURL);
    let data = await res.json();

    data = data.filter(r => r.nama && r.hrg && r.isi);
    data.sort((a,b) => String(a.nama).localeCompare(String(b.nama)));
    dataCache = data;

    renderTable(dataCache);
    populateKategoriDropdown();

    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      // 2. Sembunyikan loading, terlepas dari hasil try/catch
      hideLoading();  
    }
}

// --- RENDER TABLE ---
function renderTable(list) {
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";

  const filtered = currentCategory === "all" ? list :
    list.filter(r => (r.kategori||"").toLowerCase() === currentCategory);

  // ⭐ BARU: Simpan data yang difilter ke displayedData
  displayedData = filtered;

  // Ubah list menjadi displayedData
  displayedData.forEach((row, index) => { // Gunakan 'index' dari displayedData
    const pcs = Math.round(Number(row.hrg)/Number(row.isi));
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="td-nama">${row.nama}</td>
      <td class="td-harga">${Number(row.hrg).toLocaleString('id-ID')}</td>
      <td class="td-isi">${Number(row.isi).toLocaleString('id-ID')}</td>
      <td class="td-pcs">${pcs.toLocaleString('id-ID')}</td>
      <td class="td-kategori">${row.kategori}</td>
    `;
    
    // ⭐ PENTING: Gunakan index dari displayedData, ini sudah benar
    tr.addEventListener("click", () => openEditModal(index));
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

// --POP UP MODAL EDIT HARGA--
let selectedIndex = null;

// --- RENDER TABLE --- (Ini adalah fungsi yang harus dipertahankan)
function renderTable(list) {
  const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

  const filtered = currentCategory === "all" ? list :
    list.filter(r => (r.kategori||"").toLowerCase() === currentCategory);

  // ⭐ KUNCI: Simpan data yang difilter ke displayedData
  displayedData = filtered;

  // Gunakan displayedData untuk looping
  displayedData.forEach((row, index) => { 
    const pcs = Math.round(Number(row.hrg)/Number(row.isi));
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="td-nama">${row.nama}</td>
      <td class="td-harga">${Number(row.hrg).toLocaleString('id-ID')}</td>
      <td class="td-isi">${Number(row.isi).toLocaleString('id-ID')}</td>
      <td class="td-pcs">${pcs.toLocaleString('id-ID')}</td>
      <td class="td-kategori">${row.kategori}</td>
    `;

    // ⭐ KUNCI: Event listener harus ada di sini
    tr.addEventListener("click", () => openEditModal(index));
    tbody.appendChild(tr);
});
}


// Buka modal dan isi dengan harga saat ini
function openEditModal(index) {
  selectedIndex = index;
  // ⭐ UBAH: Ambil data dari displayedData
  const item = displayedData[index]; 
  
  // Pastikan item ada
  if (!item) return;

  document.getElementById("displayNama").textContent = item.nama;
  document.getElementById("displayHrg").textContent = Number(item.hrg).toLocaleString('id-ID');
  document.getElementById("displayIsi").textContent = Number(item.isi).toLocaleString('id-ID');
  // Catatan: Anda tidak menyimpan 'pcs' di dataCache. Hitung ulang jika perlu,
  // atau ambil nilai pcs yang sudah dihitung jika ada. Karena Anda tidak menyimpannya
  // di dataCache, hitungan pcs mungkin perlu disesuaikan di sini.
  const pcs = Math.round(Number(item.hrg) / Number(item.isi));
  document.getElementById("displayPcs").textContent = pcs.toLocaleString('id-ID'); 
  document.getElementById("displayKategori").textContent = item.kategori;

  document.getElementById("editHrg").value = Number(item.hrg); // Nilai untuk input harus berupa angka mentah (tanpa toLocaleString)
  document.getElementById("editModal").style.display = "flex";
}

// Tutup modal
function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

// Tombol Simpan Edit
document.getElementById("saveEditBtn").addEventListener("click", async () => {
  const newHarga = Number(document.getElementById("editHrg").value);
  if (!newHarga || newHarga <= 0) return alert("Isi harga dengan benar!");

  // 1. Ambil data item saat ini dari displayedData
  const itemToUpdate = displayedData[selectedIndex];
  if (!itemToUpdate) return;
  
  // 2. Cari index item ini di dataCache (data mentah) menggunakan nama
  const cacheIndex = dataCache.findIndex(row => row.nama === itemToUpdate.nama);

  if (cacheIndex !== -1) {
      // 3. Perbarui hrg di dataCache (data mentah)
      dataCache[cacheIndex].hrg = newHarga;
  }
  
  // 4. Render ulang tabel
  // Catatan: Karena Anda sudah memfilter, renderTable(dataCache)
  // akan menggunakan dataCache yang sudah diubah, tetapi tetap
  // menampilkan data yang difilter.
  
  // ⭐ PENTING: Panggil renderTable dengan dataCache untuk refresh tampilan yang difilter
  renderTable(dataCache); 
  
  // Highlight row yang di-edit (perlu diperbaiki agar menggunakan displayedData)
  // highlightNewRow(itemToUpdate.nama); 

  // Kirim update ke server (menggunakan nama untuk identifikasi)
  await fetch(scriptURL, {
    method: "POST",
    body: JSON.stringify({
      nama: itemToUpdate.nama, // Kirim nama item yang di-edit
      hrg: newHarga,
      isi: itemToUpdate.isi,
      kategori: itemToUpdate.kategori,
      update: true
    })
  });

  closeEditModal();
});

// ⭐ TAMBAHAN UNTUK MENUTUP MODAL JIKA KLIK DI LUAR AREA KONTEN ⭐
document.getElementById("editModal").addEventListener("click", function(event) {
    // Jika target klik adalah elemen modal itu sendiri (area backdrop)
    if (event.target === this) {
        closeEditModal();
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

// 3. Panggil loadData saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', loadData);