pagemodule = "Vendor";
colSpanCount = 9;
setDataType("vendor");
fetchAndUpdateData();


formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(angka || 0);
};
window.updateSummaryUI = function(summary) {
  if(!summary) return;
  
  // Sesuai dengan key JSON dari Postman Vendor
  document.getElementById('summary_total_vendors').innerText = summary.total_vendor || 0;
  
  const activeVendorsEl = document.getElementById('summary_active_vendors');
  if(activeVendorsEl) {
    activeVendorsEl.innerText = `${summary.active_vendor || 0} Active`;
  }
  
  document.getElementById('summary_payable_balance').innerText = formatRupiah(summary.outstanding_balance);
  document.getElementById('summary_overdue_bills').innerText = formatRupiah(summary.overdue_bills);
  document.getElementById('summary_active_po').innerText = summary.active_po || 0;
};


// --- REVISI: window.rowTemplate ---
window.rowTemplate = function (item) {
  // Mengambil data sesuai key di Postman (total_revenue dan active_project)
  const vendorRevenue = formatRupiah(item.total_revenue || 0);
  const vendorActiveProjects = item.active_project || 0;

  return `
    <tr class="hover:bg-gray-50 transition">
      
      <td class="px-6 py-4">
        <div class="font-bold text-gray-900">${item.nama || "-"}</div>
        <div class="text-xs text-gray-500">Code: VN-${item.vendor_id || "-"}</div>
        <div class="text-xs text-gray-500">COA: ${item.coa_code || "-"}</div>
        <div class="text-xs text-gray-500">${item.coa_name || "-"}</div>
      </td>

      <td class="px-6 py-4">
        <div class="space-y-1 text-gray-600">
          <div>${item.email || '-'}</div>
          <div>${item.phone || '-'}</div>
        </div>
      </td>

      <td class="px-6 py-4">
        <div class="flex flex-col gap-2">
          <span class="inline-flex px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 border rounded w-max">
            Retail
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-gray-600 bg-gray-50 border rounded w-max">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            Inactive
          </span>
        </div>
      </td>

      <td class="px-6 py-4 text-right">
        <div class="font-mono font-medium text-gray-900">${finance(item.total_revenue)}</div>
        <div class="text-xs text-gray-400">${item.active_project} Active Projects</div>
      </td>

      <td class="px-6 py-4 text-center">
        <div class="flex justify-center gap-2">
          <button onclick="event.stopPropagation(); handleEdit(${item.vendor_id}, '${item.nama}')"
            class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Edit Vendor">
            ✏️
          </button>
          <button onclick="openLinkCOAModal(${item.vendor_id}, '${item.coa_code}', '${item.coa_id}')"
            class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Link COA">
            🔗
          </button>
          <button onclick="event.stopPropagation(); handleDelete(${item.vendor_id}, '${item.nama}')"
            class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Delete Vendor">
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
<form id="dataform" class="space-y-5">

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

async function fillFormData(data) {
  // Karena data endpoint yang kamu berikan berbentuk objek tunggal (bukan array), 
  // kita handle agar bisa menerima data[0] atau data itu sendiri.
  const item = Array.isArray(data) ? data[0] : data;
  
  console.log("Filling Form with Data:", item);

  // 1. Hidden & Field Dasar
  const ownerIdEl = document.getElementById("owner_id");
  if (ownerIdEl) ownerIdEl.value = item.owner_id || "";

  // 2. Text Inputs (Sesuai ID di formHtml)
  const fields = [
    "nama", 
    "alias", 
    "email", 
    "phone", 
    "whatsapp", 
    "website", 
    "city_name", 
    "no_npwp"
  ];

  fields.forEach(field => {
    const el = document.getElementById(field);
    if (el) {
      el.value = item[field] || "";
    }
  });

  // 3. Textarea (Alamat)
  const alamatEl = document.getElementById("alamat");
  if (alamatEl) {
    alamatEl.value = item.alamat || "";
  }
}

function validateFormData(formData, requiredFields = []) {
  console.log("✅ Validasi Form dimulai...");

  for (const { field, message } of requiredFields) {
    if (!formData[field] || formData[field].trim() === "") {
      console.warn(`⚠️ Field kosong: ${field}`);
      alert(message); // bisa diganti SweetAlert kalau mau lebih cantik
      return false;
    }
  }

  console.log("✅ Semua field terisi");
  return true;
}