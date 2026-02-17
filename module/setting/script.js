  function switchSettingTab(panelId, btnElement) {
    // 1. Hide all panels
    document.querySelectorAll('.setting-panel').forEach(el => el.classList.add('hidden'));
    
    // 2. Show selected panel
    document.getElementById(panelId + 'Panel').classList.remove('hidden');

    // 3. Reset Sidebar Styles
    document.querySelectorAll('.setting-tab').forEach(el => {
      // Reset to inactive style (Gray)
      el.className = 'setting-tab group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer';
      
      // Reset Icon Color inside
      const icon = el.querySelector('svg');
      if(icon) icon.setAttribute('class', 'w-5 h-5 text-gray-400 group-hover:text-gray-500');
    });

    // 4. Set Active Sidebar Style
    // Active style (Blue)
    btnElement.className = 'setting-tab active-setting-tab group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 transition-colors cursor-pointer';
    
    // Set Icon Color Active
    const activeIcon = btnElement.querySelector('svg');
    if(activeIcon) activeIcon.setAttribute('class', 'w-5 h-5 text-blue-500 group-hover:text-blue-700');
  }