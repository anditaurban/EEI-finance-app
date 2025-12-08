/**
 * KONFIGURASI HALAMAN
 */
pagemodule = "Receiveable";
colSpanCount = 9;
setDataType("account_receivable");

// --- INISIALISASI HALAMAN ---
if (window.detail_id && window.detail_desc) {
  // Mode Update
  console.log("Mode: Update");
  loadDetail(detail_id, detail_desc);
  document.getElementById("addButton").classList.add("hidden");
  document.getElementById("updateButton").classList.remove("hidden");

  // Kunci search project saat edit
  const pInput = document.getElementById("projectInput");
  pInput.readOnly = true;
  pInput.classList.add("bg-gray-100");
} else {
  // Mode Create
  console.log("Mode: Create");
  document.getElementById("updateButton").classList.add("hidden");
  setupProjectSearch();
}

// B. Hitung: Nominal * Rate = Total Converted, lalu set Total Invoice
function calculateKonversi() {
  // Ambil input (bersihkan titik ribuan dulu)
  let nominal = unfinance(document.getElementById("nominal").value);
  let rate = unfinance(document.getElementById("rate").value);

  // Default rate = 1
  if (!rate || rate === 0) rate = 1;

  // Hitung Total Rupiah (Converted)
  let totalIDR = nominal * rate;

  // Tampilkan ke kolom Total Converted
  document.getElementById("total_converted").value = finance(totalIDR);

  // Hitung Persentase Progress untuk Total Converted
  const projectAmount = unfinance(
    document.getElementById("project_amount").value
  );
  if (projectAmount > 0) {
    const percent = (totalIDR / projectAmount) * 100;
    document.getElementById("percent_converted").value = percent
      .toFixed(2)
      .replace(/\.00$/, "");
  } else {
    document.getElementById("percent_converted").value = "0";
  }

  // Auto-set Total Invoice (Excl. Tax) sama dengan Total Converted
  document.getElementById("total_invoice").value = finance(totalIDR);
  document.getElementById("percent_invoice").value = document.getElementById("percent_converted").value;

  // PENTING: Langsung trigger hitung pajak!
  calculateTax();
}

// C. Hitung Pajak (PPN & PPH) - dari persentase ke nominal
function calculateTaxFromPercent() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);

  // Ambil Persen Pajak
  const ppnPercent = parseFloat(document.getElementById("ppn_percent").value) || 0;
  const pphPercent = parseFloat(document.getElementById("pph_percent").value) || 0;

  // Hitung Nominal dari Persen
  const ppnNominal = totalInv * (ppnPercent / 100);
  const pphNominal = totalInv * (pphPercent / 100);

  // Update Nominal fields
  document.getElementById("ppn_nominal").value = finance(ppnNominal);
  document.getElementById("pph_nominal").value = finance(pphNominal);

  // Update Total After Tax
  updateTotalAfterTax();
}

// Hitung dari PPN Nominal ke Persen
function calculateTaxFromPPN() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);
  const ppnNominal = unfinance(document.getElementById("ppn_nominal").value);

  // Hitung persen dari nominal
  if (totalInv > 0) {
    const ppnPercent = (ppnNominal / totalInv) * 100;
    document.getElementById("ppn_percent").value = ppnPercent.toFixed(2).replace(/\.00$/, "");
  }

  // Update Total After Tax
  updateTotalAfterTax();
}

// Hitung dari PPH Nominal ke Persen
function calculateTaxFromPPH() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);
  const pphNominal = unfinance(document.getElementById("pph_nominal").value);

  // Hitung persen dari nominal
  if (totalInv > 0) {
    const pphPercent = (pphNominal / totalInv) * 100;
    document.getElementById("pph_percent").value = pphPercent.toFixed(2).replace(/\.00$/, "");
  }

  // Update Total After Tax
  updateTotalAfterTax();
}

// Update Total After Tax (dipanggil oleh semua fungsi pajak)
function updateTotalAfterTax() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);
  const ppnNominal = unfinance(document.getElementById("ppn_nominal").value);
  const pphNominal = unfinance(document.getElementById("pph_nominal").value);

  // Total Akhir = Total Invoice + PPN - PPH
  const totalAfterTax = totalInv + ppnNominal - pphNominal;
  document.getElementById("total_after_tax").value = finance(totalAfterTax);
}

