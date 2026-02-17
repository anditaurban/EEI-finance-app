colSpanCount = 9;
setDataType('general_ledger');
fetchAndUpdateData();

// document.getElementById('glPeriod').value =
//   now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  
// document.getElementById('transferPeriod').value =
//   now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  
// document.getElementById('inflowPeriod').value =
//   now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  
function monthName(month) {
  const names = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  return names[month - 1];
}

function showAccountingTab(viewId, btnElement) {
    // 1. Hide all views
    document.querySelectorAll('.accounting-view').forEach(el => el.classList.add('hidden'));
    
    // 2. Show selected view
    const view = document.getElementById(viewId + 'View');
    if(view) {
        view.classList.remove('hidden');
        view.classList.add('block');
    }

    // 3. Reset all tab styles
    document.querySelectorAll('.acc-tab').forEach(el => {
      // Inactive Style: Gray text, Transparent Border
      el.className = 'acc-tab pb-4 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 flex items-center gap-2 whitespace-nowrap transition-colors';
      
      // Icon Gray
      const icon = el.querySelector('svg');
      if(icon) icon.setAttribute('class', 'w-5 h-5'); // Tailwind handles color via text-gray-500 parent
    });

    // 4. Set Active Style
    // Active Style: Blue Text, Blue Border
    btnElement.className = 'acc-tab active-tab pb-4 text-sm font-semibold text-blue-600 border-b-2 border-blue-600 flex items-center gap-2 whitespace-nowrap transition-colors';
    
    // 5. Optional: Trigger specific loaders
    if(viewId === 'ledger') fetchAndUpdateData();
    if(viewId === 'inflow') loadInflow();
    if (viewId === 'outflow') loadOutflow();
    if (viewId === 'transfer') loadTransfer();
    if (viewId === 'coa') loadCOA();
  }

