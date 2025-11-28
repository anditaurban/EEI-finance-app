const isLocalhost = ['localhost', '127.0.0.1', 'finance.energieei.co.id'].includes(window.location.hostname);
const mode = isLocalhost ? 'development' : 'production';
const baseUrl = mode === 'production'
  ? 'https://apieei.katib.cloud'  //production
  : 'https://devapieei.katib.cloud';   //development
const API_TOKEN = 'DpacnJf3uEQeM7HN';

let url = null;
let currentDataSearch = '';
let currentFilterPIC = null;
let currentFilterStatus = null;
let currentFilterType = null;
let currentPeriod = 'weekly';
let chartType = 'bar';
let bundlingItems = [];

function modedev(){
  const devModeElement = document.getElementById('devmode');
  if (mode === 'development') {
    devModeElement.classList.remove('hidden');
    devModeElement.textContent = `<dev> ${mode} Mode URL: ${baseUrl}</dev>`;
  }
};


const defaultState = {
  currentPage: 1,
  totalPages: 1,
  totalRecords: 0,
  isSubmitting: false,
  loading: false,
  data: [],
  error: null
};

function modedev(){
  const devModeElement = document.getElementById('devmode');
  if (mode === 'development') {
    devModeElement.classList.remove('hidden');
    devModeElement.textContent = '<dev> Development Mode </dev>';
  }
};

const endpointList = [
  'account_payable',
  'account_receivable',
  'expenses/ledger'
];

// generate state otomatis
const state = endpointList.reduce((acc, type) => {
  acc[type] = { ...defaultState };
  return acc;
}, {});

// generate endpoints otomatis
const endpoints = endpointList.reduce((acc, type) => {
  acc[type] = {
    table: `${baseUrl}/table/${type}/${owner_id}`,
    list: `${baseUrl}/list/${type}/${owner_id}`,
    detail: `${baseUrl}/detail/${type}`,
    update: `${baseUrl}/update/${type}`,
    create: `${baseUrl}/add/${type}`,
    delete: `${baseUrl}/delete/${type}`,
  };
  return acc;
  
}, {});


async function checkApiStatus() {
//   console.log('Pengecekan Koneksi...');
  const statusEl = document.getElementById('apiIndicator');
  const textEl = document.getElementById('apiIndicatorText');
  try {
    const res = await fetch(`${baseUrl}/detail/user/${user_id}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const data = await res.json();

    if (res.ok && data.detail && data.detail.status_active === 'Active') {
    
      statusEl.textContent = '🟢';
      textEl.textContent = '🟢 API Connection OK';
      statusEl.classList.remove('text-red-600');
      statusEl.classList.add('text-green-600');

      // Simpan ke localStorage dengan expired time (1 jam)
      const expiredTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7 hari
      const userDetailWithExpiry = {
        value: data.detail,
        expiry: expiredTime
      };
      localStorage.setItem('user_detail', JSON.stringify(userDetailWithExpiry));
      const user_detail = JSON.parse(localStorage.getItem('user_detail') || '{}');
      const welcomeMessageSpan = document.getElementById('nameUser');
      welcomeMessageSpan.textContent = `Hi, ${user_detail.value.name} 👋`;
    } else {
      statusEl.textContent = '🔴';
      textEl.style.whiteSpace = 'pre-line';
      textEl.textContent = '🟢 API Connection OK,\n🔴 User Not Active';
      statusEl.classList.remove('text-green-600');
      statusEl.classList.add('text-red-600');
    }
  } catch (err) {
    console.error('Gagal konek ke API:', err);
    statusEl.textContent = '❌';
    textEl.textContent = '❌ API Connection Failed';
    statusEl.classList.remove('text-green-600');
    statusEl.classList.add('text-red-600');
  }
}


async function fetchData(type, page = 1, id = null, filter=null) {
  try {
    let url = id 
      ? `${endpoints[type].table}/${id}/${page}?search=${currentDataSearch}&${filter}` 
      : `${endpoints[type].table}/${page}?search=${currentDataSearch}&${filter}`;
    // console.log(url);
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });
    

    console.log ('Fetch URL=' , url)
    
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return { data: [], totalRecords: 0, totalPages: 0 };
  }
}

async function fetchList(type) {
  try {
    const url = `${endpoints[type].list}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });

    if (!response.ok) throw new Error(`Failed to fetch ${type} data: ${response.statusText}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error fetching ${type} list:`, error);
    return [];
  }
}

async function fetchById(type, id) {
  try {
    const response = await fetch(`${endpoints[type].detail}/${id}`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type} by ID:`, error);
    return null;
  }
}

async function updateData(type, id, payload) {
  try {
    const response = await fetch(`${endpoints[type].update}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error updating ${type} data:`, error);
    return null;
  }
}

async function createData(type, payload) {
  try {
    const body = JSON.stringify({ owner_id, ...payload });
    const response = await fetch(`${endpoints[type].create}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error creating ${type}:`, error);
    return null;
  }
}

async function createDataWithFile(type, payload) {
  try {
      const formDataFile = new FormData();

      // Append all payload fields to FormData
      for (const key in payload) {
          formDataFile.append(key, payload[key]);
      }

      // Append owner_id separately if needed
      if (owner_id) {
          formDataFile.append("owner_id", owner_id);
      }

      const response = await fetch(`${endpoints[type].create}`, {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${API_TOKEN}`
              // **DO NOT** manually set `Content-Type`, the browser will handle it automatically
          },
          body: formDataFile
      });

      if (!response.ok) throw new Error("Network response was not ok");
      
      return await response.json();
  } catch (error) {
      console.error(`Error creating ${type}:`, error);
      return null;
  }
}

async function deleteData(type, id) {
  try {
    const response = await fetch(`${endpoints[type].delete}/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
    return null;
  }
}