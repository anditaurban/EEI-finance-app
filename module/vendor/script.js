pagemodule = "Vendor";
colSpanCount = 9;
setDataType("vendor");
fetchAndUpdateData();

window.rowTemplate = function (item) {
  return `
    <tr class="hover:bg-gray-50 transition">
      
      <td class="px-6 py-4">
        <div class="font-bold text-gray-900">${item.nama}</div>
        <div class="text-xs text-gray-500">Code: CL-${item.vendor_id}</div>
        <div class="text-xs text-gray-500">COA: ${item.coa_code}</div>
        <div class="text-xs text-gray-500">${item.coa_name}</div>
      </td>

      <td class="px-6 py-4">
        <div class="space-y-1 text-gray-600">
          <div>${item.email || '-'}</div>
          <div>${item.phone || '-'}</div>
        </div>
      </td>

      <td class="px-6 py-4">
        <div class="flex flex-col gap-2">
          <span class="inline-flex px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 border rounded">
            Retail
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-gray-600 bg-gray-50 border rounded">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            Inactive
          </span>
        </div>
      </td>

      <td class="px-6 py-4 text-right">
        <div class="font-mono font-medium text-gray-900">Rp 15.000.000</div>
        <div class="text-xs text-gray-400">0 Active Projects</div>
      </td>

      <td class="px-6 py-4 text-center">
        <div class="flex justify-center gap-2">
          <button onclick="event.stopPropagation(); handleEdit(${item.pelanggan_id}, '${item.nama}')"
            class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Edit Client">
            ✏️
          </button>
          <button onclick="openLinkCOAModal(${item.pelanggan_id}, '${item.coa_id}')"
            class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Link COA">
            🔗
          </button>
          <button onclick="event.stopPropagation(); handleDelete(${item.pelanggan_id}, '${item.nama}')"
            class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Delete Client">
            🗑️
          </button>
        </div>
      </td>

    </tr>
  `;
};

async function openLinkCOAModal(clientId, currentCoaId = null) {
  Swal.fire({
    title: 'Link COA Vendor',
    width: 480,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    focusConfirm: false,
    customClass: {
      popup: 'rounded-2xl px-6 py-5',
      confirmButton:
        'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg',
      cancelButton:
        'bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg ml-3'
    },
    html: `
      <div class="text-left space-y-4">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            COA : 2-1100.00
            <br>KEWAJIBAN | Hutang Jangka Pendek | Hutang Usaha
          </label>
          <select id="coa_id"
            class="w-full h-11 rounded-lg border border-gray-300 px-3
                   focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="">- Pilih COA -</option>
          </select>

          <div class="text-xs text-gray-400 mt-1">
            COA saat ini:
            <span class="font-medium">${currentCoaId || '-'}</span>
          </div>
        </div>

      </div>
    `,
    didOpen: () => {
      loadCOAOptions(currentCoaId);
    },
    preConfirm: () => {
      const coaId = document.getElementById('coa_id').value;
      if (!coaId) {
        Swal.showValidationMessage('COA wajib dipilih');
        return false;
      }
      return { coa_id: coaId };
    }
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/client/${clientId}/link-coa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.value)
      });

      if (!res.ok) throw await res.json();

      Swal.fire('Berhasil', 'COA berhasil di-link ke client', 'success');
      loadTableData();

    } catch (err) {
      Swal.fire('Gagal', err.message || 'Gagal menyimpan COA', 'error');
    }
  });
}