window.rowTemplate = function (item, index, perPage = 10) {
  return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">  
  
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200">
      ${item.date_journal}
    </td>
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200">
      ${item.reference}
    </td>
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200">
      ${item.coa}
    </td>
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200">
      ${item.description}
    </td>
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200 text-right">
      ${finance(item.debit)}
    </td>
    <td class="px-6 py-4 text-sm text-gray-700 border border-gray-200 text-right">
      ${finance(item.credit)}
    </td>
 
  </tr>`;
};






async function loadInflow(monthYear = null) {
  try {
    const now = new Date();
    const defaultMonth =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const period =
      monthYear ||
      document.getElementById('inflowPeriod')?.value ||
      defaultMonth;
    console.log('Period Inflow', period)

    const [year, month] = period.split('-');
    const source = document.getElementById('inflowSource')?.value || '';

    const tbody = document.getElementById('inflowBody');
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-6 text-center text-gray-500">
          Memuat data inflow...
        </td>
      </tr>
    `;

    const res = await apiGet(
      `${baseUrl}/inflow?owner_id=${owner_id}&year=${year}&month=${month}&source=${source}`
    );

    console.log('Data Inflow:', res);

    tbody.innerHTML = '';

    if (!res.data || !res.data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-4 py-6 text-center text-gray-500">
            Tidak ada data inflow
          </td>
        </tr>
      `;
      return;
    }

res.data.forEach(row => {
  tbody.innerHTML += `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-2">${formatDate(row.tanggal)}</td>
      <td class="px-4 py-2 capitalize">${row.category || '-'}</td>
      <td class="px-4 py-2">
        <div class="text-sm font-medium">${row.coa.code}</div>
        <div class="text-xs text-gray-500">${row.coa.name}</div>
      </td>
      <td class="px-4 py-2">${row.no_ref || '-'}</td>
      <td class="px-4 py-2">${row.keterangan || '-'}</td>
      <td class="px-4 py-2 text-right font-semibold">${formatRupiah(row.nominal)}</td>
      <td class="px-4 py-2 text-center">
        <button
          class="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
          onclick="deleteInflow(${row.id}, '${row.no_ref || ''}')">
          Delete
        </button>
      </td>
    </tr>
  `;
});


  } catch (err) {
    console.error('loadInflow error:', err);
  }
}
async function openInflowForm() {
  try {
    // ambil COA Equity & Liability
    const coaRes = await apiGet(
      `${baseUrl}/coa?type=equity,liability`
    );

    const coaOptions = coaRes.data.map(c => `
      <option value="${c.coa_id}">
        ${c.code} – ${c.name}
      </option>
    `).join('');

    const { value: form } = await Swal.fire({
      title: 'Tambah Inflow (Pendanaan)',
      html: `
        <div class="space-y-3 text-left">

          <input id="if-date" type="date"
            class="w-full border rounded-lg px-3 py-2 text-sm" />

          <select id="if-source"
            class="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="investor">Investor</option>
            <option value="funding">Pendanaan</option>
          </select>

          <select id="if-coa"
            class="w-full border rounded-lg px-3 py-2 text-sm">
            ${coaOptions}
          </select>

          <input id="if-nominal" type="number"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Nominal" />

          <input id="if-ref"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="No Referensi" />

          <textarea id="if-note"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Keterangan"></textarea>

        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      preConfirm: () => {
        const nominal = Number(document.getElementById('if-nominal').value);

        if (!nominal || nominal <= 0) {
          Swal.showValidationMessage('Nominal harus lebih dari 0');
          return false;
        }

        return {
          owner_id,
          tanggal: document.getElementById('if-date').value,
          category: document.getElementById('if-source').value,
          coa_id: Number(document.getElementById('if-coa').value),
          nominal,
          no_ref: document.getElementById('if-ref').value,
          keterangan: document.getElementById('if-note').value
        };
      }
    });

    if (!form) return;

    await fetch(`${baseUrl}/inflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(form)
    });

    Swal.fire('Sukses', 'Inflow berhasil disimpan', 'success');
    loadInflow();

  } catch (err) {
    console.error('openInflowForm error:', err);
    Swal.fire('Error', 'Gagal menyimpan inflow', 'error');
  }
}

async function loadOutflow(year = null) {
  try {
    const now = new Date();
    const selectedYear = year || now.getFullYear();

    const tbody = document.getElementById('outflowBody');
    tbody.innerHTML = `
      <tr>
        <td colspan="13" class="px-4 py-6 text-center text-gray-500">
          Memuat data outflow...
        </td>
      </tr>
    `;

    // ===============================
    // FETCH DATA
    // ===============================
    const [categoryRes, summaryRes] = await Promise.all([
      apiGet(`${baseUrl}/outflow/categories`),
      apiGet(`${baseUrl}/outflow/summary?owner_id=${owner_id}&year=${selectedYear}`)
    ]);
    
    console.log('Category', categoryRes)
    console.log('DataSum', summaryRes)

    const categories = categoryRes.data || [];
    const summary = summaryRes.data || {};

    tbody.innerHTML = '';

    // ===============================
    // RENDER TABLE
    // ===============================
    categories.forEach(group => {

      // HEADER GROUP
      tbody.innerHTML += `
        <tr class="bg-gray-300 font-semibold text-gray-900">
          <td class="px-4 py-2">
            ${group.group}
            <div class="text-xs font-normal text-gray-600">
              ${group.note || ''}
            </div>
          </td>
          <td colspan="12"></td>
        </tr>
      `;

      // ITEMS
      group.items.forEach(item => {
        const monthly = summary[item] || {};

        let cells = '';
        for (let m = 1; m <= 12; m++) {
          const val = monthly[m] || 0;
          cells += `
            <td class="px-3 py-2 text-right">
              ${val ? formatRupiah(val) : '-'}
            </td>
          `;
        }

        tbody.innerHTML += `
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2">
              ${item}
            </td>
            ${cells}
          </tr>
        `;
      });
    });

  } catch (err) {
    console.error('loadOutflow error:', err);
  }
}

async function loadTransfer(monthYear = null) {
  try {
    const period =
      monthYear ||
      document.getElementById('transferPeriod')?.value;

    if (!period) return;

    const [year, month] = period.split('-');
    const bank = document.getElementById('transferBank')?.value || '';

    const tbody = document.getElementById('transferBody');
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-6 text-center text-gray-500">
          Memuat data...
        </td>
      </tr>
    `;

    const res = await apiGet(
      `${baseUrl}/transfer-internal?owner_id=${owner_id}&year=${year}&month=${month}&bank=${bank}`
    );

    tbody.innerHTML = '';

    if (!res.data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-4 py-6 text-center text-gray-500">
            Tidak ada mutasi bank
          </td>
        </tr>
      `;
      return;
    }

    res.data.forEach(row => {
      tbody.innerHTML += `
        <tr>
          <td class="px-4 py-2">${formatDate(row.tanggal)}</td>
          <td class="px-4 py-2">${row.bank_from}</td>
          <td class="px-4 py-2">${row.bank_to}</td>
          <td class="px-4 py-2 text-right font-medium">
            ${formatRupiah(row.nominal)}
          </td>
          <td class="px-4 py-2">${row.no_ref || '-'}</td>
          <td class="px-4 py-2">${row.keterangan || '-'}</td>
          <td class="px-4 py-2 text-center space-x-2">
            <button
              class="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700"
              onclick='openTransferForm(${JSON.stringify(row)})'>
              Edit
            </button>
            <button
              class="px-3 py-1 text-xs rounded bg-red-100 text-red-700"
              onclick="deleteTransfer(${row.transfer_id})">
              Delete
            </button>
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error('loadTransfer error', err);
  }
}
async function openTransferForm(data = null) {
  const isEdit = !!data;
  console.log('Data:', data)

  const banks = await apiGet(`${baseUrl}/coa?type=asset&category=bank`);

  const bankOptions = banks.data.map(b => `
    <option value="${b.coa_id}">
      ${b.name}
    </option>
  `).join('');

  const { value: form } = await Swal.fire({
    title: isEdit ? 'Edit Transfer Bank' : 'Transfer Antar Bank',
    html: `
      <div class="space-y-3 text-left">

        <input id="tf-date" type="date"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          value="${data?.tanggal || ''}" />

        <select id="tf-from"
          class="w-full border rounded-lg px-3 py-2 text-sm">
          <option value="">Dari Bank</option>
          ${bankOptions}
        </select>

        <select id="tf-to"
          class="w-full border rounded-lg px-3 py-2 text-sm">
          <option value="">Ke Bank</option>
          ${bankOptions}
        </select>

        <input id="tf-nominal"
          type="number"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Nominal" />

        <input id="tf-ref"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="No Referensi" />

        <textarea id="tf-note"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Keterangan"></textarea>

      </div>
    `,
    showCancelButton: true,
    confirmButtonText: isEdit ? 'Update' : 'Transfer',
    preConfirm: () => {
      const from = document.getElementById('tf-from').value;
      const to = document.getElementById('tf-to').value;
      const nominal = document.getElementById('tf-nominal').value;

      if (!from || !to || from === to || !nominal) {
        Swal.showValidationMessage('Data transfer tidak valid');
        return false;
      }

      return {
        owner_id,
        tanggal: document.getElementById('tf-date').value,
        bank_from: Number(from),
        bank_to: Number(to),
        nominal: Number(nominal),
        no_ref: document.getElementById('tf-ref').value,
        keterangan: document.getElementById('tf-note').value
      };
    }
  });

  if (!form) return;

  const url = isEdit
    ? `${baseUrl}/transfer-internal/${data.transfer_id}`
    : `${baseUrl}/transfer-internal`;

  const method = isEdit ? 'PUT' : 'POST';

  await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify(form)
  });
  
  console.log(JSON.stringify());

  Swal.fire('Sukses', 'Transfer berhasil disimpan', 'success');
  loadTransfer();
}
async function deleteTransfer(id) {
  const confirm = await Swal.fire({
    title: 'Hapus mutasi?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus'
  });

  if (!confirm.isConfirmed) return;

  await fetch(`${baseUrl}/transfer-internal/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${API_TOKEN}` }
  });

  Swal.fire('Dihapus', 'Mutasi berhasil dihapus', 'success');
  loadTransfer();
}

