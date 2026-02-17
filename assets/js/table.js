let dataItems = null;
let colSpanCount = null;
let currentDataType = null;
let debounceTimeout;
let accountOptions = [];
let itemCounter = 0;
let daftarKlien = [];
let customerList = [];
let produkList = [];
let regionList = []; 



function setDataType(type) {
    currentDataType = type;
}

function debounceSearch() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchData();
    }, 500);
  }
  
  async function searchData() {
      const searchInput = document.getElementById('searchInput').value;
  
      try {
        if (searchInput.length > 0) {
          currentDataSearch = searchInput;
        } else {
          currentDataSearch = "";
        }
    
        fetchAndUpdateData(detail_id);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }

  async function filterData(filter) {
    fetchAndUpdateData('', filter)
    document.getElementById("dropdownFilterMenu").classList.add("hidden");
  }

  async function resetfilterData() {
    currentFilterType = null;
  }

// ---------------------------------------
// LOAD DATA FUNCTIONS
// ---------------------------------------

async function fetchAndUpdateData(id = null, filter = '') {
    const tableBodyId = 'tableBody';
    showLoadingSpinner(document.querySelector(`#${tableBodyId}`));

    try {
        const response = await fetchData(currentDataType, state[currentDataType].currentPage, id, filter);
        if (!response || !response.tableData) throw new Error('Invalid response from the API');

        dataItems = response.tableData;
        dataSummary = response.summaryData;
        updateState(response);

        if (dataSummary) {
          loadSummary(dataSummary);
        }

        setTimeout(() => {
            loadData();
            updatePagination(); 
        }, 500);
    } catch (error) {
        showErrorLoadingData(document.querySelector(`#${tableBodyId}`));
    }
}

function showLoadingSpinner(tableBody) {
    const colSpanCount = tableBody.parentElement.querySelector('thead tr').children.length;
    tableBody.innerHTML = `
      <tr>
        <td colspan="${colSpanCount}">
          <div class="flex justify-center items-center py-6">
            <div class="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </td>
      </tr>
    `;
  }

const statusClassMap = {
  sales: {
    '1': 'bg-blue-100 text-blue-800',               //Diproses
    '2': 'bg-red-100 text-red-800',                 //Menunggu Pembayaran
    '3': 'bg-green-100 text-green-800',             //Pembayaran Lunas
    '4': 'bg-gray-100 text-gray-800',               //Dibatalkan
    '5': 'bg-gray-100 text-gray-800',               //Retur
    '6': 'bg-yellow-100 text-yellow-800',           //Pembayaran Sebagian
    '7': 'bg-yellow-100 text-yellow-800',           //Pembayaran Sedang Diverifikasi
    '8': 'bg-green-100 text-green-800'              //Paket Terkirim
  },
  sales_receipt: {
    '1': 'bg-yellow-100 text-yellow-800',           //Menunggu Validasi
    '2': 'bg-green-100 text-green-800',             //Valid
    '3': 'bg-red-100 text-red-800'                  //Tidak Valid"
  },
  sales_package: {
    '1': 'bg-red-100 text-red-800',                 //Menunggu Pengepakan
    '2': 'bg-blue-100 text-blue-800',               //Paket Siap
    '3': 'bg-green-100 text-green-800',             //Diproses
    '4': 'bg-blue-100 text-blue-800',               //Paket Dikirim
    '5': 'bg-yellow-100 text-yellow-800'            //Sedang Dipack
  },
  sales_shipment: {
    '1': 'bg-red-100 text-red-800',                 //Menunggu Kurir"
    '2': 'bg-green-100 text-green-800'              //Paket Dikirim
  }
};

function getStatusClass(status) {
//   console.log('Status=' , status)
//   console.log('Type=' , currentDataType)
  if (!status) return 'bg-gray-100 text-gray-800';
  const type = currentDataType; // sales, receipt, package, shipment
  const map = statusClassMap[type] || {};
  const key = status;
  return map[key] || map['default'] || 'bg-blue-100 text-blue-800';
}

function updateState(response) {
    state[currentDataType].totalPages = response.totalPages;
    state[currentDataType].totalRecords = response.totalRecords;
}

function showErrorLoadingData(tableBody) {
    setTimeout(() => {
        tableBody.innerHTML = `<tr><td colspan="${colSpanCount}" style="text-align: center; color: red; font-weight: bold;">Error Loading Data</td></tr>`;
    }, 500);
}

function loadData() {
    const tableBody = document.querySelector('#tableBody');
    if (!tableBody) {
        console.error(`Table body element not found for ${currentDataType}`);
        return;
    }

    tableBody.innerHTML = '';
    if (!dataItems || dataItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${colSpanCount}" style="text-align: center; color: red; font-weight: bold;">No Data Available</td></tr>`;
        return;
    }

    dataItems.forEach((item, index) => {
        row = document.createElement('tr');

        const html = window.rowTemplate(item, index);
        const hasDropdown = html.includes('dropdown-menu');
        const action = hasDropdown;
    
        // Tambahkan class & event jika ada dropdown
        if (action) {
          row.classList.add('hover:bg-gray-50', 'cursor-pointer', 'transition', 'relative');
          row.onclick = function (e) {
            toggleDropdown(this, e);
          };
        }
        row.innerHTML = window.rowTemplate(item, index);
        tableBody.appendChild(row);
    });
}

function getTableBody() {
    switch(currentDataType) {
        case 'income':
            return document.querySelector('#incomeTableBody');
        case 'expense':
            return document.querySelector('#expenseTableBody');
        default:
            return document.querySelector('#tableBody');
    }
}

function updatePagination(paginationContainer, onPageChange) {
  const { currentPage, totalPages, totalRecords } = state[currentDataType];

  paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = '';

  // Buat wrapper utama yang akan membagi kiri-kanan
  const wrapper = document.createElement('div');
  wrapper.className = 'w-full flex justify-between items-center flex-wrap gap-2 text-sm text-gray-600';

  // Kiri: info jumlah data
  const info = document.createElement('div');
  info.textContent = `Total Data: ${totalRecords} | Halaman ${currentPage} dari ${totalPages}`;
  wrapper.appendChild(info);

  // Kanan: tombol navigasi
  const nav = document.createElement('div');
  nav.className = 'flex flex-wrap gap-1';

  function createButton(text, disabled, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = `px-3 py-1 rounded border text-sm 
      ${disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-blue-100 text-blue-700 border-blue-500'}`;
    btn.disabled = disabled;
    if (!disabled && typeof onClick === 'function') btn.addEventListener('click', onClick);
    return btn;
  }

  nav.appendChild(createButton('« First', currentPage === 1, () => onPageChange(1)));
  nav.appendChild(createButton('‹ Prev', currentPage === 1, () => onPageChange(currentPage - 1)));

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    const btn = createButton(i, false, () => onPageChange(i));
    if (isActive) {
      btn.className += ' font-bold bg-blue-500 text-white border-blue-700';
    }
    nav.appendChild(btn);
  }

  nav.appendChild(createButton('Next ›', currentPage === totalPages, () => onPageChange(currentPage + 1)));
  nav.appendChild(createButton('Last »', currentPage === totalPages, () => onPageChange(totalPages)));

  wrapper.appendChild(nav);
  paginationContainer.appendChild(wrapper);

//   //mobile
  const pageSelect = document.getElementById('pageSelect');
  if (!pageSelect) return;

//   // Kosongkan dulu
  pageSelect.innerHTML = '';

//   // Tambahkan opsi halaman
  for (let i = 1; i <= totalPages; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Halaman ${i}`;
    if (i === currentPage) option.selected = true;
    pageSelect.appendChild(option);
  }

//   // Tambahkan event onChange
  pageSelect.onchange = function () {
    const selectedPage = parseInt(this.value);
    if (!isNaN(selectedPage)) {
      onPageChange(selectedPage); // Fungsi pagination utama
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas
    }
  };


    function onPageChange(page){
        // Update state halaman saat ini
    if (!state[currentDataType]) {
      state[currentDataType] = {};
    }
    state[currentDataType].currentPage = page;
    fetchAndUpdateData(detail_id);
    }
  }
// function updatePagination(paginationContainer, onPageChange) {
//   // 1. Ambil State
//   // Pastikan ada default 'perPage' (biasanya 10) untuk menghitung "Showing 1 to 10"
//   const { currentPage, totalPages, totalRecords, perPage = 10 } = state[currentDataType];

//   // ---------------------------------------------------------
//   // A. UPDATE TEKS INFORMASI (Showing X to Y of Z)
//   // ---------------------------------------------------------
//   const infoTextElement = document.getElementById('infoText');
//   if (infoTextElement) {
//     if (totalRecords === 0) {
//       infoTextElement.textContent = "No data available";
//     } else {
//       const startRecord = (currentPage - 1) * perPage + 1;
//       const endRecord = Math.min(currentPage * perPage, totalRecords);
//       infoTextElement.textContent = `Showing ${startRecord} to ${endRecord} of ${totalRecords} entries`;
//     }
//   }

//   // ---------------------------------------------------------
//   // B. UPDATE TOMBOL PAGINATION
//   // ---------------------------------------------------------
//   const paginationBtnContainer = document.getElementById('pagination');
//   if (paginationBtnContainer) {
//     paginationBtnContainer.innerHTML = ''; // Reset tombol

//     // --- Helper Function: Buat Tombol ---
//     function createButton(label, isActive, isDisabled, onClick) {
//       const btn = document.createElement('button');
//       btn.innerHTML = label; // Pakai innerHTML biar bisa masuk icon SVG/Text
      
//       // Base Class (Ukuran, Font, Rounded)
//       let className = "px-3 py-1 rounded-md text-xs font-medium transition border ";

//       if (isActive) {
//         // Style: Halaman Aktif (Biru Solid)
//         className += "bg-blue-600 border-blue-600 text-white shadow-sm";
//       } else if (isDisabled) {
//         // Style: Disabled (Abu-abu pudar)
//         className += "bg-white border-gray-200 text-gray-300 cursor-not-allowed";
//       } else {
//         // Style: Normal (Putih, Border Abu)
//         className += "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
//       }

//       btn.className = className;
//       btn.disabled = isDisabled;

//       if (!isDisabled && typeof onClick === 'function') {
//         btn.addEventListener('click', onClick);
//       }
//       return btn;
//     }

//     // 1. Tombol PREV
//     const prevBtn = createButton('Prev', false, currentPage === 1, () => onPageChange(currentPage - 1));
//     paginationBtnContainer.appendChild(prevBtn);

//     // 2. Logic Angka Halaman (Windowing: biar tidak kepanjangan)
//     // Menampilkan: [1] ... [Current-1] [Current] [Current+1] ... [Last]
//     const maxVisibleButtons = 5;
//     let startPage = Math.max(1, currentPage - 1);
//     let endPage = Math.min(totalPages, currentPage + 1);

//     // Adjust jika di halaman awal/akhir
//     if (currentPage === 1) endPage = Math.min(totalPages, 3);
//     if (currentPage === totalPages) startPage = Math.max(1, totalPages - 2);

//     // Tampilkan tombol '1' jika range tidak mencakup 1
//     if (startPage > 1) {
//       paginationBtnContainer.appendChild(createButton('1', false, false, () => onPageChange(1)));
//       if (startPage > 2) {
//           // Dots (...)
//           const dots = document.createElement('span');
//           dots.className = "px-2 text-gray-400 text-xs";
//           dots.innerText = "...";
//           paginationBtnContainer.appendChild(dots);
//       }
//     }

//     // Loop Halaman Tengah
//     for (let i = startPage; i <= endPage; i++) {
//       const btn = createButton(i, i === currentPage, false, () => onPageChange(i));
//       paginationBtnContainer.appendChild(btn);
//     }

//     // Tampilkan tombol 'Last' jika range tidak mencakup halaman terakhir
//     if (endPage < totalPages) {
//       if (endPage < totalPages - 1) {
//           const dots = document.createElement('span');
//           dots.className = "px-2 text-gray-400 text-xs";
//           dots.innerText = "...";
//           paginationBtnContainer.appendChild(dots);
//       }
//       paginationBtnContainer.appendChild(createButton(totalPages, false, false, () => onPageChange(totalPages)));
//     }

//     // 3. Tombol NEXT
//     const nextBtn = createButton('Next', false, currentPage === totalPages || totalPages === 0, () => onPageChange(currentPage + 1));
//     paginationBtnContainer.appendChild(nextBtn);
//   }

//   // ---------------------------------------------------------
//   // C. MOBILE SELECT (Opsional - Jika masih dipakai)
//   // ---------------------------------------------------------
//   const pageSelect = document.getElementById('pageSelect');
//   if (pageSelect) {
//     pageSelect.innerHTML = '';
//     for (let i = 1; i <= totalPages; i++) {
//       const option = document.createElement('option');
//       option.value = i;
//       option.textContent = `Halaman ${i}`;
//       if (i === currentPage) option.selected = true;
//       pageSelect.appendChild(option);
//     }
//     // Hapus listener lama (cloning node) agar event tidak numpuk
//     const newSelect = pageSelect.cloneNode(true);
//     pageSelect.parentNode.replaceChild(newSelect, pageSelect);
    
//     newSelect.addEventListener('change', function() {
//       const val = parseInt(this.value);
//       if(!isNaN(val)) onPageChange(val);
//     });
//   }
// }
function showFormModal() {
    Swal.fire({
        title: 'Create New Data',
        html: formHtml,
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
            const fileInput = document.querySelector('#file');
            if (fileInput && fileInput.files.length > 0) {
                return getFormDataFile();
            }
            else {
                return getFormData();
            }
        }        
    }).then((result) => {
        if (result.isConfirmed) {
            const fileInput = document.querySelector('#file');
            if (fileInput && fileInput.files.length > 0) {
                handleCreateFile(result.value, detail_id); // Handle with file
            } else {
                handleCreate(result.value, detail_id); // Handle without file
            }
            currentDataSearch = '';
        }
    });
}

function getFormData() {
    const formElement = document.querySelector('#dataform');
    if (!formElement) {
        throw new Error('Form not found');
    }

    const formData = new FormData(formElement);
    const dataObj = {};
    const alwaysString = ['phone', 'whatsapp', 'no_npwp', 'nik']; // ← field yang jangan di-parse ke Number

    for (const [key, value] of formData.entries()) {
        const isArrayField = key.endsWith('[]');
        const cleanKey = isArrayField ? key.slice(0, -2) : key;

        const parsedValue = (!alwaysString.includes(cleanKey) && !isNaN(value) && value.trim() !== '') 
            ? Number(value) 
            : value;

        if (isArrayField) {
            if (!dataObj[cleanKey]) {
                dataObj[cleanKey] = [];
            }
            dataObj[cleanKey].push(parsedValue);
        } else {
            dataObj[cleanKey] = parsedValue;
        }
    }

    if (!validateFormData(dataObj)) {
        return false;
    } else {
        return dataObj;
    }
}




function handleCreate(formData, detail_id) {
    Swal.showLoading();
    console.log(formData);
    const createUrl = endpoints[currentDataType].create;
    console.log (createUrl);
    formData.owner_id = owner_id;
    fetch(createUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => handleCreateResponse(data, detail_id))
    .catch(() => showErrorAlert('Failed to save data. Please try again.'));
}

function getFormDataFile() {
    const formElement = document.querySelector('#dataformfile');
    if (!formElement) {
        throw new Error('Form not found');
    }

    const formDataFile = new FormData(formElement);

    if (!validateFormData(formDataFile)) { 
        return false;
    }

    return formDataFile;
}

function handleCreateFile(formDataFile, detail_id) {
    Swal.showLoading();
    const createUrl = endpoints[currentDataType].create;

    fetch(createUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`
        },
        body: formDataFile
    })
    .then(response => response.json())
    .then(data => handleCreateResponse(data, detail_id))
    .catch(() => showErrorAlert('Failed to save data. Please try again.'));
}

