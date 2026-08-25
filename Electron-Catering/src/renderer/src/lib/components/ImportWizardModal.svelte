<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import * as XLSX from 'xlsx';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  export let show: boolean = false;
  export let defaultEntity: string = 'bookings';
  export let onClose: () => void;

  // 'all_in_one' isn't a real single table to import into — default to bookings if passed.
  let entityType = defaultEntity === 'all_in_one' ? 'bookings' : defaultEntity;
  let selectedFile: File | null = null;
  let parsedRows: Record<string, any>[] = [];
  let activeStep = 1; // 1: File Select, 2: Preview, 3: Execute
  let importing = false;
  let importSuccess = false;
  let successCount = 0;
  let errorCount = 0;
  let errorMessages: string[] = [];

  const entities = [
    { id: 'bookings', name: 'Bookings & Orders Data' },
    { id: 'customers', name: 'Customers Directory CRM' },
    { id: 'expenses', name: 'Operating Expenses Log' },
    { id: 'packages', name: 'Dishes & Catering Packages' }
  ];

  function downloadSampleTemplate(type: string) {
    let headers = '';
    let sampleRow = '';
    const fileName = `${type}_import_template.csv`;

    if (type === 'bookings') {
      headers = 'customer_name,occasion,event_date,event_time,venue,pax,total_amount,amount_paid';
      sampleRow = 'Maria Santos,Wedding Reception,2026-10-15,18:00,"Waterfront Hotel",150,120000,60000';
    } else if (type === 'customers') {
      headers = 'name,contact_number,email,address';
      sampleRow = 'Juan Dela Cruz,09171234567,juan@gmail.com,"Lahug, Cebu City"';
    } else if (type === 'expenses') {
      headers = 'category,description,amount,expense_date';
      sampleRow = 'Ingredients,"Pork Belly & Poultry Purchase",12500,2026-08-20';
    } else {
      headers = 'name,category,price_per_pax,min_pax,description';
      sampleRow = 'Executive Grand Buffet,Buffet,650,50,"Full 5-course catering menu"';
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + sampleRow;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleBrowseFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    selectedFile = input.files[0];

    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      parsedRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    } catch (e) {
      console.error('[Import] Failed to parse file:', e);
      toast.error('Could not read that file. Please use a valid .csv or .xlsx file.');
      selectedFile = null;
      parsedRows = [];
    }
  }

  function toRowFor(entity: string, row: Record<string, any>): any {
    if (entity === 'bookings') {
      const total = Number(row.total_amount || 0);
      const paid = Number(row.amount_paid || 0);
      return {
        booking_ref: row.booking_ref || undefined,
        customer_name: String(row.customer_name || '').trim(),
        occasion: String(row.occasion || '').trim(),
        event_date: String(row.event_date || '').trim(),
        event_time: String(row.event_time || '18:00').trim(),
        venue: String(row.venue || '').trim(),
        pax: Number(row.pax || 1),
        total_amount: total,
        amount_paid: paid,
        balance: Math.max(0, total - paid),
        status: 'PENDING',
        payment_status: paid >= total && total > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid',
      };
    }
    if (entity === 'customers') {
      return {
        name: String(row.name || '').trim(),
        contact_number: String(row.contact_number || '').trim(),
        email: String(row.email || '').trim() || undefined,
        address: String(row.address || '').trim() || undefined,
        loyalty_tier: 'New',
      };
    }
    if (entity === 'expenses') {
      return {
        category: String(row.category || 'General').trim(),
        description: String(row.description || '').trim(),
        amount: Number(row.amount || 0),
        expense_date: String(row.expense_date || '').trim(),
      };
    }
    // packages
    return {
      name: String(row.name || '').trim(),
      category: String(row.category || 'Buffet').trim(),
      price_per_pax: Number(row.price_per_pax || 0),
      min_pax: Number(row.min_pax || 1),
      description: String(row.description || '').trim() || undefined,
    };
  }

  async function executeImport() {
    importing = true;
    activeStep = 3;
    successCount = 0;
    errorCount = 0;
    errorMessages = [];

    for (const raw of parsedRows) {
      const data = toRowFor(entityType, raw);
      try {
        if (entityType === 'bookings') await window.electronAPI.bookings.create(data);
        else if (entityType === 'customers') await window.electronAPI.customers.create(data);
        else if (entityType === 'expenses') await window.electronAPI.expenses.create(data);
        else await window.electronAPI.packages.create(data);
        successCount++;
      } catch (e: any) {
        errorCount++;
        errorMessages.push(e?.message || 'Unknown error');
      }
    }

    importing = false;
    importSuccess = true;
  }

  function reset() {
    selectedFile = null;
    parsedRows = [];
    activeStep = 1;
    importSuccess = false;
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
    <Card className="max-w-2xl w-full p-6 space-y-5 border-2 border-emerald-500/40">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-3">
          <img src="assets/icons/svg/export.svg" alt="" class="w-6 h-6 filter invert-[60%] sepia-[90%] saturate-[400%] hue-rotate-[110deg]" />
          <div>
            <h3 class="font-extrabold text-slate-100 text-base">Data Import Wizard</h3>
            <p class="text-xs text-slate-400">Import CSV or Excel (.xlsx) spreadsheets into Jayraldine's Catering System.</p>
          </div>
        </div>

        <button class="text-slate-400 hover:text-slate-200 text-lg font-bold" on:click={onClose}>✕</button>
      </div>

      <!-- Entity & Template Selection Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-300">Data Type:</span>
          <select class="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-bold text-emerald-400 focus:outline-none" bind:value={entityType} on:change={reset}>
            {#each entities as ent}
              <option value={ent.id}>{ent.name}</option>
            {/each}
          </select>
        </div>

        <Button variant="outline" size="sm" on:click={() => downloadSampleTemplate(entityType)}>
          <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 filter invert" />
          <span>Download Sample Template</span>
        </Button>
      </div>

      <!-- Stepper Indicator -->
      <div class="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
        <div class="p-2 rounded-xl border {activeStep === 1 ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">
          1. Select File
        </div>
        <div class="p-2 rounded-xl border {activeStep === 2 ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">
          2. Preview
        </div>
        <div class="p-2 rounded-xl border {activeStep === 3 ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">
          3. Execute
        </div>
      </div>

      <!-- Step Body Content -->
      {#if activeStep === 1}
        <div class="space-y-4 text-xs">
          <p class="text-slate-400">Select your CSV or Excel (.xlsx) file. Columns must match the sample template headers.</p>

          <div class="p-6 border-2 border-dashed border-slate-700 rounded-2xl text-center space-y-3 bg-slate-900/40 hover:border-emerald-500/50 transition-colors">
            <img src="assets/icons/svg/search.svg" alt="" class="w-8 h-8 opacity-40 mx-auto filter invert" />
            <div>
              <p class="text-slate-200 font-semibold">{selectedFile ? selectedFile.name : 'Drag & drop spreadsheet file here, or browse'}</p>
              <p class="text-slate-500 text-[10px]">Supports .csv, .xlsx, .xls files</p>
            </div>
            <label class="btn-primary inline-flex cursor-pointer text-xs">
              <span>Browse File...</span>
              <input type="file" accept=".csv,.xlsx,.xls" class="hidden" on:change={handleBrowseFile} />
            </label>
          </div>

          {#if selectedFile && parsedRows.length > 0}
            <div class="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex justify-between items-center">
              <span>Selected File: <strong>{selectedFile.name}</strong> ({parsedRows.length} rows)</span>
              <Button size="sm" on:click={() => (activeStep = 2)}>Next: Preview</Button>
            </div>
          {:else if selectedFile}
            <p class="text-amber-400 text-center">No rows found in this file.</p>
          {/if}
        </div>
      {:else if activeStep === 2}
        <div class="space-y-3 text-xs">
          <div class="flex gap-2 font-mono text-[11px]">
            <Badge variant="green">Rows Ready: {parsedRows.length}</Badge>
          </div>
          <p class="text-slate-300">Preview of the first {Math.min(5, parsedRows.length)} rows:</p>
          <div class="max-h-56 overflow-auto border border-slate-800 rounded-xl bg-slate-900/60">
            <table class="w-full text-[10px] font-mono">
              <thead>
                <tr class="border-b border-slate-800 text-slate-400">
                  {#each Object.keys(parsedRows[0] || {}) as h}
                    <th class="px-2 py-1.5 text-left">{h}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each parsedRows.slice(0, 5) as row}
                  <tr class="border-b border-slate-800/60">
                    {#each Object.keys(parsedRows[0] || {}) as h}
                      <td class="px-2 py-1.5 text-slate-300">{row[h]}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {:else if activeStep === 3}
        <div class="py-6 text-center space-y-3 text-xs">
          {#if importing}
            <div class="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-slate-300 font-semibold">Importing records into SQLite database...</p>
          {:else if importSuccess}
            <Badge variant={errorCount === 0 ? 'green' : 'amber'} className="text-sm py-1 px-3">Import Complete</Badge>
            <p class="text-emerald-300 font-semibold">{successCount} record(s) imported successfully.</p>
            {#if errorCount > 0}
              <p class="text-red-400 font-semibold">{errorCount} record(s) failed.</p>
              <div class="max-h-24 overflow-y-auto text-left text-[10px] text-red-300 bg-red-950/30 border border-red-500/20 rounded-lg p-2 mx-auto max-w-md">
                {#each errorMessages.slice(0, 10) as msg}
                  <p>• {msg}</p>
                {/each}
              </div>
            {/if}
          {/if}
        </div>
      {/if}

      <!-- Footer Action Buttons -->
      <div class="flex justify-between items-center pt-3 border-t border-slate-800">
        <Button variant="secondary" size="sm" on:click={onClose}>Cancel</Button>
        <div class="flex gap-2">
          {#if activeStep === 2}
            <Button variant="outline" size="sm" on:click={() => (activeStep = 1)}>Back</Button>
            <Button size="sm" on:click={executeImport}>Execute Database Import</Button>
          {:else if activeStep === 3 && importSuccess}
            <Button size="sm" on:click={onClose}>Finish & Close</Button>
          {/if}
        </div>
      </div>
    </Card>
  </div>
{/if}