async function loadCOA() {
  try {
    const tbody = document.getElementById('COAtableBody');
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-gray-500">Memuat data COA...</td></tr>`;

    const res = await apiGet(`${baseUrl}/coa`);
    const tree = res.data || [];
    console.log('COAdata: ', tree);

    if (!tree.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-gray-500">Data COA belum tersedia</td></tr>`;
      return;
    }

    let htmlContent = '';

    function buildRowHtml(node, depth = 0, parentId = null) {
      const indent = depth * 24; 
      const hasChildren = node.children && node.children.length > 0;
      
      // ============================================================
      // PERUBAHAN 1: Default State = False (Collapsed)
      // Jika expandedState[id] === true, baru dianggap terbuka.
      // Jika undefined atau false, dianggap tertutup.
      // ============================================================
      const isExpanded = expandedState[node.coa_id] === true; 

      // ============================================================
      // PERUBAHAN 2: Visibility Logic
      // Jika punya parent, DAN parent-nya TIDAK terbuka (alias false/undefined), 
      // maka row ini harus disembunyikan (hidden).
      // ============================================================
      let rowClass = "hover:bg-gray-50 border-b border-gray-100 transition-all";
      if (parentId && expandedState[parentId] !== true) {
         rowClass += " hidden";
      }

      // Icon Panah (Sesuai state isExpanded)
      // rotate-90 = Bawah (Terbuka), rotate-0 = Kanan (Tertutup)
      const arrowIcon = isExpanded 
        ? '<svg class="w-3 h-3 transform rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>'
        : '<svg class="w-3 h-3 transform rotate-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';

      const toggleBtn = hasChildren
        ? `<button onclick="toggleCoaNode(event, ${node.coa_id})" id="btn-${node.coa_id}" class="p-1 mr-1 rounded hover:bg-gray-200 text-gray-500 focus:outline-none transition-colors">
             ${arrowIcon}
           </button>`
        : `<span class="w-5 h-5 inline-flex items-center justify-center mr-1 text-gray-300">•</span>`;

      const statusBadge = node.is_active
        ? '<span class="px-2 py-0.5 text-[10px] font-semibold rounded bg-green-100 text-green-700">Aktif</span>'
        : '<span class="px-2 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700">Nonaktif</span>';

      let html = `
        <tr 
          id="row-${node.coa_id}" 
          data-id="${node.coa_id}" 
          data-parent="${parentId || ''}" 
          class="${rowClass}"
        >
          <td class="px-6 py-3 font-mono text-xs text-gray-600">${node.code}</td>
          <td class="px-6 py-3">
            <div style="padding-left:${indent}px" class="flex items-center">
              ${toggleBtn}
              <span class="text-sm text-gray-800 ${node.is_postable ? 'font-normal' : 'font-bold'}">
                ${node.name}
              </span>
            </div>
          </td>
          <td class="px-6 py-3 text-xs text-gray-600 uppercase">${formatAccountType(node.type)}</td>
          <td class="px-6 py-3 text-xs text-gray-600">${node.category || '-'}</td>
          <td class="px-6 py-3 text-right font-mono text-xs text-gray-700">${finance(node.balance)}</td>
          <td class="px-6 py-3 text-center w-24">
             <div class="flex items-center justify-center gap-2">
                <button onclick="openCOAForm(${node.coa_id})" class="text-gray-400 hover:text-blue-600 transition" title="Edit">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onclick="deleteCOA(${node.coa_id})" class="text-gray-400 hover:text-red-600 transition" title="Delete">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
             </div>
          </td>
        </tr>
      `;

      if (hasChildren) {
        node.children.forEach(child => {
          html += buildRowHtml(child, depth + 1, node.coa_id);
        });
      }
      return html;
    }

    tree.forEach(node => {
      htmlContent += buildRowHtml(node);
    });

    tbody.innerHTML = htmlContent;

  } catch (error) {
    console.error('loadCOA error:', error);
  }
}

