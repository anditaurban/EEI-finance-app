pagemodule = 'Receiveable'
colSpanCount = 9;
setDataType('account/receivable');

if (window.detail_id && window.detail_desc) {
  // Mode update
  loadDetail(detail_id, detail_desc);
  document.getElementById('addButton').classList.add('hidden');
  document.getElementById('project').readOnly = true;
}else {
  // Mode tambah
  document.getElementById('updateButton').classList.add('hidden');

  setupAutoDropdown(
    "projectInput",        // id input pencarian
    "pesananIdInput",      // id input target
    "https://devapieei.katib.cloud/list/data/project", // API endpoint
    "project_name",        // field yang ditampilkan di dropdown
    "pesanan_id"           // field yang akan diset ke input target
  );
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

async function loadDetail(Id, Detail) {
  // Set judul form dan simpan ID global
  document.getElementById('formTitle').innerText = 'FORM RECEIVABLE DETAIL';
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
    document.getElementById('projectInput').value = detail.project_name || '';
    document.getElementById('po_number').value = detail.po_number || '';
    document.getElementById('project_amount').value = finance(detail.total_inv) || '';
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

async function loadInputData(){
    document.getElementById('pesananIdInput').value = selectedDropdownItem.pesanan_id || '';
    document.getElementById('client').value = selectedDropdownItem.pelanggan_nama || '';
    document.getElementById('project_amount').value = finance(selectedDropdownItem.total_order) || '';
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
