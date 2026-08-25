<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from '$lib/stores/toast';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ImportWizardModal from '$lib/components/ImportWizardModal.svelte';
  import ExportWizardModal from '$lib/components/ExportWizardModal.svelte';
  import type { ReportData } from '../../../../preload/types';

  type Period = 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time';
  const PERIODS: Period[] = ['Today', 'This Week', 'This Month', 'This Year', 'All Time'];

  let selectedPeriod: Period = 'All Time';
  let showImportModal = false;
  let showExportModal = false;
  let loading = true;
  let exportingPdf = false;
  let data: ReportData | null = null;

  const OCCASION_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-500'];
  const PAYMENT_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];

  async function loadReportData() {
    loading = true;
    try {
      data = await window.electronAPI.reports.getReportData(selectedPeriod);
    } catch (e) {
      console.error('[Reports] Failed to load report data:', e);
    } finally {
      loading = false;
    }
  }

  onMount(loadReportData);
  $: if (selectedPeriod) loadReportData();

  $: maxMonthlyRevenue = data ? Math.max(1, ...data.monthlyRevenue.map((d) => d.revenue)) : 1;
  $: annualTotal = data ? data.monthlyRevenue.reduce((s, d) => s + d.revenue, 0) : 0;

  function handleExportCSV() {
    if (!data) return;
    const csvRows = ['Month,Revenue (PHP)'];
    data.monthlyRevenue.forEach((d) => csvRows.push(`"${d.month}",${d.revenue}`));
    csvRows.push('');
    csvRows.push('Package Name,Orders,Total Revenue (PHP)');
    data.topPackages.forEach((t) => csvRows.push(`"${t.name}",${t.orders},${t.revenue}`));
    csvRows.push('');
    csvRows.push('Occasion,Bookings,Share (%)');
    data.occasionBreakdown.forEach((o) => csvRows.push(`"${o.name}",${o.count},${o.share}`));

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jayraldines_financial_reports_${selectedPeriod.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportExcel() {
    showExportModal = true;
  }

  async function handleExportPDF() {
    exportingPdf = true;
    try {
      const success = await window.electronAPI.reports.exportFinancialPdf(selectedPeriod);
      if (success) toast.success('Financial Report PDF generated and saved successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF document.');
    } finally {
      exportingPdf = false;
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
      <p class="text-xs text-slate-400">Revenue trends, catering occasion breakdown, payment methods, and package rankings.</p>
    </div>

    <!-- Export & Import Action Buttons -->
    <div class="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" disabled={exportingPdf} on:click={handleExportPDF} title="Print / PDF Report">
        <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 nav-icon" />
        <span>{exportingPdf ? 'Generating...' : 'Export PDF'}</span>
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

  <!-- Period Filter -->
  <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
    {#each PERIODS as p}
      <button
        class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all {selectedPeriod === p ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
        on:click={() => (selectedPeriod = p)}
      >
        {p}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="p-12 text-center text-slate-500">Loading report data...</div>
  {:else if data}
    <!-- KPI Row -->
    <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
      <Card className="p-3 space-y-1 border-l-4 border-l-blue-500">
        <p class="text-[10px] font-semibold text-slate-400 uppercase">Bookings</p>
        <h4 class="text-lg font-extrabold text-slate-100">{data.totalBookings}</h4>
      </Card>
      <Card className="p-3 space-y-1 border-l-4 border-l-emerald-500">
        <p class="text-[10px] font-semibold text-slate-400 uppercase">Revenue</p>
        <h4 class="text-lg font-extrabold text-emerald-400">₱{data.totalRevenue.toLocaleString()}</h4>
      </Card>
      <Card className="p-3 space-y-1 border-l-4 border-l-teal-500">
        <p class="text-[10px] font-semibold text-slate-400 uppercase">Total Pax</p>
        <h4 class="text-lg font-extrabold text-slate-100">{data.totalPax}</h4>
      </Card>
      <Card className="p-3 space-y-1 border-l-4 border-l-red-500">
        <p class="text-[10px] font-semibold text-slate-400 uppercase">Unpaid</p>
        <h4 class="text-lg font-extrabold text-red-400">₱{data.unpaidTotal.toLocaleString()}</h4>
      </Card>
      <Card className="p-3 space-y-1 border-l-4 border-l-indigo-500">
        <p class="text-[10px] font-semibold text-slate-400 uppercase">Today</p>
        <h4 class="text-lg font-extrabold text-slate-100">{data.todayBookings}</h4>
      </Card>
      <Card className="p-3 space-y-1 border-l-4 border-l-amber-500">
        <p class="text-[10px] font-semibold text-slate-400 uppercase">This Week</p>
        <h4 class="text-lg font-extrabold text-amber-400">{data.weekBookings}</h4>
      </Card>
    </div>

    <!-- Chart Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Chart 1: Monthly Revenue Bar Chart (Spans 2 columns) -->
      <Card className="md:col-span-2 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 class="font-bold text-slate-100 text-sm">Monthly Revenue Trend (₱)</h4>
            <p class="text-[11px] text-slate-400">Last 12 months, confirmed & completed bookings</p>
          </div>
          <Badge variant="green">12-Month Total: ₱{annualTotal.toLocaleString()}</Badge>
        </div>

        <div class="h-60 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-800/80 px-2">
          {#each data.monthlyRevenue as item}
            <div class="flex-1 flex flex-col items-center gap-2 group relative">
              <div class="absolute -top-8 hidden group-hover:flex bg-slate-950 border border-rose-500/40 text-rose-400 font-mono text-[10px] font-bold py-1 px-2 rounded-lg shadow-xl z-20 whitespace-nowrap">
                ₱{item.revenue.toLocaleString()}
              </div>
              <div
                class="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 transition-all duration-300 shadow-md shadow-emerald-500/20"
                style="height: {Math.max(2, (item.revenue / maxMonthlyRevenue) * 180)}px;"
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
          <p class="text-[11px] text-slate-400">Share of events by occasion type ({selectedPeriod})</p>
        </div>

        <div class="space-y-4 pt-2">
          {#if data.occasionBreakdown.length === 0}
            <p class="text-slate-500 text-center py-6 text-xs">No bookings in this period.</p>
          {:else}
            {#each data.occasionBreakdown as occ, i}
              <div class="space-y-1 text-xs">
                <div class="flex justify-between font-semibold">
                  <span class="text-slate-200">{occ.name}</span>
                  <span class="text-slate-400">{occ.count} events ({occ.share}%)</span>
                </div>
                <div class="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div class="h-full {OCCASION_COLORS[i % OCCASION_COLORS.length]} rounded-full" style="width: {occ.share}%;"></div>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </Card>
    </div>

    <!-- Bottom Grid: Payment Methods & Top Packages -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Chart 3: Payment Method Preference -->
      <Card className="space-y-4">
        <div class="border-b border-slate-800 pb-3">
          <h4 class="font-bold text-slate-100 text-sm">Payment Methods Share</h4>
          <p class="text-[11px] text-slate-400">All-time recorded payments</p>
        </div>

        <div class="space-y-4 pt-2">
          {#if data.paymentMethods.length === 0}
            <p class="text-slate-500 text-center py-6 text-xs">No payments recorded yet.</p>
          {:else}
            {#each data.paymentMethods as pm, i}
              <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div class="flex justify-between text-xs font-semibold">
                  <span class="text-slate-200">{pm.name}</span>
                  <span class="text-emerald-400">{pm.percentage}%</span>
                </div>
                <div class="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div class="h-full {PAYMENT_COLORS[i % PAYMENT_COLORS.length]} rounded-full" style="width: {pm.percentage}%;"></div>
                </div>
                <p class="text-[10px] text-slate-400 text-right">Volume: ₱{pm.amount.toLocaleString()}</p>
              </div>
            {/each}
          {/if}
        </div>
      </Card>

      <!-- Table: Top Packages Ranking -->
      <Card className="md:col-span-2">
        <div class="border-b border-slate-800 pb-3 mb-4">
          <h4 class="font-bold text-slate-100 text-sm">Top Catering Packages</h4>
          <p class="text-[11px] text-slate-400">Ranked by revenue generated ({selectedPeriod})</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <th class="py-3 px-2">Package Name</th>
                <th class="py-3 px-2 text-center">Bookings</th>
                <th class="py-3 px-2 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              {#if data.topPackages.length === 0}
                <tr><td colspan="3" class="py-6 text-center text-slate-500">No package-linked bookings yet.</td></tr>
              {:else}
                {#each data.topPackages as item}
                  <tr class="hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-2 font-bold text-slate-200">{item.name}</td>
                    <td class="py-3 px-2 text-center font-semibold text-emerald-400">{item.orders} bookings</td>
                    <td class="py-3 px-2 text-right font-bold text-slate-100">₱{item.revenue.toLocaleString()}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  {/if}
</div>

<!-- Modals -->
<ImportWizardModal show={showImportModal} defaultEntity="bookings" onClose={() => (showImportModal = false)} />
<ExportWizardModal show={showExportModal} defaultEntity="all" onClose={() => (showExportModal = false)} />