// Logic Toggle tetap sama, tidak perlu diubah dari versi sebelumnya
function toggleCoaNode(event, coaId) {
  event.stopPropagation();
  const btn = document.getElementById(`btn-${coaId}`);
  const svg = btn.querySelector('svg');
  
  // Cek state saat ini via class visual
  const isCurrentlyExpanded = svg.classList.contains('rotate-90');

  if (isCurrentlyExpanded) {
    // Action: Collapse
    svg.classList.remove('rotate-90');
    svg.classList.add('rotate-0');
    expandedState[coaId] = false;
    toggleChildrenVisibility(coaId, false);
  } else {
    // Action: Expand
    svg.classList.remove('rotate-0');
    svg.classList.add('rotate-90');
    expandedState[coaId] = true;
    toggleChildrenVisibility(coaId, true);
  }
}

function toggleChildrenVisibility(parentId, shouldShow) {
  const childRows = document.querySelectorAll(`tr[data-parent="${parentId}"]`);
  childRows.forEach(row => {
    const rowId = row.dataset.id;
    if (shouldShow) {
      row.classList.remove('hidden');
      // Recursive show: Jika anak ini status terakhirnya expanded, buka juga cucu-nya
      const childBtn = document.getElementById(`btn-${rowId}`);
      if (childBtn) {
         const childSvg = childBtn.querySelector('svg');
         if (childSvg && childSvg.classList.contains('rotate-90')) {
            toggleChildrenVisibility(rowId, true);
         }
      }
    } else {
      row.classList.add('hidden');
      toggleChildrenVisibility(rowId, false); // Recursive hide all descendants
    }
  });
}


