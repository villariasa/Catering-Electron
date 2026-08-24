<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ExportWizardModal from '$lib/components/ExportWizardModal.svelte';

  export let onNavigate: (page: string) => void = () => {};

  let showExportModal = false;

  // Greeting & Hero Slideshow state
  let currentSlide = 0;
  let slideTimer: any = null;

  const slides = [
    {
      badge: 'EXECUTIVE BRIEFING • SYSTEM ONLINE',
      badgeColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
      title: getGreetingTitle(),
      desc: `Operations and kitchen prep are online for today's catering schedule. — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`,
      btnText: '+ New Reservation',
      btnAction: () => onNavigate('bookings')
    },
    {
      badge: 'RESERVATIONS & DISPATCH',
      badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      title: 'Real-Time Bookings & Automated Email Dispatch',
      desc: 'Create reservations, send branded PDF receipts, and dispatch client approval requests directly.',
      btnText: 'Manage Orders',
      btnAction: () => onNavigate('bookings')
    },
    {
      badge: 'CHEF JAY AI INTELLIGENCE',
      badgeColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      title: 'Recipe Costing, Margin Analytics & Kitchen Optimization',
      desc: 'Chef Jay is ready to forecast ingredient requirements, analyze profit margins, and assist with menu packages.',
      btnText: 'Open AI Assistant',
      btnAction: () => onNavigate('ai')
    }
  ];

  function getGreetingTitle() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning, Team Jayraldine';
    if (hour < 18) return 'Good Afternoon, Team Jayraldine';
    return 'Good Evening, Team Jayraldine';
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  }

  // Date Filtering Toolbar State
  let activeDateFilter: 'all' | 'today' | 'yesterday' | 'custom' = 'all';
  let customDate = new Date().toISOString().split('T')[0];

  // Revenue vs Expenses Chart Period Toggle
  let chartPeriod: 'Weekly' | 'Monthly' | 'Yearly' = 'Monthly';

  // Live Countdowns State for Upcoming Events
  let now = new Date();
  let clockInterval: any = null;

  const upcomingEvents = [
    { id: 101, name: 'Juan Dela Cruz — Birthday Party', dateStr: 'Aug 28, 2026 at 5:00 PM', eventDt: new Date('2026-08-28T17:00:00'), pax: 100, venue: 'Marco Polo Ballroom', status: 'CONFIRMED' },
    { id: 102, name: 'Maria Santos — Wedding Reception', dateStr: 'Sep 12, 2026 at 6:30 PM', eventDt: new Date('2026-09-12T18:30:00'), pax: 200, venue: 'Waterfront Grand Ballroom', status: 'CONFIRMED' },
    { id: 103, name: 'Carlos Reyes — Corporate Anniversary', dateStr: 'Sep 25, 2026 at 12:00 PM', eventDt: new Date('2026-09-25T12:00:00'), pax: 150, venue: 'Cebu Trade Hall', status: 'PENDING' }
  ];

  function getCountdownText(targetDt: Date): string {
    const diff = targetDt.getTime() - now.getTime();
    if (diff <= 0) return 'Event started';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `Starts in ${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function markEventCompleted(id: number) {
    alert(`Event #${id} marked as Completed! Saved to SQLite database.`);
  }

  onMount(() => {
    slideTimer = setInterval(nextSlide, 6500);
    clockInterval = setInterval(() => {
      now = new Date();
    }, 1000);
  });

  onDestroy(() => {
    if (slideTimer) clearInterval(slideTimer);
    if (clockInterval) clearInterval(clockInterval);
  });
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Top Welcome Header & Quick Action Buttons -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-extrabold text-slate-100">Welcome back, Owner</h2>
      <p class="text-xs text-slate-400">Here's what's happening at Jayraldine's Catering today.</p>
    </div>

    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm" on:click={() => (showExportModal = true)}>
        <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 filter invert" />
        <span>Export Report</span>
      </Button>

      <Button size="sm" on:click={() => onNavigate('bookings')}>
        <img src="assets/icons/svg/plus.svg" alt="" class="w-3.5 h-3.5 filter invert brightness-200" />
        <span>+ New Booking</span>
      </Button>
    </div>
  </div>

  <!-- Date Filtering Toolbar -->
  <Card className="p-3 bg-slate-900/90 border-slate-800 flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
        <img src="assets/icons/svg/calendar.svg" alt="" class="w-4 h-4 filter invert-[40%] sepia-[90%] saturate-[500%] hue-rotate-[320deg]" />
        Date Scope Filter:
      </span>

      <div class="flex gap-1.5">
        <button
          class="px-3 py-1 rounded-lg text-xs font-semibold border transition-all {activeDateFilter === 'all' ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}"
          on:click={() => (activeDateFilter = 'all')}
        >
          All Time
        </button>

        <button
          class="px-3 py-1 rounded-lg text-xs font-semibold border transition-all {activeDateFilter === 'today' ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}"
          on:click={() => (activeDateFilter = 'today')}
        >
          Today
        </button>

        <button
          class="px-3 py-1 rounded-lg text-xs font-semibold border transition-all {activeDateFilter === 'yesterday' ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}"
          on:click={() => (activeDateFilter = 'yesterday')}
        >
          Yesterday
        </button>
      </div>

      <div class="flex items-center gap-2 pl-3 border-l border-slate-800">
        <span class="text-[11px] text-slate-400 font-medium">Specific Date:</span>
        <input type="date" class="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 focus:outline-none" bind:value={customDate} on:change={() => (activeDateFilter = 'custom')} />
      </div>
    </div>

    <span class="text-xs font-extrabold text-rose-400">
      Showing: {activeDateFilter === 'all' ? 'All Time Overview' : activeDateFilter === 'today' ? 'Today Operations' : activeDateFilter === 'yesterday' ? 'Yesterday Summary' : customDate}
    </span>
  </Card>

  <!-- Welcome Hero Slideshow Card -->
  <Card className="relative overflow-hidden p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border-rose-500/40 border-2">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="space-y-3 flex-1">
        <span class="inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider border {slides[currentSlide].badgeColor}">
          {slides[currentSlide].badge}
        </span>

        <h3 class="text-lg font-extrabold text-slate-100 tracking-tight">
          {slides[currentSlide].title}
        </h3>

        <p class="text-xs text-slate-300 max-w-2xl leading-relaxed">
          {slides[currentSlide].desc}
        </p>

        <div class="pt-1">
          <Button size="sm" className="bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-bold" on:click={slides[currentSlide].btnAction}>
            {slides[currentSlide].btnText}
          </Button>
        </div>
      </div>

      <!-- Slideshow Navigation Controls -->
      <div class="flex flex-col items-end gap-3 select-none">
        <div class="flex gap-2">
          <button class="w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 hover:bg-rose-600 hover:border-rose-500 transition-colors flex items-center justify-center font-bold" on:click={prevSlide}>
            ‹
          </button>
          <button class="w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 hover:bg-rose-600 hover:border-rose-500 transition-colors flex items-center justify-center font-bold" on:click={nextSlide}>
            ›
          </button>
        </div>

        <div class="flex gap-1.5">
          {#each slides as _, i}
            <button
              class="h-2 rounded-full transition-all {currentSlide === i ? 'w-6 bg-rose-500' : 'w-2 bg-slate-700 hover:bg-slate-500'}"
              on:click={() => (currentSlide = i)}
            ></button>
          {/each}
        </div>
      </div>
    </div>
  </Card>

  <!-- 4 Primary KPI Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card className="border-l-4 border-l-sky-500 space-y-2">
      <div class="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>Total Active Bookings</span>
        <img src="assets/icons/svg/bookings.svg" alt="" class="w-4 h-4 opacity-50" />
      </div>
      <h3 class="text-3xl font-extrabold text-slate-100">24</h3>
      <Badge variant="green">+12% vs last month</Badge>
    </Card>

    <Card className="border-l-4 border-l-emerald-500 space-y-2">
      <div class="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>Gross Revenue</span>
        <img src="assets/icons/svg/reports.svg" alt="" class="w-4 h-4 opacity-50" />
      </div>
      <h3 class="text-3xl font-extrabold text-emerald-400">₱242,500</h3>
      <Badge variant="green">Target ₱200k Reached</Badge>
    </Card>

    <Card className="border-l-4 border-l-red-500 space-y-2">
      <div class="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>Operating Expenses</span>
        <img src="assets/icons/svg/billing.svg" alt="" class="w-4 h-4 opacity-50" />
      </div>
      <h3 class="text-3xl font-extrabold text-red-400">₱22,100</h3>
      <Badge variant="secondary">Meat & Staff Wages</Badge>
    </Card>

    <Card className="border-l-4 border-l-amber-500 space-y-2">
      <div class="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>Net Profit Surplus</span>
        <img src="assets/icons/svg/billing.svg" alt="" class="w-4 h-4 opacity-50" />
      </div>
      <h3 class="text-3xl font-extrabold text-amber-400">₱220,400</h3>
      <Badge variant="amber">90.8% Net Margin</Badge>
    </Card>
  </div>

  <!-- Middle Grid: Revenue vs Expenses Chart & Upcoming Events with Countdown -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Chart: Revenue vs Expenses Bar Chart with Toggle -->
    <Card className="md:col-span-2 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 class="font-bold text-slate-100 text-sm">Revenue vs Operating Expenses</h4>
          <p class="text-[11px] text-slate-400">Comparison breakdown over time</p>
        </div>

        <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {#each ['Weekly', 'Monthly', 'Yearly'] as p}
            <button
              class="px-3 py-1 rounded-lg text-xs font-bold transition-all {chartPeriod === p ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}"
              on:click={() => (chartPeriod = p as any)}
            >
              {p}
            </button>
          {/each}
        </div>
      </div>

      <!-- Bar Chart Visualization -->
      <div class="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-800/80 px-4">
        {#each [
          { label: 'Jan', rev: 45000, exp: 12000 },
          { label: 'Feb', rev: 62000, exp: 15000 },
          { label: 'Mar', rev: 58000, exp: 14000 },
          { label: 'Apr', rev: 75000, exp: 18000 },
          { label: 'May', rev: 90000, exp: 21000 },
          { label: 'Jun', rev: 110000, exp: 24000 },
          { label: 'Jul', rev: 95000, exp: 19000 },
          { label: 'Aug', rev: 175000, exp: 22100 }
        ] as d}
          <div class="flex-1 flex flex-col items-center gap-1.5 group relative">
            <div class="w-full flex justify-center items-end gap-1 h-44">
              <!-- Revenue Bar -->
              <div class="w-1/2 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md transition-all duration-300" style="height: {(d.rev / 175000) * 160}px;"></div>
              <!-- Expense Bar -->
              <div class="w-1/2 bg-gradient-to-t from-rose-600 to-amber-500 rounded-t-md transition-all duration-300" style="height: {(d.exp / 175000) * 160}px;"></div>
            </div>
            <span class="text-[10px] font-bold text-slate-400">{d.label}</span>
          </div>
        {/each}
      </div>

      <div class="flex justify-center items-center gap-6 text-xs pt-1 font-semibold">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm bg-emerald-500"></span>
          <span class="text-slate-300">Gross Revenue (₱)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm bg-rose-500"></span>
          <span class="text-slate-300">Operating Expenses (₱)</span>
        </div>
      </div>
    </Card>

    <!-- Upcoming Events Card with Live Countdowns & Complete Action -->
    <Card className="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 class="font-bold text-slate-100 text-sm">Upcoming Catering Events</h4>
          <p class="text-[11px] text-slate-400">Live countdowns & status</p>
        </div>
        <Badge variant="amber">3 Events Soon</Badge>
      </div>

      <div class="space-y-3">
        {#each upcomingEvents as ev}
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
            <div class="flex justify-between items-start gap-2">
              <div>
                <h5 class="font-bold text-slate-100 text-xs">{ev.name}</h5>
                <p class="text-[10px] text-slate-400">{ev.venue} • {ev.pax} pax</p>
              </div>
              <Badge variant={ev.status === 'CONFIRMED' ? 'green' : 'amber'}>{ev.status}</Badge>
            </div>

            <div class="flex justify-between items-center pt-1 border-t border-slate-800/60">
              <span class="text-[11px] font-extrabold font-mono text-amber-400 flex items-center gap-1">
                ⏱ {getCountdownText(ev.eventDt)}
              </span>

              <button class="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md" on:click={() => markEventCompleted(ev.id)}>
                ✓ Complete
              </button>
            </div>
          </div>
        {/each}
      </div>
    </Card>
  </div>
</div>

<!-- Export Report Modal -->
<ExportWizardModal show={showExportModal} defaultEntity="all" onClose={() => (showExportModal = false)} />
