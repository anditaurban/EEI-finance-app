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
          <button onclick="event.stopPropagation(); handleEdit(${item.vendor_id}, '${item.nama}')"
            class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Edit Client">
            ✏️
          </button>
          <button onclick="openLinkCOAModal(${item.vendor_id}, '${item.coa_code}', '${item.coa_id}')"
            class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Link COA">
            🔗
          </button>
          <button onclick="event.stopPropagation(); handleDelete(${item.vendor_id}, '${item.nama}')"
            class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Delete Client">
            🗑️
          </button>
        </div>
      </td>

    </tr>
  `;
};

async function openLinkCOAModal(vendorId, coacode = null, currentCoaId = null) {
  Swal.fire({
    title: 'Link COA Vendor',
    width: 480,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    focusConfirm: false,
    customClass: {
      popup: 'rounded-2xl px-6 py-5',
      title: 'text-2xl font-bold text-gray-800 mb-6',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-semibold order-2',
      cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-600 px-8 py-2.5 rounded-xl text-sm font-semibold order-1'
    },
    html: `
      <div class="text-left">
        <div class="mb-4">
          <div class="text-sm font-bold text-gray-700">COA : ${coacode || '-'}</div>
          <div class="text-sm text-gray-600">AKTIVA | Aktiva Lancar | Piutang Usaha</div>
        </div>

        <div class="relative">
          <select id="coa_id"
            class="w-full h-12 rounded-xl border-2 border-blue-500 px-4 bg-white
                   focus:ring-0 focus:outline-none text-gray-700 appearance-none cursor-pointer">
            <option value="">- Pilih COA -</option>
          </select>
          <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>

        <div class="mt-2 text-sm text-gray-400">
          COA saat ini: <span class="font-medium text-gray-500">${currentCoaId || '-'}</span>
        </div>
      </div>
    `,
    didOpen: () => {
      // Pastikan fungsi ini sudah menggunakan endpoint /list/coa_piutang_usaha/
      loadCOAOptions(currentCoaId);
    },
    preConfirm: () => {
      const coaId = document.getElementById('coa_id').value;
      if (!coaId) {
        Swal.showValidationMessage('Silakan pilih COA terlebih dahulu');
        return false;
      }
      return { coa_id: parseInt(coaId) };
    }
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      // Update menggunakan endpoint sesuai revisi gambar Postman sebelumnya
      const res = await fetch(`${baseUrl}/update/vendor_coa/${vendorId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}` 
        },
        body: JSON.stringify(result.value)
      });

      const resData = await res.json();
      if (!res.ok) throw resData;

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'COA Vendor telah diperbarui',
        timer: 1500,
        showConfirmButton: false
      });
      
      // Refresh data tabel
      if (typeof fetchAndUpdateData === 'function') fetchAndUpdateData();

    } catch (err) {
      Swal.fire('Gagal', err.message || 'Terjadi kesalahan saat menyimpan data', 'error');
    }
  });
}

async function loadCOAOptions(selectedCoaId = null) {
  const select = document.getElementById('coa_id');
  if (!select) return;

  select.innerHTML = `<option value="">Loading...</option>`;

  try {
    const res = await fetch(`${baseUrl}/list/coa_hutang_usaha/${owner_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new TypeError("Server tidak mengembalikan JSON! Pastikan baseUrl benar.");
    }

    const result = await res.json();
    const listData = result.listData;

    select.innerHTML = `<option value="">- Pilih COA -</option>`;

    if (Array.isArray(listData)) {
      listData.forEach(coa => {
        const opt = document.createElement('option');
        opt.value = coa.coa_id;
        opt.textContent = `${coa.code} - ${coa.name}`;
        
        // Pilih otomatis jika coa_id cocok
        if (String(coa.coa_id) === String(selectedCoaId)) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    } else {
      select.innerHTML = `<option value="">Data tidak ditemukan</option>`;
    }

  } catch (error) {
    console.error('Gagal memuat data:', error);
    select.innerHTML = `<option value="">Gagal memuat data</option>`;
  }
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
