<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ImportWizardModal from '$lib/components/ImportWizardModal.svelte';
  import ExportWizardModal from '$lib/components/ExportWizardModal.svelte';

  let selectedYear = '2026';
  let selectedPeriod = 'All Months';
  let showImportModal = false;
  let showExportModal = false;

  const monthlyRevenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 62000 },
    { month: 'Mar', revenue: 58000 },
    { month: 'Apr', revenue: 75000 },
    { month: 'May', revenue: 90000 },
    { month: 'Jun', revenue: 110000 },
    { month: 'Jul', revenue: 95000 },
    { month: 'Aug', revenue: 175000 },
    { month: 'Sep', revenue: 130000 },
    { month: 'Oct', revenue: 85000 },
    { month: 'Nov', revenue: 120000 },
    { month: 'Dec', revenue: 210000 }
  ];

  const maxRevenue = Math.max(...monthlyRevenueData.map(d => d.revenue));

  const topOccasions = [
    { name: 'Wedding Receptions', count: 18, share: 42, color: 'bg-emerald-500' },
    { name: 'Birthday Parties', count: 14, share: 32, color: 'bg-blue-500' },
    { name: 'Corporate Events', count: 7, share: 16, color: 'bg-amber-500' },
    { name: 'Anniversaries & Reunions', count: 4, share: 10, color: 'bg-purple-500' }
  ];

  const paymentMethods = [
    { name: 'GCash Mobile Transfer', percentage: 48, amount: 564000, color: 'bg-blue-500' },
    { name: 'Cash Deposit & On-Site', percentage: 34, amount: 399500, color: 'bg-emerald-500' },
    { name: 'Bank Transfer (BDO / BPI)', percentage: 18, amount: 211500, color: 'bg-purple-500' }
  ];

  const topDishes = [
    { dish: 'Lechon Pork Belly (Crispy Skin)', category: 'Pork', orders: 28, revenue: 168000 },
    { dish: 'BAM-I Special Cebuano Noodles', category: 'Pasta/Noodle', orders: 24, revenue: 72000 },
    { dish: 'Beef Caldereta Special', category: 'Beef', orders: 21, revenue: 147000 },
    { dish: 'Fish Fillet with Tartar Sauce', category: 'Seafood', orders: 19, revenue: 95000 },
    { dish: 'Mango Float & Buko Pandan', category: 'Dessert', orders: 26, revenue: 52000 }
  ];

  function handleExportCSV() {
    const csvRows = ['Month,Revenue (PHP)'];
    monthlyRevenueData.forEach(d => {
      csvRows.push(`"${d.month}",${d.revenue}`);
    });
    csvRows.push('');
    csvRows.push('Dish Name,Category,Orders Count,Total Sales (PHP)');
    topDishes.forEach(t => {
      csvRows.push(`"${t.dish}","${t.category}",${t.orders},${t.revenue}`);
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jayraldines_financial_reports_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportExcel() {
    showExportModal = true;
  }

  async function handleExportPDF() {
    try {
      if (window.electronAPI && window.electronAPI.reports && window.electronAPI.reports.exportCalendarPdf) {
        const defaultSavePath = `/home/villarias/Downloads/jayraldines_financial_report_${selectedYear}.pdf`;
        const success = await window.electronAPI.reports.exportCalendarPdf(defaultSavePath, parseInt(selectedYear), 8);
        if (success) {
          alert('Financial Report PDF generated and saved successfully!');
        } else {
          alert('PDF export was canceled or could not save to specified folder.');
        }
      } else {
        alert('PDF Export Service is available in the desktop application.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF document.');
    }
  }
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Header Bar & Filters -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
    <div>
      <h3 class="text-base font-extrabold text-slate-100 flex items-center gap-2">
        <img src="assets/icons/svg/reports.svg" alt="" class="w-5 h-5 opacity-80 nav-icon" />
        <span>Financial Reports & Business Intelligence</span>
      </h3>
      <p class="text-xs text-slate-400">Revenue trends, catering occasion breakdown, payment methods, and popular dish rankings.</p>
    </div>

    <!-- Export & Import Action Buttons -->
    <div class="flex flex-wrap items-center gap-2">
      <select class="bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 text-xs font-bold mr-1" bind:value={selectedYear}>
        <option value="2026">Year 2026</option>
        <option value="2025">Year 2025</option>
      </select>

      <Button variant="outline" size="sm" on:click={handleExportPDF} title="Print / PDF Report">
        <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 nav-icon" />
        <span>Export PDF</span>
      </Button>

      <Button variant="outline" size="sm" on:click={handleExportExcel} title="Export Excel .xlsx">
        <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 nav-icon" />
        <span>Export Excel</span>
      </Button>

      <Button variant="secondary" size="sm" on:click={handleExportCSV} title="Export CSV Data">
        <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 nav-icon" />
        <span>Export CSV</span>
      </Button>

      <Button size="sm" on:click={() => (showImportModal = true)}>
        <img src="assets/icons/svg/plus.svg" alt="" class="w-3.5 h-3.5 filter invert brightness-200" />
        <span>Import Data</span>
      </Button>
    </div>
  </div>

  <!-- Chart Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Chart 1: Monthly Revenue Bar Chart (Spans 2 columns) -->
    <Card className="md:col-span-2 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 class="font-bold text-slate-100 text-sm">Monthly Revenue Trend (₱)</h4>
          <p class="text-[11px] text-slate-400">Total catering sales breakdown for {selectedYear}</p>
        </div>
        <Badge variant="green">Annual Total: ₱1,275,000</Badge>
      </div>

      <!-- Bar Chart Component -->
      <div class="h-60 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-800/80 px-2">
        {#each monthlyRevenueData as item}
          <div class="flex-1 flex flex-col items-center gap-2 group relative">
            <!-- Tooltip -->
            <div class="absolute -top-8 hidden group-hover:flex bg-slate-950 border border-rose-500/40 text-rose-400 font-mono text-[10px] font-bold py-1 px-2 rounded-lg shadow-xl z-20 whitespace-nowrap">
              ₱{item.revenue.toLocaleString()}
            </div>
            
            <div
              class="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 transition-all duration-300 shadow-md shadow-emerald-500/20"
              style="height: {(item.revenue / maxRevenue) * 180}px;"
            ></div>
            <span class="text-[10px] font-bold text-slate-400">{item.month}</span>
          </div>
        {/each}
      </div>
    </Card>

    <!-- Chart 2: Catering Occasion Distribution -->
    <Card className="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <h4 class="font-bold text-slate-100 text-sm">Catering Occasions Breakdown</h4>
        <p class="text-[11px] text-slate-400">Share of events by occasion type</p>
      </div>

      <div class="space-y-4 pt-2">
        {#each topOccasions as occ}
          <div class="space-y-1 text-xs">
            <div class="flex justify-between font-semibold">
              <span class="text-slate-200">{occ.name}</span>
              <span class="text-slate-400">{occ.count} events ({occ.share}%)</span>
            </div>
            <div class="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div class="h-full {occ.color} rounded-full" style="width: {occ.share}%;"></div>
            </div>
          </div>
        {/each}
      </div>
    </Card>
  </div>

  <!-- Bottom Grid: Payment Methods & Popular Dishes -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Chart 3: Payment Method Preference -->
    <Card className="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <h4 class="font-bold text-slate-100 text-sm">Payment Methods Share</h4>
        <p class="text-[11px] text-slate-400">GCash vs Cash vs Bank Transfer</p>
      </div>

      <div class="space-y-4 pt-2">
        {#each paymentMethods as pm}
          <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div class="flex justify-between text-xs font-semibold">
              <span class="text-slate-200">{pm.name}</span>
              <span class="text-emerald-400">{pm.percentage}%</span>
            </div>
            <div class="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
              <div class="h-full {pm.color} rounded-full" style="width: {pm.percentage}%;"></div>
            </div>
            <p class="text-[10px] text-slate-400 text-right">Volume: ₱{pm.amount.toLocaleString()}</p>
          </div>
        {/each}
      </div>
    </Card>

    <!-- Table: Popular Menu Items Ranking -->
    <Card className="md:col-span-2">
      <div class="border-b border-slate-800 pb-3 mb-4">
        <h4 class="font-bold text-slate-100 text-sm">Top Popular Catering Menu Items</h4>
        <p class="text-[11px] text-slate-400">Ranked by client orders and revenue generated</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <th class="py-3 px-2">Dish Name</th>
              <th class="py-3 px-2">Category</th>
              <th class="py-3 px-2 text-center">Orders Count</th>
              <th class="py-3 px-2 text-right">Total Sales</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            {#each topDishes as item}
              <tr class="hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-2 font-bold text-slate-200">{item.dish}</td>
                <td class="py-3 px-2">
                  <Badge variant="secondary">{item.category}</Badge>
                </td>
                <td class="py-3 px-2 text-center font-semibold text-emerald-400">{item.orders} orders</td>
                <td class="py-3 px-2 text-right font-bold text-slate-100">₱{item.revenue.toLocaleString()}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</div>

<!-- Modals -->
<ImportWizardModal show={showImportModal} defaultEntity="all_in_one" onClose={() => (showImportModal = false)} />
<ExportWizardModal show={showExportModal} defaultEntity="all" onClose={() => (showExportModal = false)} />