function handleCreateResponse(data, detail_id) {
    const message = data.data.message;
    const isSuccess = message === "Data successfully added";
    
    Swal.fire({
        icon: isSuccess ? 'success' : 'error',
        title: isSuccess ? 'Success' : 'Failed',
        text: message
    }).then(() => {
        fetchAndUpdateData(detail_id);
    });
}

function toggleDropdown(row, event) {
    const dropdown = row.querySelector('.dropdown-menu');
  
    document.querySelectorAll('.dropdown-menu').forEach(el => {
      if (el !== dropdown) el.classList.add('hidden');
    });

    const x = event.clientX;
    const y = event.clientY;
    
    dropdown.style.left = `${x}px`;
    dropdown.style.top = `${y}px`;
    
    if (dropdown) dropdown.classList.toggle('hidden');
}

function toggleFilterDropdown() {
  document.getElementById("dropdownFilterMenu").classList.toggle("hidden");
}
  
document.addEventListener('click', function (e) {
  // Tutup semua dropdown di dalam tabel ketika klik di luar <tr>
  if (!e.target.closest('tr')) {
    document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
  }

  // Tutup filter dropdown jika elemen ada
  const dropdownBtn = document.getElementById("dropdownFilterButton");
  const dropdownMenu = document.getElementById("dropdownFilterMenu");

  if (dropdownBtn && dropdownMenu) {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.add("hidden");
    }
  }
});

  
// ---------------------------------------
// DELETE DATA FUNCTIONS
// ---------------------------------------

