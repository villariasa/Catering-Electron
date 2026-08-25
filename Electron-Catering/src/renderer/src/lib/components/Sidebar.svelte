<script lang="ts">
  export let currentPage: string = 'dashboard';
  export let onSelectPage: (page: string) => void;
  export let collapsed: boolean = false;
  export let onToggleCollapse: () => void = () => {};

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

<aside class="{collapsed ? 'w-[68px]' : 'w-64'} bg-slate-950 border-r border-slate-800 flex flex-col h-full select-none transition-all duration-200 flex-shrink-0">
  <!-- Official Jayraldine's Logo Header -->
  <div class="p-4 border-b border-slate-800/80 flex items-center gap-3 {collapsed ? 'justify-center' : ''}">
    <img
      src="assets/logo.png"
      alt="Jayraldine's Catering Logo"
      class="w-10 h-10 object-contain rounded-xl bg-slate-900 border border-slate-800 p-1 shadow-md shadow-emerald-500/10 flex-shrink-0"
    />
    {#if !collapsed}
      <div class="min-w-0">
        <h1 class="font-extrabold text-slate-100 text-sm tracking-wide leading-tight truncate">Jayraldine's</h1>
        <p class="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider truncate">Catering Desktop</p>
      </div>
    {/if}
  </div>

  <!-- Collapse / Expand Toggle -->
  <button
    type="button"
    class="mx-2 mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-[var(--text-primary)] hover:bg-slate-900/80 transition-all {collapsed ? 'justify-center' : ''}"
    title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
    on:click={onToggleCollapse}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 transition-transform {collapsed ? 'rotate-180' : ''}">
      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"></path>
    </svg>
    {#if !collapsed}<span>Collapse</span>{/if}
  </button>

  <!-- Nav Items with Official SVG Icons -->
  <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
    {#each navItems as item}
      <button
        type="button"
        title={collapsed ? item.label : ''}
        class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left
        {collapsed ? 'justify-center' : ''}
        {currentPage === item.id
          ? 'bg-rose-600 text-white shadow-md border border-rose-500'
          : 'text-slate-300 hover:text-[var(--text-primary)] hover:bg-slate-900/80'}"
        on:click={() => onSelectPage(item.id)}
      >
        <img
          src={item.icon}
          alt=""
          class="w-4 h-4 flex-shrink-0 transition-transform duration-150 nav-icon {currentPage === item.id ? 'scale-110' : ''}"
        />
        {#if !collapsed}<span class="truncate">{item.label}</span>{/if}
      </button>
    {/each}
  </nav>

  <!-- Footer Version -->
  {#if !collapsed}
    <div class="p-3 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
      <span class="text-[11px] font-medium text-slate-400">Electron Desktop Edition</span>
      <span class="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[10px] font-bold">v5.0.0</span>
    </div>
  {/if}
</aside>
