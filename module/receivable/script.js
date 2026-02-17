pagemodule = "Receiveable";
colSpanCount = 9;
setDataType("account_receivable");
fetchAndUpdateData();

function loadSummary(dataSummary) {
  const summary = dataSummary || {};

  document.getElementById("summary_total_invoice").textContent = finance(
    summary.totalInvoice || 0
  );
  document.getElementById("summary_total_ppn").textContent = finance(
    summary.totalPpn || 0
  );
  document.getElementById("summary_total_pph").textContent = finance(
    summary.totalPph || 0
  );
  document.getElementById("summary_total_final").textContent = finance(
    summary.totalFinal || 0
  );

  // Tambahan info unpaid & overdue jika ada
  if (summary.unpaidCount !== undefined)
    document.getElementById(
      "summary_unpaid"
    ).textContent = `${summary.unpaidCount} Unpaid`;

  if (summary.overdueCount !== undefined)
    document.getElementById(
      "summary_overdue"
    ).textContent = `${summary.overdueCount} Overdue`;
}

window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;

  // --- 1. LOGIC PRE-CALCULATION (Agar HTML bersih) ---

  // A. Status Badge Logic
  let statusBadgeClass = "bg-gray-100 text-gray-700 border border-gray-300"; // Default
  const statusCheck = item.status ? item.status.trim() : "";

  if (statusCheck === "Belum Jatuh Tempo") {
    statusBadgeClass = "bg-green-100 text-green-700 border border-green-300";
  } else if (statusCheck === "Jatuh Tempo Hari ini") {
    statusBadgeClass = "bg-yellow-100 text-yellow-800 border border-yellow-300";
  } else if (statusCheck === "Terlambat") {
    statusBadgeClass = "bg-red-100 text-red-700 border border-red-300";
  } else if (statusCheck === "Terbayar") {
    statusBadgeClass = "bg-blue-100 text-blue-700 border border-blue-300";
  }

  // B. Financial Logic & Booleans
  const isDebit = item.transaction_type === "debit";
  const hasPPN  = item.ppn_nominal && parseFloat(item.ppn_nominal) !== 0;
  const hasPPH  = item.pph_nominal && parseFloat(item.pph_nominal) !== 0;
  const hasTax  = hasPPN || hasPPH;

  // C. Base Amount Display (Merah/Kurung jika debit)
  const baseAmountDisplay = isDebit 
    ? `<span class='text-red-600'>(${finance(item.total_inv)})</span>` 
    : finance(item.total_inv);

  // D. Safety: Escape string project_name untuk onclick agar tidak error jika ada kutip (')
  const safeProjectName = (item.project_name || "").replace(/'/g, "\\'");

  // --- 2. RENDER HTML ---
  return `
  <tr class="bg-white hover:bg-blue-50/50 transition duration-150 group border-b border-gray-100 last:border-0">
      
      <td class="px-6 py-4 align-top w-48">
        <div class="flex flex-col gap-2">
          <span class="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100">
            ${item.po_number || '-'}
          </span>
          
          <div class="flex flex-col gap-0.5">
            <div class="flex justify-between text-xs">
              <span class="text-gray-400 uppercase tracking-wider">Inv Date</span>
              <span class="font-medium text-gray-700">${item.inv_date}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-400 uppercase tracking-wider">Due Date</span>
              <span class="font-medium text-red-600">${item.due_date}</span>
            </div>
          </div>

          <div class="mt-1">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass}">
              ${item.status}
            </span>
          </div>
        </div>
      </td>

      <td class="px-6 py-4 align-top">
        <div class="flex flex-col gap-1">
          <span class="font-bold text-gray-900 text-sm md:text-base leading-tight">
            ${item.client}
          </span>
          <span class="text-gray-500 text-xs font-medium uppercase tracking-wide">
            ${item.project_name || "-"}
          </span>
          
          <div class="mt-3 bg-gray-50 rounded-lg p-2 border border-gray-100 flex flex-col gap-1">
            <div class="flex items-start gap-2 text-xs text-gray-500">
              <span class="w-14 font-mono text-gray-400 shrink-0">INV #</span>
              <span class="font-mono text-gray-700 font-medium select-all">${item.inv_number}</span>
            </div>
            <div class="flex items-start gap-2 text-xs text-gray-500">
              <span class="w-14 font-mono text-gray-400 shrink-0">DESC</span>
              <span class="text-gray-600 italic line-clamp-2">${item.description || '-'}</span>
            </div>
          </div>
        </div>
      </td>      

      <td class="px-6 py-4 align-top text-right">
        <div class="space-y-1.5 inline-block w-full max-w-xs">
          
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-400">Base Amount</span>
            <span class="font-mono font-medium text-gray-700">${baseAmountDisplay}</span>
          </div>

          ${hasPPN ? `
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-400">PPN (${item.ppn_percent}%)</span>
            <span class="font-mono text-gray-600">+ ${finance(item.ppn_nominal)}</span>
          </div>` : ''}

          ${hasPPH ? `
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-400">PPH (${item.pph_percent}%)</span>
            <span class="font-mono text-red-500">- ${finance(item.pph_nominal)}</span>
          </div>` : ''}

          ${hasTax ? `
          <div class="border-t border-gray-200 my-1 pt-1"></div>
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Total</span>
            <span class="font-mono font-bold text-base text-emerald-600">${finance(item.total_inv_tax)}</span>
          </div>` : ''}
          
        </div>
      </td>
      
      <td class="px-6 py-4 align-top text-center w-24">
        <div class="flex flex-col items-center gap-2">
          <button onclick="event.stopPropagation(); loadModuleContent('receivable_form', '${item.receivable_id}', '${safeProjectName}');" 
            class="group/btn text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition" title="Edit">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          
          <button onclick="event.stopPropagation(); handlePayment('${item.receivable_id}', '${safeProjectName}', '${item.total_inv}');" 
            class="group/btn text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition" title="Input Payment">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          
          <button onclick="event.stopPropagation(); handleDelete(${item.receivable_id})" 
            class="group/btn text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition" title="Delete">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>

  </tr>`;
};

