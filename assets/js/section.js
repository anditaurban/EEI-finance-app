document.getElementById('logout').addEventListener('click', function () {
  Swal.fire({
    title: 'Yakin ingin logout?',
    text: "Anda harus login kembali untuk mengakses aplikasi.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e3342f',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      sessionStorage.clear();
      localStorage.clear();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil logout!',
        showConfirmButton: false,
        timer: 1200
      }).then(() => {
        window.location.href = 'login';
      });
    }
  });
});


if (owner_id || user_id || level || name) {
    // const welcomeMessageSpan = document.getElementById('nameUser');
    // welcomeMessageSpan.textContent = `Hi, ${nama} 👋`;
}

// expandSidebar();
collapseSidebar()
// loadBadge();

function collapseSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
  
    // document.querySelectorAll('#sidebar .menu-text').forEach(el => el.classList.add('hidden'));
    sidebar.classList.add('w-16');
    sidebar.classList.remove('w-64');
    mainContent.classList.add('md:ml-16');
    mainContent.classList.remove('md:ml-64');
  }
  
  function expandSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
  
    document.querySelectorAll('#sidebar .menu-text').forEach(el => el.classList.remove('hidden'));
    sidebar.classList.remove('w-16');
    sidebar.classList.add('w-64');
    mainContent.classList.remove('md:ml-16');
    mainContent.classList.add('md:ml-64');
  }
  
  function toggleDarkMode() {
    document.body.classList.toggle('dark');
    document.body.classList.toggle('bg-gray-900');
  
    document.querySelectorAll('header, main, aside, footer, #mainCard, #userDisplay, #dynamicModule')
      .forEach(el => {
        el?.classList.toggle('bg-white');
        el?.classList.toggle('bg-gray-800');
        el?.classList.toggle('text-gray-900');
        el?.classList.toggle('text-white');
      });
  
    const mode = document.body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', mode);
  }



    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const desktopToggle = document.getElementById('desktopToggle');
    desktopToggle?.addEventListener('click', () => {
        if (window.innerWidth < 768) {
            sidebar.classList.toggle('hidden');
        } else {
            sidebar.classList.contains('w-16') ? expandSidebar() : collapseSidebar();
        }
    })

    document.getElementById('toggleTheme')?.addEventListener('click', toggleDarkMode);
    document.getElementById('mobileToggleTheme')?.addEventListener('click', toggleDarkMode);


const dropdowns = [
  { toggle: 'userDropdownToggle', menu: 'userDropdown' },
  { toggle: 'notificationToggle', menu: 'notificationDropdown' },
  { toggle: 'apiIndicatorToggle', menu: 'apiIndicatorDropdown' }
];

// Pasang event click toggle
dropdowns.forEach(({ toggle, menu }) => {
  const btn = document.getElementById(toggle);
  const dropdown = document.getElementById(menu);

  btn?.addEventListener('click', () => {
    dropdown?.classList.toggle('hidden');
  });
});

// Klik di luar → tutup semua dropdown
document.addEventListener('click', (e) => {
  dropdowns.forEach(({ toggle, menu }) => {
    const btn = document.getElementById(toggle);
    const dropdown = document.getElementById(menu);

    if (!btn?.contains(e.target) && !dropdown?.contains(e.target)) {
      dropdown?.classList.add('hidden');
    }
  });
});

    // Mobile menu dropdown
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuDropdown = document.getElementById('mobileMenuDropdown');
  
    mobileMenuToggle?.addEventListener('click', () => {
      mobileMenuDropdown?.classList.toggle('hidden');
    });
  
    document.addEventListener('click', (e) => {
      if (!mobileMenuToggle?.contains(e.target) && !mobileMenuDropdown?.contains(e.target)) {
        mobileMenuDropdown?.classList.add('hidden');
      }
    });

// async function loadBadge() {
//   const badgeConfigs = [
//     { id: 'salesQtyBadge', endpoint: 'counting/sales_pending' },
//     { id: 'receiptQtyBadge', endpoint: 'counting/sales_receipt_unvalid' },
//     { id: 'packageQtyBadge', endpoint: 'counting/sales_package_unpack' },
//     { id: 'shipmentQtyBadge', endpoint: 'counting/sales_package_unshipped' },
//   ];

