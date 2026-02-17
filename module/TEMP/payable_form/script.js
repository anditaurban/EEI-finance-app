/**
 * konfigurasi halaman
 */
pagemodule = "Payable";
colSpanCount = 9;
setDataType("account_payable");

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
    document.getElementById("formTitle").innerText = "PAYABLE FORM";
  }
})();

// hitung: nominal * rate = total converted, lalu set total invoice
function calculateKonversi() {
  let nominal = unfinance(document.getElementById("nominal").value);
  let rate = unfinance(document.getElementById("rate").value);

  if (!rate || rate === 0) rate = 1;

  let totalIDR = nominal * rate;

  document.getElementById("total_converted").value = finance(totalIDR);

  const projectAmount = unfinance(document.getElementById("project_amount").value);
  if (projectAmount > 0) {
    const percent = (totalIDR / projectAmount) * 100;
    document.getElementById("percent_converted").value = percent.toFixed(2).replace(/\.00$/, "");
  } else {
    document.getElementById("percent_converted").value = "0";
  }

  const currentTotalInvoice = unfinance(document.getElementById("total_invoice").value);
  
  if (currentTotalInvoice === 0 || !document.getElementById("total_invoice").dataset.manualEdit) {
    document.getElementById("total_invoice").value = finance(totalIDR);
    document.getElementById("percent_invoice").value = document.getElementById("percent_converted").value;
  }

  calculateTax();
}

// hitung total invoice dari persentase
function calculateInvoiceFromPercent() {
  const projectAmount = unfinance(document.getElementById("project_amount").value);
  const percentInvoice = parseFloat(document.getElementById("percent_invoice").value) || 0;

  if (projectAmount > 0) {
    const totalInvoice = projectAmount * (percentInvoice / 100);
    document.getElementById("total_invoice").value = finance(totalInvoice);
    document.getElementById("total_invoice").dataset.manualEdit = "true";
  }

  calculateTax();
}

// hitung persentase dari total invoice
function calculateInvoiceFromAmount() {
  const projectAmount = unfinance(document.getElementById("project_amount").value);
  const totalInvoice = unfinance(document.getElementById("total_invoice").value);

  if (projectAmount > 0) {
    const percentInvoice = (totalInvoice / projectAmount) * 100;
    document.getElementById("percent_invoice").value = percentInvoice.toFixed(2).replace(/\.00$/, "");
  } else {
    document.getElementById("percent_invoice").value = "0";
  }
  
  document.getElementById("total_invoice").dataset.manualEdit = "true";
  calculateTax();
}

// hitung pajak dari persentase ke nominal
function calculateTaxFromPercent() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);

  const ppnPercent = parseFloat(document.getElementById("ppn_percent").value) || 0;
  const pphPercent = parseFloat(document.getElementById("pph_percent").value) || 0;

  const ppnEnabled = document.getElementById("ppn_enabled")?.checked;
  const pphEnabled = document.getElementById("pph_enabled")?.checked;

  const ppnNominal = ppnEnabled ? totalInv * (ppnPercent / 100) : 0;
  const pphNominal = pphEnabled ? totalInv * (pphPercent / 100) : 0;

  document.getElementById("ppn_nominal").value = finance(ppnNominal);
  document.getElementById("pph_nominal").value = finance(pphNominal);

  updateTotalAfterTax();
}

// update total after tax
function updateTotalAfterTax() {
  const totalInv = unfinance(document.getElementById("total_invoice").value);
  const ppnNominal = unfinance(document.getElementById("ppn_nominal").value);
  const pphNominal = unfinance(document.getElementById("pph_nominal").value);

  // Update formula: Total Invoice + PPN - PPh
  const totalAfterTax = totalInv + ppnNominal - pphNominal;
  document.getElementById("total_after_tax").value = finance(totalAfterTax);
}

// alias
function calculateTax() {
  calculateTaxFromPercent();
}

