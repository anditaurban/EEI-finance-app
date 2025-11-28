const user = JSON.parse(localStorage.getItem('user') || '{}');

const owner_id = user.owner_id;
const user_id = user.user_id;
const status_active = user.user_status;
const level = user.level;
const nama = user.nama;
const userRole = user.role || 'guest';

// const default_module = 'dashboard';
const default_module = getDefaultModule(userRole);
// const default_module = 'product_form';

let currentScript = null;
let formHtml = null;
let h1Element = null;
let campaignTitle = null;
let responseData = "";
let loadingStart = 0;
let pagemoduleparent = "";
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const formattedDate = `${year}-${month}-${day}`;
let cashier_id = 0;
let current_date = formattedDate;

const scriptsToLoad = [
  `./assets/js/utils.js`,
  `./assets/js/api.js`,
  `./assets/js/table.js`
];

if (!owner_id || !user_id || !level || !nama) {
    window.location.href = 'login.html'; 
}


function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function finance(value) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0
  }).format(value);
}

function unfinance(value) {
  if (!value) return 0;
  let str = String(value).trim();
  str = str.replace(/[^\d,-]/g, '');
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}


function getDefaultModule(role) {
  const roleDefault = {
    superadmin: 'dashboard',
    sales: 'sales',
    finance: 'sales',
    shipping: 'package',
    packing: 'package',
  };
  return roleDefault[role] || 'dashboard';
}

async function loadSection(sectionPath) {
  try {
    const response = await fetch(sectionPath);
    if (response.ok) {
      return await response.text();
    } else {
      throw new Error(`Failed to load ${sectionPath}`);
    }
  } catch (error) {
    console.error(error);
    return `<div>Error loading ${sectionPath}</div>`;
  }
}

function loadScript(src, callback) {
  const script = document.createElement('script');
  script.src = src;
  script.onload = callback;
  script.onerror = () => console.error(`Error loading script: ${src}`);
  document.body.appendChild(script);
}

scriptsToLoad.forEach(script => loadScript(`${script}?v=${new Date().getTime()}`, () => {}));

async function loadAppSections() {
  const sectionDataDiv = document.getElementById("section-data");

  const [headNavbar, sideNavbar, mainContent, footNavbar, footer] = await Promise.all([
    loadSection(`section/headnavbar.html?v=${new Date().getTime()}`),
    loadSection(`section/sidenavbar.html?v=${new Date().getTime()}`),
    loadSection(`section/maincontent.html?v=${new Date().getTime()}`),
    loadSection(`section/footnavbar.html?v=${new Date().getTime()}`),
    loadSection(`section/footer.html?v=${new Date().getTime()}`)
  ]);

  sectionDataDiv.innerHTML = `${headNavbar}${sideNavbar}${mainContent}${footNavbar}${footer}`;
  modedev();
  addSideNavListeners();

  loadScript(`./assets/js/section.js?v=${new Date().getTime()}`, () => {});
  loadModuleContent(default_module);
}

function addSideNavListeners() {
  // const links = document.querySelectorAll('nav div ul li a');
  const links = document.querySelectorAll('nav a');
  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const module = link.getAttribute('data-module');
      loadModuleContent(module);
    });
  });
}

function showLoading() {
  loadingStart = Date.now();
  document.getElementById('loadingOverlay')?.classList.remove('hidden');
}

function hideLoading() {
  const elapsed = Date.now() - loadingStart;
  const delay = Math.max(0, 500 - elapsed); // pastikan minimal 1 detik

  setTimeout(() => {
    document.getElementById('loadingOverlay')?.classList.add('hidden');
  }, delay);
}

function loadModuleContent(module, Id, Detail, Detail2) {
  
  // showLoading();
  setActiveMenu(module);
  currentDataSearch='';
  fetch(`./module/${module}/data.html?v=${new Date().getTime()}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error loading module: ${module}`);
      }
      return response.text();
    })
    .then(data => {
      document.getElementById('content').innerHTML = data;

      if (data.trim() !== '') {
        window.detail_id = Id;
        window.detail_desc = Detail;
        window.detail2_desc = Detail2;
      }

      if (currentScript) {
        document.body.removeChild(currentScript);
      }

      currentScript = document.createElement('script');
      currentScript.src = `./module/${module}/script.js?v=${new Date().getTime()}`;
      document.body.appendChild(currentScript);
    })
    .catch(error => {
      console.error(error);
      document.getElementById('content').innerHTML = `<p>Error loading module ${module}</p>`;
    });
    hideLoading();
}

function collapseSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');

  document.querySelectorAll('#sidebar .menu-text').forEach(el => el.classList.add('hidden'));
  sidebar.classList.add('w-16');
  sidebar.classList.remove('w-64');
  mainContent.classList.add('md:ml-16');
  mainContent.classList.remove('md:ml-64');
}

window.onload = loadAppSections;