//   for (const config of badgeConfigs) {
//     try {
//       const response = await fetch(`${baseUrl}/${config.endpoint}/${owner_id}`, {
//         headers: {
//           'Authorization': `Bearer ${API_TOKEN}`
//         }
//       });

//       const data = await response.json();
//       const total = data?.countData?.total || 0;

//       const badge = document.getElementById(config.id);
//       if (badge) {
//         badge.textContent = total;
//         badge.style.display = total > 0 ? 'inline-block' : 'none';
//       }
//     } catch (error) {
//       console.error(`Gagal memuat data untuk ${config.id}:`, error);
//     }
//   }
// }



  // console.log (userRole);
   // Panggil fungsi saat halaman dimuat

const allMenus = {
  dashboard: { icon: '📊', label: 'Dashboard' },
  statement: { icon: '🏗️', label: 'Statement' },
  payable: { icon: '📤', label: 'Payable', badge: true },   // uang keluar
  receiveable: { icon: '📥', label: 'Receivable', badge: true }, // uang masuk
  expenses: { icon: '💸', label: 'Expenses'}, // pengeluaran
  report: { icon: '📑', label: 'Report' }, // laporan
};



  const roleMenus = {
    superadmin: Object.keys(allMenus),
  };

const createMenuItem = (key, menu) => {
  const badgeSpan = menu.badge
    ? `<span id="${key}QtyBadge" class="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">0</span>`
    : '';
  return `
    <a href="#" onclick="loadModuleContent('${key}')" class="flex items-center gap-2 py-2 px-2 hover:bg-blue-200 rounded-lg">
      <span>${menu.icon}</span> 
      <span class="menu-text">${menu.label}</span>
      ${badgeSpan}
    </a>`;
};


  function renderSidebar(role) {
    console.log(role);
    const allowed = roleMenus[role] || [];
    const menuContainer = document.getElementById('sidebarMenu');
    menuContainer.innerHTML = '';

    // Jika superadmin, tampilkan semua termasuk submenu
    if (role != 'Superadmin') {
      menuContainer.innerHTML = `
        ${createMenuItem('dashboard', allMenus.dashboard)}

        <div class="flex flex-col space-y-2">
          <div class="flex items-center gap-2 py-2 px-2 hover:bg-blue-200 rounded-lg cursor-pointer" onclick="toggleSubMenu('salesSubmenu')">
            <span>💼</span>
            <span class="menu-text flex justify-between items-center w-full">
              Penjualan
              <svg class="w-4 h-4 ml-auto transition-transform transform" id="salesSubmenuIcon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
          <div id="salesSubmenu" class="hidden ml-8 flex flex-col space-y-2">
            ${createMenuItem('sales', allMenus.sales)}
            ${createMenuItem('receipt', allMenus.receipt)}
            ${createMenuItem('package', allMenus.package)}
            ${createMenuItem('shipment', allMenus.shipment)}
          </div>
        </div>

        <div class="flex flex-col space-y-2">
          <div class="flex items-center gap-2 py-2 px-2 hover:bg-blue-200 rounded-lg cursor-pointer" onclick="toggleSubMenu('productSubmenu')">
            <span>📦</span>
            <span class="menu-text flex justify-between items-center w-full">
              Persediaan
              <svg class="w-4 h-4 ml-auto transition-transform transform" id="productSubmenuIcon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
          <div id="productSubmenu" class="hidden ml-8 flex flex-col space-y-2">
            ${createMenuItem('product', allMenus.product)}
            ${createMenuItem('bundling', allMenus.bundling)}
            ${createMenuItem('category', allMenus.category)}
          </div>
        </div>

        ${createMenuItem('contact', allMenus.contact)}
        ${createMenuItem('report', allMenus.report)}
        ${createMenuItem('employee', allMenus.employee)}
        ${createMenuItem('user', allMenus.user)}
        ${createMenuItem('setting_unit', allMenus.setting)}
      `;
    } else {
      // Role selain superadmin, menu dibuat flat
      allowed.forEach(key => {
        if (allMenus[key]) {
          menuContainer.innerHTML += createMenuItem(key, allMenus[key]);
        }
      });
    }
  }



renderSidebar(userRole);

// checkApiStatus();
// setInterval(loadBadge, 1000);
// setInterval(checkApiStatus, 10000)
