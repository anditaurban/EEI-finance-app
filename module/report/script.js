showInformation();

function showInformation() {
  document.getElementById('informationView').classList.remove('hidden');
  document.getElementById('btnInfo').classList.add('active');

  document.getElementById('overviewView').classList.add('hidden');
  document.getElementById('btnOverview').classList.remove('active');
  document.getElementById('historyView').classList.add('hidden');
  document.getElementById('btnHistory').classList.remove('active');
  document.getElementById('reportView').classList.add('hidden');
  document.getElementById('btnReport').classList.remove('active');  
  loadInfo();
  loadAnnouncements();
  loadWorkingProgress();
}
function showOverview() {
  document.getElementById('overviewView').classList.remove('hidden');
  document.getElementById('btnOverview').classList.add('active');

  document.getElementById('informationView').classList.add('hidden');
  document.getElementById('btnInfo').classList.remove('active');
  document.getElementById('historyView').classList.add('hidden');
  document.getElementById('btnHistory').classList.remove('active');
  document.getElementById('reportView').classList.add('hidden');
  document.getElementById('btnReport').classList.remove('active');
  loadReport();
  loadProfitLoss();
}
function showHistory() {
  document.getElementById('historyView').classList.remove('hidden');
  document.getElementById('btnHistory').classList.add('active');

  document.getElementById('informationView').classList.add('hidden');
  document.getElementById('btnInfo').classList.remove('active');
  document.getElementById('overviewView').classList.add('hidden');
  document.getElementById('btnOverview').classList.remove('active');
  document.getElementById('reportView').classList.add('hidden');
  document.getElementById('btnReport').classList.remove('active');
  loadHistory('daily');

}
function showReport() {
  document.getElementById('reportView').classList.remove('hidden');
  document.getElementById('btnReport').classList.add('active'); 
    
  document.getElementById('informationView').classList.add('hidden');
  document.getElementById('btnInfo').classList.remove('active');
  document.getElementById('overviewView').classList.add('hidden');
  document.getElementById('btnOverview').classList.remove('active');
  document.getElementById('historyView').classList.add('hidden');
  document.getElementById('btnHistory').classList.remove('active'); 
  loadReportMenu();
}

function switchRange(range) {
  currentRange = range;

  document.querySelectorAll('.range-btn')
    .forEach(btn => btn.classList.remove('active'));

  event.target.classList.add('active');

  loadHistory(range);
}