function handleDelete(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const deleteUrl = `${endpoints[currentDataType].delete}/${id}`;
            console.log(deleteUrl);

            fetch(deleteUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => handleDeleteResponse(data))
            .catch(() => showErrorAlert('Failed to delete data. Please try again.'));
        }
    });
}

function handleDeleteResponse(data) {
    const message = data.data.message;
    const isSuccess = message === "Data successfully deleted";
    setTimeout(() => {
        Swal.fire({
            icon: isSuccess ? 'success' : 'error',
            title: isSuccess ? 'Deleted' : 'Failed',
            text: message
        }).then(() => {
            fetchAndUpdateData(detail_id);
        });
}, 500);
}


// ---------------------------------------
// UPDATE DATA FUNCTIONS
// ---------------------------------------

async function handleEdit(Id, Data, tab) {
    const updateUrl = endpoints[currentDataType].detail;
    const fullUrl = `${updateUrl}/${Id}`;

    try {
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('API URL Get Edit Data:', fullUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch item data');
        }

        const itemData = await response.json();
        console.log(itemData);
        if (!itemData.detail || itemData.detail.length === 0) {
            throw new Error('No item data found for editing');
        }

        const detailItem = itemData.detail;
        


        Swal.fire({
            title: `Edit ${Data}`,
            html: formHtml,
            showCancelButton: true,
            confirmButtonText: 'Save',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                Swal.showLoading();

                const fileInput = document.querySelector('#dataformfile input[type="file"]');
                const fileText = document.querySelector('#file_text');

                if (fileInput && fileInput.files.length > 0) {
                    return getFormDataFile(); // Handles file upload
                } 
                else if (fileText && fileText.value.trim() && fileText.value !== 'No image selected') {
                    return getFormDataWithExistingImage(fileText.value.trim()); // Uses existing image
                } 
                else {
                    return getFormData(); // Normal form data
                }
            },
            didOpen: async () => {
                await loadDropdownCall(tab);
                fillFormData(detailItem, tab);
                console.log(detailItem);

                //Set the file input label to the existing image name
                const fileInput = document.querySelector('#dataformfile input[type="file"]');
                const fileText = document.querySelector('#file_text');
                
                if (fileText && fileInput) {
                    fileInput.dataset.placeholder = fileText.value; // Custom attribute to indicate the selected image
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.showLoading();
                handleUpdate(Id, result.value);
            }
        });
    } catch (error) {
        console.error('Error while editing:', error);
        showErrorAlert(error.message);
    }
}