// Alias untuk backward compatibility
function calculateTax() {
  calculateTaxFromPercent();
}

/**
 * 2. SEARCH PROJECT & FILL DATA
 */
function setupProjectSearch() {
  const input = document.getElementById("projectInput");
  const suggestionsBox = document.getElementById("projectSuggestions");
  let searchTimeout;

  input.addEventListener("input", function () {
    const query = this.value;
    clearTimeout(searchTimeout);

    if (query.length < 2) {
      suggestionsBox.classList.add("hidden");
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        // Sesuaikan endpoint ini dengan backend Anda
        const url = `${baseUrl}/table/project_won/${owner_id}/1?search=${encodeURIComponent(
          query
        )}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
        const result = await response.json();
        const projects = result.tableData || [];

        suggestionsBox.innerHTML = "";
        if (projects.length > 0) {
          suggestionsBox.classList.remove("hidden");
          projects.forEach((proj) => {
            const li = document.createElement("li");
            li.className =
              "px-4 py-2 hover:bg-blue-100 cursor-pointer border-b text-sm";
            li.innerHTML = `
                            <div class="font-bold text-gray-800">${
                              proj.project_name
                            }</div>
                            <div class="text-xs text-gray-500">${
                              proj.pelanggan_nama || "-"
                            } | No: ${proj.project_number || "-"}</div>
                        `;
            li.onclick = () => selectProject(proj);
            suggestionsBox.appendChild(li);
          });
        } else {
          suggestionsBox.classList.add("hidden");
        }
      } catch (error) {
        console.error(error);
      }
    }, 400);
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.classList.add("hidden");
    }
  });
}

// === FUNGSI MAPPING PROJECT ===
function selectProject(data) {
  // 1. Mapping Basic Info
  document.getElementById("projectInput").value = data.project_name || "";
  document.getElementById("project_id").value = data.project_id || "";
  document.getElementById("pelanggan_id").value = data.pelanggan_id || "";
  document.getElementById("project_number").value = data.project_number || "";

  // --- UPDATE: LOGIKA PO NUMBER DUMMY ---
  let poValue = data.po_number;

  // Jika PO kosong/null, buatkan dummy: PO-DUMMY-YYYYMMDD
  if (!poValue || poValue.trim() === "") {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // Contoh: 20231205
    poValue = `PO-${dateStr}`;

    // Opsional: Beri tanda visual kalau ini dummy (misal ubah warna text jadi merah)
    document.getElementById("po_number").classList.add("text-black");
  } else {
    // Kalau ada PO asli, warna text normal
    document.getElementById("po_number").classList.remove("text-black");
  }

  document.getElementById("po_number").value = poValue;
  // -------------------------------------

  document.getElementById("project_amount").value = finance(
    data.contract_amount
  );

  // 2. Mapping Client
  document.getElementById("client").value = data.pelanggan_nama || "";

  // 3. Reset Form Keuangan
  document.getElementById("projectSuggestions").classList.add("hidden");
  document.getElementById("currency").value = "IDR";
  autoSetRate(document.getElementById("currency"));

  document.getElementById("nominal").value = "";
  document.getElementById("total_invoice").value = "";
  document.getElementById("ppn_nominal").value = "0";
  document.getElementById("total_after_tax").value = "0";
}

/**
 * 3. HELPER UTILS (Finance, Format, Payload)
 */
function unfinance(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  let str = val.toString().replace(/\./g, "").replace(",", ".");
  return parseFloat(str) || 0;
}

function finance(val) {
  if (val === "" || val === null || val === undefined) return "0";
  let num = parseFloat(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("id-ID");
}

function formatNumber(input) {
  if (input.value === "") return;
  let originalVal = unfinance(input.value);
  input.value = finance(originalVal);
}

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
    console.error(e);
  }
}

function getDataPayload() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };

  const payload = {
    owner_id,
    user_id,
    project_id: getVal("project_id"),
    pelanggan_id: getVal("pelanggan_id"),
    po_number: getVal("po_number"),
    inv_number: getVal("invoice_number"),
    inv_date: getVal("invoice_date"),
    due_date: getVal("due_date"),
    payment_date: getVal("payment_date"),

    currency: getVal("currency"),
    rate: unfinance(getVal("rate")),
    nominal: unfinance(getVal("nominal")),
    total_converted: unfinance(getVal("total_converted")),
    total_inv: unfinance(getVal("total_invoice")),

    ppn_percent: getVal("ppn_percent"),
    ppn_nominal: unfinance(getVal("ppn_nominal")),
    pph_percent: getVal("pph_percent"),
    pph_nominal: unfinance(getVal("pph_nominal")),
    total_inv_tax: unfinance(getVal("total_after_tax")),

    description: getVal("description"),
    detail_inv: window.detail_desc || "",
  };

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

// === FUNGSI HELPER MATA UANG ===
// Fallback exchange rates to IDR (used if API fails)
let currencyRates = {
  IDR: 1,
  USD: 16689,
  EUR: 19418,
  SGD: 12879,
  JPY: 107,
  CNY: 2360,
  GBP: 22258,
  AUD: 11079,
  MYR: 4059,
  THB: 522
};

// List of supported currencies
const supportedCurrencies = ['USD', 'EUR', 'SGD', 'JPY', 'CNY', 'GBP', 'AUD', 'MYR', 'THB'];

// Flag to track if live rates are loaded
let liveRatesLoaded = false;

// Fetch single currency rate from Hexarate API
async function fetchRateFromHexarate(currency) {
  try {
    const response = await fetch(`https://hexarate.paikama.co/api/rates/latest/${currency}?target=IDR`);
    const data = await response.json();
    
    if (data.status_code === 200 && data.data && data.data.mid) {
      // The API returns the rate from currency to IDR
      return Math.round(data.data.mid);
    }
  } catch (error) {
    console.warn(`Failed to fetch rate for ${currency}:`, error.message);
  }
  return null;
}

// Fetch all currency rates from Hexarate API
async function fetchLiveCurrencyRates() {
  try {
    console.log('Fetching live currency rates from Hexarate...');
    
    // Fetch all rates in parallel
    const ratePromises = supportedCurrencies.map(async (currency) => {
      const rate = await fetchRateFromHexarate(currency);
      return { currency, rate };
    });
    
    const results = await Promise.all(ratePromises);
    
    // Update rates for successful fetches
    let successCount = 0;
    results.forEach(({ currency, rate }) => {
      if (rate !== null) {
        currencyRates[currency] = rate;
        successCount++;
      }
    });
    
    if (successCount > 0) {
      liveRatesLoaded = true;
      console.log(`Live currency rates loaded: ${successCount}/${supportedCurrencies.length} currencies`);
      console.log('Current rates:', currencyRates);
      return true;
    }
  } catch (error) {
    console.warn('Failed to fetch live rates, using fallback rates:', error.message);
  }
  return false;
}

// Fetch single rate on demand (for faster response)
async function fetchSingleRate(currency) {
  if (currency === 'IDR') return 1;
  
  const rate = await fetchRateFromHexarate(currency);
  if (rate !== null) {
    currencyRates[currency] = rate;
    return rate;
  }
  return currencyRates[currency] || 1;
}

// Initialize live rates on page load
fetchLiveCurrencyRates();

async function autoSetRate(input) {
  // Pastikan input tidak null sebelum mengambil value
  if (!input) return;

  const val = input.value.toUpperCase();
  const rateInput = document.getElementById("rate");

  if (val === "IDR") {
    // Jika IDR, Rate dikunci jadi 1
    rateInput.value = "1";
    rateInput.setAttribute("readonly", true);
    rateInput.classList.add("bg-gray-100");
  } else {
    // Show loading indicator
    rateInput.value = "Loading...";
    rateInput.classList.add("bg-gray-100");
    
    // Fetch fresh rate for selected currency
    const rate = await fetchSingleRate(val);
    rateInput.value = finance(rate);
    
    // Buka kunci rate agar bisa diedit manual jika perlu
    rateInput.removeAttribute("readonly");
    rateInput.classList.remove("bg-gray-100");
    
    console.log(`📊 Rate for ${val}: ${rate} IDR`);
  }

  // Hitung ulang konversi (jika nominal sudah terisi)
  if (typeof calculateKonversi === "function") {
    calculateKonversi();
  }
}

// Function to manually refresh rates
async function refreshCurrencyRates() {
  const success = await fetchLiveCurrencyRates();
  if (success) {
    Swal.fire('Success', 'Currency rates updated from Hexarate!', 'success');
    // Re-apply current currency rate
    const currencyInput = document.getElementById("currency");
    if (currencyInput && currencyInput.value !== 'IDR') {
      autoSetRate(currencyInput);
    }
  } else {
    Swal.fire('Warning', 'Failed to fetch live rates. Using cached rates.', 'warning');
  }
}

/**
 * 4. LOAD DETAIL (Untuk Mode Edit)
 */
async function loadDetail(Id, Detail) {
  document.getElementById("formTitle").innerText = "EDIT RECEIVABLE";
  window.detail_id = Id;
  window.detail_desc = Detail;
  console.log("Loading detail for ID:", Id);

  try {
    const res = await fetch(
      `${baseUrl}/detail/${currentDataType}/${Id}?_=${Date.now()}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );
    const result = await res.json();

    // Jaga-jaga jika response dibungkus dalam object 'detail' atau langsung root
    const detail = result.detail || result;

    console.log("Loaded Data:", detail);

    // --- MAPPING INFO PROJECT ---
    document.getElementById("projectInput").value = detail.project_name || "";
    document.getElementById("project_id").value = detail.project_id || "";
    // Jika project_number tidak ada di JSON detail, biarkan kosong atau handle khusus
    document.getElementById("project_number").value =
      detail.project_number || "";
    document.getElementById("po_number").value = detail.po_number || "";

    // Client: Ambil dari key 'client' (sesuai JSON kamu)
    document.getElementById("client").value =
      detail.client || detail.pelanggan_nama || "";

    // Project Amount (Cek key contract_amount atau project_amount)
    let amount = detail.contract_amount || detail.project_amount || 0;
    document.getElementById("project_amount").value = finance(amount);

    document.getElementById("description").value = detail.description || "";

    // --- MAPPING TANGGAL & NO INV ---
    document.getElementById("invoice_date").value = detail.inv_date || "";
    document.getElementById("due_date").value = detail.due_date || "";
    document.getElementById("payment_date").value = detail.payment_date || "";
    document.getElementById("invoice_number").value = detail.inv_number || "";

    // --- MAPPING KEUANGAN (FIXED LOGIC) ---

    // 1. Currency
    let curr = detail.currency || "IDR";
    document.getElementById("currency").value = curr;

    // 2. Rate (Handle jika di DB nilainya 0)
    let dbRate = parseFloat(detail.rate) || 0;

    // Jika IDR tapi rate di DB 0, kita paksa jadi 1 agar perhitungan benar
    if (curr === "IDR" && dbRate === 0) {
      dbRate = 1;
    }
    document.getElementById("rate").value = finance(dbRate);

    // 3. Nominal & Total Inv
    let dbTotalInv = parseFloat(detail.total_inv) || 0;
    let dbNominal = parseFloat(detail.nominal) || 0;

    // LOGIKA RECOVERY NOMINAL:
    // Jika Nominal di DB 0 (seperti di JSON kamu), kita hitung mundur dari Total Inv
    if (dbNominal === 0 && dbTotalInv > 0) {
      if (curr === "IDR") {
        dbNominal = dbTotalInv; // Kalau IDR, Nominal = Total
      } else {
        dbNominal = dbTotalInv / dbRate; // Kalau Asing, Total / Rate
      }
    }

    // Set nilai ke input
    document.getElementById("nominal").value = finance(dbNominal);
    document.getElementById("total_converted").value = finance(dbTotalInv);
    document.getElementById("total_invoice").value = finance(dbTotalInv);

    // 4. Pajak
    document.getElementById("ppn_percent").value = detail.ppn_percent || "11"; // Default 11 jika null
    document.getElementById("ppn_nominal").value = finance(detail.ppn_nominal);

    document.getElementById("pph_percent").value = detail.pph_percent || "22";
    document.getElementById("pph_nominal").value = finance(detail.pph_nominal);

    document.getElementById("total_after_tax").value = finance(
      detail.total_inv_tax
    );

    // --- FINALISASI UI ---
    // Panggil autoSetRate untuk mengunci/membuka field Rate sesuai Currency
    autoSetRate(document.getElementById("currency"));

    // Trigger hitung ulang visual (persentase dll)
    calculateKonversi();
  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire("Error", "Gagal mengambil data detail.", "error");
  }
}
