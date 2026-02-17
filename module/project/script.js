pagemodule = 'Project Recap';
colSpanCount = 9;
setDataType('project-recap');
fetchAndUpdateData();

function loadSummary(dataSummary) {
  const summary = dataSummary || {};
  document.getElementById("summary_total_revenue").textContent = finance(
    summary.totalRevenue || 0
  );
  document.getElementById("summary_total_cost").textContent = finance(
    summary.totalCost || 0
  );
  document.getElementById("summary_net_profit").textContent = finance(
    summary.netProfit || 0
  );
}

window.rowTemplate = function (item, index, perPage = 10) {
  return `
    <tr class="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">

      <td class="px-6 py-4 align-top">
           <div class="space-y-1">
            <div class="font-bold text-gray-900 leading-snug">
              ${item.project_name}
            </div>
            
            <div class="text-xs text-gray-500">
              <span class="font-medium text-gray-700">${item.client}</span>
              <span class="text-gray-300 mx-1">•</span> 
              <span class="font-mono text-gray-400">#${item.project_number}</span>
            </div>

            <div class="pt-1">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                ${item.status}
              </span>
            </div>
          </div>
      </td>

      <td class="px-6 py-4 align-top">
        <div class="grid grid-cols-2 gap-x-8 gap-y-2">
          
          <div class="flex flex-col">
             <span class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Revenue</span>
             <span class="font-mono text-sm font-bold text-gray-900">${finance(item.revenue)}</span>
          </div>

          <div class="flex flex-col">
             <span class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Net Profit</span>
             <span class="font-mono text-sm font-bold text-emerald-600">${finance(item.profit)}</span>
          </div>

          <div class="flex flex-col">
             <span class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">HPP (Cost)</span>
             <span class="font-mono text-sm font-medium text-gray-600">${finance(item.hpp)}</span>
          </div>

          <div class="flex flex-col">
             <span class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Other Exp</span>
             <span class="font-mono text-sm font-medium text-gray-600">${finance(item.expense)}</span>
          </div>

        </div>
      </td>
    </tr>
  `;
};