async function openCOAForm(coa = null) {
  const isEdit = !!coa;

  // ===============================
  // LOAD PARENT OPTIONS
  // ===============================
  const coaTree = (await apiGet(`${baseUrl}/coa`)).data || [];

  function flattenCOA(tree, depth = 0, result = []) {
    tree.forEach(n => {
      result.push({
        coa_id: n.coa_id,
        name: `${'—'.repeat(depth)} ${n.code} ${n.name}`,
        level: n.level
      });
      if (n.children?.length) flattenCOA(n.children, depth + 1, result);
    });
    return result;
  }

  const parentOptions = flattenCOA(coaTree);

  const { value: formData } = await Swal.fire({
    title: isEdit ? 'Edit COA' : 'Tambah COA',
    html: `
      <div class="space-y-3 text-left">

        <select id="coa-parent" class="w-full border rounded-lg px-3 py-2 text-sm" ${isEdit ? 'disabled' : ''}>
          <option value="">-- Root / Akun Utama --</option>
          ${parentOptions.map(p => `
            <option value="${p.coa_id}" ${coa?.parent_id === p.coa_id ? 'selected' : ''}>
              ${p.name}
            </option>
          `).join('')}
        </select>

        <input id="coa-code"
          class="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100"
          placeholder="Kode Akun"
          value="${coa?.code || ''}"
          disabled
        />

        <input id="coa-name"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Nama Akun"
          value="${coa?.name || ''}"
        />

        <select id="coa-type"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          ${isEdit ? 'disabled' : ''}
        >
          ${['asset','liability','equity','income','expense','cogs']
            .map(t => `
              <option value="${t}" ${coa?.type === t ? 'selected' : ''}>
                ${t.toUpperCase()}
              </option>
            `).join('')}
        </select>

        <input id="coa-category"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Kategori"
          value="${coa?.category || ''}"
        />

        <input id="coa-ledger"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Ledger Key"
          value="${coa?.ledger_key || ''}"
        />

        <label class="flex items-center gap-2 text-sm">
          <input id="coa-postable" type="checkbox" class="rounded"
            ${coa?.is_postable ? 'checked' : ''}
          />
          Akun Bisa Dijurnal (Postable)
        </label>

        <label class="flex items-center gap-2 text-sm">
          <input id="coa-active" type="checkbox" class="rounded"
            ${coa?.is_active ?? 1 ? 'checked' : ''}
          />
          Aktif
        </label>

      </div>
    `,
didOpen: async () => {
  if (!isEdit) {
    const parentEl = document.getElementById('coa-parent');
    const typeEl   = document.getElementById('coa-type');

    await generateCOACodeByParent(parentEl.value);

    parentEl.addEventListener('change', e =>
      generateCOACodeByParent(e.target.value)
    );

    typeEl.addEventListener('change', () =>
      generateCOACodeByParent(parentEl.value)
    );
  }
}
,
    preConfirm: () => {
      const name = document.getElementById('coa-name').value.trim();
      if (!name) {
        Swal.showValidationMessage('Nama akun wajib diisi');
        return false;
      }

      return {
        parent_id: document.getElementById('coa-parent').value || null,
        code: document.getElementById('coa-code').value,
        name,
        type: document.getElementById('coa-type').value,
        category: document.getElementById('coa-category').value || null,
        ledger_key: document.getElementById('coa-ledger').value || null,
        is_postable: document.getElementById('coa-postable').checked ? 1 : 0,
        is_active: document.getElementById('coa-active').checked ? 1 : 0
      };
    },
    showCancelButton: true,
    confirmButtonText: isEdit ? 'Update' : 'Simpan'
  });

  if (!formData) return;

  const url = isEdit
    ? `${baseUrl}/coa/${coa.coa_id}`
    : `${baseUrl}/coa`;

  const method = isEdit ? 'PUT' : 'POST';

  await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });

  Swal.fire('Sukses', 'COA berhasil disimpan', 'success');
  loadCOA();
}
async function generateCOACodeByParent(parentId) {
  const codeInput = document.getElementById('coa-code');

  try {
    let url;

    // ===============================
    // ROOT COA (LEVEL 1)
    // ===============================
    if (!parentId) {
      const type = document.getElementById('coa-type')?.value;

      if (!type) {
        codeInput.value = '';
        return;
      }

      url = `${baseUrl}/coa/next-code?type=${type}`;
    }
    // ===============================
    // CHILD COA
    // ===============================
    else {
      url = `${baseUrl}/coa/next-code?parent_id=${parentId}`;
    }

    const res = await apiGet(url);

    if (!res?.next_code) {
      throw new Error('Next COA code not returned');
    }

    codeInput.value = res.next_code;

  } catch (err) {
    console.error('generateCOACodeByParent error:', err);
    codeInput.value = '';
    Swal.fire(
      'Error',
      'Gagal menghasilkan kode COA. Silakan coba lagi.',
      'error'
    );
  }
}

async function deleteCOA(id, name=null) {
  const result = await Swal.fire({
    title: 'Nonaktifkan COA?',
    text: `Akun "${name}" akan dinonaktifkan`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, nonaktifkan',
    cancelButtonText: 'Batal',
    customClass: {
      confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-lg',
      cancelButton: 'bg-gray-200 text-gray-700 px-4 py-2 rounded-lg'
    }
  });

  if (!result.isConfirmed) return;

  try {
    await fetch(`${baseUrl}/coa/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });



    Swal.fire({
      icon: 'success',
      title: 'Tunggu Progress',
      text: 'COA dinonaktifkan!',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      timer: 10000,
      timerProgressBar: true
    });

    setTimeout(() => {
       loadCOA();
    }, 10000);

  } catch (err) {
    Swal.fire('Error', 'Gagal menonaktifkan COA', 'error');
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
function formatAccountType(type) {
  const map = {
    asset: 'Asset',
    liability: 'Liability',
    equity: 'Equity',
    income: 'Income',
    expense: 'Expense'
  };
  return map[type] || type;
}




