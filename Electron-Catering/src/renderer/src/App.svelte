<script lang="ts">
  import { onMount } from 'svelte';
  import type { User } from '../../preload/types';

  import Sidebar from './lib/components/Sidebar.svelte';
  import Topbar from './lib/components/Topbar.svelte';
  import ChefJayMascot from './lib/components/ChefJayMascot.svelte';
  import ToastContainer from './lib/components/ToastContainer.svelte';

  import Login from './lib/pages/Login.svelte';
  // Dashboard is the immediate post-login screen, so it stays a static import (no
  // loading flash on the most common entry point). Every other page is loaded on
  // demand — with 14 pages plus xlsx/pdf-lib/nodemailer surface area, eagerly
  // importing all of them slowed initial app parse/compile for no benefit, since
  // only one page is ever visible at a time.
  import Dashboard from './lib/pages/Dashboard.svelte';

  const pageLoaders: Record<string, () => Promise<{ default: any }>> = {
    bookings: () => import('./lib/pages/Bookings.svelte'),
    calendar: () => import('./lib/pages/Calendar.svelte'),
    customers: () => import('./lib/pages/Customers.svelte'),
    packages: () => import('./lib/pages/Packages.svelte'),
    expenses: () => import('./lib/pages/Expenses.svelte'),
    billing: () => import('./lib/pages/Billing.svelte'),
    cashflow: () => import('./lib/pages/CashFlow.svelte'),
    reports: () => import('./lib/pages/Reports.svelte'),
    kitchen: () => import('./lib/pages/Kitchen.svelte'),
    inventory: () => import('./lib/pages/Inventory.svelte'),
    ai: () => import('./lib/pages/AIAssistant.svelte'),
    settings: () => import('./lib/pages/Settings.svelte'),
  };

  const pageComponentCache: Record<string, any> = {};

  let currentUser: User | null = null;
  let checkingAuth = true;
  let currentPage = 'dashboard';
  let sidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  let LazyPage: any = null;
  let loadingPage = false;

  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
  }

  import { applyThemePalette } from './lib/theme';

  onMount(async () => {
    const savedTheme = localStorage.getItem('selected_theme_id') || 'dark_mode';
    applyThemePalette(savedTheme);

    try {
      if (window.electronAPI && window.electronAPI.auth) {
        currentUser = await window.electronAPI.auth.getCurrentUser();
      }
    } catch (e) {
      console.error(e);
    } finally {
      checkingAuth = false;
    }
  });

  function handleLoginSuccess(user: User) {
    currentUser = user;
    currentPage = 'dashboard';
  }

  async function handleLogout() {
    if (window.electronAPI && window.electronAPI.auth) {
      await window.electronAPI.auth.logout();
    }
    currentUser = null;
  }

  async function handleSelectPage(page: string) {
    currentPage = page;
    if (page === 'dashboard' || !pageLoaders[page]) {
      LazyPage = null;
      return;
    }
    if (pageComponentCache[page]) {
      LazyPage = pageComponentCache[page];
      return;
    }
    loadingPage = true;
    LazyPage = null;
    const mod = await pageLoaders[page]();
    pageComponentCache[page] = mod.default;
    if (currentPage === page) LazyPage = mod.default;
    loadingPage = false;
  }

  const pageTitles: Record<string, string> = {
    dashboard: 'Executive Dashboard',
    bookings: 'Bookings & Orders Core',
    calendar: 'Catering Calendar Schedule',
    customers: 'Customers Directory & CRM',
    packages: 'Menu & Packages Catalog',
    expenses: 'Operating Expenses Log',
    billing: 'Billing & Payment Invoices',
    cashflow: 'Cash Flow Ledger & Operating Surplus',
    reports: 'Financial Reports & Analytics',
    kitchen: 'Kitchen Display System (KDS)',
    inventory: 'Inventory & Supply Stock',
    ai: 'Jayraldine AI Assistant',
    settings: 'Settings & Database Tools'
  };
</script>

<ToastContainer />

{#if checkingAuth}
  <div class="h-screen w-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
    Initializing Jayraldine's Catering System...
  </div>
{:else if !currentUser}
  <Login onLoginSuccess={handleLoginSuccess} />
{:else}
  <div class="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 relative">
    <!-- Navigation Sidebar -->
    <Sidebar {currentPage} onSelectPage={handleSelectPage} collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col h-full overflow-hidden relative">
      <Topbar
        title={pageTitles[currentPage] || 'Dashboard'}
        {currentUser}
        onLogout={handleLogout}
      />

      <main class="flex-1 overflow-hidden bg-slate-900/50 relative">
        {#if currentPage === 'dashboard'}
          <Dashboard onNavigate={handleSelectPage} />
        {:else if loadingPage}
          <div class="h-full flex items-center justify-center text-xs text-slate-500">Loading...</div>
        {:else if LazyPage}
          {#if currentPage === 'ai'}
            <svelte:component this={LazyPage} currentScreen={pageTitles[currentPage]} />
          {:else}
            <svelte:component this={LazyPage} />
          {/if}
        {/if}
      </main>
    </div>

    <!-- Global Floating Chef Jay AI Mascot Avatar Widget (Present on ALL pages) -->
    <ChefJayMascot currentScreen={pageTitles[currentPage] || currentPage} />
  </div>
{/if}
