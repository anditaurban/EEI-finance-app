pagemodule = "Payable";
colSpanCount = 9;
setDataType("account_payable");
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

  const isPaid = item.status === "Terbayar" || item.status === "Partial Paid";
    const safeDesc = (item.description || "").replace(/'/g, "\\'");

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
            ${item.vendor}
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
          <button onclick="event.stopPropagation(); 
    ${isPaid ? 
        `Swal.fire({
            icon: 'warning',
            title: 'Akses Ditolak',
            text: 'Data ini sudah terbayar dan tidak dapat diedit.',
            confirmButtonColor: '#3085d6'
        })` : 
        `loadModuleContent('payable_form', '${item.payable_id}', '${safeProjectName}')`
    };" 
    class="group/btn text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition" 
    title="Edit">
    
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
    </svg>
</button>
          
          <button onclick="event.stopPropagation(); ${isPaid ? `viewPayment('${item.payable_id}', '${safeProjectName}')` : `handlePayment('${item.payable_id}', '${safeProjectName}', '${item.total_inv}', '${safeDesc}', ${item.ppn_percent || 0})`}" 
            class="group/btn text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition" 
            title="${isPaid ? 'Lihat Riwayat Bayar' : 'Input Payment'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
        </button>
          
          <button onclick="event.stopPropagation(); handleDelete(${item.payable_id})" 
            class="group/btn text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition" title="Delete">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>

  </tr>`;
};

document.getElementById("addButton").addEventListener("click", () => {
  loadModuleContent("payable_form");
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

/**
 * Fungsi Input & Edit Pembayaran
 * Perbaikan: Otomatis set value Bank dan PPh saat edit
 */
async function handlePayment(payableId, projectName, nominal, description, ppnPercent, paymentId = null) {
    const isEdit = paymentId !== null;
    const displayProject = (projectName && projectName !== "-" && projectName !== "") 
        ? projectName : (description || "Tanpa Keterangan");

    Swal.fire({ title: 'Memuat Data...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    let existingData = null;
    let bankOptions = '<option value="" disabled selected>-- Pilih Bank --</option>';
    let pphOptions = '<option value="0" data-coa-id="0">-- Pilih Jenis PPh --</option>';
    let currencyOptions = '';

    try {
        const [bankRes, pphRes, currListRes] = await Promise.all([
            fetch(`${baseUrl}/list/coa_bank/${owner_id}`, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } }),
            fetch(`${baseUrl}/list/coa_hutang_pajak/${owner_id}`, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } }),
            fetch(`https://open.er-api.com/v6/latest/IDR`)
        ]);

        const bankData = await bankRes.json();
        const pphData = await pphRes.json();
        const currListData = await currListRes.json();

        if (isEdit) {
            const detailRes = await fetch(`${baseUrl}/table/account_payment/${payableId}/1`, {
                headers: { 'Authorization': `Bearer ${API_TOKEN}` }
            });
            const detailJson = await detailRes.json();
            // Pastikan data ditemukan berdasarkan paymentId
            existingData = detailJson.tableData.find(p => p.payment_id == paymentId);
        }

        // Generate Options dengan logika Selected
        if (bankData.listData) {
            bankData.listData.forEach(bank => {
                const isSelected = existingData && existingData.coa_bank == bank.coa_id ? 'selected' : '';
                bankOptions += `<option value="${bank.coa_id}" ${isSelected}>${bank.name} - ${bank.code}</option>`;
            });
        }
        if (pphData.listData) {
            pphData.listData.forEach(pph => {
                // Perbaikan: Bandingkan coa_id jika pph_percent sama
                const isSelected = existingData && (existingData.pph_percent == pph.value) ? 'selected' : '';
                pphOptions += `<option value="${pph.value}" data-coa-id="${pph.coa_id}" ${isSelected}>${pph.name} (${pph.value}%)</option>`;
            });
        }
        if (currListData?.rates) {
            Object.keys(currListData.rates).sort().forEach(code => {
                const isSelected = (existingData && existingData.currency == code) || (!existingData && code === 'IDR') ? 'selected' : '';
                currencyOptions += `<option value="${code}" ${isSelected}>${code}</option>`;
            });
        }
        Swal.close();
    } catch (error) {
        Swal.fire('Error', 'Gagal memuat referensi data.', 'error'); return;
    }

    // Format Tanggal untuk Input HTML (YYYY-MM-DD)
    // Mendapatkan tanggal saat ini di zona waktu Jakarta (WIB)
    const now = new Date();
    const jakartaDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    const yyyy = jakartaDate.getFullYear();
    const mm = String(jakartaDate.getMonth() + 1).padStart(2, '0');
    const dd = String(jakartaDate.getDate()).padStart(2, '0');
    let formattedDate = `${yyyy}-${mm}-${dd}`;

    // Jika dalam mode edit, gunakan tanggal dari data yang sudah ada
    if (existingData?.payment_date) {
        const parts = existingData.payment_date.split('/');
        if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const result = await Swal.fire({
        title: `<div class="text-center text-xl font-bold">${isEdit ? 'Edit' : 'Input'} Pembayaran</div>`,
        html: `
            <div class="text-center mb-4 text-sm text-gray-500 border-b pb-2">Project: <span class="text-blue-600 font-bold">${displayProject}</span></div>
            <form id="swal-payment-form" class="text-left text-sm text-gray-700">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-3">
                        <div>
                            <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">Bank Pengirim / Kas</label>
                            <select id="coa_bank" class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">${bankOptions}</select>
                        </div>
                        <div>
                            <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">No. Pembayaran</label>
                            <input type="text" id="payment_number" class="w-full px-3 py-2 border rounded bg-gray-50 font-mono" value="${existingData?.payment_number || ''}" ${isEdit ? '' : 'readonly'}>
                        </div>
                        <div>
                            <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">Tanggal</label>
                            <input type="date" id="payment_date" class="w-full px-3 py-2 border rounded" value="${formattedDate}" onchange="updatePaymentNumber(this.value)">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">Mata Uang</label>
                                <select id="currency" class="w-full px-3 py-2 border rounded">${currencyOptions}</select>
                            </div>
                            <div>
                                <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">Rate</label>
                                <input type="text" id="rate" class="w-full px-3 py-2 border rounded font-mono" value="${existingData?.rate || 1}" oninput="formatRate(this); calculateTotals();">
                            </div>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div>
                            <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">Nominal Dasar (IDR)</label>
                            <input type="text" id="input_nominal_display" class="w-full px-3 py-2 border rounded font-bold text-lg" oninput="formatNominal(this); calculateTotals();">
                            <input type="hidden" id="input_nominal_raw">
                        </div>
                        <div class="grid grid-cols-3 gap-2 items-end">
                            <div class="col-span-1">
                                <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">PPN (%)</label>
                                <input type="number" id="ppn_percent" class="w-full px-3 py-2 border rounded text-center" value="${existingData?.ppn_percent || ppnPercent || 0}" oninput="calculateTotals()">
                            </div>
                            <div class="col-span-2">
                                <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">Nominal PPN (IDR)</label>
                                <input type="text" id="ppn_nominal_display" class="w-full px-3 py-2 bg-gray-50 border rounded" readonly>
                            </div>
                        </div>
                        <div>
                            <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">Potongan PPh</label>
                            <select id="coa_pph" class="w-full px-3 py-2 border rounded mb-2" onchange="calculateTotals()">${pphOptions}</select>
                            <div class="grid grid-cols-3 gap-2 items-center">
                                <div class="col-span-1"><input type="text" id="pph_percent_display" class="w-full px-3 py-2 bg-gray-50 border rounded text-center text-xs font-bold" readonly></div>
                                <div class="col-span-2"><input type="text" id="pph_nominal_display" class="w-full px-3 py-2 bg-gray-50 border rounded text-xs font-bold" readonly></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mt-6 border-t pt-4">
                    <div>
                        <label class="block font-semibold mb-1 text-[10px] text-gray-400 uppercase font-mono">Total Tagihan (Inc. Tax)</label>
                        <input type="text" id="total_inv_tax_display" class="w-full px-3 py-2 bg-gray-50 border rounded font-medium" readonly>
                    </div>
                    <div>
                        <label class="block font-semibold text-blue-600 mb-1 text-[10px] uppercase text-right font-mono tracking-tighter">Total Dibayar (Net Paid)</label>
                        <input type="text" id="total_payment_display" class="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded font-bold text-xl text-right" readonly>
                    </div>
                </div>

                <div class="mt-4">
                    <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">Keterangan</label>
                    <textarea id="description_input" class="w-full px-3 py-2 border rounded" rows="2" placeholder="Keterangan...">${existingData?.description || description || ''}</textarea>
                </div>
                <div class="mt-3">
                    <label class="block font-semibold mb-1 text-xs text-gray-500 uppercase">Bukti Transfer</label>
                    <input type="file" id="file_upload" class="w-full px-3 py-2 border rounded bg-white w-full">
                </div>
            </form>
        `,
        width: '850px',
        showCancelButton: true,
        confirmButtonText: 'Simpan Pembayaran',
        didOpen: () => {
            const finance = (n) => new Intl.NumberFormat("id-ID").format(parseFloat(n) || 0);
            const unfinance = (s) => parseFloat(s.toString().replace(/\./g, '').replace(/,/g, '.')) || 0;

           window.updatePaymentNumber = async (date) => {
                try {
                    const res = await fetch(`${baseUrl}/generate/payment_number`, { 
                        method: "POST", 
                        headers: { "Authorization": `Bearer ${API_TOKEN}`, "Content-Type": "application/json" }, 
                        body: JSON.stringify({ payment_date: date }) 
                    });
                    const data = await res.json();
                    if (data?.data?.success) document.getElementById("payment_number").value = data.data.payment_number;
                } catch(e) {}
            };
            window.calculateTotals = () => {
                const nominalAsing = unfinance(document.getElementById('input_nominal_display').value);
                const rateValue = parseFloat(document.getElementById('rate').value) || 1;
                const totalIDR = nominalAsing * rateValue;
                
                const ppnPct = parseFloat(document.getElementById('ppn_percent').value) || 0;
                const pphSel = document.getElementById('coa_pph');
                const pphPct = parseFloat(pphSel.value) || 0;

                const ppnNominal = Math.round((totalIDR * ppnPct) / 100);
                const pphNominal = Math.round((totalIDR * pphPct) / 100);
                
                // Pastikan elemen ada sebelum set value untuk menghindari error Null
                const pphPctDisp = document.getElementById('pph_percent_display');
                if(pphPctDisp) pphPctDisp.value = pphPct;

                document.getElementById('ppn_nominal_display').value = finance(ppnNominal);
                document.getElementById('pph_nominal_display').value = finance(pphNominal);
                document.getElementById('total_inv_tax_display').value = finance(totalIDR + ppnNominal);
                document.getElementById('total_payment_display').value = finance(totalIDR - pphNominal);
            };

            window.formatNominal = (el) => {
                let val = unfinance(el.value);
                el.value = finance(val);
                document.getElementById('input_nominal_raw').value = val;
            };

            // Inisialisasi Nominal Dasar
            const baseValue = isEdit ? (parseFloat(existingData.nominal) || 0) : (parseFloat(nominal) || 0);
            const nominalInput = document.getElementById('input_nominal_display');
            if(nominalInput) {
                nominalInput.value = finance(baseValue);
                document.getElementById('input_nominal_raw').value = baseValue;
            }

            // Jalankan kalkulasi pertama kali
            calculateTotals();
            updatePaymentNumber(formattedDate);
        },
        preConfirm: async () => {
            const unfinance = (id) => {
                const el = document.getElementById(id);
                return el ? el.value.replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '') : 0;
            };
            
            const pphSel = document.getElementById('coa_pph');
            const coaPajakId = pphSel.options[pphSel.selectedIndex].getAttribute('data-coa-id');

            const fd = new FormData();
            fd.append('owner_id', owner_id);
            fd.append('user_id', user_id);
            fd.append('payable_id', payableId);
            fd.append('coa_bank', document.getElementById('coa_bank').value);
            fd.append('payment_number', document.getElementById('payment_number').value);
            fd.append('payment_date', document.getElementById('payment_date').value);
            fd.append('currency', document.getElementById('currency').value);
            fd.append('rate', unfinance('rate'));
            fd.append('nominal', document.getElementById('input_nominal_raw').value);
            fd.append('total_inv', document.getElementById('input_nominal_raw').value);
            fd.append('ppn_percent', document.getElementById('ppn_percent').value);
            fd.append('ppn_nominal', unfinance('ppn_nominal_display'));
            fd.append('coa_hutang_pajak', coaPajakId); 
            fd.append('pph_percent', document.getElementById('pph_percent_display').value);
            fd.append('pph_nominal', unfinance('pph_nominal_display'));
            fd.append('total_inv_tax', unfinance('total_inv_tax_display'));
            fd.append('total_payment', unfinance('total_payment_display'));
            fd.append('description', document.getElementById('description_input').value);

            const file = document.getElementById('file_upload').files[0];
            if (file) fd.append('file', file);

            try {
                const url = isEdit ? `${baseUrl}/update/account_payment/${paymentId}` : `${baseUrl}/add/account_payment`;
                const r = await fetch(url, { 
                    method: isEdit ? 'PUT' : 'POST', 
                    headers: { 'Authorization': `Bearer ${API_TOKEN}` }, 
                    body: fd 
                });
                
                const responseJson = await r.json();
                if (!r.ok) throw new Error(responseJson.message || "Gagal menyimpan data.");
                return responseJson;
            } catch (e) { 
                Swal.showValidationMessage(e.message); 
            }
        }
    });

    if (result.isConfirmed) {
        Swal.fire({ icon: 'success', title: 'Berhasil',  text: isEdit ? 'Data pembayaran berhasil diperbarui' : 'Pembayaran berhasil disimpan', timer: 1500, showConfirmButton: false });
        fetchAndUpdateData(); 
    }
}

