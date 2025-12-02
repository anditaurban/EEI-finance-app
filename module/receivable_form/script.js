/**
 * KONFIGURASI HALAMAN
 */
pagemodule = "Receiveable";
colSpanCount = 9;
setDataType("account/receivable");

// --- INISIALISASI HALAMAN ---
if (window.detail_id && window.detail_desc) {
  // Mode Update
  console.log("Mode: Update");
  loadDetail(detail_id, detail_desc);
  document.getElementById("addButton").classList.add("hidden");
  document.getElementById("updateButton").classList.remove("hidden");

  // Kunci pencarian project di mode edit
  const projInput = document.getElementById("projectInput");
  projInput.readOnly = true;
  projInput.classList.add("bg-gray-100");
} else {
  // Mode Create
  console.log("Mode: Create");
  document.getElementById("updateButton").classList.add("hidden");
  setupProjectSearch(); // Aktifkan search
}

/**
 * 1. FITUR SEARCH PROJECT (AUTOCOMPLETE)
 */
function setupProjectSearch() {
  const input = document.getElementById("projectInput");
  const suggestionsBox = document.getElementById("projectSuggestions");

  input.addEventListener("input", function () {
    const query = this.value;
    clearTimeout(searchTimeout);

    if (query.length < 2) {
      suggestionsBox.classList.add("hidden");
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        // Perbaikan URL search
        const url = `${baseUrl}/table/project_won/${owner_id}/1?search=${encodeURIComponent(
          query
        )}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });

        if (!response.ok) throw new Error("Gagal mengambil data project");
        const result = await response.json();

        // Sesuaikan key response ('tableData')
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

  document.addEventListener("click", function (e) {
    if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.classList.add("hidden");
    }
  });
}

// Fungsi Saat Project Dipilih
function selectProject(data) {
  // Mapping Data Project
  document.getElementById("projectInput").value = data.project_name || "";
  document.getElementById("project_id").value = data.project_id || "";
  document.getElementById("pelanggan_id").value = data.pelanggan_id || ""; // NEW: Simpan Pelanggan ID
  document.getElementById("project_number").value = data.project_number || "";
  document.getElementById("po_number").value = data.po_number || "";
  document.getElementById("client").value = data.pelanggan_nama || "";

  // Format Project Amount
  document.getElementById("project_amount").value =
    finance(data.contract_amount) || "0";

  // Mapping Currency ke Dropdown
  const curr = data.currency || "IDR";
  const currencySelect = document.getElementById("currency");

  // Cek apakah mata uang ada di opsi dropdown
  if ([...currencySelect.options].some((o) => o.value === curr)) {
    currencySelect.value = curr;
  } else {
    currencySelect.value = "IDR";
  }

  // Jalankan logika Rate berdasarkan currency
  checkCurrency();

  document.getElementById("projectSuggestions").classList.add("hidden");

  // Reset form keuangan
  document.getElementById("percent_invoice").value = "";
  document.getElementById("total_invoice").value = "";
  document.getElementById("total_after_tax").value = "0";
  document.getElementById("ppn_nominal").value = "0";

  // Default PPN 11%
  document.getElementById("ppn_percent").value = "11";
}

/**
 * 2. LOGIC MATA UANG & RATE (REVISI)
 */
function checkCurrency() {
  const currencySelect = document.getElementById("currency");
  const currencyVal = currencySelect.value;
  const rateInput = document.getElementById("rate");

  if (currencyVal === "IDR") {
    // Jika IDR, Rate otomatis 1 dan dikunci
    rateInput.value = "1";
    rateInput.setAttribute("readonly", true);
    rateInput.classList.add("bg-gray-100");
  } else {
    // Jika USD/Asing, Rate dibuka untuk input manual
    rateInput.removeAttribute("readonly");
    rateInput.classList.remove("bg-gray-100");

    // Reset jika nilai masih 1 agar user input sendiri
    if (rateInput.value == "1") rateInput.value = "";
    rateInput.focus();
  }
}

/**
 * 3. LOGIC PERHITUNGAN BOLAK-BALIK & PAJAK
 */

// User isi Persen -> Hitung Rupiah
function calculateByPercent() {
  const projectAmount = unfinance(
    document.getElementById("project_amount").value
  );
  let percent =
    parseFloat(document.getElementById("percent_invoice").value) || 0;

  const nominal = projectAmount * (percent / 100);
  document.getElementById("total_invoice").value = finance(nominal);

  calculateTax();
}

// User isi Rupiah -> Hitung Persen
function calculateByAmount() {
  const projectAmount = unfinance(
    document.getElementById("project_amount").value
  );
  let rawValue = document.getElementById("total_invoice").value;

  // Format ulang inputan user (agar ada titik ribuan)
  const nominal = unfinance(rawValue);
  if (rawValue !== "") {
    document.getElementById("total_invoice").value = finance(nominal);
  }

  if (projectAmount > 0) {
    const percent = (nominal / projectAmount) * 100;
    document.getElementById("percent_invoice").value = percent
      .toFixed(2)
      .replace(/\.00$/, "");
  } else {
    document.getElementById("percent_invoice").value = "0";
  }

  calculateTax();
}

// Hitung PPN, PPH, Total Akhir
function calculateTax() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);
  const ppnPercent =
    parseFloat(document.getElementById("ppn_percent").value) || 0;
  const pphPercent =
    parseFloat(document.getElementById("pph_percent").value) || 0;

  const ppnNominal = totalInv * (ppnPercent / 100);
  const pphNominal = totalInv * (pphPercent / 100);
  const totalAfterTax = totalInv + ppnNominal - pphNominal;

  document.getElementById("ppn_nominal").value = finance(ppnNominal);
  document.getElementById("pph_nominal").value = finance(pphNominal);
  document.getElementById("total_after_tax").value = finance(totalAfterTax);
}

// Generate Invoice Number
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
    console.error("Gagal generate invoice number", e);
  }
}

/**
 * 4. MANAJEMEN DATA (PAYLOAD & SUBMIT)
 */

function getDataPayload() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };

  const payload = {
    owner_id,
    user_id,

    // --- DATA PROJECT ---
    project_id: getVal("project_id"),
    pelanggan_id: getVal("pelanggan_id"), // NEW: Pelanggan ID
    po_number: getVal("po_number"),

    // --- DATA INVOICE ---
    inv_number: getVal("invoice_number"),
    inv_date: getVal("invoice_date"),
    due_date: getVal("due_date"),
    payment_date: getVal("payment_date"),
    description: getVal("description"),

    // --- CURRENCY & RATE ---
    currency: getVal("currency"),
    rate: getVal("rate"),

    // --- DATA KEUANGAN (Gunakan unfinance) ---
    total_inv: unfinance(getVal("total_invoice")),
    ppn_percent: getVal("ppn_percent"), // Persen tetap string/angka biasa
    ppn_nominal: unfinance(getVal("ppn_nominal")),
    pph_percent: getVal("pph_percent"),
    pph_nominal: unfinance(getVal("pph_nominal")),
    total_inv_tax: unfinance(getVal("total_after_tax")),

    detail_inv: window.detail_desc || "",
  };

  console.log("Payload:", payload);

  if (!payload.project_id) {
    Swal.fire("Warning", "Project belum dipilih!", "warning");
    return null;
  }
  if (!payload.inv_date) {
    Swal.fire("Warning", "Tanggal Invoice wajib diisi!", "warning");
    return null;
  }

  return payload;
}

async function submitData(method, id = "") {
  const payload = getDataPayload();
  if (!payload) return;

  const isCreate = method === "POST";
  const url = `${baseUrl}/${isCreate ? "add" : "update"}/account_receivable${
    id ? "/" + id : ""
  }`;

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
      Swal.fire(
        "Berhasil",
        `Data berhasil ${isCreate ? "disimpan" : "diupdate"}.`,
        "success"
      );
      loadModuleContent("receivable");
    } else {
      throw new Error(result.message || "Gagal menyimpan data.");
    }
  } catch (error) {
    console.error(error);
    Swal.fire("Error", error.message, "error");
  }
}

async function createData() {
  await submitData("POST");
}
async function updateData() {
  await submitData("PUT", detail_id);
}

// Load Detail Mode Edit
async function loadDetail(Id, Detail) {
  document.getElementById("formTitle").innerText = "EDIT RECEIVABLE";
  window.detail_id = Id;
  window.detail_desc = Detail;

  try {
    const res = await fetch(
      `${baseUrl}/detail/${currentDataType}/${Id}?_=${Date.now()}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );
    const { detail } = await res.json();
    console.log("Loaded:", detail);

    // Mapping Data
    document.getElementById("projectInput").value = detail.project_name || "";
    document.getElementById("project_id").value = detail.project_id || "";
    document.getElementById("pelanggan_id").value = detail.pelanggan_id || ""; // Load Pelanggan ID
    document.getElementById("project_number").value =
      detail.project_number || "";
    document.getElementById("po_number").value = detail.po_number || "";
    document.getElementById("client").value = detail.client || "";
    document.getElementById("project_amount").value =
      finance(detail.contract_amount) || "";
    document.getElementById("description").value = detail.description || "";

    document.getElementById("invoice_date").value = detail.inv_date || "";
    document.getElementById("due_date").value = detail.due_date || "";
    document.getElementById("payment_date").value = detail.payment_date || "";
    document.getElementById("invoice_number").value = detail.inv_number || "";

    // Mapping Keuangan
    document.getElementById("currency").value = detail.currency || "IDR";
    document.getElementById("rate").value = detail.rate || "1";
    checkCurrency(); // Lock rate jika IDR

    document.getElementById("total_invoice").value = finance(detail.total_inv);
    document.getElementById("ppn_percent").value = detail.ppn_percent || "0";
    document.getElementById("ppn_nominal").value = finance(detail.ppn_nominal);
    document.getElementById("pph_percent").value = detail.pph_percent || "0";
    document.getElementById("pph_nominal").value = finance(detail.pph_nominal);
    document.getElementById("total_after_tax").value = finance(
      detail.total_inv_tax
    );
  } catch (err) {
    console.error(err);
  }
}

// Print Function
function printInvoice(type) {
  const id = window.detail_id || "";
  if (!id) {
    Swal.fire("Info", "Simpan data terlebih dahulu.", "info");
    return;
  }
  window.open(`${baseUrl}/export/invoice/${type}/${id}`, "_blank");
}

// Helper Utils
function unfinance(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  let str = val.toString().replace(/\./g, "").replace(",", ".");
  return parseFloat(str) || 0;
}

function finance(val) {
  if (val === "" || val === null || val === undefined) return "";
  let num = parseFloat(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("id-ID");
}

function formatNumber(input) {
  // Opsional: format input rate saat diketik
  // input.value = finance(unfinance(input.value));
}
