const scriptURL = "https://script.google.com/macros/s/AKfycbzjWjdmlCZJTDRfMZ4FiVfpWI5Pt3UapZUHbXVwNQm1h-yiPru6_6bjH70rNzbglgKq/exec";
let dataCache = [];
let currentCategory = "all";
let displayedData = [];

let isAdmin = false; // Default: Belum login

const confirmModal = document.getElementById("customConfirmModal");
const confirmOkBtn = document.getElementById("confirmOkBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");
const confirmMessage = document.getElementById("confirmMessage");
const confirmTitle = document.getElementById("confirmTitle");

/**
 * Menampilkan modal konfirmasi kustom.
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {function} callbackOk - Fungsi yang dijalankan jika user menekan OK.
 * @param {string} title - Judul modal (opsional).
 */
function showCustomConfirm(message, callbackOk, title = "Konfirmasi") {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmModal.style.display = 'flex'; // Tampilkan modal

    // Hapus event listener sebelumnya (agar tidak menumpuk)
    confirmOkBtn.replaceWith(confirmOkBtn.cloneNode(true));
    confirmCancelBtn.replaceWith(confirmCancelBtn.cloneNode(true));
    
    // Ambil ulang referensi tombol setelah clone (penting!)
    const newConfirmOkBtn = document.getElementById("confirmOkBtn");
    const newConfirmCancelBtn = document.getElementById("confirmCancelBtn");

    // Event saat tombol OK ditekan
    newConfirmOkBtn.onclick = () => {
        confirmModal.style.display = 'none'; // Sembunyikan modal
        callbackOk(); // Jalankan fungsi callback
    };

    // Event saat tombol Batal ditekan
    newConfirmCancelBtn.onclick = () => {
        confirmModal.style.display = 'none'; // Sembunyikan modal
    };
}



// Cek apakah user pernah login sebelumnya (disimpan di browser)
if (localStorage.getItem("adminStatus") === "true") {
  isAdmin = true;
  document.body.classList.add("is-admin");
}

// --- FUNGSI LOGIN ---
const loginBtn = document.getElementById("loginBtn");
const loginModal = document.getElementById("loginModal");

// Klik tombol Login di Navbar
loginBtn.onclick = () => {
  if (isAdmin) {
    // Kalau sudah login, jadinya tombol Logout
    
    // GANTI BAGIAN INI DENGAN CUSTOM CONFIRM:
    showCustomConfirm("Yakin ingin Logout dari mode Admin?", () => {
        // Logika Logout dipindahkan ke dalam callback
        isAdmin = false;
        localStorage.removeItem("adminStatus");
        document.body.classList.remove("is-admin");
        loginBtn.textContent = "Login";
        loginBtn.classList.remove("btn-logout");
        renderTable(dataCache); // Render ulang tabel
    }, "Logout"); // Tambahkan judul

  } else {
    // Kalau belum login, buka modal login
    loginModal.style.display = "flex";
    document.getElementById("loginPass").value = "";
    document.getElementById("loginPass").focus();
  }
};

function closeLoginModal() {
  loginModal.style.display = "none";
}

function checkLogin() {
  const pass = document.getElementById("loginPass").value;
  
  // --- PASSWORD SETTING DI SINI ---
  if (pass === "admin123") { // Ganti password sesuai keinginan
    isAdmin = true;
    localStorage.setItem("adminStatus", "true"); // Simpan sesi
    document.body.classList.add("is-admin"); // Munculkan menu admin via CSS
    
    loginBtn.textContent = "Logout";
    loginBtn.classList.add("btn-logout");
    
    closeLoginModal();
    renderTable(dataCache); // Render ulang untuk memunculkan kolom
    alert("Login Berhasil!");
  } else {
    alert("Password Salah!");
  }
}

// Trigger enter di input password
document.getElementById("loginPass").addEventListener("keypress", function(event) {
  if (event.key === "Enter") checkLogin();
});

