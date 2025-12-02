const ctx = document.getElementById('balanceChart').getContext('2d');

  // Dummy data
  const dataSets = {
    daily: {
      labels: ["Jul 09", "Jul 10", "Jul 11", "Jul 12", "Jul 13", "Jul 14", "Jul 15", "Jul 16", "Jul 17", "Jul 18", "Jul 19", "Jul 20", "Jul 21"],
      data: [1200000, 1800000, 2500000, 4200000, 3900000, 3500000, 2800000, 1800000, 3700000, 4100000, 1900000, 4000000, 3200000]
    },
    weekly: {
      labels: ["W1 May", "W2 May", "W3 May", "W4 May", "W1 Jun", "W2 Jun", "W3 Jun", "W4 Jun", "W1 Jul"],
      data: [45000000, 22000000, 25000000, 39000000, 32000000, 28000000, 30000000, 21000000, 20000000]
    },
    monthly: {
      labels: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      data: [18000000, 22000000, 30000000, 31000000, 42000000, 50000000, 29000000, 15000000, 19000000, 28000000, 33000000, 51000000]
    }
  };

  // Initial Chart
  let balanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataSets.daily.labels,
      datasets: [{
        label: 'Ending Balance',
        data: dataSets.daily.data,
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255,255,255,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.2)" } },
        y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.2)" } }
      }
    }
  });

  // Update function
  function updateChart(type) {
    balanceChart.data.labels = dataSets[type].labels;
    balanceChart.data.datasets[0].data = dataSets[type].data;
    balanceChart.update();

    // Update button styles
    ["daily", "weekly", "monthly"].forEach(btn => {
      document.getElementById(`btn-${btn}`).className = 
        `px-4 py-2 rounded-full font-semibold ${
          btn === type ? "bg-green-700 text-white" : "bg-white text-green-700"
        }`;
    });
  }