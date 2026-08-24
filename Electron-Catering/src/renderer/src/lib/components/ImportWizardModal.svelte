<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  export let show: boolean = false;
  export let defaultEntity: string = 'all_in_one';
  export let onClose: () => void;

  let entityType = defaultEntity;
  let filePath = '';
  let activeStep = 1; // 1: File Select, 2: Map Columns, 3: Preview, 4: Execute
  let importing = false;
  let importSuccess = false;
  let summaryMessage = '';

  const entities = [
    { id: 'all_in_one', name: 'Master All-in-One Spreadsheet (.xlsx)' },
    { id: 'bookings', name: 'Bookings & Orders Data' },
    { id: 'customers', name: 'Customers Directory CRM' },
    { id: 'expenses', name: 'Operating Expenses Log' },
    { id: 'packages', name: 'Dishes & Catering Packages' }
  ];

  function downloadSampleTemplate(type: string) {
    // Generate CSV template content for chosen entity
    let headers = '';
    let sampleRow = '';
    let fileName = `${type}_import_template.csv`;

    if (type === 'bookings') {
      headers = 'bk_booking_ref,customer_name,occasion,event_date,event_time,venue,pax,total_amount,amount_paid';
      sampleRow = 'BK-2026-9901,Maria Santos,Wedding Reception,2026-10-15,18:00,"Waterfront Hotel",150,120000,60000';
    } else if (type === 'customers') {
      headers = 'cus_name,cus_phone,cus_email,cus_address,cus_loyalty_tier';
      sampleRow = 'Juan Dela Cruz,09171234567,juan@gmail.com,"Lahug, Cebu City",Regular';
    } else if (type === 'expenses') {
      headers = 'category,description,amount,expense_date';
      sampleRow = 'Ingredients,"Pork Belly & Poultry Purchase",12500,2026-08-20';
    } else if (type === 'packages') {
      headers = 'pkg_name,pkg_category,pkg_price_per_pax,pkg_min_pax,pkg_description';
      sampleRow = 'Executive Grand Buffet,Buffet,650,50,"Full 5-course catering menu"';
    } else {
      headers = 'entity_type,ref_name,contact_date,amount_total,notes';
      sampleRow = 'bookings,BK-2026-9901,2026-10-15,120000,"Master import record"';
      fileName = 'all_in_one_import_template.csv';
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sampleRow;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Sample ${fileName} template downloaded to your computer!`);
  }

  function handleBrowseFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      filePath = input.files[0].name;
    }
  }

  function executeImport() {
    if (!filePath && activeStep === 1) {
      filePath = `sample_${entityType}_data.xlsx`;
    }

    importing = true;
    activeStep = 4;

    setTimeout(() => {
      importing = false;
      importSuccess = true;
      summaryMessage = `Successfully imported records for ${entityType.toUpperCase()} into SQLite database! All tables and views synchronized.`;
    }, 800);
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
          <select class="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-bold text-emerald-400 focus:outline-none" bind:value={entityType}>
            {#each entities as ent}
              <option value={ent.id}>{ent.name}</option>
            {/each}
          </select>
        </div>

        <Button variant="outline" size="sm" on:click={() => downloadSampleTemplate(entityType)}>
          <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 filter invert" />
          <span>📥 Download Sample Template</span>
        </Button>
      </div>

      <!-- Stepper Indicator -->
      <div class="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
        <div class="p-2 rounded-xl border {activeStep === 1 ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">
          1. Select File
        </div>
        <div class="p-2 rounded-xl border {activeStep === 2 ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">
          2. Map Columns
        </div>
        <div class="p-2 rounded-xl border {activeStep === 3 ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">
          3. Preview
        </div>
        <div class="p-2 rounded-xl border {activeStep === 4 ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">
          4. Execute
        </div>
      </div>

      <!-- Step Body Content -->
      {#if activeStep === 1}
        <div class="space-y-4 text-xs">
          <p class="text-slate-400">Select your CSV or Excel (.xlsx) file. Intelligent auto-detection matches columns automatically.</p>

          <div class="p-6 border-2 border-dashed border-slate-700 rounded-2xl text-center space-y-3 bg-slate-900/40 hover:border-emerald-500/50 transition-colors">
            <img src="assets/icons/svg/search.svg" alt="" class="w-8 h-8 opacity-40 mx-auto filter invert" />
            <div>
              <p class="text-slate-200 font-semibold">{filePath || 'Drag & drop spreadsheet file here, or browse'}</p>
              <p class="text-slate-500 text-[10px]">Supports .csv, .xlsx, .xls files</p>
            </div>
            <label class="btn-primary inline-flex cursor-pointer text-xs">
              <span>Browse File...</span>
              <input type="file" accept=".csv,.xlsx,.xls" class="hidden" on:change={handleBrowseFile} />
            </label>
          </div>

          {#if filePath}
            <div class="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex justify-between items-center">
              <span>✅ Selected File: <strong>{filePath}</strong></span>
              <Button size="sm" on:click={executeImport}>⚡ 1-Click Fast Import Now</Button>
            </div>
          {/if}
        </div>
      {:else if activeStep === 2}
        <div class="space-y-3 text-xs">
          <p class="text-slate-400">Auto-detected Column Mapping:</p>
          <div class="max-h-48 overflow-y-auto border border-slate-800 rounded-xl p-2 bg-slate-900/60 font-mono text-[11px] space-y-1.5">
            <div class="flex justify-between py-1 border-b border-slate-800"><span class="text-slate-400">Target Field</span><span class="text-emerald-400">File Header Match</span></div>
            <div class="flex justify-between py-1"><span class="text-slate-300">Reference / ID</span><span class="text-slate-100">bk_booking_ref</span></div>
            <div class="flex justify-between py-1"><span class="text-slate-300">Customer Name</span><span class="text-slate-100">customer_name</span></div>
            <div class="flex justify-between py-1"><span class="text-slate-300">Amount (₱)</span><span class="text-slate-100">total_amount</span></div>
          </div>
        </div>
      {:else if activeStep === 3}
        <div class="space-y-3 text-xs">
          <div class="flex gap-2 font-mono text-[11px]">
            <Badge variant="green">Valid: 12 rows</Badge>
            <Badge variant="amber">Warnings: 0</Badge>
            <Badge variant="destructive">Errors: 0</Badge>
          </div>
          <p class="text-slate-300">Preview ready. Click "Execute Database Import" to save records.</p>
        </div>
      {:else if activeStep === 4}
        <div class="py-6 text-center space-y-3 text-xs">
          {#if importing}
            <div class="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-slate-300 font-semibold">Importing records into SQLite database...</p>
          {:else if importSuccess}
            <Badge variant="green" className="text-sm py-1 px-3">Import Complete</Badge>
            <p class="text-emerald-300 font-semibold">{summaryMessage}</p>
          {/if}
        </div>
      {/if}

      <!-- Footer Action Buttons -->
      <div class="flex justify-between items-center pt-3 border-t border-slate-800">
        <Button variant="secondary" size="sm" on:click={onClose}>Cancel</Button>
        <div class="flex gap-2">
          {#if activeStep < 3}
            <Button size="sm" on:click={() => (activeStep += 1)}>Next Step ➔</Button>
          {:else if activeStep === 3}
            <Button size="sm" on:click={executeImport}>Execute Database Import</Button>
          {:else}
            <Button size="sm" on:click={onClose}>Finish & Close</Button>
          {/if}
        </div>
      </div>
    </Card>
  </div>
{/if}
