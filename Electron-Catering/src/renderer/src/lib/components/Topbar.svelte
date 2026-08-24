<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { User } from '../../../preload/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Card from '$lib/components/ui/Card.svelte';

  export let title: string = 'Dashboard';
  export let currentUser: User | null = null;
  export let onNewBooking: () => void;
  export let onLogout: () => void;

  // Date and Time without seconds counting (updates every 30 sec)
  let dateTimeStr = formatDateTime();
  let timer: any = null;

  function formatDateTime() {
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateStr} • ${timeStr}`;
  }

  // Notifications Drawer State
  let showNotifications = false;
  let notifications = [
    { id: 1, type: 'booking', title: 'Upcoming Catering Event', message: 'Juan Dela Cruz — Birthday Party on Aug 28 (100 pax)', time: '10m ago', unread: true },
    { id: 2, type: 'billing', title: 'Unpaid Invoice Balance', message: 'Carlos Reyes has ₱67,500.00 unpaid balance due', time: '1h ago', unread: true },
    { id: 3, type: 'inventory', title: 'Low Stock Warning', message: 'Pork Belly stock is down to 12.0 kg in freezer', time: '3h ago', unread: true }
  ];

  $: unreadCount = notifications.filter(n => n.unread).length;

  function toggleNotifications() {
    showNotifications = !showNotifications;
  }

  function markAllRead() {
    notifications = [];
    showNotifications = false;
  }

  function removeNotification(id: number) {
    notifications = notifications.filter(n => n.id !== id);
  }

  onMount(() => {
    timer = setInterval(() => {
      dateTimeStr = formatDateTime();
    }, 30000);
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
        class="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 transition-all relative cursor-pointer"
        title="Notifications"
        on:click={toggleNotifications}
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
              {#each notifications as item}
                <div class="p-3.5 rounded-xl border text-left space-y-1.5 transition-colors relative bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50">
                  <div class="flex justify-between items-center pr-6">
                    <span class="font-extrabold text-slate-100 text-xs">{item.title}</span>
                    <span class="text-[10px] text-slate-400 font-mono">{item.time}</span>
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

    <!-- Quick Action Button -->
    <Button size="sm" on:click={onNewBooking}>
      <img src="assets/icons/svg/plus.svg" alt="" class="w-3.5 h-3.5 filter invert brightness-200" />
      <span>New Booking</span>
    </Button>

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
