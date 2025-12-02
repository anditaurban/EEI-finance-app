let currentDataType = null;
let campaignId = null;

function setDataType(type) {
    currentDataType = type;
}

async function fetchAndUpdateData(id = null) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const tableBody = document.querySelector('#tableBody');
    
    // Show the loading spinner
    loadingSpinner.classList.remove('hidden');
    tableBody.innerHTML = ''; // Optionally clear previous data

    try {
        const response = await fetchData(currentDataType, state[currentDataType].currentPage, id);
        console.log(response);
        if (!response || !response.tableData) {
            throw new Error('Invalid response from the API');
        }

        dataItems = response.tableData;
        state[currentDataType].totalPages = response.totalPages;
        state[currentDataType].totalRecords = response.totalRecords;
        
        loadData();
        updatePagination(dataItems.length);

    } catch (error) {
        console.error('Error fetching data:', error);
        document.querySelector('#tableBody').innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-red-500">Error loading data</td></tr>';
    } finally {
        // Hide the loading spinner when done
        loadingSpinner.classList.add('hidden');
    }
}

function addTableEventListeners() {
    // View button listener
    const viewButtons = document.querySelectorAll('.viewButton');
    viewButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const id = this.getAttribute('data-id');
            if (currentDataType === 'campaign') {
                await handleCampaignView(id);
            }
        });
    });
    // Edit button listener
    const editButtons = document.querySelectorAll('.editButton');
    editButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const id = this.getAttribute('data-id');

            if (currentDataType === 'campaign') {
                const data = await fetchById(currentDataType, id);

                const toolDropdownList = document.getElementById('edit_toolDropdownList');
                toolDropdownList.classList.add('hidden');

                const tools = await fetchList('tool');
                if (tools.listData && Array.isArray(tools.listData)) {
                    populateEditToolDropdown(tools.listData);
                }
                
                if (data) {
                    populateEditModal(data);
                    document.getElementById('editModal').classList.remove('hidden');
                } else {
                    showErrorDialog(`Failed to load ${currentDataType} data.`);
                }

            } else if (currentDataType === 'admin') {
                // Fetch data and open the edit modal for other data types
                const data = await fetchById(currentDataType, id);
                
                if (data) {
                    populateEditModal(data);
                    document.getElementById('editModal').classList.remove('hidden');
                } else {
                    showErrorDialog(`Failed to load ${currentDataType} data.`);
                }
            } else if (currentDataType === 'detailcampaign') {
                // Fetch data and open the edit modal for other data types
                const data = await fetchById(currentDataType, id);
                const adminDropdownList = document.getElementById('edit_adminDropdownList');
                adminDropdownList.classList.add('hidden');
                console.log(campaignId);

                const admins = await fetchList('admin'); // Wait for the fetch to complete
                if (admins.listData && Array.isArray(admins.listData)) {
                    populateEditAdminDropdown(admins.listData);  // Pass the listData to the function
                }

                const toolDropdownList = document.getElementById('edit_toolDropdownList');
                toolDropdownList.classList.add('hidden');

                const tools = await fetchList('tool');
                if (tools.listData && Array.isArray(tools.listData)) {
                    populateEditToolDropdown(tools.listData);
                }
                
                if (data) {
                    populateEditModal(data);
                    document.getElementById('editModal').classList.remove('hidden');
                } else {
                    showErrorDialog(`Failed to load ${currentDataType} data.`);
                }
            } else if (currentDataType === 'tool') {
                // Fetch data and open the edit modal for other data types
                const data = await fetchById(currentDataType, id);
                
                if (data) {
                    populateEditModal(data);
                    document.getElementById('editModal').classList.remove('hidden');
                } else {
                    showErrorDialog(`Failed to load ${currentDataType} data.`);
                }
            }
        });
    });

    // Delete button listener remains the same for all data types
    const deleteButtons = document.querySelectorAll('.deleteButton');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            document.getElementById('confirmDeleteButton').setAttribute('data-id', id);
            document.getElementById('deleteModal').classList.remove('hidden');
        });
    });
}

async function handleCreate() {
    const formData = getFormData('create');
    if (currentDataType == 'detailcampaign') {
        // Get the selected admin ID and name
        const adminInput = document.getElementById('create_adminSearchDropdown');
        const selectedAdminId = adminInput.getAttribute('data-selected-id');
        const selectedAdminName = adminInput.value;

        // Add admin information to formData
        formData.cs_id = selectedAdminId;
        formData.cs_admin = selectedAdminName;
        formData.campaign_id = campaignId;
        formData.tool_id = 1;
        
        const toolInput = document.getElementById('create_toolSearchDropdown');
        const selectedToolId = toolInput.getAttribute('data-selected-id');
        const selectedCampaignType = toolInput.value;
    
        formData.tool_id = selectedToolId;
        formData.campaign_type = selectedCampaignType;
    }
    if (currentDataType == 'tool') {
        // Get the selected campaign ID and name
        const campaignInput = document.getElementById('create_campaignSearchDropdown');
        const selectedCampaignId = campaignInput.getAttribute('data-selected-id');
        const selectedCampaignName = campaignInput.value;

        // Add campaign information to formData
        formData.campaign_id = selectedCampaignId;
        formData.campaign_name = selectedCampaignName;
    }
    
    // Validation
    if (!validateFormData(formData, 'create')) {
        return;
    }

    // Call the create function from api.js
    const result = await createData(currentDataType, formData);
    console.log(formData);

    if (result) {
        showSuccessDialog(`${capitalize(currentDataType)} successfully created!`);
        clearForm('create');
        closeModal('createModal');
        if (currentDataType == 'detailcampaign') {
            await fetchAndUpdateData(campaignId);
        } else {
            await fetchAndUpdateData();
        }

    } else {
        showErrorDialog(`Failed to create ${currentDataType}. Please try again.`);
    }
}

