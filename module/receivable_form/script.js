/**
 * konfigurasi halaman
 */
pagemodule = "Receiveable";
colSpanCount = 9;
setDataType("account_receivable");

// --- inisialisasi halaman ---
var isEditMode = !!(window.detail_id && window.detail_id !== "null" && window.detail_id !== "undefined");

(function initializeFormMode() {
  const addButton = document.getElementById("addButton");
  const updateButton = document.getElementById("updateButton");
  const projectInput = document.getElementById("projectInput");
  
  if (isEditMode) {
    // mode update
    addButton.classList.add("hidden");
    updateButton.classList.remove("hidden");
    
    // kunci search project saat edit
    projectInput.readOnly = true;
    projectInput.classList.add("bg-gray-100");
    
    // load data detail
    loadDetail(window.detail_id, window.detail_desc);
  } else {
    // mode create
    addButton.classList.remove("hidden");
    updateButton.classList.add("hidden");
    
    // unlock project search di mode create
    projectInput.readOnly = false;
    projectInput.classList.remove("bg-gray-100");
    
    // setup project search
    setupProjectSearch();
    
    // reset form title
    document.getElementById("formTitle").innerText = "RECEIVABLE FORM";
  }
})();

// hitung: nominal * rate = total converted, lalu set total invoice
function calculateKonversi() {
  // ambil input (bersihkan titik ribuan dulu)
  let nominal = unfinance(document.getElementById("nominal").value);
  let rate = unfinance(document.getElementById("rate").value);

  // default rate = 1
  if (!rate || rate === 0) rate = 1;

  // hitung total rupiah (converted)
  let totalIDR = nominal * rate;

  // tampilkan ke kolom total converted
  document.getElementById("total_converted").value = finance(totalIDR);

  // hitung persentase progress untuk total converted
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

  // auto-set total invoice (excl. tax) sama dengan total converted
  // hanya jika user belum mengedit manual
  const currentTotalInvoice = unfinance(document.getElementById("total_invoice").value);
  
  // jika total invoice masih kosong atau belum diedit manual, update otomatis
  if (currentTotalInvoice === 0 || !document.getElementById("total_invoice").dataset.manualEdit) {
    document.getElementById("total_invoice").value = finance(totalIDR);
    document.getElementById("percent_invoice").value = document.getElementById("percent_converted").value;
  }

  // trigger hitung pajak
  calculateTax();
}

// hitung total invoice dari persentase yang diketik user
function calculateInvoiceFromPercent() {
  const projectAmount = unfinance(document.getElementById("project_amount").value);
  const percentInvoice = parseFloat(document.getElementById("percent_invoice").value) || 0;

  if (projectAmount > 0) {
    const totalInvoice = projectAmount * (percentInvoice / 100);
    document.getElementById("total_invoice").value = finance(totalInvoice);
    document.getElementById("total_invoice").dataset.manualEdit = "true";
  }

  // update pajak
  calculateTax();
}

// hitung persentase dari total invoice yang diketik user
function calculateInvoiceFromAmount() {
  const projectAmount = unfinance(document.getElementById("project_amount").value);
  const totalInvoice = unfinance(document.getElementById("total_invoice").value);

  if (projectAmount > 0) {
    const percentInvoice = (totalInvoice / projectAmount) * 100;
    document.getElementById("percent_invoice").value = percentInvoice.toFixed(2).replace(/\.00$/, "");
  } else {
    document.getElementById("percent_invoice").value = "0";
  }
  
  // tandai bahwa user sudah edit manual
  document.getElementById("total_invoice").dataset.manualEdit = "true";

  // update pajak
  calculateTax();
}

// hitung pajak (ppn & pph) - dari persentase ke nominal
function calculateTaxFromPercent() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);

  // ambil persen pajak
  const ppnPercent = parseFloat(document.getElementById("ppn_percent").value) || 0;
  const pphPercent = parseFloat(document.getElementById("pph_percent").value) || 0;

  // hitung nominal dari persen
  const ppnNominal = totalInv * (ppnPercent / 100);
  const pphNominal = totalInv * (pphPercent / 100);

  // update nominal fields
  document.getElementById("ppn_nominal").value = finance(ppnNominal);
  document.getElementById("pph_nominal").value = finance(pphNominal);

  // update total after tax
  updateTotalAfterTax();
}

