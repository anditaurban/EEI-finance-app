pagemodule = "Receiveable";
colSpanCount = 9;
setDataType("account/receivable");

// Inisialisasi Halaman
if (window.detail_id && window.detail_desc) {
  // --- MODE UPDATE ---
  console.log("Mode: Update");
  loadDetail(detail_id, detail_desc);

  // Sembunyikan tombol simpan, tampilkan update
  document.getElementById("addButton").classList.add("hidden");
  document.getElementById("updateButton").classList.remove("hidden");

  // Kunci input project saat mode update (karena project tidak boleh ganti sembarangan)
  const projInput = document.getElementById("projectInput");
  projInput.readOnly = true;
  projInput.classList.add("bg-gray-100");
} else {
  // --- MODE TAMBAH (CREATE) ---
  console.log("Mode: Create");
  document.getElementById("updateButton").classList.add("hidden");

  // Aktifkan fitur pencarian project
  setupProjectSearch();
}

/**
 * 1. FITUR PENCARIAN PROJECT (AUTOCOMPLETE)
 */
function setupProjectSearch() {
  const input = document.getElementById("projectInput");
  const suggestionsBox = document.getElementById("projectSuggestions");

  input.addEventListener("input", function () {
    const query = this.value;
    clearTimeout(searchTimeout);

    // Jika kurang dari 2 huruf, sembunyikan saran
    if (query.length < 2) {
      suggestionsBox.classList.add("hidden");
      return;
    }

    // Debounce 400ms agar tidak spam server
    searchTimeout = setTimeout(async () => {
      try {
        // Perbaikan URL: Menggunakan Backtick ` dan ${} variable
        const url = `${baseUrl}/table/project_won/${owner_id}/1?search=${encodeURIComponent(
          query
        )}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });

        if (!response.ok) throw new Error("Gagal mengambil data project");

        const result = await response.json();

        // Ambil data dari key 'tableData' sesuai struktur JSON kamu
        const projects = result.tableData || [];

        suggestionsBox.innerHTML = "";

        if (projects.length > 0) {
          suggestionsBox.classList.remove("hidden");
          projects.forEach((proj) => {
            const li = document.createElement("li");
            li.className =
              "px-4 py-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0 text-sm";

            // Tampilan baris saran
            li.innerHTML = `
                            <div class="font-semibold text-gray-800">${
                              proj.project_name
                            }</div>
                            <div class="text-xs text-gray-500">
                                ${proj.pelanggan_nama || "-"} | No: ${
              proj.project_number || "-"
            }
                            </div>
                        `;

            // Event klik item
            li.onclick = () => selectProject(proj);
            suggestionsBox.appendChild(li);
          });
        } else {
          suggestionsBox.classList.add("hidden");
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    }, 400);
  });

  // Tutup dropdown jika klik di luar area
  document.addEventListener("click", function (e) {
    if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.classList.add("hidden");
    }
  });
}

function selectProject(data) {
  // Mapping Data Project ke Form
  document.getElementById("projectInput").value = data.project_name || "";
  document.getElementById("project_id").value = data.project_id || "";
  document.getElementById("project_number").value = data.project_number || "";
  document.getElementById("po_number").value = data.po_number || "";
  document.getElementById("client").value = data.pelanggan_nama || "";

  // Set Contract Amount (Project Amount)
  document.getElementById("project_amount").value =
    finance(data.contract_amount) || "0";

  // Mapping Currency (Default IDR jika kosong)
  // Asumsi di data API project ada field 'currency', jika tidak ada default "IDR"
  const curr = data.currency || "IDR";
  document.getElementById("currency").value = curr;

  // Jalankan Pengecekan Rate (Logic Poin 4)
  checkCurrency();

  // Sembunyikan dropdown saran
  document.getElementById("projectSuggestions").classList.add("hidden");

  // Reset form perhitungan agar bersih
  document.getElementById("percent_invoice").value = "";
  document.getElementById("total_invoice").value = "0";
  document.getElementById("total_after_tax").value = "0";
}

/**
 * 2. LOGIC PERHITUNGAN & RATE (POIN 3 & 4)
 */

function checkCurrency() {
  const currencyVal = document
    .getElementById("currency")
    .value.trim()
    .toUpperCase();
  const rateInput = document.getElementById("rate");

  // Jika mata uang IDR atau Kosong, Rate otomatis 1 dan dikunci
  if (currencyVal === "IDR" || currencyVal === "RP" || currencyVal === "") {
    rateInput.value = "1";
    rateInput.setAttribute("readonly", true);
    rateInput.classList.add("bg-gray-100");
  } else {
    // Jika mata uang Asing (USD, SGD, dll), Rate bisa diedit
    rateInput.removeAttribute("readonly");
    rateInput.classList.remove("bg-gray-100");

    
    // Reset ke kosong jika nilainya masih 1, supaya user sadar harus isi
    if (rateInput.value == "1") rateInput.value = "";
  }
}

// --- 2. LOGIC PERHITUNGAN (POIN 3) ---
function calculateNominal() {
  // Ambil Project Amount (Contract Amount)
  const projectAmountStr = document.getElementById("project_amount").value;
  const projectAmount = unfinance(projectAmountStr); // Pastikan ada fungsi unfinance()

  // Ambil Persentase Invoice
  const percent =
    parseFloat(document.getElementById("percent_invoice").value) || 0;

  // Hitung Total Invoice (Nilai Tanpa Pajak)
  // Rumus: Contract Amount * Persen / 100
  const totalInv = projectAmount * (percent / 100);

  // Tampilkan hasil Total Invoice
  document.getElementById("total_invoice").value = finance(totalInv);

  // Lanjut hitung pajak
  calculateTax();
}


// Generate Invoice Number Otomatis
async function generateInvoiceNumber() {
  const dateVal = document.getElementById("invoice_date").value;
  if (!dateVal) return;

  try {
    const response = await fetch(`${baseUrl}/generate/inv_number`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({ inv_date: dateVal }),
    });

    const result = await response.json();

    if (result.data && result.data.inv_number) {
      document.getElementById("invoice_number").value = result.data.inv_number;
    }
  } catch (e) {
    console.error("Gagal generate nomor invoice", e);
  }
}

/**
 * 3. MANAJEMEN DATA (CRUD)
 */

// Load Data untuk Mode Edit
async function loadDetail(Id, Detail) {
  document.getElementById("formTitle").innerText = "EDIT RECEIVABLE";
  window.detail_id = Id;
  window.detail_desc = Detail;

  try {
    const res = await fetch(
      `${baseUrl}/detail/${currentDataType}/${Id}?_=${Date.now()}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { detail } = await res.json();

    console.log("Loaded Detail:", detail);

    // -- MAPPING DATA DARI DATABASE KE FORM --

    // 1. Project Info
    document.getElementById("projectInput").value = detail.project_name || "";
    document.getElementById("project_id").value = detail.project_id || ""; // ID Project
    document.getElementById("project_number").value =
      detail.project_number || detail.pesanan_id || "";
    document.getElementById("po_number").value = detail.po_number || "";
    document.getElementById("project_amount").value =
      finance(detail.contract_amount || detail.project_amount) || "";
    document.getElementById("client").value =
      detail.client || detail.pelanggan_nama || "";
    document.getElementById("description").value = detail.description || "";

    // 2. Dates
    document.getElementById("invoice_date").value = detail.inv_date || "";
    document.getElementById("due_date").value = detail.due_date || ""; // Field Baru
    document.getElementById("payment_date").value = detail.payment_date || ""; // Field Baru
    document.getElementById("invoice_number").value = detail.inv_number || "";

    // 3. Financials
    // Hitung persen invoice balik dari total / contract (opsional, jika tidak disimpan di DB)
    // document.getElementById("percent_invoice").value = ...

    document.getElementById("total_invoice").value =
      finance(detail.total_inv) || ""; // Nilai tanpa pajak
    document.getElementById("currency").value = detail.currency || "IDR";
    document.getElementById("rate").value =
      detail.rate || (detail.currency === "IDR" ? "1" : "");

    // Cek currency untuk lock input rate
    checkCurrency();

    // 4. Taxes
    document.getElementById("ppn_percent").value = detail.ppn_percent || "0";
    document.getElementById("ppn_nominal").value =
      finance(detail.ppn_nominal) || "";
    document.getElementById("pph_percent").value = detail.pph_percent || "0";
    document.getElementById("pph_nominal").value =
      finance(detail.pph_nominal) || "";
    document.getElementById("total_after_tax").value =
      finance(detail.total_inv_tax) || "";
  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Data",
      text: err.message || "Terjadi kesalahan saat memuat data detail.",
    });
  }
}

// Persiapkan Data Payload untuk Disimpan
function getDataPayload() {
  const getVal = (id) => document.getElementById(id).value.trim();

  const payload = {
    owner_id,
    user_id,

    // Data Identifikasi
    project_id: getVal("project_id"),
    po_number: getVal("po_number"),

    // Data Invoice
    inv_number: getVal("invoice_number"),
    inv_date: getVal("invoice_date"),
    due_date: getVal("due_date"), // Baru
    payment_date: getVal("payment_date"), // Baru
    description: getVal("description"),

    // Data Keuangan
    currency: getVal("currency"),
    rate: getVal("rate"), // Baru

    // Angka-angka (Unfinance untuk menghapus format ribuan sebelum kirim ke DB)
    total_inv: unfinance(getVal("total_invoice")), // Nilai Tanpa Pajak
    ppn_percent: getVal("ppn_percent"),
    ppn_nominal: unfinance(getVal("ppn_nominal")),
    pph_percent: getVal("pph_percent"),
    pph_nominal: unfinance(getVal("pph_nominal")),

    total_inv_tax: unfinance(getVal("total_after_tax")), // Nilai + Pajak (Grand Total)

    // Tambahan
    detail_inv: window.detail_desc || "",
  };

  console.log("Payload to Submit:", payload);

  // -- VALIDASI INPUT --
  if (!payload.project_id) {
    Swal.fire("Warning", "Project belum dipilih!", "warning");
    return null;
  }
  if (!payload.inv_date) {
    Swal.fire("Warning", "Tanggal Invoice wajib diisi!", "warning");
    return null;
  }
  if (payload.total_inv_tax == 0) {
    Swal.fire("Warning", "Total Amount tidak boleh 0!", "warning");
    return null;
  }

  return payload;
}

// Fungsi Submit ke Server
async function submitData(method, id = "") {
  const payload = getDataPayload();
  if (!payload) return;

  const isCreate = method === "POST";
  const url = `${baseUrl}/${isCreate ? "add" : "update"}/account_receivable${
    id ? "/" + id : ""
  }`;
  const actionText = isCreate ? "menyimpan" : "memperbarui";

  const confirm = await Swal.fire({
    icon: "question",
    title: isCreate ? "Simpan Data?" : "Perbarui Data?",
    text: `Pastikan data sudah benar sebelum ${actionText}.`,
    showCancelButton: true,
    confirmButtonText: `Ya, ${isCreate ? "Simpan" : "Update"}`,
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.status === "success" || (result.data && result.data.id)) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Data berhasil ${isCreate ? "ditambahkan" : "diperbarui"}.`,
      });
      // Kembali ke halaman list
      loadModuleContent("receivable");
    } else {
      throw new Error(result.message || "Gagal menyimpan data.");
    }
  } catch (error) {
    console.error(error);
    Swal.fire("Error", error.message || "Terjadi kesalahan koneksi.", "error");
  }
}

// Wrapper Functions
async function createData() {
  await submitData("POST");
}

async function updateData() {
  await submitData("PUT", detail_id);
}

// Fitur Print (Poin 5)
function printInvoice(type) {
  // Pastikan ID tersedia (harus simpan data dulu baru bisa print)
  const id = window.detail_id || "";

  if (!id) {
    Swal.fire(
      "Info",
      "Mohon simpan data terlebih dahulu sebelum mencetak invoice.",
      "info"
    );
    return;
  }

  // Arahkan ke endpoint export
  const url = `${baseUrl}/export/invoice/${type}/${id}`;
  window.open(url, "_blank");
}

/**
 * 4. HELPER UTILS
 */
function switchTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.add("hidden"));
  document.querySelectorAll(".tab-link").forEach((btn) => {
    btn.classList.remove("bg-blue-100", "text-blue-600", "font-semibold");
    btn.classList.add("text-gray-600");
  });
  document.getElementById(`tab-${tabId}`).classList.remove("hidden");
  document
    .querySelector(`.tab-link[data-tab="${tabId}"]`)
    .classList.add("bg-blue-100", "text-blue-600", "font-semibold");
}

// Helper Unfinance (jika belum ada di global)
// --- HELPER FORMATTING (SANGAT PENTING) ---
// Fungsi untuk mengubah string Rp (16.000.000) menjadi angka murni (16000000)
function unfinance(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;

  // 1. Ubah ke string
  let str = val.toString();

  // 2. Hapus semua titik (pemisah ribuan Indonesia)
  // Contoh: "16.000.000" menjadi "16000000"
  str = str.replace(/\./g, "");

  // 3. Ganti koma dengan titik (jika ada desimal)
  // Contoh: "16000000,50" menjadi "16000000.50"
  str = str.replace(",", ".");

  // 4. Parse ke float
  return parseFloat(str) || 0;
}

// Fungsi untuk format angka ke tampilan Indonesia
function finance(val) {
  if (val === "" || val === null || val === undefined) return "";
  let num = parseFloat(val);
  if (isNaN(num)) return "0";
  // Format ke Indonesia (pake titik untuk ribuan)
  return num.toLocaleString("id-ID");
}

// --- LOGIC PERHITUNGAN BOLAK-BALIK ---

// Skenario A: User mengetik PERSEN (%) -> Hitung Rupiah
function calculateByPercent() {
  const projectAmount = unfinance(
    document.getElementById("project_amount").value
  );
  let percent =
    parseFloat(document.getElementById("percent_invoice").value) || 0;

  // Rumus: Contract * Persen / 100
  const nominal = projectAmount * (percent / 100);

  // Update kolom Rupiah (Total Invoice)
  document.getElementById("total_invoice").value = finance(nominal);

  // Trigger hitung pajak
  calculateTax();
}

// Skenario B: User mengetik RUPIAH (Amount) -> Hitung Persen
function calculateByAmount() {
  const projectAmount = unfinance(
    document.getElementById("project_amount").value
  );

  // Ambil nilai yang diketik user
  let rawValue = document.getElementById("total_invoice").value;

  // Langsung format biar ada titiknya saat ngetik (UX lebih enak)
  // Hati-hati: cursor bisa lompat kalau logic ini dipasang onkeyup,
  // tapi aman untuk memastikan format benar.
  const nominal = unfinance(rawValue);

  // Update tampilan input user agar ada format ribuannya
  // Cek agar tidak looping saat hapus data
  if (rawValue !== "") {
    document.getElementById("total_invoice").value = finance(nominal);
  }

  // Hitung Persen Otomatis
  if (projectAmount > 0) {
    // Rumus: (Nominal / Contract) * 100
    const percent = (nominal / projectAmount) * 100;
    // Tampilkan max 2 desimal
    document.getElementById("percent_invoice").value = percent
      .toFixed(2)
      .replace(/\.00$/, "");
  } else {
    document.getElementById("percent_invoice").value = "0";
  }

  // Trigger hitung pajak
  calculateTax();
}

// Skenario C: Hitung Pajak (PPN & PPH)
function calculateTax() {
  // Ambil Total Invoice (Dasar Pengenaan Pajak)
  const totalInv = unfinance(document.getElementById("total_invoice").value);

  // Ambil Persen PPN & PPH
  const ppnPercent =
    parseFloat(document.getElementById("ppn_percent").value) || 0;
  const pphPercent =
    parseFloat(document.getElementById("pph_percent").value) || 0;

  // Hitung Nominal PPN & PPH
  const ppnNominal = totalInv * (ppnPercent / 100);
  const pphNominal = totalInv * (pphPercent / 100);

  // Hitung Grand Total (Incl. Tax)
  // Rumus: Dasar + PPN - PPH
  const totalAfterTax = totalInv + ppnNominal - pphNominal;

  // Tampilkan ke UI
  document.getElementById("ppn_nominal").value = finance(ppnNominal);
  document.getElementById("pph_nominal").value = finance(pphNominal);
  document.getElementById("total_after_tax").value = finance(totalAfterTax);
}

// Skenario D: Saat Project Dipilih -> Reset angka
function selectProject(data) {
  // ... (kode mapping kamu yang sebelumnya tetap sama) ...
  document.getElementById("projectInput").value = data.project_name || "";
  document.getElementById("project_id").value = data.project_id || "";
  document.getElementById("project_number").value = data.project_number || "";
  document.getElementById("po_number").value = data.po_number || "";
  document.getElementById("client").value = data.pelanggan_nama || "";

  // PENTING: Set Contract Amount
  document.getElementById("project_amount").value =
    finance(data.contract_amount) || "0";

  const curr = data.currency || "IDR";
  document.getElementById("currency").value = curr;
  checkCurrency();

  document.getElementById("projectSuggestions").classList.add("hidden");

  // Reset form perhitungan
  document.getElementById("percent_invoice").value = "";
  document.getElementById("total_invoice").value = "";
  document.getElementById("total_after_tax").value = "0";
  document.getElementById("ppn_nominal").value = "0";
}

// Helper Format Input (opsional)
function formatNumber(input) {
  // Logic formatting ribuan saat mengetik bisa ditaruh sini
  // input.value = finance(unfinance(input.value));
}