async function loadCOAOptions(selectedCoaId = null) {
  const select = document.getElementById('coa_id');
  if (!select) return;

  const res = await fetch('/api/coa?type=asset');
  const { data } = await res.json();

  data.forEach(coa => {
    const opt = document.createElement('option');
    opt.value = coa.coa_id;
    opt.textContent = `${coa.code} - ${coa.name}`;
    if (String(coa.coa_id) === String(selectedCoaId)) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
}

document.getElementById('addButton').addEventListener('click', () => {
  showFormModal();
  loadDropdownCall();
});

async function fillFormData(data) {
  console.log("Fill Form Data:", data[0]);

  // Helper untuk menunggu <option> tersedia di select
  async function waitForOption(selectId, expectedValue, timeout = 3000) {
    return new Promise((resolve) => {
      const interval = 100;
      let waited = 0;

      const check = () => {
        const select = document.getElementById(selectId);
        if (!select) return resolve();
        const exists = Array.from(select.options).some(opt => opt.value == expectedValue);
        if (exists || waited >= timeout) {
          resolve();
        } else {
          waited += interval;
          setTimeout(check, interval);
        }
      };

      check();
    });
  }
  // Hidden field
  document.getElementById("owner_id").value = data[0].owner_id || "";
  document.getElementById("expired_date").value = "0000-00-00";
  document.getElementById("webshop").value = data.webshop || "YES";

  // Text input
  document.getElementById("productcode").value = data[0].productcode;
  document.getElementById("product").value = data[0].product;
  document.getElementById("description").value = data[0].description;
  document.getElementById("purchase_price").value = data[0].purchase_price;
  document.getElementById("price").value = data[0].price;

  // Tunggu option category & unit
  await waitForOption("category_id", data[0].category_id);
  await waitForOption("unit_id", data[0].unit_id);
  await waitForOption("brand_id", data[0].brand_id);

  // Set select value
  const categorySelect = document.getElementById("category_id");
  const unitSelect = document.getElementById("unit_id");
  const brandSelect = document.getElementById("brand_id");
  if (categorySelect) categorySelect.value = data[0].category_id || "";
  if (unitSelect) unitSelect.value = data[0].unit_id || "";
  if (brandSelect) brandSelect.value = data[0].brand_id || "";


  // File (hanya tampilkan nama file di file_text jika ada)
  if (data[0].picture) {
    document.getElementById("file_text").value = data[0].picture;
  } else {
    document.getElementById("file_text").value = "";
  }
}

async function loadDropdown(selectId, apiUrl, valueField, labelField) {
  console.log(selectId, apiUrl, valueField, labelField);
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">Loading...</option>`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log(`Data untuk ${selectId}:`, result);
    const listData = result.listData;

    select.innerHTML = `<option value="">Pilih...</option>`;

    if (Array.isArray(listData)) {
      listData.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[labelField];
        select.appendChild(option);
      });
    } else {
      console.error('Format listData tidak sesuai:', listData);
    }

  } catch (error) {
    console.error(`Gagal memuat data untuk ${selectId}:`, error);
    select.innerHTML = `<option value="">Gagal memuat data</option>`;
  }
}

function loadDropdownCall() {
  loadDropdown('category_id', `${baseUrl}/list/product_category/${owner_id}`, 'category_id', 'category');
  loadDropdown('unit_id', `${baseUrl}/list/product_unit/${owner_id}`, 'unit_id', 'unit');
  loadDropdown('brand_id', `${baseUrl}/list/product_brand/${owner_id}`, 'brand_id', 'nama_brand');
} 


formHtml = `
<form id="dataformfile"
      enctype="multipart/form-data"
      autocomplete="off"
      spellcheck="false"
      class="space-y-5">

  <!-- Hidden Owner ID -->
  <input type="hidden" name="owner_id" id="owner_id" value="${owner_id}">

  <!-- ROW 1 -->
  <div class="grid grid-cols-2 gap-5">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Nama Client</label>
      <input id="nama" name="nama"
        autocomplete="off" autocorrect="off" autocapitalize="off"
        class="w-full h-11 rounded-lg border border-gray-300 px-3
               focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Alias</label>
      <input id="alias" name="alias"
        autocomplete="off" autocorrect="off" autocapitalize="off"
        class="w-full h-11 rounded-lg border border-gray-300 px-3
               focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
    </div>
  </div>

  <!-- ROW 2 -->
  <div class="grid grid-cols-2 gap-5">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
      <input id="email" name="email" type="email"
        autocomplete="off" autocorrect="off" autocapitalize="off"
        class="w-full h-11 rounded-lg border border-gray-300 px-3
               focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
      <input id="phone" name="phone" inputmode="numeric"
        autocomplete="off" autocorrect="off" autocapitalize="off"
        class="w-full h-11 rounded-lg border border-gray-300 px-3
               focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
    </div>
  </div>

  <!-- ROW 3 -->
  <div class="grid grid-cols-2 gap-5">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
      <input id="whatsapp" name="whatsapp" inputmode="numeric"
        autocomplete="off" autocorrect="off" autocapitalize="off"
        class="w-full h-11 rounded-lg border border-gray-300 px-3
               focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
      <input id="website" name="website" type="url"
        autocomplete="off" autocorrect="off" autocapitalize="off"
        class="w-full h-11 rounded-lg border border-gray-300 px-3
               focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
    </div>
  </div>

  <!-- ALAMAT -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
    <textarea id="alamat" name="alamat" rows="3"
      autocomplete="off" autocorrect="off" autocapitalize="off"
      class="w-full rounded-lg border border-gray-300 px-3 py-2
             focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
  </div>

  <!-- ROW 4 -->
  <div class="grid grid-cols-2 gap-5">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Kota</label>
      <input id="city_name" name="city_name"
        autocomplete="off" autocorrect="off" autocapitalize="off"
        class="w-full h-11 rounded-lg border border-gray-300 px-3
               focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">NPWP</label>
      <input id="no_npwp" name="no_npwp"
        autocomplete="off" autocorrect="off" autocapitalize="off"
        class="w-full h-11 rounded-lg border border-gray-300 px-3
               focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
    </div>
  </div>

</form>
`;
