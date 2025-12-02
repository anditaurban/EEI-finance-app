pagemodule = 'Setting Unit'
colSpanCount = 9;
setDataType('product_unit');
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

  document.getElementById('formUnit').value = data.unit || '';

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
     <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
    <span class="font-medium sm:hidden">Name</span>  
    ${item.unit_id}
    </td>
  
    <td class="px-6 py-4 text-sm text-gray-700 border-b sm:border-0 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Email</span>
      ${item.unit}
    </td>

    <td class="px-6 py-4 text-sm text-gray-700 flex justify-between sm:table-cell">
      <span class="font-medium sm:hidden">Role</span>
      ${item.status || 'NotAvailable'}
      <div class="dropdown-menu hidden fixed w-48 bg-white border rounded shadow z-50 text-sm">
       <button onclick="event.stopPropagation(); handleEdit(${item.unit_id}, '${item.unit.replace(/'/g, "\\'")}')" class="block w-full text-left px-4 py-2 hover:bg-gray-100">✏️ Edit User</button>
        <button onclick="event.stopPropagation(); handleDelete(${item.unit_id})" class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
          🗑 Delete User
        </button>
      </div>
    </td>
  </tr>`;
  };
  
  document.getElementById('addButton').addEventListener('click', () => {
    showFormModal();
    // loadDropdownCall();
  });

  formHtml = `
<form id="dataform" class="space-y-2">

  <label for="formUnit" class="block text-sm font-medium text-gray-700 dark:text-gray-200 text-left">Unit</label>
  <input id="formUnit" name="unit" type="text" class="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">

</form>

  `
requiredFields = [
    { field: 'formProject', message: 'Project Name is required!' },
    { field: 'formPM', message: 'Project Manager is required!' },
    { field: 'formStartDate', message: 'Starting Date is required!' },
    { field: 'formDeadline', message: 'Deadline is required!' }
  ];  