// Update tampilan tombol saat pertama load
if (isAdmin) {
    loginBtn.textContent = "Logout";
    loginBtn.classList.add("btn-logout");
}


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
  showLoading();
  try {
    const res = await fetch(scriptURL);
    let data = await res.json();

    data = data.filter(r => r.nama && r.hpp && r.isi);
    data.sort((a,b) => String(a.nama).localeCompare(String(b.nama)));
    dataCache = data;

    renderTable(dataCache);
    updateCategoryDropdowns();

    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      // 2. Sembunyikan loading, terlepas dari hasil try/catch
      hideLoading();  
    }
}

// --- FUNGSI BARU: ISI DROPDOWN KATEGORI (FILTER & MODAL) ---
function updateCategoryDropdowns() {
  // Ambil semua kategori unik dari data
  const kategoriSet = new Set(dataCache.map(row => row.kategori).filter(k => k));
  
  // 1. Isi Dropdown Filter (Navbar)
  const filterSelect = document.getElementById("filterKategori");
  filterSelect.innerHTML = '<option value="">Semua</option>';
  
  // 2. Isi Dropdown Modal (Form Tambah)
  const modalSelect = document.getElementById("kategori");
  modalSelect.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
  
  // Loop data kategori
  kategoriSet.forEach(k => {
    // Tambah ke Filter
    const optFilter = document.createElement("option");
    optFilter.value = k;
    optFilter.textContent = k;
    filterSelect.appendChild(optFilter);

    // Tambah ke Modal
    const optModal = document.createElement("option");
    optModal.value = k;
    optModal.textContent = k;
    modalSelect.appendChild(optModal);
  });
}