function getFormDataWithExistingImage(imagePath) {
    const formData = getFormDataFile();
    formData.append('existing_image', imagePath);
    return formData;
}

function handleUpdate(id, formData) {
    const updateUrl = `${endpoints[currentDataType].update}/${id}`;

    // Check if formData is FormData (file upload) or a regular object
    const isMultipart = formData instanceof FormData;

    if (!isMultipart) {
        formData.owner_id = owner_id;
    } else {
        formData.append('owner_id', owner_id);
    }

    console.log(formData);
    fetch(updateUrl, {
        method: 'PUT', // Use POST for form-data, some APIs allow PUT with form-data too
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            ...(isMultipart ? {} : { 'Content-Type': 'application/json' }) // Do not set Content-Type for FormData
        },
        body: isMultipart ? formData : JSON.stringify(formData)
    })
    
    .then(response => response.json())
    .then(data => handleUpdateResponse(data))
    .catch(() => showErrorAlert('Failed to update data. Please try again.'));
}

function handleUpdateResponse(data) {
    const message = data.data.message;
    const isSuccess = message === "Data successfully updated";

    Swal.fire({
        icon: isSuccess ? 'success' : 'error',
        title: isSuccess ? 'Success' : 'Failed',
        text: message
    }).then(() => {
        fetchAndUpdateData(detail_id);
    });
}



