pagemodule = 'Payable'
colSpanCount = 9;
setDataType('account/payable');

if (window.detail_id && window.detail_desc) {
  // Mode update
  loadDetail(detail_id, detail_desc);
  document.getElementById('addButton').classList.add('hidden');
}else {
  // Mode tambah
  document.getElementById('updateButton').classList.add('hidden');
  // loadDropdown('formCategory', `${baseUrl}/list/product_category/${owner_id}`, 'category_id', 'category');
  // loadDropdown('formUnit', `${baseUrl}/list/product_unit/${owner_id}`, 'unit_id', 'unit');
  // loadDropdown('formStatus', `${baseUrl}/list/product_status/${owner_id}`, 'status_id', 'status');
  loadKategoriOptions();
  
  formattedToday = today.getFullYear() + '-' +
  String(today.getMonth() + 1).padStart(2, '0') + '-' +
  String(today.getDate()).padStart(2, '0');
  console.log(formattedToday);
  document.getElementById('formJoin').value = formattedToday;
}

function switchTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

  // Remove active styling
  document.querySelectorAll('.tab-link').forEach(btn => {
    btn.classList.remove('bg-blue-100', 'text-blue-600', 'font-semibold');
    btn.classList.add('text-gray-600');
  });

  // Show selected tab
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  // Set active tab link
  document.querySelector(`.tab-link[data-tab="${tabId}"]`).classList.add('bg-blue-100', 'text-blue-600', 'font-semibold');
  document.querySelector(`.tab-link[data-tab="${tabId}"]`).classList.remove('text-gray-600');
}

async function loadDropdown(selectId, apiUrl, valueField, labelField) {
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

async function loadDetail(Id, Detail) {
  // Set judul form dan simpan ID global
  document.getElementById('formTitle').innerText = 'FORM PAYABLE DETAIL';
  window.detail_id = Id;
  window.detail_desc = Detail;

  console.log('ID:', window.detail_id);
  console.log('DATA:', window.detail_desc);

  try {
    const res = await fetch(`${baseUrl}/detail/${currentDataType}/${Id}?_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { detail } = await res.json();
    console.log('DETAIL DATA:', detail);

    // Mapping data ke form
    document.getElementById('project').value = detail.project_name || '';
    document.getElementById('po_number').value = detail.po_number || '';
    document.getElementById('client').value = detail.client || '';
    document.getElementById('description').value = detail.description || '';
    document.getElementById('invoice_date').value = detail.inv_date || '';
    document.getElementById('invoice_number').value = detail.inv_number || '';
    document.getElementById('total_invoice').value = finance(detail.total_inv) || '';
    document.getElementById('currency').value = detail.currency || '';
    document.getElementById('rate').value = detail.currency === 'IDR' ? '1' : '';
    document.getElementById('ppn_percent').value = detail.ppn_percent || '';
    document.getElementById('ppn_nominal').value = finance(detail.ppn_nominal) || '';
    document.getElementById('pph_percent').value = detail.pph_percent || '';
    document.getElementById('pph_nominal').value = finance(detail.pph_nominal) || '';
    document.getElementById('total_after_tax').value = finance(detail.total_inv_tax) || '';

  } catch (err) {
    console.error('Gagal load detail:', err);
    Swal.fire({
      icon: 'error',
      title: 'Gagal Memuat Data',
      text: err.message || 'Terjadi kesalahan saat memuat data detail.',
    });
  }
}


async function loadKategoriOptions(Id, selectedIds = []) {
  try {
    const res = await fetch(`${baseUrl}/list/business_category/${owner_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    const result = await res.json();
    const kategoriList = result.listData || [];

    const container = document.getElementById('kategoriList');
    const countDisplay = document.getElementById('selectedCount');
    const searchInput = document.getElementById('searchKategori');

    container.innerHTML = '';
    countDisplay.textContent = `0 kategori dipilih`;

    // Pisahkan yang terpilih dan tidak terpilih
    const selectedItems = kategoriList.filter(item => selectedIds.includes(item.business_category_id));
    const unselectedItems = kategoriList.filter(item => !selectedIds.includes(item.business_category_id));
    const sortedList = [...selectedItems, ...unselectedItems];

    sortedList.forEach(item => {
      const checkboxWrapper = document.createElement('label');
      checkboxWrapper.className = "flex items-start gap-2 p-2 border rounded hover:bg-gray-100 kategori-item";

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'kategori';
      checkbox.value = item.business_category_id;
      checkbox.className = 'mt-1';

      // Jika termasuk yang dipilih
      if (selectedIds.includes(item.business_category_id)) {
        checkbox.checked = true;
        checkboxWrapper.classList.add('bg-green-100'); // Warna hijau
      }

      const labelText = document.createElement('div');
      labelText.innerHTML = `<strong>${item.business_category}</strong><br><small>${item.description || ''}</small>`;

      checkboxWrapper.appendChild(checkbox);
      checkboxWrapper.appendChild(labelText);
      container.appendChild(checkboxWrapper);

      checkbox.addEventListener('change', () => updateSelectedCount());

      checkboxWrapper.dataset.category = `${item.business_category} ${item.description || ''}`.toLowerCase();
    });

    function updateSelectedCount() {
      const selected = container.querySelectorAll('input[name="kategori"]:checked').length;
      countDisplay.textContent = `${selected} kategori dipilih`;
    }

    // Inisialisasi count awal
    updateSelectedCount();

    // Pencarian
    searchInput.addEventListener('input', function () {
      const keyword = this.value.toLowerCase();
      const items = container.querySelectorAll('.kategori-item');

      items.forEach(item => {
        const text = item.dataset.category;
        item.style.display = text.includes(keyword) ? 'flex' : 'none';
      });
    });

  } catch (err) {
    console.error('Gagal load kategori:', err);
  }
}

function formatMembershipID(id) {
  return 'CUS-' + id.toString().padStart(5, '0');
}

function getDataPayload() {
  const getVal = id => document.getElementById(id).value.trim();

  const payload = {
    owner_id,
    user_id, 
    prefix: 'INV',
    project_id: getVal('project'),
    client: getVal('client'),
    po_number: getVal('po_number'),
    inv_number: getVal('invoice_number'),
    inv_date: getVal('invoice_date'),
    due_date: '', // bisa tambahkan input due_date di form jika diperlukan
    payment_date: '', // atau ambil dari detail pembayaran
    currency: getVal('currency'),
    total_inv: unfinance(getVal('total_invoice')), // ubah ke angka murni
    ppn_percent: getVal('ppn_percent'),
    ppn_nominal: unfinance(getVal('ppn_nominal')),
    pph_percent: getVal('pph_percent'),
    pph_nominal: unfinance(getVal('pph_nominal')),
    total_inv_tax: unfinance(getVal('total_after_tax')),
    akun: '', // bisa diisi nanti di tab akun
    description: getVal('description'),
    detail_inv: window.detail_desc || '',
    file: '' // handle upload file jika ada
  };

  console.log(payload);

  // Validasi wajib
  if (!payload.nama || !payload.whatsapp) {
    Swal.fire({
      icon: 'warning',
      title: 'Data wajib belum lengkap',
      text: 'Isi Nama, dan Whatsapp terlebih dahulu.',
    });
    return null;
  }

  return payload;
}

async function submitData(method, id = '') {
  const payload = getDataPayload();
  if (!payload) return;

  const isCreate = method === 'POST';
  const url = `${baseUrl}/${isCreate ? 'add' : 'update'}/client${id ? '/' + id : ''}`;
  const actionText = isCreate ? 'menyimpan' : 'memperbarui';
  const successText = isCreate ? 'ditambahkan' : 'diperbarui';

  const confirm = await Swal.fire({
    icon: 'question',
    title: isCreate ? 'Simpan Data?' : 'Perbarui Data?',
    text: `Apakah Anda yakin ingin ${actionText} data pelanggan ini?`,
    showCancelButton: true,
    confirmButtonText: `Ya, ${isCreate ? 'simpan' : 'perbarui'}`,
    cancelButtonText: 'Batal'
  });

  if (!confirm.isConfirmed) return;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.data && result.data.id) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: `Data pelanggan berhasil ${successText}.`
      });
      const { id } = result.data;
      loadModuleContent('contact');
    } else {
      throw new Error(result.message || `Gagal ${actionText} data pelanggan`);
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: error.message || `Terjadi kesalahan saat ${actionText} data.`
    });
  }
}

