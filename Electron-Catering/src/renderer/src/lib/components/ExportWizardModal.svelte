<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  export let show: boolean = false;
  export let defaultEntity: string = 'all';
  export let onClose: () => void;

  let exportEntity = defaultEntity;
  let exportFormat = 'xlsx';
  let dateRange = 'all';

  function handleExport() {
    const fileName = `Jayraldines_Catering_${exportEntity.toUpperCase()}_Export.${exportFormat}`;
    
    // Generate sample data blob for export
    const sampleText = `Jayraldine's Catering ${exportEntity} Export\nGenerated: ${new Date().toLocaleString()}\n`;
    const blob = new Blob([sampleText], { type: exportFormat === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Exported ${fileName} successfully!`);
    onClose();
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
    <Card className="max-w-md w-full p-6 space-y-4 border-2 border-emerald-500/40">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-extrabold text-slate-100 text-base flex items-center gap-2">
          <img src="assets/icons/svg/export.svg" alt="" class="w-5 h-5 opacity-80 filter invert" />
          <span>Data Export Wizard</span>
        </h3>
        <button class="text-slate-400 hover:text-slate-200 text-lg font-bold" on:click={onClose}>✕</button>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label for="exp-ent" class="block text-slate-300 font-semibold mb-1">Select Entity to Export</label>
          <select id="exp-ent" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs font-semibold" bind:value={exportEntity}>
            <option value="all">Master System Workbook (All Tables & Views)</option>
            <option value="bookings">Bookings & Orders Core</option>
            <option value="customers">Customers Directory CRM</option>
            <option value="expenses">Operating Expenses Log</option>
            <option value="billing">Invoices & Payment Records</option>
            <option value="cashflow">Cash Flow Ledger</option>
            <option value="packages">Dishes & Menu Packages</option>
          </select>
        </div>

        <div>
          <label for="exp-fmt" class="block text-slate-300 font-semibold mb-1">Export File Format</label>
          <div class="grid grid-cols-2 gap-2">
            <Button variant={exportFormat === 'xlsx' ? 'default' : 'outline'} size="sm" type="button" on:click={() => (exportFormat = 'xlsx')}>
              Excel Workbook (.xlsx)
            </Button>
            <Button variant={exportFormat === 'csv' ? 'default' : 'outline'} size="sm" type="button" on:click={() => (exportFormat = 'csv')}>
              CSV Spreadsheet (.csv)
            </Button>
          </div>
        </div>

        <div>
          <label for="exp-range" class="block text-slate-300 font-semibold mb-1">Date Period Filter</label>
          <select id="exp-range" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs" bind:value={dateRange}>
            <option value="all">All Historical Records</option>
            <option value="this_month">This Month (August 2026)</option>
            <option value="year_to_date">Year to Date (2026)</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <Button variant="secondary" size="sm" on:click={onClose}>Cancel</Button>
        <Button size="sm" on:click={handleExport}>Download Export File</Button>
      </div>
    </Card>
  </div>
{/if}
