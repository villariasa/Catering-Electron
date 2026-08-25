<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { User, Notification } from '../../../preload/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { THEME_PALETTES, applyThemePalette } from '$lib/theme';

  export let title: string = 'Dashboard';
  export let currentUser: User | null = null;
  export let onLogout: () => void;

  // ── Quick Theme Toggle ──
  let currentThemeId = 'dark_mode';
  $: currentMode = THEME_PALETTES[currentThemeId]?.mode || 'dark';

  function toggleTheme() {
    currentThemeId = currentMode === 'dark' ? 'light_mode' : 'dark_mode';
    applyThemePalette(currentThemeId);
  }

  // Date and Time without seconds counting (updates every 30 sec)
  let dateTimeStr = formatDateTime();
  let timer: any = null;

  function formatDateTime() {
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateStr} • ${timeStr}`;
  }

  // Notifications Drawer State (real, persisted via `notifications` table)
  let showNotifications = false;
  let notifications: Notification[] = [];

  $: unreadCount = notifications.filter(n => !n.is_read).length;

  function timeAgo(iso?: string): string {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso.replace(' ', 'T')).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  async function loadNotifications() {
    try {
      notifications = await window.electronAPI.notifications.getAll();
    } catch (e) {
      console.error('[Topbar] Failed to load notifications:', e);
    }
  }

  function toggleNotifications() {
    showNotifications = !showNotifications;
    if (showNotifications) loadNotifications();
  }

  async function markAllRead() {
    try {
      await window.electronAPI.notifications.clearAll();
      notifications = notifications.map((n) => ({ ...n, is_read: true }));
    } catch (e) {
      console.error('[Topbar] Failed to clear notifications:', e);
    }
  }

  async function removeNotification(id: number) {
    try {
      await window.electronAPI.notifications.delete(id);
      notifications = notifications.filter(n => n.id !== id);
    } catch (e) {
      console.error('[Topbar] Failed to delete notification:', e);
    }
  }

  onMount(() => {
    currentThemeId = localStorage.getItem('selected_theme_id') || 'dark_mode';
    timer = setInterval(() => {
      dateTimeStr = formatDateTime();
      loadNotifications();
    }, 30000);
    loadNotifications();
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });
</script>

<!-- Clean solid header without backdrop blur -->
<header class="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between select-none relative z-30">
  <div>
    <h2 class="text-lg font-bold text-slate-100">{title}</h2>
    <p class="text-xs text-slate-400">{dateTimeStr}</p>
  </div>

  <div class="flex items-center gap-3">
    <!-- Notifications Bell Button & Popover -->
    <div class="relative">
      <button
        type="button"
        class="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer"
        style="background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-secondary);"
        title="Notifications"
        on:click={toggleNotifications}
        on:mouseenter={(e) => (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)'}
        on:mouseleave={(e) => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'}
      >
        <img src="assets/icons/svg/bell.svg" alt="Notifications" class="w-4 h-4 nav-icon" />
        {#if unreadCount > 0}
          <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        {/if}
      </button>

      <!-- Notifications Popover Drawer with Smooth Slide-Down Animation and Solid BG (No Blur) -->
      {#if showNotifications}
        <Card className="absolute right-0 top-12 w-[380px] sm:w-[440px] shadow-2xl border-2 border-rose-500/50 p-5 space-y-4 z-50 animate-slide-down bg-slate-950 rounded-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="font-extrabold text-slate-100 text-xs tracking-wide">System Notifications</span>
              {#if notifications.length > 0}
                <Badge variant="amber" className="text-[10px] py-0.5 px-2 font-bold">{notifications.length} Active</Badge>
              {/if}
            </div>
            {#if notifications.length > 0}
              <button class="text-[11px] text-slate-400 hover:text-rose-400 font-bold hover:underline cursor-pointer transition-colors" on:click={markAllRead}>
                Clear All
              </button>
            {/if}
          </div>

          <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
            {#if notifications.length === 0}
              <div class="p-8 text-center text-slate-400 text-xs font-medium space-y-1.5 bg-slate-900 rounded-xl border border-dashed border-slate-800">
                <p class="font-bold text-slate-200">All Notifications Cleared</p>
                <p class="text-[10px] text-slate-500">No active system alerts at this time.</p>
              </div>
            {:else}
              {#each notifications as item (item.id)}
                <div class="p-3.5 rounded-xl border text-left space-y-1.5 transition-colors relative {item.is_read ? 'bg-slate-900 border-slate-800' : 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50'}">
                  <div class="flex justify-between items-center pr-6">
                    <span class="font-extrabold text-slate-100 text-xs">{item.title}</span>
                    <span class="text-[10px] text-slate-400 font-mono">{timeAgo(item.created_at)}</span>
                  </div>
                  <p class="text-xs text-slate-300 leading-normal pr-4">{item.message}</p>
                  <button
                    type="button"
                    class="absolute top-3 right-3 text-slate-400 hover:text-rose-400 font-bold text-xs w-5 h-5 rounded-md flex items-center justify-center hover:bg-rose-500/20 transition-colors"
                    title="Dismiss"
                    on:click={() => removeNotification(item.id)}
                  >
                    ✕
                  </button>
                </div>
              {/each}
            {/if}
          </div>
        </Card>
      {/if}
    </div>

    <!-- Quick Theme Toggle -->
    <button
      type="button"
      class="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer"
      style="background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-secondary);"
      title={currentMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      on:click={toggleTheme}
      on:mouseenter={(e) => (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)'}
      on:mouseleave={(e) => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'}
    >
      {#if currentMode === 'dark'}
        <!-- Sun icon -->
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
        </svg>
      {:else}
        <!-- Moon icon -->
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      {/if}
    </button>

    <!-- User Profile & Sign Out -->
    {#if currentUser}
      <div class="flex items-center gap-3 pl-3 border-l border-slate-800">
        <div class="text-right">
          <p class="text-xs font-bold text-slate-200 leading-tight">{currentUser.full_name}</p>
          <Badge variant="amber" className="text-[9px] py-0 px-1.5">{currentUser.role}</Badge>
        </div>
        <Button
          variant="destructive"
          size="sm"
          on:click={onLogout}
          title="Sign Out"
        >
          <img src="assets/icons/svg/log-out.svg" alt="" class="w-3.5 h-3.5 filter invert brightness-200" />
          <span>Sign Out</span>
        </Button>
      </div>
    {/if}
  </div>
</header>
