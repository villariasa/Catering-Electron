<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ImportWizardModal from '$lib/components/ImportWizardModal.svelte';
  import ExportWizardModal from '$lib/components/ExportWizardModal.svelte';
  import { THEME_CATEGORIES, THEME_PALETTES, applyThemePalette } from '$lib/theme';

  let activeThemeCategory = 'All';
  let activeThemeId = 'dark_mode';

  function selectTheme(paletteId: string) {
    activeThemeId = paletteId;
    applyThemePalette(paletteId);
  }

  $: filteredPalettes = Object.values(THEME_PALETTES).filter(p => {
    return activeThemeCategory === 'All' || p.category === activeThemeCategory;
  });

  // Import / Export Modals State
  let showImportModal = false;
  let showExportModal = false;
  let importDefaultEntity = 'all_in_one';

  // Business Profile (real, persisted to business_info table)
  let businessName = '';
  let tagline = 'Quality Catering & Event Management';
  let contact = '';
  let email = '';
  let address = '';
  let settingsLoading = true;

  // Policy Settings (also persisted to business_info)
  let minDownpaymentPct = 20;
  let allowZeroDp = true;
  let maxDailyPax = 600;

  async function loadBusinessInfo() {
    settingsLoading = true;
    try {
      const info = await window.electronAPI.settings.getBusinessInfo();
      businessName = info.name;
      contact = info.contact;
      email = info.email;
      address = info.address;
      minDownpaymentPct = info.min_downpayment_pct;
      allowZeroDp = info.allow_zero_downpayment;
      maxDailyPax = info.max_daily_pax;
      smtpHost = info.smtp_host;
      smtpPort = info.smtp_port;
      smtpUser = info.smtp_user;
      smtpPass = info.smtp_pass;
    } catch (e) {
      console.error('[Settings] Failed to load business info:', e);
    } finally {
      settingsLoading = false;
    }
  }

  // Monthly Sales Targets (real, persisted to monthly_sales_targets table)
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let targetYear = String(new Date().getFullYear());
  let universalTarget = 85000;
  let monthlyTargets: Record<string, number> = Object.fromEntries(MONTH_NAMES.map((m) => [m, 0]));

  async function loadSalesTargets() {
    try {
      const targets = await window.electronAPI.settings.getSalesTargets(Number(targetYear));
      const next = Object.fromEntries(MONTH_NAMES.map((m) => [m, 0]));
      for (const t of targets) {
        next[MONTH_NAMES[t.month - 1]] = t.target_amount;
      }
      monthlyTargets = next;
    } catch (e) {
      console.error('[Settings] Failed to load sales targets:', e);
    }
  }

  // Occasions list (real, persisted to occasions table)
  let occasions: { id: number; name: string }[] = [];
  let newOccasionName = '';

  async function loadOccasions() {
    try {
      occasions = await window.electronAPI.settings.getOccasions();
    } catch (e) {
      console.error('[Settings] Failed to load occasions:', e);
    }
  }

  // SMTP Email Settings (real, persisted to business_info table)
  let smtpHost = '';
  let smtpPort = 587;
  let smtpUser = '';
  let smtpPass = '';
  let testingSmtp = false;

  // System Audit Logs (real, persisted to audit_logs table)
  let auditLogs: { id: number; actor: string; action: string; table_name: string; details: string; created_at: string }[] = [];

  async function loadAuditLogs() {
    try {
      auditLogs = await window.electronAPI.audit.getRecent(50);
    } catch (e) {
      console.error('[Settings] Failed to load audit logs:', e);
    }
  }

  function openImportWizard(entity: string = 'all_in_one') {
    importDefaultEntity = entity;
    showImportModal = true;
  }

  async function applyUniversalTarget() {
    Object.keys(monthlyTargets).forEach(m => {
      monthlyTargets[m] = universalTarget;
    });
    monthlyTargets = { ...monthlyTargets };
    try {
      await window.electronAPI.settings.setYearlyTarget(Number(targetYear), universalTarget);
      toast.success(`Universal target of ₱${universalTarget.toLocaleString()} applied to all months of ${targetYear}!`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to apply universal target.');
    }
  }

  async function addOccasion() {
    if (!newOccasionName.trim()) return;
    try {
      const created = await window.electronAPI.settings.addOccasion(newOccasionName.trim());
      occasions = [...occasions, created];
      newOccasionName = '';
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add occasion.');
    }
  }

  async function removeOccasion(occ: { id: number; name: string }) {
    try {
      await window.electronAPI.settings.deleteOccasion(occ.id);
      occasions = occasions.filter((o) => o.id !== occ.id);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete occasion.');
    }
  }

  async function saveBusinessProfile() {
    try {
      await window.electronAPI.settings.updateBusinessInfo({
        name: businessName,
        address,
        contact,
        email,
        min_downpayment_pct: minDownpaymentPct,
        allow_zero_downpayment: allowZeroDp,
        max_daily_pax: maxDailyPax,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
      });
      toast.success('Business information saved successfully!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save business profile.');
    }
  }

  async function savePolicy() {
    try {
      await window.electronAPI.settings.updateBusinessInfo({
        name: businessName,
        address,
        contact,
        email,
        min_downpayment_pct: minDownpaymentPct,
        allow_zero_downpayment: allowZeroDp,
        max_daily_pax: maxDailyPax,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
      });
      toast.success('Booking policy and capacity limits updated!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save policy settings.');
    }
  }

  async function saveSalesTargets() {
    try {
      for (let i = 0; i < MONTH_NAMES.length; i++) {
        await window.electronAPI.settings.setSalesTarget(Number(targetYear), i + 1, monthlyTargets[MONTH_NAMES[i]] || 0);
      }
      toast.success(`Monthly sales targets for ${targetYear} saved!`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save sales targets.');
    }
  }

  async function saveSmtpConfig() {
    try {
      await window.electronAPI.settings.updateBusinessInfo({
        name: businessName,
        address,
        contact,
        email,
        min_downpayment_pct: minDownpaymentPct,
        allow_zero_downpayment: allowZeroDp,
        max_daily_pax: maxDailyPax,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
      });
      toast.success('Email SMTP configuration saved!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save SMTP configuration.');
    }
  }

  async function testSmtpConnection() {
    testingSmtp = true;
    try {
      await saveSmtpConfig();
      const result = await window.electronAPI.settings.testSmtp();
      if (result.success) {
        toast.success('SMTP connection test successful!');
      } else {
        toast.error(`SMTP connection failed: ${result.error}`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'SMTP test failed.');
    } finally {
      testingSmtp = false;
    }
  }

  async function createDatabaseBackup() {
    try {
      const result = await window.electronAPI.settings.backupDatabase();
      if (result.success) {
        toast.success(`Database backup created at:\n${result.path}`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create backup.');
    }
  }

  async function restoreDatabaseBackup() {
    if (!confirm('Restoring will overwrite the current database with the selected backup file. The app will need to restart. Continue?')) return;
    try {
      const result = await window.electronAPI.settings.restoreDatabase();
      if (result.success && result.requiresRestart) {
        toast.success('Database restored successfully. The app will now restart.');
        await window.electronAPI.relaunch();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to restore backup.');
    }
  }

  // Daily Log Viewer State
  let activeLogPath = '';
  let activeLogContent = '';

  async function fetchDailyLogInfo() {
    try {
      if (window.electronAPI && window.electronAPI.logs) {
        activeLogPath = await window.electronAPI.logs.getActiveLogPath();
        activeLogContent = await window.electronAPI.logs.readActiveLogContent();
      } else {
        activeLogPath = '/home/villarias/.config/JayraldinesCatering/logs/app_2026-08-24.log';
        activeLogContent = '[2026-08-24 20:49:00] [INFO] Jayraldine\'s Catering Desktop Session Started\n[2026-08-24 20:49:01] [INFO] SQLite database loaded & migrations synced successfully.';
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleOpenLogFolder() {
    if (window.electronAPI && window.electronAPI.logs) {
      window.electronAPI.logs.openLogFolder();
    } else {
      toast.info(`Daily Log File Location: ${activeLogPath}`);
    }
  }

  onMount(() => {
    fetchDailyLogInfo();
    loadBusinessInfo();
    loadOccasions();
    loadSalesTargets();
    loadAuditLogs();
  });
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Page Header -->
  <div class="flex justify-between items-center border-b border-slate-800 pb-4">
    <div>
      <h3 class="text-lg font-extrabold text-slate-100 flex items-center gap-2">
        <img src="assets/icons/svg/settings.svg" alt="" class="w-5 h-5 opacity-80" />
        <span>System Settings & Theme Customizer</span>
      </h3>
      <p class="text-xs text-slate-400">Configure business info, select from 22 curated themes, import/export data, and manage backups.</p>
    </div>
    <Badge variant="green">System Version: v5.0.0 (Electron ES Module)</Badge>
  </div>

  <!-- Appearance & Curated Themes Card (Full Width) -->
  <Card className="space-y-4 border-l-4 border-l-rose-500">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
      <div>
        <h4 class="font-bold text-slate-100 text-base">Appearance & 22 Curated Theme Palettes</h4>
        <p class="text-xs text-slate-400">Select from Nature, Mood, Color-driven, Vibe-based, and Seasonal light/dark palettes.</p>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" on:click={() => selectTheme(THEME_PALETTES[activeThemeId]?.mode === 'dark' ? 'light_mode' : 'dark_mode')}>
          Toggle Dark / Light Mode
        </Button>
      </div>
    </div>

    <!-- Theme Category Filter Pills -->
    <div class="flex flex-wrap gap-2 pt-1 text-xs">
      {#each ['All', ...THEME_CATEGORIES] as cat}
        <button
          class="px-3.5 py-1.5 rounded-xl font-extrabold border transition-all {activeThemeCategory === cat ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}"
          on:click={() => (activeThemeCategory = cat)}
        >
          {cat}
        </button>
      {/each}
    </div>

    <!-- Theme Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
      {#each filteredPalettes as pal}
        <button
          class="p-3.5 rounded-2xl border-2 text-left transition-all relative space-y-2.5 {activeThemeId === pal.id ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/20' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'}"
          on:click={() => selectTheme(pal.id)}
        >
          <div class="flex justify-between items-center">
            <span class="font-bold text-slate-100 text-xs">{pal.name}</span>
            <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md {pal.mode === 'dark' ? 'bg-slate-950 text-sky-400' : 'bg-amber-100 text-amber-900'}">
              {pal.mode}
            </span>
          </div>

          <!-- 4-bar Swatch Preview -->
          <div class="grid grid-cols-4 gap-1.5 h-3">
            <div class="rounded-sm" style="background-color: {pal.background};"></div>
            <div class="rounded-sm" style="background-color: {pal.surface};"></div>
            <div class="rounded-sm" style="background-color: {pal.primary};"></div>
            <div class="rounded-sm" style="background-color: {pal.textPrimary};"></div>
          </div>

          {#if activeThemeId === pal.id}
            <div class="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow">
              ✓
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </Card>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Card 1: Business Profile -->
    <Card className="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 class="font-bold text-slate-100 text-sm">Business Profile & Branding</h4>
        <img src="assets/logo.png" alt="Official Logo" class="h-7 w-auto object-contain" />
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label for="stg-bname" class="block text-slate-300 font-semibold mb-1">Business Name</label>
          <Input id="stg-bname" bind:value={businessName} />
        </div>

        <div>
          <label for="stg-tag" class="block text-slate-300 font-semibold mb-1">Tagline / Subtitle</label>
          <Input id="stg-tag" bind:value={tagline} />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="stg-phone" class="block text-slate-300 font-semibold mb-1">Contact Phone</label>
            <Input id="stg-phone" bind:value={contact} />
          </div>
          <div>
            <label for="stg-email" class="block text-slate-300 font-semibold mb-1">Email Address</label>
            <Input id="stg-email" bind:value={email} />
          </div>
        </div>

        <div>
          <label for="stg-addr" class="block text-slate-300 font-semibold mb-1">Physical Address</label>
          <Input id="stg-addr" bind:value={address} />
        </div>

        <div class="flex justify-end pt-2">
          <Button size="sm" on:click={saveBusinessProfile}>Save Profile Changes</Button>
        </div>
      </div>
    </Card>

    <!-- Card 2: Data Import & Export Migration Wizards -->
    <Card className="space-y-4 border-l-4 border-l-emerald-500">
      <div class="border-b border-slate-800 pb-3">
        <h4 class="font-bold text-slate-100 text-sm">Data Import & Export Migration Wizards</h4>
        <p class="text-[11px] text-slate-400">Import/export Bookings, Customers, Expenses, or Menu Items from Excel/CSV</p>
      </div>

      <div class="space-y-3 text-xs">
        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span class="font-bold text-emerald-400 block">📥 1-Click Data Import Wizard</span>
          <p class="text-[11px] text-slate-400">Includes auto-detection, column mapping, and downloadable sample templates for all 5 entity types.</p>
          <div class="flex flex-wrap gap-2 pt-1">
            <Button size="sm" on:click={() => openImportWizard('all_in_one')}>
              Launch Import Wizard
            </Button>
            <Button variant="outline" size="sm" on:click={() => openImportWizard('bookings')}>
              Bookings Import
            </Button>
            <Button variant="outline" size="sm" on:click={() => openImportWizard('customers')}>
              Customers Import
            </Button>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span class="font-bold text-blue-400 block">📤 System Data Export Wizard</span>
          <p class="text-[11px] text-slate-400">Export master Excel workbooks (.xlsx) or CSV spreadsheets with custom date range filters.</p>
          <div class="flex gap-2 pt-1">
            <Button variant="outline" size="sm" on:click={() => (showExportModal = true)}>
              Launch Export Wizard
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Card 3: Booking & Capacity Policy -->
    <Card className="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <h4 class="font-bold text-slate-100 text-sm">Booking Policy & Daily Capacity</h4>
        <p class="text-[11px] text-slate-400">Configure downpayment rules and max daily pax</p>
      </div>

      <div class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="stg-min-dp" class="block text-slate-300 font-semibold mb-1">Minimum Downpayment (%)</label>
            <Input id="stg-min-dp" type="number" bind:value={minDownpaymentPct} />
          </div>
          <div>
            <label for="stg-max-pax" class="block text-slate-300 font-semibold mb-1">Max Daily Pax Limit</label>
            <Input id="stg-max-pax" type="number" bind:value={maxDailyPax} />
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input type="checkbox" id="zero-dp" class="rounded bg-slate-900 border-slate-700" bind:checked={allowZeroDp} />
          <label for="zero-dp" class="text-slate-300 cursor-pointer">Allow confirming bookings without downpayment override</label>
        </div>

        <div class="flex justify-end pt-2">
          <Button size="sm" on:click={savePolicy}>Save Policy Settings</Button>
        </div>
      </div>
    </Card>

    <!-- Card 4: Monthly Sales Targets -->
    <Card className="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 class="font-bold text-slate-100 text-sm">Monthly Sales Target Configuration</h4>
          <p class="text-[11px] text-slate-400">Revenue target used for evaluation</p>
        </div>
        <select class="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200" bind:value={targetYear} on:change={loadSalesTargets}>
          <option value="2026">Year 2026</option>
          <option value="2025">Year 2025</option>
        </select>
      </div>

      <div class="space-y-3 text-xs">
        <div class="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
          <span class="text-slate-300 font-semibold">Quick Target:</span>
          <Input type="number" bind:value={universalTarget} className="w-32" />
          <Button size="sm" variant="secondary" on:click={applyUniversalTarget}>Apply to All Months</Button>
        </div>

        <div class="grid grid-cols-4 gap-2 font-mono text-[11px]">
          {#each Object.keys(monthlyTargets) as m}
            <div class="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span class="text-slate-400 block text-[9px] uppercase">{m}</span>
              <span class="text-emerald-400 font-bold">₱{(monthlyTargets[m]/1000).toFixed(0)}k</span>
            </div>
          {/each}
        </div>

        <div class="flex justify-end pt-1">
          <Button size="sm" on:click={saveSalesTargets}>Save Targets</Button>
        </div>
      </div>
    </Card>

    <!-- Card 5: Occasions Manager -->
    <Card className="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <h4 class="font-bold text-slate-100 text-sm">Occasion Types Manager</h4>
        <p class="text-[11px] text-slate-400">Customize the dropdown options for booking occasion types</p>
      </div>

      <div class="space-y-3 text-xs">
        <div class="flex gap-2">
          <Input bind:value={newOccasionName} placeholder="New occasion name..." />
          <Button size="sm" on:click={addOccasion}>+ Add</Button>
        </div>

        <div class="max-h-36 overflow-y-auto space-y-1.5 pr-1">
          {#each occasions as occ (occ.id)}
            <div class="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
              <span>{occ.name}</span>
              <button class="text-red-400 hover:text-red-300 font-bold" on:click={() => removeOccasion(occ)}>✕</button>
            </div>
          {/each}
        </div>
      </div>
    </Card>

    <!-- Card 6: Database Backup & Restore -->
    <Card className="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <h4 class="font-bold text-slate-100 text-sm">Database Backup & Recovery</h4>
        <p class="text-[11px] text-slate-400">Export timestamped database snapshots or restore from file</p>
      </div>

      <div class="space-y-3 text-xs">
        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p class="text-slate-300 font-semibold">SQLite Storage Engine:</p>
          <p class="text-[11px] text-slate-500 font-mono">/home/villarias/.config/jayraldines-catering-electron/electron-test.db</p>
        </div>

        <div class="flex gap-3">
          <Button size="sm" on:click={createDatabaseBackup}>
            💾 Create Backup Now
          </Button>
          <Button variant="secondary" size="sm" on:click={restoreDatabaseBackup}>
            🔄 Restore Backup
          </Button>
        </div>
      </div>
    </Card>

    <!-- Card 7: SMTP Email Settings -->
    <Card className="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <h4 class="font-bold text-slate-100 text-sm">Email (SMTP) Server Configuration</h4>
        <p class="text-[11px] text-slate-400">Used for sending electronic receipts and booking updates</p>
      </div>

      <div class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="smtp-host" class="block text-slate-300 font-semibold mb-1">SMTP Host</label>
            <Input id="smtp-host" bind:value={smtpHost} />
          </div>
          <div>
            <label for="smtp-port" class="block text-slate-300 font-semibold mb-1">Port</label>
            <Input id="smtp-port" type="number" bind:value={smtpPort} />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="smtp-usr" class="block text-slate-300 font-semibold mb-1">Username / Email</label>
            <Input id="smtp-usr" bind:value={smtpUser} />
          </div>
          <div>
            <label for="smtp-pwd" class="block text-slate-300 font-semibold mb-1">Password</label>
            <Input id="smtp-pwd" type="password" bind:value={smtpPass} />
          </div>
        </div>

        <div class="flex justify-between pt-1">
          <Button variant="outline" size="sm" disabled={testingSmtp} on:click={testSmtpConnection}>{testingSmtp ? 'Testing...' : 'Test Connection'}</Button>
          <Button size="sm" on:click={saveSmtpConfig}>Save SMTP Config</Button>
        </div>
      </div>
    </Card>

    <!-- Card 8: Daily Diagnostic Log Files (Date-Stamped Logs) -->
    <Card className="space-y-4 border-l-4 border-l-rose-500">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 class="font-bold text-slate-100 text-sm flex items-center gap-2">
            <span>Daily Diagnostic Log File (app_YYYY-MM-DD.log)</span>
            <Badge variant="green">Auto Date-Stamped</Badge>
          </h4>
          <p class="text-[11px] text-slate-400">A new log file is automatically created every day to inspect errors, IPC calls & system events.</p>
        </div>

        <div class="flex gap-2">
          <Button variant="outline" size="sm" on:click={fetchDailyLogInfo}>
            Refresh Log
          </Button>
          <Button size="sm" on:click={handleOpenLogFolder}>
            Open Log Folder
          </Button>
        </div>
      </div>

      <div class="space-y-3 text-xs">
        <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-[11px] font-mono">
          <span class="text-slate-400">Active Daily Log:</span>
          <span class="text-emerald-400 font-bold truncate max-w-md">{activeLogPath || 'app_2026-08-24.log'}</span>
        </div>

        <div class="max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-slate-300">
          {activeLogContent}
        </div>
      </div>
    </Card>

    <!-- Card 9: Audit Logs Viewer -->
    <Card className="space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <h4 class="font-bold text-slate-100 text-sm">System Audit Trail & Event Logs</h4>
        <p class="text-[11px] text-slate-400">Chronological history of system actions</p>
      </div>

      <div class="max-h-40 overflow-y-auto space-y-2 pr-1 text-[11px] font-mono">
        {#if auditLogs.length === 0}
          <p class="text-slate-500 text-center py-4">No audit events yet.</p>
        {:else}
          {#each auditLogs as log (log.id)}
            <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
              <div class="flex justify-between text-slate-400">
                <span>{log.created_at}</span>
                <span class="text-emerald-400 font-bold">{log.action}</span>
              </div>
              <p class="text-slate-200">{log.details}</p>
            </div>
          {/each}
        {/if}
      </div>
    </Card>
  </div>
</div>

<!-- Import Wizard Modal -->
<ImportWizardModal show={showImportModal} defaultEntity={importDefaultEntity} onClose={() => (showImportModal = false)} />

<!-- Export Wizard Modal -->
<ExportWizardModal show={showExportModal} defaultEntity="all" onClose={() => (showExportModal = false)} />