async function handleEdit() {
    let id = null;
    if (currentDataType === 'admin') {
        id = document.getElementById(`cs_id`).value;
    } else if (currentDataType === 'campaign') {
        id = document.getElementById(`campaign_id`).value;
    } else if (currentDataType === 'detailcampaign') {
        id = document.getElementById(`cd_id`).value;
    } else if (currentDataType === 'tool') {
        id = document.getElementById('tool_id').value;
    }
    
    const formData = getFormData('edit');

    if (currentDataType == 'detailcampaign') {
        const adminInput = document.getElementById('edit_adminSearchDropdown');
        const selectedAdminId = adminInput.getAttribute('data-selected-id');
        const selectedAdminName = adminInput.value;

        // Always include cs_id and cs_admin, even if they haven't changed
        formData.cs_id = selectedAdminId;
        formData.cs_admin = selectedAdminName;
        formData.tool_id = 1;
        formData.campaign_id = campaignId;

        const toolInput = document.getElementById('edit_toolSearchDropdown');
        const selectedToolId = toolInput.getAttribute('data-selected-id');
        const selectedCampaignType = toolInput.value;
    
        formData.tool_id = selectedToolId;
        formData.campaign_type = selectedCampaignType;
    }
    
    // Validation
    if (!validateFormData(formData, 'edit')) {
        return;
    }
    console.log(formData);

    // Call the update function from api.js
    const result = await updateData(currentDataType, id, formData);
    console.log(result);

    if (result) {
        closeModal('editModal');
        showSuccessDialog(`${capitalize(currentDataType)} successfully updated!`);
        if (currentDataType == 'detailcampaign') {
            await fetchAndUpdateData(campaignId);
        } else {
            await fetchAndUpdateData();
        } 
    } else {
        showErrorDialog(`Failed to update ${currentDataType}. Please try again.`);
    }
}

async function handleDelete() {
    const id = document.getElementById('confirmDeleteButton').getAttribute('data-id');

    // Call the delete function from api.js
    const result = await deleteData(currentDataType, id);
    console.log(result);

    if (result) {
        showSuccessDialog(`${capitalize(currentDataType)} successfully deleted!`);

        if (currentDataType == 'detailcampaign') {
            await fetchAndUpdateData(campaignId);
        } else {
            await fetchAndUpdateData();
        }
        closeModal('deleteModal');
    } else {
        showErrorDialog(`Failed to delete ${currentDataType}. Please try again.`);
    }
}

// Helper functions
function getFormData(formType) {
    const formData = {};
    const form = document.getElementById(`${formType}Form`);
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (input.name === 'phone') {
            //if phone field is detected, add prefix '62' if it's not already present
            formData[input.name] = input.value.startsWith('62') ? input.value : `62${input.value}`;
        } else {
            formData[input.name] = input.value;
        }
    });
    return formData;
}

function validateFormData(formData) {
    // Add your validation logic here
    // Return true if valid, false otherwise
    return true;
}

function clearForm(formType) {
    const form = document.getElementById(`${formType}Form`);
    if (currentDataType == 'detailcampaign') {
        const adminInput = document.getElementById('create_adminSearchDropdown');
        adminInput.value = '';
        adminInput.removeAttribute('data-selected-id');
        document.getElementById('create_adminDropdownList').classList.add('hidden');
    }

    form.reset();
}

function populateEditModal(data) {
    const form = document.getElementById('editForm');
    for (const key in data) {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            if (key === 'phone') {
                const phoneNumberWithoutPrefix = data[key].startsWith('62') ? data[key].substring(2) : data[key];
                input.value = phoneNumberWithoutPrefix;
            } else if (key === 'cs_admin' && currentDataType === 'detailcampaign') {
                const adminInput = document.getElementById('edit_adminSearchDropdown');
                adminInput.value = data[key];
                adminInput.setAttribute('data-selected-id', data.cs_id);
            } else if (key === 'campaign_type' && currentDataType === 'detailcampaign') {
                const toolInput = document.getElementById('edit_toolSearchDropdown');
                toolInput.value = data.campaign_type;
                toolInput.setAttribute('data-selected-id', data.tool_id);
            } else {
                input.value = data[key];
            }
        }
    }
}

async function handleCampaignView(id) {
    campaignId = id;

    // Load the campaign-detail.html and associated script.js
    loadModuleContent('campaign-detail');
    
    // Fetch campaign data by ID and populate the detail page
    const campaignData = await fetchData('detailcampaign', state[currentDataType].currentPage, id);
    console.log(campaignData);
    if (!campaignData) {
        showErrorDialog('Failed to load campaign data.');
    }

}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize
fetchAndUpdateData();