async function loadInfo() {
    document.getElementById('titleText').textContent = 'Welcome back,';
    document.getElementById('closingBalance').textContent = user.nama+'!';
    document.getElementById('infoText').textContent = 'Let’s make today productive and impactful.';
}
async function loadReport(year = null) {
    document.getElementById('titleText').textContent = 'ACCOUNT BALANCE';
    document.getElementById('infoText').textContent = '(saldo awal dan akhir setiap periode berjalan)';
  try {
    const selectedYear =
      year || document.getElementById('yearFilter')?.value || new Date().getFullYear();

    const startDate = `${selectedYear}-01-01`;
    const endDate   = `${selectedYear}-12-31`;

    const res = await fetch(
      `${baseUrl}/report/overview?owner_id=${owner_id}&startDate=${startDate}&endDate=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );

    const json = await res.json();
    const d = json.data;
    
    console.log('Data:', json);

    document.getElementById('openingBalance').textContent = formatRupiah(d.opening_balance);
    document.getElementById('cashIn').textContent = formatRupiah(d.cash_in);
    document.getElementById('cashOut').textContent = formatRupiah(d.cash_out);
    document.getElementById('netCash').textContent = formatRupiah(d.net_cash);
    document.getElementById('closingBalance').textContent = formatRupiah(d.closing_balance);

  } catch (err) {
    console.error(err);
  }
}
async function loadHistory(type) {
  const ctx = document.getElementById('historyChart').getContext('2d');

  if (chartInstance) chartInstance.destroy();

  const year =
    document.getElementById('yearFilter')?.value || new Date().getFullYear();

  const startDate = `${year}-01-01`;
  const endDate   = `${year}-12-31`;

  const res = await fetch(
    `${baseUrl}/report/history-chart?owner_id=${owner_id}&startDate=${startDate}&endDate=${endDate}&type=${type}`,
    {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    }
  );

  const json = await res.json();
  console.log('Data Graph:', json);

  const labels = json.data.map(row => formatLabel(row.label, type));
  const values = json.data.map(row => Number(row.value));

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        fill: true,
        tension: 0.4,
        backgroundColor: 'rgba(6,95,70,0.15)',
        borderColor: '#065f46',
        borderWidth: 2,
        pointRadius: 0
      }]
    },
    options: {
      plugins: { legend: { display: false }},
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
async function loadReportMenu() {}


async function loadAnnouncements() {
  const listEl = document.getElementById('announcementList');
  const countEl = document.getElementById('announcementCount');

  try {
    listEl.innerHTML = `
      <div class="text-gray-400 italic">
        Memuat pengumuman...
      </div>
    `;

    const res = await apiGet(
      `${baseUrl}/announcements/${owner_id}`
    );

    const data = res.data || [];
    countEl.innerText = data.length;

    if (!data.length) {
      listEl.innerHTML = `
        <div class="text-gray-400 italic">
          Tidak ada pengumuman
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';

    data.forEach(item => {
      const badge =
        item.type === 'urgent'
          ? `<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Urgent</span>`
          : `<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Info</span>`;

      listEl.innerHTML += `
        <div class="border-b pb-3 last:border-none">
          <div class="flex items-center justify-between mb-1">
            <div class="font-bold text-blue-800">
              ${item.title}
            </div>
            ${badge}
          </div>

          ${item.subtitle
            ? `<div class="text-xs text-gray-500 mb-1">${item.subtitle}</div>`
            : ''
          }

          <p class="leading-relaxed text-gray-700">
            ${item.content}
          </p>

          ${(item.start_date || item.end_date)
            ? `
              <div class="mt-2 text-xs text-gray-500">
                📅 ${item.start_date || ''} ${item.end_date ? '– ' + item.end_date : ''}
              </div>
            `
            : ''
          }
        </div>
      `;
    });

  } catch (err) {
    console.error('loadAnnouncements error:', err);
    listEl.innerHTML = `
      <div class="text-red-500 italic">
        Gagal memuat pengumuman
      </div>
    `;
  }
}
async function loadWorkingProgress() {
  try {
    const listEl = document.getElementById('workingProgressList');

    listEl.innerHTML = `
      <li class="text-gray-400 italic">
        Memuat data project...
      </li>
    `;

    const res = await apiGet(
      `${baseUrl}/project/working-progress/${owner_id}`
    );

    const projects = res.projects || [];
    const stats = res.stats || {};

    /* ===============================
     * RENDER PROJECT LIST
     * =============================== */
    listEl.innerHTML = '';

    if (!projects.length) {
      listEl.innerHTML = `
        <li class="text-gray-400 italic">
          Tidak ada project yang sedang berjalan
        </li>
      `;
    } else {
      projects.forEach(p => {
        listEl.innerHTML += `
          <li class="flex items-center justify-between gap-2">
            <span>
              ${p.project_name}
            </span>

            <span class="text-xs text-blue-700 font-medium">
              ${p.progress ?? 0}%
            </span>
          </li>
        `;
      });
    }

    /* ===============================
     * QUICK STATS
     * =============================== */
    document.getElementById('stat-active-projects').innerText =
      stats.active_projects ?? projects.length;

    document.getElementById('stat-ongoing-tasks').innerText =
      stats.ongoing_tasks ?? 0;

    document.getElementById('stat-pending-approvals').innerText =
      stats.pending_approvals ?? 0;

    document.getElementById('stat-new-announcements').innerText =
      stats.new_announcements ?? 0;

  } catch (err) {
    console.error('loadWorkingProgress error:', err);

    const listEl = document.getElementById('workingProgressList');
    listEl.innerHTML = `
      <li class="text-red-500 italic">
        Gagal memuat data project
      </li>
    `;
  }
}
async function loadProfitLoss(year = null) {
  try {
    const selectedYear =
      year || document.getElementById('yearFilter')?.value || new Date().getFullYear();

    const startDate = `${selectedYear}-01-01`;
    const endDate   = `${selectedYear}-12-31`;

    const res = await fetch(
      `${baseUrl}/report/profit-loss?owner_id=${owner_id}&startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );

    const json = await res.json();
    const d = json.data;
    
    console.log('Data LossProfit:', json);
    console.log('Data Years:', selectedYear);

    const total = d.income + d.hpp + d.expense;

    // ====== SUMMARY ======
    document.getElementById('profitIncome').textContent =
      `${formatRupiah(d.income)} (${percent(d.income, total)}%)`;

    document.getElementById('profitHpp').textContent =
      `${formatRupiah(d.hpp)} (${percent(d.hpp, total)}%)`;

    document.getElementById('profitExpense').textContent =
      `${formatRupiah(d.expense)} (${percent(d.expense, total)}%)`;

    const resultEl = document.getElementById('profitResult');
    resultEl.textContent =
      d.profit >= 0 ? `Laba ${formatRupiah(d.profit)}` : `Rugi ${formatRupiah(Math.abs(d.profit))}`;

    resultEl.className =
      `text-xl font-semibold ${d.profit >= 0 ? 'text-green-600' : 'text-red-600'}`;

    // ====== DONUT ======
    renderDonut(d);

  } catch (err) {
    console.error(err);
  }
}

function renderDonut(data) {
  const ctx = document.getElementById('donutChart').getContext('2d');

  if (donutInstance) donutInstance.destroy();

  donutInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pendapatan', 'HPP', 'Pengeluaran'],
      datasets: [{
        data: [data.income, data.hpp, data.expense],
        backgroundColor: ['#22c55e', '#facc15', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${formatRupiah(ctx.raw)}`
          }
        }
      }
    }
  });
}
function percent(value, total) {
  if (!total) return 0;
  return ((value / total) * 100).toFixed(0);
}
function formatLabel(label, type) {
  if (type === 'daily') {
    return new Date(label).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short'
    });
  }

  if (type === 'monthly') {
    const [year, month] = label.split('-');
    return new Date(year, month - 1).toLocaleDateString('id-ID', {
      month: 'short',
      year: 'numeric'
    });
  }

  return label; // yearly
}