// hitung dari ppn nominal ke persen
function calculateTaxFromPPN() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);
  const ppnNominal = unfinance(document.getElementById("ppn_nominal").value);

  // hitung persen dari nominal
  if (totalInv > 0) {
    const ppnPercent = (ppnNominal / totalInv) * 100;
    document.getElementById("ppn_percent").value = ppnPercent.toFixed(2).replace(/\.00$/, "");
  }

  // update total after tax
  updateTotalAfterTax();
}

// hitung dari pph nominal ke persen
function calculateTaxFromPPH() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);
  const pphNominal = unfinance(document.getElementById("pph_nominal").value);

  // hitung persen dari nominal
  if (totalInv > 0) {
    const pphPercent = (pphNominal / totalInv) * 100;
    document.getElementById("pph_percent").value = pphPercent.toFixed(2).replace(/\.00$/, "");
  }

  // update total after tax
  updateTotalAfterTax();
}

// update total after tax (dipanggil oleh semua fungsi pajak)
function updateTotalAfterTax() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);
  const ppnNominal = unfinance(document.getElementById("ppn_nominal").value);
  const pphNominal = unfinance(document.getElementById("pph_nominal").value);

  // total akhir = total invoice + ppn - pph
  const totalAfterTax = totalInv + ppnNominal - pphNominal;
  document.getElementById("total_after_tax").value = finance(totalAfterTax);
}

// alias untuk backward compatibility
function calculateTax() {
  calculateTaxFromPercent();
}

