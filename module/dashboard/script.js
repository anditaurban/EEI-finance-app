// Fetch active project count from API
async function fetchDashboardStats() {
	let activeProjects = 0;
	try {
		// Use baseUrl and API_TOKEN from global scope (api.js)
		const res = await fetch(`${baseUrl}/project`, {
			headers: { 'Authorization': `Bearer ${API_TOKEN}` }
		});
		console.log('API fetch response:', res);
		const data = await res.json();
		console.log('API response JSON:', data);
		if (Array.isArray(data.dataProject)) {
			// status === 1 is active
			activeProjects = data.dataProject.filter(p => p.status === 1).length;
			console.log('Active projects count:', activeProjects);
		} else {
			console.warn('dataProject is not an array:', data.dataProject);
		}
	} catch (e) {
		console.warn('Failed to fetch active projects:', e);
	}
	// You can fetch other stats here as needed
	return {
		activeProjects,
		ongoingTasks: 5, // TODO: Replace with real data if available
		pendingApprovals: 3, // TODO: Replace with real data if available
		newAnnouncements: 2 // TODO: Replace with real data if available
	};
}


function updateDashboardStats(stats) {
	console.log('Updating dashboard stats:', stats);
	const elActive = document.getElementById('stat-active-projects');
	const elOngoing = document.getElementById('stat-ongoing-tasks');
	const elPending = document.getElementById('stat-pending-approvals');
	const elAnnouncements = document.getElementById('stat-new-announcements');
	console.log('DOM elements:', {elActive, elOngoing, elPending, elAnnouncements});
	if (elActive) elActive.textContent = stats.activeProjects;
	if (elOngoing) elOngoing.textContent = stats.ongoingTasks;
	if (elPending) elPending.textContent = stats.pendingApprovals;
	if (elAnnouncements) elAnnouncements.textContent = stats.newAnnouncements;
}


// Insert user's name into dashboard welcome card
function updateDashboardUserName() {
  let userData = {};
  try {
    userData = JSON.parse(localStorage.getItem('user')) || {};
  } catch (e) {
    userData = {};
  }
  const nama = (typeof userData.nama === 'string' && userData.nama.trim() !== '') ? userData.nama : 'User';
  const welcomeNameSpan = document.querySelector('.welcome-dashboard-nama');
  if (welcomeNameSpan) welcomeNameSpan.textContent = nama;
}

// Wait for stat elements to exist before running stats update
function waitForStatsAndRun() {
  const elActive = document.getElementById('stat-active-projects');
  const elOngoing = document.getElementById('stat-ongoing-tasks');
  const elPending = document.getElementById('stat-pending-approvals');
  const elAnnouncements = document.getElementById('stat-new-announcements');
  const welcomeNameSpan = document.querySelector('.welcome-dashboard-nama');
  if (elActive && elOngoing && elPending && elAnnouncements && welcomeNameSpan) {
    updateDashboardUserName();
    fetchDashboardStats().then(updateDashboardStats);
  } else {
    setTimeout(waitForStatsAndRun, 50);
  }
}

waitForStatsAndRun();
