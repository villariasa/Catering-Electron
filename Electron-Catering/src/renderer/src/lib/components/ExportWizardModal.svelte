<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import * as XLSX from 'xlsx';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  export let show: boolean = false;
  export let defaultEntity: string = 'all';
  export let onClose: () => void;

  let exportEntity = defaultEntity;
  let exportFormat = 'xlsx';
  let exporting = false;

  async function fetchEntityRows(entity: string): Promise<{ sheetName: string; rows: any[] }[]> {
    const api = window.electronAPI;
    switch (entity) {
      case 'bookings':
        return [{ sheetName: 'Bookings', rows: await api.bookings.getAll() }];
      case 'customers':
        return [{ sheetName: 'Customers', rows: await api.customers.getAll() }];
      case 'expenses':
        return [{ sheetName: 'Expenses', rows: await api.expenses.getAll() }];
      case 'billing':
        return [{ sheetName: 'Invoices', rows: await api.invoices.getAll() }];
      case 'cashflow':
        return [{ sheetName: 'CashFlow', rows: await api.cashFlow.getAll() }];
      case 'packages':
        return [
          { sheetName: 'Packages', rows: await api.packages.getAll() },
          { sheetName: 'Dishes', rows: await api.menuItems.getAll() },
        ];
      case 'all':
      default:
        return [
          { sheetName: 'Bookings', rows: await api.bookings.getAll() },
          { sheetName: 'Customers', rows: await api.customers.getAll() },
          { sheetName: 'Expenses', rows: await api.expenses.getAll() },
          { sheetName: 'Invoices', rows: await api.invoices.getAll() },
          { sheetName: 'CashFlow', rows: await api.cashFlow.getAll() },
          { sheetName: 'Packages', rows: await api.packages.getAll() },
          { sheetName: 'Dishes', rows: await api.menuItems.getAll() },
        ];
    }
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toCsv(rows: any[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
    }
    return lines.join('\n');
  }

  async function handleExport() {
    exporting = true;
    try {
      const sheets = await fetchEntityRows(exportEntity);
      const nonEmpty = sheets.filter((s) => s.rows.length > 0);
      if (nonEmpty.length === 0) {
        toast.info('No data found to export for this selection.');
        return;
      }

      const fileBase = `Jayraldines_Catering_${exportEntity.toUpperCase()}_Export_${new Date().toISOString().slice(0, 10)}`;

      if (exportFormat === 'xlsx') {
        const wb = XLSX.utils.book_new();
        for (const sheet of nonEmpty) {
          const ws = XLSX.utils.json_to_sheet(sheet.rows);
          XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName.slice(0, 31));
        }
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        downloadBlob(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${fileBase}.xlsx`);
      } else {
        // CSV only supports one table — export the first (or only) sheet.
        const csv = toCsv(nonEmpty[0].rows);
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${fileBase}.csv`);
      }

      toast.success(`Exported ${fileBase}.${exportFormat} successfully!`);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Export failed.');
    } finally {
      exporting = false;
    }
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
            <option value="all">Master System Workbook (All Tables)</option>
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
          {#if exportFormat === 'csv' && exportEntity === 'all'}
            <p class="text-[10px] text-amber-400 mt-1">CSV supports one table at a time — this will export Bookings only. Use Excel for all tables.</p>
          {/if}
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
        <Button variant="secondary" size="sm" disabled={exporting} on:click={onClose}>Cancel</Button>
        <Button size="sm" disabled={exporting} on:click={handleExport}>{exporting ? 'Exporting...' : 'Download Export File'}</Button>
      </div>
    </Card>
  </div>
{/if}