/**
 * search project & fill data
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

// mapping project ke form
function selectProject(data) {
  // mapping basic info
  document.getElementById("projectInput").value = data.project_name || "";
  document.getElementById("project_id").value = data.project_id || "";
  document.getElementById("pelanggan_id").value = data.pelanggan_id || "";
  document.getElementById("project_number").value = data.project_number || "";

  // logika po number dummy
  let poValue = data.po_number;

  // jika po kosong/null, buatkan dummy: PO-YYYYMMDD
  if (!poValue || poValue.trim() === "") {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    poValue = `PO-${dateStr}`;
    document.getElementById("po_number").classList.add("text-black");
  } else {
    document.getElementById("po_number").classList.remove("text-black");
  }

  document.getElementById("po_number").value = poValue;
  document.getElementById("project_amount").value = finance(
    data.contract_amount
  );

  // mapping client
  document.getElementById("client").value = data.pelanggan_nama || "";

  // reset form keuangan
  document.getElementById("projectSuggestions").classList.add("hidden");
  document.getElementById("currency").value = "IDR";
  autoSetRate(document.getElementById("currency"));

  document.getElementById("nominal").value = "";
  document.getElementById("total_invoice").value = "";
  document.getElementById("ppn_nominal").value = "0";
  document.getElementById("total_after_tax").value = "0";
}

/**
 * helper utils (finance, format, payload)
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

// get data payload untuk submit
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

// submit data ke api
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

// helper mata uang - fallback exchange rates to IDR
var currencyRates = {
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

var supportedCurrencies = ['USD', 'EUR', 'SGD', 'JPY', 'CNY', 'GBP', 'AUD', 'MYR', 'THB'];
var liveRatesLoaded = false;

// fetch single currency rate dari hexarate api
async function fetchRateFromHexarate(currency) {
  try {
    const response = await fetch(`https://hexarate.paikama.co/api/rates/latest/${currency}?target=IDR`);
    const data = await response.json();
    
    if (data.status_code === 200 && data.data && data.data.mid) {
      return Math.round(data.data.mid);
    }
  } catch (error) {
    console.warn(`Failed to fetch rate for ${currency}:`, error.message);
  }
  return null;
}

// fetch all currency rates dari hexarate api
async function fetchLiveCurrencyRates() {
  try {
    const ratePromises = supportedCurrencies.map(async (currency) => {
      const rate = await fetchRateFromHexarate(currency);
      return { currency, rate };
    });
    
    const results = await Promise.all(ratePromises);
    
    let successCount = 0;
    results.forEach(({ currency, rate }) => {
      if (rate !== null) {
        currencyRates[currency] = rate;
        successCount++;
      }
    });
    
    if (successCount > 0) {
      liveRatesLoaded = true;
      return true;
    }
  } catch (error) {
    console.warn('Failed to fetch live rates, using fallback rates:', error.message);
  }
  return false;
}

// fetch single rate on demand
async function fetchSingleRate(currency) {
  if (currency === 'IDR') return 1;
  
  const rate = await fetchRateFromHexarate(currency);
  if (rate !== null) {
    currencyRates[currency] = rate;
    return rate;
  }
  return currencyRates[currency] || 1;
}

// initialize live rates on page load
fetchLiveCurrencyRates();

// auto set rate berdasarkan currency yang dipilih
async function autoSetRate(input) {
  if (!input) return;

  const val = input.value.toUpperCase();
  const rateInput = document.getElementById("rate");

  if (val === "IDR") {
    rateInput.value = "1";
    rateInput.setAttribute("readonly", true);
    rateInput.classList.add("bg-gray-100");
  } else {
    rateInput.value = "Loading...";
    rateInput.classList.add("bg-gray-100");
    
    const rate = await fetchSingleRate(val);
    rateInput.value = finance(rate);
    
    rateInput.removeAttribute("readonly");
    rateInput.classList.remove("bg-gray-100");
  }

  if (typeof calculateKonversi === "function") {
    calculateKonversi();
  }
}

// refresh currency rates manual
async function refreshCurrencyRates() {
  const success = await fetchLiveCurrencyRates();
  if (success) {
    Swal.fire('Success', 'Currency rates updated!', 'success');
    const currencyInput = document.getElementById("currency");
    if (currencyInput && currencyInput.value !== 'IDR') {
      autoSetRate(currencyInput);
    }
  } else {
    Swal.fire('Warning', 'Failed to fetch live rates. Using cached rates.', 'warning');
  }
}

/**
 * load detail (untuk mode edit)
 */
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
    const result = await res.json();
    const detail = result.detail || result;

    // mapping info project
    document.getElementById("projectInput").value = detail.project_name || "";
    document.getElementById("project_id").value = detail.project_id || "";
    document.getElementById("project_number").value = detail.project_number || "";
    document.getElementById("po_number").value = detail.po_number || "";
    document.getElementById("client").value = detail.client || detail.pelanggan_nama || "";

    let amount = detail.contract_amount || detail.project_amount || 0;
    document.getElementById("project_amount").value = finance(amount);
    document.getElementById("description").value = detail.description || "";

    // mapping tanggal & no inv
    document.getElementById("invoice_date").value = detail.inv_date || "";
    document.getElementById("due_date").value = detail.due_date || "";
    document.getElementById("payment_date").value = detail.payment_date || "";
    document.getElementById("invoice_number").value = detail.inv_number || "";

    // mapping keuangan
    let curr = detail.currency || "IDR";
    document.getElementById("currency").value = curr;

    let dbRate = parseFloat(detail.rate) || 0;
    if (curr === "IDR" && dbRate === 0) {
      dbRate = 1;
    }
    document.getElementById("rate").value = finance(dbRate);

    let dbTotalInv = parseFloat(detail.total_inv) || 0;
    let dbNominal = parseFloat(detail.nominal) || 0;

    // recovery nominal jika di db 0
    if (dbNominal === 0 && dbTotalInv > 0) {
      if (curr === "IDR") {
        dbNominal = dbTotalInv;
      } else {
        dbNominal = dbTotalInv / dbRate;
      }
    }

    document.getElementById("nominal").value = finance(dbNominal);
    document.getElementById("total_converted").value = finance(dbTotalInv);
    document.getElementById("total_invoice").value = finance(dbTotalInv);

    // pajak
    document.getElementById("ppn_percent").value = detail.ppn_percent || "11";
    document.getElementById("ppn_nominal").value = finance(detail.ppn_nominal);
    document.getElementById("pph_percent").value = detail.pph_percent || "22";
    document.getElementById("pph_nominal").value = finance(detail.pph_nominal);
    document.getElementById("total_after_tax").value = finance(detail.total_inv_tax);

    // finalisasi ui
    autoSetRate(document.getElementById("currency"));
    calculateKonversi();
  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire("Error", "Gagal mengambil data detail.", "error");
  }
}