document.getElementById("addButton").addEventListener("click", () => {
  loadModuleContent("receivable_form");
});

async function openCustomFilter() {
  const currentYear = new Date().getFullYear();
  const minYear = 2024;

  // Generate option tahun dari currentYear → minYear
  const yearOptions = ['<option value="">Pilih Tahun</option>'];
  for (let y = currentYear; y >= minYear; y--) {
    yearOptions.push(`<option value="${y}">${y}</option>`);
  }

  const { value: formValues } = await Swal.fire({
    title:
      '<span class="text-xl font-semibold text-gray-800 dark:text-white">Filter Kustom</span>',
    html: `
      <div class="text-left space-y-4 mt-4">

        <!-- Year -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tahun</label>
          <select id="filterYear"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-800 text-gray-800 dark:text-white 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
            ${yearOptions.join("")}
          </select>
        </div>

        <!-- Project -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Project</label>
          <select id="filterProject"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-800 text-gray-800 dark:text-white 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="">Semua Project</option>
            <option value="122">Project 122 - DKiDSmedia</option>
            <option value="57">Project 57 - Kampanye Facebook</option>
            <option value="64">Project 64 - Pengadaan ATK Deli</option>
          </select>
        </div>

        <!-- Client -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Client</label>
          <select id="filterClient"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-800 text-gray-800 dark:text-white 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="">Semua Client</option>
            <option value="30364">PT Andalan Niaga</option>
            <option value="30252">CV Sumber Rezeki</option>
            <option value="30198">Toko Cahaya Baru</option>
          </select>
        </div>

        <!-- Payment Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Payment Date</label>
          <input type="date" id="filterPaymentDate"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-800 text-gray-800 dark:text-white 
                   placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText:
      '<span class="px-5 py-1.5 text-sm font-medium">Terapkan</span>',
    cancelButtonText:
      '<span class="px-5 py-1.5 text-sm font-medium">Batal</span>',
    background: "#ffffff",
    customClass: {
      popup:
        "bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md",
      confirmButton:
        "bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400",
      cancelButton:
        "bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg ml-2 focus:ring-2 focus:ring-gray-400",
    },
    focusConfirm: false,
    preConfirm: () => {
      return {
        year: document.getElementById("filterYear").value,
        project: document.getElementById("filterProject").value.trim(),
        client: document.getElementById("filterClient").value.trim(),
        payment_date: document.getElementById("filterPaymentDate").value.trim(),
      };
    },
  });

  if (formValues) {
    let queryParts = [];

    if (formValues.year) queryParts.push(`year=${formValues.year}`);
    if (formValues.project) queryParts.push(`project_id=${formValues.project}`);
    if (formValues.client) queryParts.push(`client=${formValues.client}`);
    if (formValues.payment_date)
      queryParts.push(`payment_date=${formValues.payment_date}`);

    const query = queryParts.join("&");
    if (query) {
      filterData(query);
    } else {
      Swal.fire({
        icon: "info",
        title: "Info",
        text: "Tidak ada filter yang dipilih.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }
}

async function handlePayment(receivableId, projectName, nominal) {
    // 1. Fetch Data Referensi (Bank & PPh)
    Swal.fire({
        title: 'Memuat Data...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    let bankOptions = '<option value="" disabled selected>-- Pilih Bank --</option>';
    let pphOptions = '<option value="0" data-percent="0">Tidak Ada PPh</option>';

    try {
        const [bankRes, pphRes] = await Promise.all([
            fetch(`${baseUrl}/list/coa_bank/${owner_id}`, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } }),
            fetch(`${baseUrl}/list/coa_pph/${owner_id}`, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } })
        ]);

        const bankData = await bankRes.json();
        const pphData = await pphRes.json();

        if (bankData.listData) {
            bankData.listData.forEach(bank => {
                bankOptions += `<option value="${bank.coa_id}">${bank.name} - ${bank.code}</option>`;
            });
        }
        if (pphData.listData) {
            pphData.listData.forEach(pph => {
                pphOptions += `<option value="${pph.coa_id}" data-percent="${pph.value}">${pph.name} (${pph.value}%)</option>`;
            });
        }
        Swal.close();
    } catch (error) {
        Swal.fire('Error', 'Gagal memuat data: ' + error.message, 'error');
        return;
    }

    // 2. HTML Form
    const formHtml = `
        <form id="swal-payment-form" class="text-left text-sm text-gray-700">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-3">
                    <div>
                        <label class="block font-semibold mb-1">Bank Penerima / Kas</label>
                        <select id="coa_bank" class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                            ${bankOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block font-semibold mb-1">No. Kwitansi</label>
                        <input type="text" id="receipt_number" class="w-full px-3 py-2 border rounded" placeholder="Contoh: 01192026/RCT/001" required>
                    </div>
                    <div>
                        <label class="block font-semibold mb-1">Tanggal</label>
                        <input type="date" id="receipt_date" class="w-full px-3 py-2 border rounded" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block font-semibold mb-1">Mata Uang</label>
                            <input type="text" id="currency" class="w-full px-3 py-2 bg-gray-100 border rounded" value="IDR" readonly>
                        </div>
                        <div>
                            <label class="block font-semibold mb-1">Rate</label>
                            <input type="number" id="rate" class="w-full px-3 py-2 border rounded" value="1">
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <div>
                        <label class="block font-semibold mb-1">Nominal Dasar</label>
                        <input type="number" id="input_nominal" class="w-full px-3 py-2 border rounded" placeholder="0" onkeyup="formatNumber(this); oninput="calculateTotals()">
                    </div>
                    <div class="grid grid-cols-3 gap-2 items-end">
                        <div class="col-span-1">
                            <label class="block font-semibold mb-1">PPN (%)</label>
                            <input type="number" id="ppn_percent" class="w-full px-3 py-2 border rounded" value="11" oninput="calculateTotals()">
                        </div>
                        <div class="col-span-2">
                            <label class="block font-semibold mb-1">Nominal PPN</label>
                            <input type="number" id="ppn_nominal" class="w-full px-3 py-2 bg-gray-50 border rounded" readonly placeholder="0">
                        </div>
                    </div>
                    <div>
                        <label class="block font-semibold mb-1">Jenis PPh</label>
                        <select id="coa_pph" class="w-full px-3 py-2 border rounded mb-2" onchange="updatePPhRate()">
                            ${pphOptions}
                        </select>
                        <div class="grid grid-cols-3 gap-2 items-center">
                            <div class="col-span-1">
                                <input type="number" id="pph_percent" class="w-full px-3 py-2 bg-gray-50 border rounded text-center" value="0" readonly>
                            </div>
                            <div class="col-span-2">
                                <input type="number" id="pph_nominal" class="w-full px-3 py-2 bg-gray-50 border rounded" readonly placeholder="Nominal PPh">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <hr class="my-4">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block font-semibold mb-1">Total Invoice (Inc. Tax)</label>
                    <input type="number" id="total_inv_tax" class="w-full px-3 py-2 bg-gray-100 border rounded font-medium" readonly>
                </div>
                <div>
                    <label class="block font-semibold text-green-600 mb-1">Total Diterima (Net)</label>
                    <input type="number" id="total_receipt" class="w-full px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded font-bold text-lg" readonly>
                </div>
            </div>
            <div class="space-y-3">
                <div>
                    <label class="block font-semibold mb-1">Keterangan</label>
                    <textarea id="description" class="w-full px-3 py-2 border rounded" rows="2"></textarea>
                </div>
                <div>
                    <label class="block font-semibold mb-1">Bukti Transfer</label>
                    <input type="file" id="file_upload" class="w-full px-3 py-2 border rounded bg-white">
                </div>
            </div>
        </form>
    `;

    // 3. Eksekusi SweetAlert
    const result = await Swal.fire({
        title: `<span class="text-xl font-bold">Input Pembayaran</span>`,
        html: `<div class="mb-4 text-gray-600">Project: <span class="font-semibold text-blue-600">${projectName}</span></div>${formHtml}`,
        width: '800px',
        showCancelButton: true,
        confirmButtonText: 'Simpan Pembayaran',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#ef4444',
        
        didOpen: async () => {
            const today = document.getElementById('receipt_date').value;
            try {
                const res = await fetch(`${baseUrl}/generate/receipt_number`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${API_TOKEN}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ receipt_date: today })
                });

                const data = await res.json();

                if (data?.data?.success) {
                    document.getElementById("receipt_number").value = data.data.receipt_number;
                }
            } catch (err) {
                console.error("Gagal generate receipt:", err);
            }
    
    
            document.getElementById('input_nominal').value=nominal;
            window.updatePPhRate = () => {
                const select = document.getElementById('coa_pph');
                const rate = select.options[select.selectedIndex].getAttribute('data-percent') || 0;
                document.getElementById('pph_percent').value = rate;
                window.calculateTotals();
            };
            
            

            window.calculateTotals = () => {
                const nominal = parseFloat(document.getElementById('input_nominal').value) || 0;
                const ppnPct = parseFloat(document.getElementById('ppn_percent').value) || 0;
                const pphPct = parseFloat(document.getElementById('pph_percent').value) || 0;

                const ppnNominal = Math.round((nominal * ppnPct) / 100);
                const pphNominal = Math.round((nominal * pphPct) / 100);
                
                // Rumus sesuai kebutuhan akuntansi umum
                const totalInvTax = nominal + ppnNominal; 
                const totalReceipt = nominal - pphNominal; 

                document.getElementById('ppn_nominal').value = Math.floor(ppnNominal);
                document.getElementById('pph_nominal').value = Math.floor(pphNominal);
                document.getElementById('total_inv_tax').value = Math.floor(totalInvTax);
                document.getElementById('total_receipt').value = Math.floor(totalReceipt);
            };
            calculateTotals();
        },

        showLoaderOnConfirm: true,
        preConfirm: async () => {
            const inputNominal = document.getElementById('input_nominal').value;
            const bankId = document.getElementById('coa_bank').value;
            
            if (!inputNominal || !bankId) {
                Swal.showValidationMessage('Nominal dan Bank wajib diisi!');
                return false;
            }

            // --- MENYUSUN FORM DATA SESUAI SCREENSHOT ---
            const formData = new FormData();
            
            // 1. ID Wajib
            formData.append('owner_id', owner_id); // Global variable
            // Pastikan user_id tersedia (ambil dari localStorage atau variabel global)
            formData.append('user_id', typeof user_id !== 'undefined' ? user_id : localStorage.getItem('user_id')); 
            formData.append('receivable_id', receivableId);

            // 2. Dropdown (Key diperbarui sesuai gambar)
            formData.append('coa_bank', bankId); // Sesuai gambar: coa_bank
            
            const pphId = document.getElementById('coa_pph').value;
            if (pphId && pphId !== "0") {
                formData.append('coa_pph', pphId); // Sesuai gambar: coa_pph
            }

            // 3. Data Transaksi
            formData.append('receipt_number', document.getElementById('receipt_number').value);
            formData.append('receipt_date', document.getElementById('receipt_date').value);
            formData.append('currency', document.getElementById('currency').value);
            formData.append('rate', document.getElementById('rate').value);

            // 4. Nominal Logic (Sesuai gambar: nominal = 0, total_inv = nilai asli)
            formData.append('nominal', 0); 
            formData.append('total_inv', inputNominal); 

            // 5. Pajak & Total
            formData.append('ppn_percent', document.getElementById('ppn_percent').value);
            formData.append('ppn_nominal', document.getElementById('ppn_nominal').value);
            formData.append('total_inv_tax', document.getElementById('total_inv_tax').value);
            
            formData.append('pph_percent', document.getElementById('pph_percent').value);
            formData.append('pph_nominal', document.getElementById('pph_nominal').value);
            formData.append('total_receipt', document.getElementById('total_receipt').value);
            
            formData.append('description', document.getElementById('description').value);
            
            const fileInput = document.getElementById('file_upload');
            if (fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }

            // Debugging di Console
            console.group("📦 PAYLOAD FORM DATA");
            console.log(Object.fromEntries(formData.entries()));
            console.groupEnd();

            try {
                const response = await fetch(`${baseUrl}/add/account_receipt`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${API_TOKEN}` },
                    body: formData
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Gagal menyimpan');
                if (data.data && data.data.success === false) throw new Error(data.data.message);

                return data;
            } catch (error) {
                Swal.showValidationMessage(`Gagal: ${error.message}`);
            }
        }
    });

    if (result.isConfirmed) {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data tersimpan.', timer: 1500, showConfirmButton: false });
        if (typeof fetchAndUpdateData === 'function') fetchAndUpdateData();
    }
}

function formatNumber(value) {
    if (!value) return "0";
    return new Intl.NumberFormat("id-ID").format(value);
}

function parseNumber(value) {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/\./g, "")) || 0;
}