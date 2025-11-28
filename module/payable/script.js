pagemodule = 'User'
colSpanCount = 9;
setDataType('account_payable');
fetchAndUpdateData();

function validateFormData(formData, requiredFields = []) {
  console.log('Validasi Form');
  for (const { field, message } of requiredFields) {
    if (!formData[field] || formData[field].trim() === '') {
      alert(message);
      return false;
    }
  }
  return true;
} 

async function fillFormData(data) {
  console.log(data);
  // Helper untuk menunggu sampai <option> tersedia
  async function waitForOption(selectId, expectedValue, timeout = 3000) {
    return new Promise((resolve) => {
      const interval = 100;
      let waited = 0;

      const check = () => {
        const select = document.getElementById(selectId);
        const exists = Array.from(select.options).some(opt => opt.value === expectedValue?.toString());
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

  // Pastikan value bertipe string
  const roleValue = data.role || '';
//   const levelValue = data.level || '';

  // Tunggu sampai option-nya ada
  await waitForOption('formRole', roleValue);
//   await waitForOption('formLevel', levelValue);

  // Set nilai ke form
  const formRole = document.getElementById('formRole');
//   const formLevel = document.getElementById('formLevel');
  formRole.value = roleValue;
//   formLevel.value = levelValue;

  document.getElementById('formName').value = data.name || '';
  document.getElementById('formPhone').value = String(data.wa_login || '');
  document.getElementById('formEmail').value = data.email || '';
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

function loadDropdownCall() {
  // loadDropdown('formProject', `${baseUrl}/list/project_won/${owner_id}`, 'pesanan_id', 'project_name');
  // loadDropdown('formPM', `${baseUrl}/list/project_manager/${owner_id}`, 'project_manager_id', 'name');
} 


  window.rowTemplate = function (item, index, perPage = 10) {
    const { currentPage } = state[currentDataType];
    const globalIndex = (currentPage - 1) * perPage + index + 1;
  
    return `
  <tr class="flex flex-col sm:table-row border rounded sm:rounded-none mb-4 sm:mb-0 shadow-sm sm:shadow-none transition hover:bg-gray-50">  
  
    <td class="px-6 py-4 text-sm text-gray-700  w-[15%] border-b sm:border-0 sm:table-cell  align-top">
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

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 sm:table-cell  align-top">
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

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell  align-top">
      <span class="font-medium sm:hidden">Email</span>
      <span class="uppercase">${item.vendor}</span>
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell  align-top">
      <span class="font-medium sm:hidden">Email</span>
      ${item.detail_inv}
    </td>
   

<td class="px-6 py-4 text-sm text-gray-700 text-right w-[15%] align-top">
  <div class="flex flex-col space-y-1">
      <div class="flex justify-between">
        <span class="font-medium">Amount</span>
        <span class="font-semibold text-gray-600">${finance(item.total_inv)}</span>
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

    ${
      (item.ppn_nominal && item.ppn_nominal != 0) || (item.pph_nominal && item.pph_nominal != 0)
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
    <button onclick="event.stopPropagation(); loadModuleContent('receivable_form', '${item.payable_id}', '${item.project_name}');" class="block w-full text-left px-4 py-2 hover:bg-gray-100">✏️ Edit</button>
    <button onclick="event.stopPropagation(); handleDelete(${item.payable_id})" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
      🗑 Delete
    </button>
  </div>
</td>


  </tr>`;
  };
  
  document.getElementById('addButton').addEventListener('click', () => {
    // showFormModal();
    // loadDropdownCall();
    loadModuleContent('payable_form');
  });

  formHtml = `
<form id="dataform" class="space-y-2">

<input type="hidden" name="app_ids[]" value="11">
<input id="formCompany" name="company" value="MKI" type="text" class="hidden form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
    

  <label for="formName" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Nama</label>
  <input id="formName" name="nama" type="text" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
  

  <label for="formPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Phone</label>
  <input id="formPhone" name="phone" type="text" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">

  <label for="formEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Email</label>
  <input id="formEmail" name="email" type="email" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">



  <label for="formRole" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Role</label>
  <select id="formRole" name="role" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
    <option value="">Pilih Role</option>
    <option value="superadmin">Super Admin</option>
    <option value="sales">Sales</option>
    <option value="finance">Finance</option>
    <option value="packing">Packing</option>
    <option value="shipping">Shipping</option>
    <option value="viewer">Viewer</option>
  </select>

</form>

  `
requiredFields = [
    { field: 'formProject', message: 'Project Name is required!' },
    { field: 'formPM', message: 'Project Manager is required!' },
    { field: 'formStartDate', message: 'Starting Date is required!' },
    { field: 'formDeadline', message: 'Deadline is required!' }
  ];  