async function viewPayment(payableId, projectName) {
    Swal.fire({ 
        title: 'Memuat Riwayat...', 
        allowOutsideClick: false, 
        didOpen: () => Swal.showLoading() 
    });

    try {
        const res = await fetch(`${baseUrl}/table/account_payment/${payableId}/1`, {
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        });
        const result = await res.json();
        const payments = result.tableData || [];
        const finance = (n) => new Intl.NumberFormat("id-ID").format(parseFloat(n) || 0);

        // Perbaikan 1: Escape projectName agar aman digunakan dalam atribut onclick
        const escapedProjectName = projectName.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        let tableRows = payments.map((item, index) => {
            // Perbaikan 2: Pastikan variabel 'item' digunakan secara konsisten (menggantikan 'p' yang error)
            const ppnDetail = item.ppn_percent > 0 
                ? `<div class="text-[10px] text-emerald-600 font-medium">${item.ppn_name} (${item.ppn_percent}%)<br>+${finance(item.ppn_nominal)}</div>` 
                : '<span class="text-gray-300">-</span>';
                
            const pphDetail = item.pph_percent > 0 
                ? `<div class="text-[10px] text-red-600 font-medium">${item.pph_name} (${item.pph_percent}%)<br>-${finance(item.pph_nominal)}</div>` 
                : '<span class="text-gray-300">-</span>';

            const safeDesc = (item.description || "").replace(/'/g, "\\'").replace(/"/g, '&quot;');

            return `
            <tr class="border-b text-[11px] hover:bg-gray-50 transition-colors">
                <td class="p-3 text-center text-gray-500">${index + 1}</td>
                <td class="p-3">
                    <div class="font-mono font-bold text-blue-600">${item.payment_number}</div>
                    <div class="text-[10px] text-gray-400">${item.payment_date}</div>
                </td>
                <td class="p-3">
                    <div class="font-semibold text-gray-700">${item.vendor_name || '-'}</div>
                    <div class="text-[10px] text-gray-500 truncate max-w-[150px]">${item.description || '-'}</div>
                </td>
                <td class="p-3 font-semibold text-right text-gray-700">${finance(item.total_inv_tax)}</td>
                <td class="p-3 text-center">${ppnDetail}</td>
                <td class="p-3 text-center">${pphDetail}</td>
                <td class="p-3">
                    <div class="text-[10px] font-medium text-gray-600">${item.bank_name || '-'}</div>
                </td>
                <td class="p-3 font-bold text-right text-emerald-700 bg-emerald-50/30">${finance(item.total_payment)}</td>
                <td class="p-3 text-center">
                    <div class="flex gap-2 justify-center">
                        <button type="button" onclick="handlePayment('${payableId}', '${escapedProjectName}', '${item.nominal}', '${safeDesc}', ${item.ppn_percent}, '${item.payment_id}')" class="px-2 py-1 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 transition">
                             Edit
                        </button>
                        <button type="button" onclick="deletePayment('${item.payment_id}', '${payableId}', '${escapedProjectName}')" class="px-2 py-1 text-red-600 hover:bg-red-100 rounded border border-red-200 transition">
                             Hapus
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        Swal.fire({
            title: `<div class="text-left"><span class="text-lg font-bold">Riwayat Pembayaran</span></div>`,
            html: `
                <div class="text-left mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
                    <div>
                        <p class="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Project / Description</p>
                        <p class="text-sm font-semibold text-gray-700">${projectName}</p>
                    </div>
                    <button type="button" onclick="handlePayment('${payableId}', '${escapedProjectName}', '0', '', 0)" class="bg-emerald-600 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-emerald-700 shadow-md">
                        + Tambah Cicilan
                    </button>
                </div>
                <div class="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold border-b">
                            <tr>
                                <th class="p-3 text-center">No</th>
                                <th class="p-3">Ref & Tanggal</th>
                                <th class="p-3">Vendor & Deskripsi</th>
                                <th class="p-3 text-right">Total Inv</th>
                                <th class="p-3 text-center">PPN</th>
                                <th class="p-3 text-center">PPh</th>
                                <th class="p-3">Bank</th>
                                <th class="p-3 text-right">Total Pay</th>
                                <th class="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">${tableRows || '<tr><td colspan="9" class="p-12 text-center text-gray-400 italic">Belum ada riwayat pembayaran</td></tr>'}</tbody>
                    </table>
                </div>`,
            width: '1250px',
            showConfirmButton: false,
            showCloseButton: true,
            customClass: { popup: 'rounded-2xl' }
        });
    } catch (e) { 
        console.error(e);
        Swal.fire('Error', 'Gagal memuat data riwayat.', 'error'); 
    }
}

async function deletePayment(paymentId, payableId, projectName) {
    const confirm = await Swal.fire({
        title: 'Hapus pembayaran ini?',
        text: "Saldo hutang akan dikembalikan seperti semula.",
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Ya, Hapus!'
    });

    if (confirm.isConfirmed) {
        Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            const r = await fetch(`${baseUrl}/delete/account_payment/${paymentId}`, {
                method: 'PUT', 
                headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' }
            });
            
            if (r.ok) {
                Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Pembayaran telah dibatalkan.', timer: 1500, showConfirmButton: false });
                
                // Langsung fetch data utama
                if (typeof fetchAndUpdateData === 'function') {
                    fetchAndUpdateData();
                }
            } else { 
                const err = await r.json();
                throw new Error(err.message || "Gagal menghapus"); 
            }
        } catch (e) { 
            Swal.fire('Error', e.message || 'Gagal memproses penghapusan.', 'error'); 
        }
    }
}