<script lang="ts">
  import { onMount } from 'svelte';
  import type { User } from '../../preload/types';

  import Sidebar from './lib/components/Sidebar.svelte';
  import Topbar from './lib/components/Topbar.svelte';
  import ChefJayMascot from './lib/components/ChefJayMascot.svelte';

  import Login from './lib/pages/Login.svelte';
  import Dashboard from './lib/pages/Dashboard.svelte';
  import Bookings from './lib/pages/Bookings.svelte';
  import Calendar from './lib/pages/Calendar.svelte';
  import Customers from './lib/pages/Customers.svelte';
  import Packages from './lib/pages/Packages.svelte';
  import Expenses from './lib/pages/Expenses.svelte';
  import Billing from './lib/pages/Billing.svelte';
  import CashFlow from './lib/pages/CashFlow.svelte';
  import Reports from './lib/pages/Reports.svelte';
  import Kitchen from './lib/pages/Kitchen.svelte';
  import Inventory from './lib/pages/Inventory.svelte';
  import AIAssistant from './lib/pages/AIAssistant.svelte';
  import Settings from './lib/pages/Settings.svelte';

  let currentUser: User | null = null;
  let checkingAuth = true;
  let currentPage = 'dashboard';

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

  function handleSelectPage(page: string) {
    currentPage = page;
  }

  function handleNewBooking() {
    currentPage = 'bookings';
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
    ai: 'Jayraldine AI Assistant Copilot',
    settings: 'Settings & Database Tools'
  };
</script>

{#if checkingAuth}
  <div class="h-screen w-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
    Initializing Jayraldine's Catering System...
  </div>
{:else if !currentUser}
  <Login onLoginSuccess={handleLoginSuccess} />
{:else}
  <div class="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 relative">
    <!-- Navigation Sidebar -->
    <Sidebar {currentPage} onSelectPage={handleSelectPage} />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col h-full overflow-hidden relative">
      <Topbar
        title={pageTitles[currentPage] || 'Dashboard'}
        {currentUser}
        onNewBooking={handleNewBooking}
        onLogout={handleLogout}
      />

      <main class="flex-1 overflow-hidden bg-slate-900/50 relative">
        {#if currentPage === 'dashboard'}
          <Dashboard onNavigate={handleSelectPage} />
        {:else if currentPage === 'bookings'}
          <Bookings />
        {:else if currentPage === 'calendar'}
          <Calendar />
        {:else if currentPage === 'customers'}
          <Customers />
        {:else if currentPage === 'packages'}
          <Packages />
        {:else if currentPage === 'expenses'}
          <Expenses />
        {:else if currentPage === 'billing'}
          <Billing />
        {:else if currentPage === 'cashflow'}
          <CashFlow />
        {:else if currentPage === 'reports'}
          <Reports />
        {:else if currentPage === 'kitchen'}
          <Kitchen />
        {:else if currentPage === 'inventory'}
          <Inventory />
        {:else if currentPage === 'ai'}
          <AIAssistant />
        {:else if currentPage === 'settings'}
          <Settings />
        {/if}
      </main>
    </div>

    <!-- Global Floating Chef Jay AI Mascot Avatar Widget (Present on ALL pages) -->
    <ChefJayMascot />
  </div>
{/if}
