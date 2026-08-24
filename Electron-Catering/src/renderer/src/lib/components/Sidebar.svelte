<script lang="ts">
  export let currentPage: string = 'dashboard';
  export let onSelectPage: (page: string) => void;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'assets/icons/svg/dashboard.svg' },
    { id: 'bookings', label: 'Bookings & Orders', icon: 'assets/icons/svg/bookings.svg' },
    { id: 'calendar', label: 'Calendar Schedule', icon: 'assets/icons/svg/calendar.svg' },
    { id: 'customers', label: 'Customers Directory', icon: 'assets/icons/svg/customers.svg' },
    { id: 'packages', label: 'Menu & Packages', icon: 'assets/icons/svg/menu.svg' },
    { id: 'expenses', label: 'Expenses Log', icon: 'assets/icons/svg/billing.svg' },
    { id: 'billing', label: 'Billing & Invoices', icon: 'assets/icons/svg/billing.svg' },
    { id: 'cashflow', label: 'Cash Flow Ledger', icon: 'assets/icons/svg/trending-up.svg' },
    { id: 'reports', label: 'Reports & Analytics', icon: 'assets/icons/svg/reports.svg' },
    { id: 'kitchen', label: 'Kitchen Display (KDS)', icon: 'assets/icons/svg/kitchen.svg' },
    { id: 'inventory', label: 'Inventory & Stock', icon: 'assets/icons/svg/inventory.svg' },
    { id: 'ai', label: 'AI Assistant', icon: 'assets/icons/svg/bell.svg' },
    { id: 'settings', label: 'Settings & DB', icon: 'assets/icons/svg/settings.svg' }
  ];
</script>

<aside class="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full select-none">
  <!-- Official Jayraldine's Logo Header -->
  <div class="p-4 border-b border-slate-800/80 flex items-center gap-3">
    <img
      src="assets/logo.png"
      alt="Jayraldine's Catering Logo"
      class="w-10 h-10 object-contain rounded-xl bg-slate-900 border border-slate-800 p-1 shadow-md shadow-emerald-500/10"
    />
    <div>
      <h1 class="font-extrabold text-slate-100 text-sm tracking-wide leading-tight">Jayraldine's</h1>
      <p class="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Catering Desktop</p>
    </div>
  </div>

  <!-- Nav Items with Official SVG Icons -->
  <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
    {#each navItems as item}
      <button
        type="button"
        class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left
        {currentPage === item.id 
          ? 'bg-rose-600 text-white shadow-md border border-rose-500' 
          : 'text-slate-300 hover:text-white hover:bg-slate-900/80'}"
        on:click={() => onSelectPage(item.id)}
      >
        <img
          src={item.icon}
          alt=""
          class="w-4 h-4 transition-transform duration-150 nav-icon {currentPage === item.id ? 'scale-110' : ''}"
        />
        <span>{item.label}</span>
      </button>
    {/each}
  </nav>

  <!-- Footer Version -->
  <div class="p-3 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
    <span class="text-[11px] font-medium text-slate-400">Electron Desktop Edition</span>
    <span class="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[10px] font-bold">v5.0.0</span>
  </div>
</aside>