async function createData() {
  await submitData('POST');
}

async function updateData() {
  await submitData('PUT', detail_id);
}

input = document.getElementById('cityInput');
resultList = document.getElementById('resultList');

// Fungsi debounce
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Fungsi pencarian dan render hasil
async function searchCity(query) {
  if (!query.trim()) {
    resultList.innerHTML = '';
    resultList.classList.add('hidden');
    return;
  }

  try {
    const url = `https://region.katib.cloud/table/region/${owner_id}/1?search=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer 0f4d99ae56bf938a9dc29d4f4dc499b919e44f4d3774cf2e5c7b9f5395d05fc6`
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const results = data.tableData || [];

    resultList.innerHTML = results.length
      ? results.map(item => `
          <li class="px-3 py-2 border-b hover:bg-gray-100 cursor-pointer"
              data-kelurahan="${item.kelurahan}"
              data-kecamatan="${item.kecamatan}"
              data-kota="${item.kota}"
              data-provinsi="${item.provinsi}"
              data-kodepos="${item.kode_pos}"
              data-region_id="${item.region_id}">
              ${item.kelurahan}, ${item.kecamatan}, ${item.kota}, ${item.provinsi} ${item.kode_pos}
          </li>`).join('')
      : '<li class="px-3 py-2 text-gray-500">Tidak ditemukan</li>';

    resultList.classList.remove('hidden');

    // Tambahkan event listener untuk setiap <li>
    resultList.querySelectorAll('li[data-kelurahan]').forEach(li => {
      li.addEventListener('click', () => {
        document.getElementById('formregion_ID').value = li.dataset.region_id;
        document.getElementById('formKelurahan').value = li.dataset.kelurahan;
        document.getElementById('formKecamatan').value = li.dataset.kecamatan;
        document.getElementById('formKota').value = li.dataset.kota;
        document.getElementById('formProvinsi').value = li.dataset.provinsi;
        document.getElementById('formPOS').value = li.dataset.kodepos;

        input.value = li.textContent;
        resultList.classList.add('hidden');
      });
    });

  } catch (err) {
    console.error('Gagal ambil data wilayah:', err);
    resultList.innerHTML = '<li class="px-2 py-1 text-red-500">Gagal ambil data</li>';
    resultList.classList.remove('hidden');
  }
}

input.addEventListener('input', debounce((e) => {
  searchCity(e.target.value);
}, 400));
