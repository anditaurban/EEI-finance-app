pagemodule = 'Receiveable'
colSpanCount = 9;
setDataType('account_receivable');
fetchAndUpdateData();

function loadSummary(dataSummary) {
  console.log('Data Summary:', dataSummary);

  // Helper: format angka ke Rupiah
  const formatRupiah = (num) => {
    if (!num || isNaN(num)) return 'Rp 0';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  // Pastikan dataSummary tidak null
  const summary = dataSummary || {};

  // Isi nilai ke dalam elemen HTML
  document.getElementById("summary_total_invoice").textContent = finance(summary.totalInvoice || 0);
  document.getElementById("summary_total_ppn").textContent = finance(summary.totalPpn || 0);
  document.getElementById("summary_total_pph").textContent = finance(summary.totalPph || 0);
  document.getElementById("summary_total_final").textContent = finance(summary.totalFinal || 0);

  // Tambahan info unpaid & overdue jika ada
  if (summary.unpaidCount !== undefined)
    document.getElementById("summary_unpaid").textContent = `${summary.unpaidCount} Unpaid`;

  if (summary.overdueCount !== undefined)
    document.getElementById("summary_overdue").textContent = `${summary.overdueCount} Overdue`;
}


window.rowTemplate = function (item, index, perPage = 10) {
  const { currentPage } = state[currentDataType];
  const globalIndex = (currentPage - 1) * perPage + index + 1;
  

  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">
    
    <!-- Invoice Dates -->
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200 ">
      <div class="flex flex-col space-y-1">
        <div class="flex justify-between">
          <span class="font-medium">Invoice</span>
          <span class="text-gray-600">${item.inv_date}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-medium">Due</span>
          <span class="text-gray-600">${item.due_date}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-medium">Payment</span>
          <span class="text-gray-600">${item.payment_date}</span>
        </div>
      </div>
    </td>

    <!-- Project Details -->
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200 ">
      <div class="grid grid-cols-[100px_auto] gap-x-2 gap-y-1">
        <span class="font-medium">PO#</span>
        <span class="text-gray-600">${item.po_number}</span>

        <span class="font-medium">Invoice#</span>
        <span class="text-gray-600">${item.inv_number}</span>

        <span class="font-medium">Project</span>
        <span class="text-gray-600">${item.project_name || '-'}</span>

        <span class="font-medium">Description</span>
        <span class="text-gray-600">${item.description}</span>
      </div>
    </td>

    <!-- Client -->
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200 ">
      <span class="font-medium sm:hidden">Client</span>
      <span class="uppercase">${item.client}</span>
    </td>

    <!-- Detail Invoice -->
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200 ">
      <span class="font-medium sm:hidden">Detail</span>
      ${item.detail_inv}
    </td>

    <!-- Amounts -->
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200 ">
      <div class="flex flex-col space-y-1">

        <div class="flex justify-between">
          <span class="font-medium">Amount</span>
          <span class="font-semibold text-gray-600">
            ${item.transaction_type === 'debit' 
              ? `<span class='text-red-600'>(${finance(item.total_inv)})</span>` 
              : finance(item.total_inv)}
          </span>
        </div>

        ${item.ppn_nominal && item.ppn_nominal != 0 ? `
          <div class="flex justify-between">
            <span class="font-medium">PPN (${item.ppn_percent}%)</span>
            <span class="text-gray-600">${finance(item.ppn_nominal)}</span>
          </div>
        ` : ''}

        ${item.pph_nominal && item.pph_nominal != 0 ? `
          <div class="flex justify-between">
            <span class="font-medium">PPH (${item.pph_percent}%)</span>
            <span class="text-gray-600">${finance(item.pph_nominal)}</span>
          </div>
        ` : ''}

        ${(item.ppn_nominal && item.ppn_nominal != 0) || (item.pph_nominal && item.pph_nominal != 0)
          ? `
          <div class="flex justify-between">
            <span class="font-medium">Final</span>
            <span class="text-gray-600">${finance(item.total_inv_tax)}</span>
          </div>
          `
          : ''
        }
      </div>

  <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
    <button onclick="event.stopPropagation(); loadModuleContent('receivable_form', '${item.receivable_id}', '${item.project_name}');" class="block w-full text-left px-4 py-2 hover:bg-gray-100">✏️ Edit</button>
    <button onclick="event.stopPropagation(); handleDelete(${item.receivable_id})" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
      🗑 Delete
    </button>
  </div>
    </td>
  </tr>`;
};

document.getElementById('addButton').addEventListener('click', () => {
  loadModuleContent('receivable_form');
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
    title: '<span class="text-xl font-semibold text-gray-800 dark:text-white">Filter Kustom</span>',
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
    confirmButtonText: '<span class="px-5 py-1.5 text-sm font-medium">Terapkan</span>',
    cancelButtonText: '<span class="px-5 py-1.5 text-sm font-medium">Batal</span>',
    background: '#ffffff',
    customClass: {
      popup: 'bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400',
      cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg ml-2 focus:ring-2 focus:ring-gray-400',
    },
    focusConfirm: false,
    preConfirm: () => {
      return {
        year: document.getElementById('filterYear').value,
        project: document.getElementById('filterProject').value.trim(),
        client: document.getElementById('filterClient').value.trim(),
        payment_date: document.getElementById('filterPaymentDate').value.trim()
      };
    }
  });

  if (formValues) {
    let queryParts = [];

    if (formValues.year) queryParts.push(`year=${formValues.year}`);
    if (formValues.project) queryParts.push(`project_id=${formValues.project}`);
    if (formValues.client) queryParts.push(`client=${formValues.client}`);
    if (formValues.payment_date) queryParts.push(`payment_date=${formValues.payment_date}`);

    const query = queryParts.join('&');
    if (query) {
      filterData(query);
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Info',
        text: 'Tidak ada filter yang dipilih.',
        confirmButtonColor: '#3b82f6',
      });
    }
  }
}