// toggle field pajak
function toggleTaxField(taxType) {
  const checkbox = document.getElementById(`${taxType}_enabled`);
  const percentInput = document.getElementById(`${taxType}_percent`);
  const nominalInput = document.getElementById(`${taxType}_nominal`);
  
  if (checkbox.checked) {
    percentInput.disabled = false;
    percentInput.classList.remove("bg-gray-100");
    calculateTaxFromPercent();
  } else {
    percentInput.disabled = true;
    percentInput.classList.add("bg-gray-100");
    nominalInput.value = "0";
    updateTotalAfterTax();
  }
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
        const url = `${baseUrl}/table/project_vendor/${owner_id}/1?search=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
        const result = await response.json();
        const projects = result.tableData || result.data || [];

        suggestionsBox.innerHTML = "";
        if (projects.length > 0) {
          suggestionsBox.classList.remove("hidden");
          projects.forEach((proj) => {
            const li = document.createElement("li");
            li.className = "px-4 py-2 hover:bg-blue-100 cursor-pointer border-b text-sm";
            li.innerHTML = `
              <div class="font-bold text-gray-800">${proj.project_name}</div>
              <div class="text-xs text-gray-500">No: ${proj.project_number || "-"}</div>
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
async function selectProject(data) {
  document.getElementById("projectInput").value = data.project_name || "";
  document.getElementById("project_id").value = data.project_id || "";
  document.getElementById("project_number").value = data.project_number || "";

  let poValue = data.po_number;
  if (!poValue || poValue.trim() === "") {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    poValue = `PO-${dateStr}`;
  }
  document.getElementById("po_number").value = poValue;
  document.getElementById("project_amount").value = finance(0);

  document.getElementById("projectSuggestions").classList.add("hidden");
  document.getElementById("currency").value = "IDR";
  autoSetRate(document.getElementById("currency"));

  document.getElementById("nominal").value = "";
  document.getElementById("total_invoice").value = "";
  document.getElementById("ppn_nominal").value = "0";
  document.getElementById("total_after_tax").value = "0";
  
  // load vendors for this project
  await loadVendorsForProject(data.project_id);
}

/**
 * helper utils
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

// load vendors for selected project
async function loadVendorsForProject(projectId) {
  if (!projectId) return;
  
  console.log('=== Load Vendors API Call ===');
  console.log('Project ID:', projectId);
  
  // get project number to match with API response
  const projectNumber = document.getElementById('project_number').value;
  console.log('Project Number:', projectNumber);
  
  try {
    const url = `${baseUrl}/table/project_vendor/${owner_id}/1?search=`;
    console.log('Request URL:', url);
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    
    console.log('Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.warn('Failed to fetch project vendors');
      setupVendorField([]);
      return;
    }
    
    const result = await response.json();
    console.log('Project Vendors API Response:', result);
    
    const projects = result.tableData || [];
    console.log('Total projects:', projects.length);
    
    // find matching project by project_id or project_number
    const matchingProject = projects.find(p => 
      p.project_id === parseInt(projectId) || 
      p.project_number === projectNumber
    );
    
    console.log('Matching project:', matchingProject);
    
    if (!matchingProject) {
      console.warn('No matching project found');
      setupVendorField([]);
      return;
    }
    
    // if project_number input is empty, fill it from matching project
    if (!projectNumber && matchingProject.project_number) {
      document.getElementById('project_number').value = matchingProject.project_number;
    }

    const vendors = matchingProject.vendor_detail || [];
    console.log('Vendors Count:', vendors.length);
    console.log('Vendors:', vendors);
    
    setupVendorField(vendors);
  } catch (error) {
    console.error('Error loading vendors:', error);
    setupVendorField([]);
  }
}

// setup vendor field (dropdown or input)
function setupVendorField(vendors) {
  console.log('=== Setup Vendor Field ===');
  console.log('Vendor count:', vendors.length);
  
  const container = document.querySelector('[data-vendor-container]') || document.getElementById('vendor').parentElement;
  const currentVendor = document.getElementById('vendor');
  
  // remove existing field
  if (currentVendor) {
    currentVendor.remove();
  }
  
  if (vendors.length > 1) {
    console.log('Creating dropdown for multiple vendors');
    // multiple vendors - show dropdown
    const select = document.createElement('select');
    select.id = 'vendor';
    select.name = 'vendor';
    select.className = 'flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Pilih Vendor...';
    select.appendChild(defaultOption);
    
    vendors.forEach(vendor => {
      const option = document.createElement('option');
      option.value = vendor.vendor || '';
      option.textContent = vendor.vendor || 'N/A';
      option.dataset.vendorId = vendor.vendor_id || '';
      option.dataset.contractAmount = vendor.contract_amount || 0;
      select.appendChild(option);
    });

    // keep vendor_id in select dataset for easy access
    select.addEventListener('change', () => {
      const selectedOpt = select.options[select.selectedIndex];
      select.dataset.vendorId = selectedOpt?.dataset?.vendorId || '';
      select.dataset.contractAmount = selectedOpt?.dataset?.contractAmount || 0;
      const amt = unfinance(select.dataset.contractAmount || 0);
      document.getElementById('project_amount').value = finance(amt);
      console.log('Vendor selected:', {
        vendor: select.value,
        vendor_id: select.dataset.vendorId,
        contract_amount: select.dataset.contractAmount
      });
    });
    
    container.appendChild(select);
  } else if (vendors.length === 1) {
    console.log('Creating readonly field for single vendor:', vendors[0].vendor);
    // single vendor - show readonly input
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'vendor';
    input.name = 'vendor';
    input.value = vendors[0].vendor || '';
    input.className = 'flex-1 border border-yellow-400 bg-yellow-50 rounded px-3 py-2';
    input.readOnly = true;
    input.dataset.vendorId = vendors[0].vendor_id || '';
    input.dataset.contractAmount = vendors[0].contract_amount || 0;
    
    const amt = unfinance(input.dataset.contractAmount || 0);
    document.getElementById('project_amount').value = finance(amt);
    container.appendChild(input);
  } else {
    console.log('Creating manual input field (no vendors)');
    // no vendors - show manual input
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'vendor';
    input.name = 'vendor';
    input.placeholder = 'Nama vendor/supplier...';
    input.className = 'flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500';
    
    document.getElementById('project_amount').value = finance(0);
    container.appendChild(input);
  }
}

// delete function for payable (if exists)
async function deleteData(id) {
  console.log('=== DELETE PAYABLE ===');
  console.log('Delete ID:', id);
  const url = `${baseUrl}/delete/account_payable/${id}`;
  console.log('Request URL:', url);
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Body:', responseText);
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Server error: ${responseText}`);
    }
    if (result.status === 'success' || (result.data && result.data.id)) {
      Swal.fire('Berhasil', 'Data berhasil dihapus.', 'success');
      loadModuleContent('payable');
    } else {
      throw new Error(result.message || 'Gagal menghapus data.');
    }
  } catch (error) {
    console.error(error);
    Swal.fire('Error', error.message, 'error');
  }
}
async function generateInvoiceNumber() {
  const projectNumber = document.getElementById('project_number').value;
  const invDate = document.getElementById('invoice_date').value;
  
  console.log('=== Generate Invoice Number API Call ===');
  console.log('Project Number:', projectNumber);
  console.log('Invoice Date:', invDate);
  
  if (!projectNumber || !invDate) {
    console.log('Project number or invoice date not set - skipping generation');
    return;
  }
  
  try {
    const url = `${baseUrl}/generate/po_number`;
    const payload = {
      project_number: projectNumber,
      inv_date: invDate
    };
    
    console.log('Request URL:', url);
    console.log('Request Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response Status:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('Generate PO Number API Response:', JSON.stringify(result, null, 2));
    
    if (result.data && result.data.success && result.data.po_number) {
      document.getElementById('invoice_number').value = result.data.po_number;
      console.log('✅ Invoice number set to:', result.data.po_number);
    } else {
      console.warn('❌ Failed to generate invoice number:', result);
    }
  } catch (error) {
    console.error('❌ Error generating invoice number:', error);
  }
}

// get data payload
function getDataPayload() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };

  const ppnEnabled = document.getElementById("ppn_enabled")?.checked;
  const pphEnabled = document.getElementById("pph_enabled")?.checked;

  const payload = {
    owner_id,
    user_id,
    project_id: getVal("project_id"),
    project_name: getVal("projectInput"),
    project_number: getVal("project_number"),
    vendor: getVal("vendor"),
    vendor_id: (() => {
      const vendorEl = document.getElementById("vendor");
      if (!vendorEl) return "";
      if (vendorEl.tagName === "SELECT") {
        const opt = vendorEl.options[vendorEl.selectedIndex];
        return opt?.dataset?.vendorId || "";
      }
      return vendorEl.dataset?.vendorId || "";
    })(),
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

    ppn_percent: ppnEnabled ? getVal("ppn_percent") : "0",
    ppn_nominal: ppnEnabled ? unfinance(getVal("ppn_nominal")) : 0,
    pph_percent: pphEnabled ? getVal("pph_percent") : "0",
    pph_nominal: pphEnabled ? unfinance(getVal("pph_nominal")) : 0,
    total_inv_tax: unfinance(getVal("total_after_tax")),

    description: getVal("description") || window.detail_desc || "",
  };

  console.log("=== PAYABLE FORM PAYLOAD PREVIEW ===", {
    ...payload,
    vendor_contract_amount:
      document.getElementById("vendor")?.dataset?.contractAmount || 0,
  });

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

// submit data
async function submitData(method, id = "") {
  const payload = getDataPayload();
  if (!payload) return;
  const isCreate = method === "POST";
  const url = `${baseUrl}/${isCreate ? "add" : "update"}/account_payable${id ? "/" + id : ""}`;

  console.log("=== DEBUG PAYLOAD ===");
  console.log("URL:", url);
  console.log("Method:", method);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    
    const responseText = await response.text();
    console.log("Response Status:", response.status);
    console.log("Response Body:", responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Server error: ${responseText}`);
    }
    
    if (result.status === "success" || (result.data && result.data.id)) {
      Swal.fire("Berhasil", `Data berhasil ${isCreate ? "disimpan" : "diupdate"}.`, "success");
      loadModuleContent("payable");
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

// currency rates
var currencyRates = {
  IDR: 1, USD: 16689, EUR: 19418, SGD: 12879, JPY: 107,
  CNY: 2360, GBP: 22258, AUD: 11079, MYR: 4059, THB: 522
};

var supportedCurrencies = ['USD', 'EUR', 'SGD', 'JPY', 'CNY', 'GBP', 'AUD', 'MYR', 'THB'];

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

async function fetchSingleRate(currency) {
  if (currency === 'IDR') return 1;
  const rate = await fetchRateFromHexarate(currency);
  if (rate !== null) {
    currencyRates[currency] = rate;
    return rate;
  }
  return currencyRates[currency] || 1;
}

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

/**
 * load detail (untuk mode edit)
 */
async function loadDetail(Id, Detail) {
  document.getElementById("formTitle").innerText = "EDIT PAYABLE";
  window.detail_id = Id;
  window.detail_desc = Detail;

  try {
    const res = await fetch(
      `${baseUrl}/detail/${currentDataType}/${Id}?_=${Date.now()}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    const result = await res.json();
    let detail = result?.detail || result?.data?.detail || result?.data || result;
    // handle API returning array of detail
    if (Array.isArray(detail)) {
      detail = detail[0] || {};
    }

    console.log("Detail data:", detail);

    // mapping info project
    document.getElementById("projectInput").value = detail.project_name || detail.nama_project || "";
    document.getElementById("project_id").value = detail.project_id || detail.id_project || "";
    document.getElementById("project_number").value = detail.project_number || "";
    document.getElementById("po_number").value = detail.po_number || "";
    
    // load vendors and set current vendor
    if (detail.project_id) {
      await loadVendorsForProject(detail.project_id);
    }
    
    // set vendor value after field is created, prefer vendor_id for matching
    const vendorField = document.getElementById("vendor");
    if (vendorField) {
      if (vendorField.tagName === 'SELECT') {
        const vendorId = (detail.vendor_id || detail.vendorid || detail.id_vendor || "").toString();
        let matched = false;
        if (vendorId) {
          const opt = Array.from(vendorField.options).find(o => (o.dataset.vendorId || "").toString() === vendorId);
          if (opt) {
            vendorField.value = opt.value;
            vendorField.dataset.vendorId = opt.dataset.vendorId || "";
            vendorField.dataset.contractAmount = opt.dataset.contractAmount || 0;
            document.getElementById("project_amount").value = finance(unfinance(opt.dataset.contractAmount || 0));
            matched = true;
          }
        }
        if (!matched) {
          vendorField.value = detail.vendor || detail.supplier || "";
          const opt = vendorField.options[vendorField.selectedIndex];
          vendorField.dataset.vendorId = opt?.dataset?.vendorId || "";
          vendorField.dataset.contractAmount = opt?.dataset?.contractAmount || 0;
          document.getElementById("project_amount").value = finance(unfinance(opt?.dataset?.contractAmount || detail.contract_amount || 0));
        }
      } else {
        vendorField.value = detail.vendor || detail.supplier || "";
        const amt = unfinance(vendorField.dataset.contractAmount || detail.contract_amount || 0);
        document.getElementById("project_amount").value = finance(amt);
      }
    }

    // fallback if vendor not set
    if (!document.getElementById("project_amount").value) {
      document.getElementById("project_amount").value = finance(detail.contract_amount || 0);
    }

    document.getElementById("description").value = detail.detail_inv || detail.description || "";

    // mapping tanggal & no inv
    document.getElementById("invoice_date").value = detail.inv_date || "";
    document.getElementById("due_date").value = detail.due_date || "";
    document.getElementById("payment_date").value = detail.payment_date || "";
    document.getElementById("invoice_number").value = detail.inv_number || "";

    // mapping keuangan
    let curr = detail.currency || "IDR";
    document.getElementById("currency").value = curr;

    let dbRate = parseFloat(detail.rate) || 0;
    if (curr === "IDR" && dbRate === 0) dbRate = 1;
    document.getElementById("rate").value = finance(dbRate);

    let dbTotalInv = parseFloat(detail.total_inv) || 0;
    let dbNominal = parseFloat(detail.nominal) || 0;

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

    // pajak - set checkbox state
    const ppnPercent = parseFloat(detail.ppn_percent) || 0;
    const pphPercent = parseFloat(detail.pph_percent) || 0;
    const ppnNominal = parseFloat(detail.ppn_nominal) || 0;
    const pphNominal = parseFloat(detail.pph_nominal) || 0;
    
    const ppnCheckbox = document.getElementById("ppn_enabled");
    const pphCheckbox = document.getElementById("pph_enabled");
    const ppnPercentInput = document.getElementById("ppn_percent");
    const pphPercentInput = document.getElementById("pph_percent");
    
    if (ppnPercent > 0 || ppnNominal > 0) {
      ppnCheckbox.checked = true;
      ppnPercentInput.disabled = false;
      ppnPercentInput.classList.remove("bg-gray-100");
    } else {
      ppnCheckbox.checked = false;
      ppnPercentInput.disabled = true;
      ppnPercentInput.classList.add("bg-gray-100");
    }
    ppnPercentInput.value = ppnPercent || 11;
    document.getElementById("ppn_nominal").value = finance(ppnNominal);
    
    if (pphPercent > 0 || pphNominal > 0) {
      pphCheckbox.checked = true;
      pphPercentInput.disabled = false;
      pphPercentInput.classList.remove("bg-gray-100");
    } else {
      pphCheckbox.checked = false;
      pphPercentInput.disabled = true;
      pphPercentInput.classList.add("bg-gray-100");
    }
    pphPercentInput.value = pphPercent || 2;
    document.getElementById("pph_nominal").value = finance(pphNominal);
    
    document.getElementById("total_after_tax").value = finance(detail.total_inv_tax);

    // finalisasi ui
    if (curr !== "IDR") {
      const rateInput = document.getElementById("rate");
      rateInput.removeAttribute("readonly");
      rateInput.classList.remove("bg-gray-100");
    }
    
    const projectAmount = unfinance(document.getElementById("project_amount").value);
    if (projectAmount > 0) {
      const percentConverted = (dbTotalInv / projectAmount) * 100;
      document.getElementById("percent_converted").value = percentConverted.toFixed(2).replace(/\.00$/, "");
      document.getElementById("percent_invoice").value = percentConverted.toFixed(2).replace(/\.00$/, "");
    }
  } catch (err) {
    console.error("Gagal load detail:", err);
    Swal.fire("Error", "Gagal mengambil data detail.", "error");
  }
}