// --- RENDER TABLE --- (SAYA HANYA PAKAI 1 VERSI YANG BENAR DISINI)
function renderTable(list) {
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";

  const filtered = currentCategory === "all" ? list :
    list.filter(r => (r.kategori||"").toLowerCase() === currentCategory);

  displayedData = filtered;

  displayedData.forEach((row, index) => { 
    // Hitung Pcs (Estimasi dari Harga Jual / Isi)
    const hpp = Number(row.hpp); 
    const isi = Number(row.isi);
    const pcs = isi ? Math.round( hpp / isi ) : 0; 

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="td-nama">${row.nama}</td>
      <td class="td-hpp admin-col">${Number(row.hpp).toLocaleString('id-ID')}</td>
      <td class="td-isi">${isi.toLocaleString('id-ID')}</td>
      <td class="td-pcs admin-col">${pcs.toLocaleString('id-ID')}</td>
      <td class="td-hrg">${Number(row.hrg).toLocaleString('id-ID')}</td>
    `;
    
    tr.addEventListener("click", () => openEditModal(index));
    tbody.appendChild(tr);
  });
}

// --- CATEGORY BUTTONS ---
const filterKategori = document.getElementById("filterKategori");

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

addBtn.onclick = () => modal.style.display = "flex";
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if(e.target==modal) modal.style.display="none"; };


// --- SUBMIT FORM (TAMBAH DATA) ---
document.getElementById("dataForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  
  // Ambil nilai HPP
  const hppVal = Number(document.getElementById("hpp").value);
  const isiVal = Number(document.getElementById("isi").value);
  const katVal = document.getElementById("kategori").value;
  const namaVal = document.getElementById("nama").value.trim();

  // Validasi sederhana
  if(!hppVal || !isiVal || !namaVal || !katVal) {
     alert("Lengkapi semua data!"); return;
  }

  btn.disabled = true;
  btn.textContent = "Mengirim…";

  // Payload: kirim HPP, bukan Harga Jual
  const payload = {
    nama: namaVal,
    hpp: hppVal,   // Kirim ke script sebagai HPP (Col B)
    isi: isiVal,
    kategori: katVal
  };

  try {
    await fetch(scriptURL, {method:"POST", body:JSON.stringify(payload)});
    await loadData(); // Reload agar tabel update dengan harga hasil rumus
    
    e.target.reset();
    modal.style.display = "none";
    alert("Data tersimpan!");
  } catch(err){
    console.error(err);
    alert("❌ Gagal kirim data");
  } finally {
    btn.disabled = false;
    btn.textContent = "Kirim Data";
  }
});


// --POP UP MODAL EDIT HARGA--
let selectedIndex = null;

// Buka modal dan isi dengan harga saat ini
function openEditModal(index) {
  selectedIndex = index;
  const item = displayedData[index]; 
  if (!item) return;

  // Isi data text (Label)
  document.getElementById("displayNama").textContent = item.nama;
  document.getElementById("displayHrg").textContent = Number(item.hrg).toLocaleString('id-ID');
  document.getElementById("displayIsi").textContent = Number(item.isi).toLocaleString('id-ID');
  const pcs = Math.round(Number(item.hpp) / Number(item.isi));
  document.getElementById("displayPcs").textContent = pcs.toLocaleString('id-ID'); 
  document.getElementById("displayKategori").textContent = item.kategori;
  
  // Gambar
  const imgElement = document.getElementById("gambar");
  if(item.imglink) {
      imgElement.src = item.imglink;
      imgElement.style.display = "block";
  } else {
      imgElement.style.display = "none";
  }

  // --- LOGIKA ADMIN DI MODAL ---
  // Pastikan ID ini konsisten. Di HTML sebelumnya ID-nya "editHrg"
  const editInput = document.getElementById("editHpp"); 
  const saveBtn = document.getElementById("saveEditBtn");

  if (isAdmin) {
      // Jika Admin: Tampilkan Input Edit HPP & Tombol Simpan
      editInput.style.display = "inline-block";
      saveBtn.style.display = "block";
      
      editInput.placeholder = "Edit HPP (Modal)";
      editInput.value = Number(item.hpp); // Admin edit HPP
  } else {
      // Jika User Biasa: Sembunyikan Input & Tombol
      editInput.style.display = "none";
      saveBtn.style.display = "none";
  }

  document.getElementById("editModal").style.display = "flex";
}

// Tutup modal
function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

// Tombol Simpan Edit
document.getElementById("saveEditBtn").addEventListener("click", async () => {
  const saveBtn = document.getElementById("saveEditBtn");

  // PERBAIKAN: Gunakan ID "editHpp" sesuai dengan HTML dan fungsi openEditModal
  const newHpp = Number(document.getElementById("editHpp").value); 
  
  if (!newHpp || newHpp <= 0) return alert("Isi HPP dengan benar!");

  // --- 1. UBAH TAMPILAN TOMBOL (LOADING STATE) ---
  const originalText = saveBtn.textContent; 
  saveBtn.disabled = true;                  
  saveBtn.textContent = "Menyimpan...";     

  try {
    // Ambil data item saat ini dari displayedData
    const itemToUpdate = displayedData[selectedIndex];
    if (!itemToUpdate) throw new Error("Item tidak ditemukan");
    
    // Cari index item ini di dataCache (data mentah) menggunakan nama
    const cacheIndex = dataCache.findIndex(row => row.nama === itemToUpdate.nama);

    if (cacheIndex !== -1) {
        // Perbarui hpp di dataCache local agar UI langsung berubah
        dataCache[cacheIndex].hpp = newHpp;
    }
    
    // Render ulang tabel segera (Optimistic UI)
    renderTable(dataCache); 
    
    // Kirim update ke server Google Sheet
    await fetch(scriptURL, {
      method: "POST",
      body: JSON.stringify({
        nama: itemToUpdate.nama,
        hpp: newHpp,
        isi: itemToUpdate.isi,
        kategori: itemToUpdate.kategori,
        update: true
      })
    });
    
    // Reload data (karena harga jual berubah via rumus di sheet)
    await loadData(); 

    // Tutup modal jika sukses
    closeEditModal();

  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan data. Cek koneksi internet.");
  } finally {
    // --- 2. KEMBALIKAN TOMBOL KE SEMULA ---
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
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