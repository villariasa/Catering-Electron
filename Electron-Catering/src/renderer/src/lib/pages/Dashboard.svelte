<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { onMount, onDestroy } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { DashboardStats, DashboardChartPoint } from '../../../../../preload/types';

  export let onNavigate: (page: string) => void = () => {};

  let showExportModal = false;
  // xlsx (~280kB) is only needed once the export modal actually opens — loading it
  // eagerly here would add it to the app's startup bundle since Dashboard mounts immediately.
  let ExportWizardModalComp: any = null;
  async function openExportModal() {
    if (!ExportWizardModalComp) {
      ExportWizardModalComp = (await import('$lib/components/ExportWizardModal.svelte')).default;
    }
    showExportModal = true;
  }

  // ── Greeting Slideshow ──
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

  function nextSlide() { currentSlide = (currentSlide + 1) % slides.length; }
  function prevSlide() { currentSlide = (currentSlide - 1 + slides.length) % slides.length; }

  // ── Chart Period Toggle ──
  let chartPeriod: 'Weekly' | 'Monthly' | 'Yearly' = 'Monthly';

  // ── DB-loaded data ──
  let stats: DashboardStats | null = null;
  let isLoading = true;
  let loadError = '';

  // ── Chart hover state ──
  let hoveredIndex: number | null = null;
  let chartMounted = false;

  // ── Live Countdowns ──
  let now = new Date();
  let clockInterval: any = null;

  // Minute-level precision is all event planning actually needs — updating every
  // second forced a full re-render of the entire upcoming-events list 60x/minute.
  function getCountdownText(eventDate: string, eventTime: string): string {
    const targetDt = new Date(`${eventDate}T${eventTime}`);
    const diff = targetDt.getTime() - now.getTime();
    if (diff <= 0) return '🔴 Event started';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  }

  function formatCurrency(val: number): string {
    return '₱' + val.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // ── Load / Reload data from DB ──
  async function loadDashboardStats() {
    isLoading = true;
    chartMounted = false;
    loadError = '';
    try {
      stats = await window.electronAPI.dashboard.getStats(chartPeriod);
      // Trigger bar grow-in animation after data loads
      setTimeout(() => { chartMounted = true; }, 60);
    } catch (e: any) {
      loadError = e?.message || 'Failed to load dashboard data';
    } finally {
      isLoading = false;
    }
  }

  // Reload chart data when period toggle changes
  $: if (chartPeriod) loadDashboardStats();

  // ── SVG Chart config ──
  const SVG_W = 600;
  const SVG_H = 200;
  const PADDING = { top: 16, right: 12, bottom: 28, left: 48 };
  const CHART_W = SVG_W - PADDING.left - PADDING.right;
  const CHART_H = SVG_H - PADDING.top - PADDING.bottom;

  function chartMax(data: DashboardChartPoint[]): number {
    if (!data || data.length === 0) return 1;
    const max = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)));
    return max > 0 ? max * 1.12 : 1; // 12% headroom
  }

  function getYGridLines(max: number): number[] {
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
  }

  function yPos(value: number, max: number): number {
    return CHART_H - (value / max) * CHART_H;
  }

  function barX(index: number, total: number, offset: 0 | 1): number {
    const groupW = CHART_W / total;
    const barW = groupW * 0.34;
    const gap = groupW * 0.04;
    const groupStart = PADDING.left + index * groupW + (groupW - 2 * barW - gap) / 2;
    return groupStart + offset * (barW + gap);
  }

  function barWidth(total: number): number {
    const groupW = CHART_W / total;
    return groupW * 0.34;
  }

  // ── Mark event completed ──
  async function markEventCompleted(id: number) {
    try {
      await window.electronAPI.bookings.updateStatus(id, 'COMPLETED');
      await loadDashboardStats();
    } catch (e) {
      toast.error('Failed to update status.');
    }
  }

  onMount(() => {
    slideTimer = setInterval(nextSlide, 6500);
    clockInterval = setInterval(() => { now = new Date(); }, 60000);
    loadDashboardStats();
  });

  onDestroy(() => {
    if (slideTimer) clearInterval(slideTimer);
    if (clockInterval) clearInterval(clockInterval);
  });
</script>

<style>
  /* ── Bar grow-in animation ── */
  @keyframes barGrow {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }

  .bar-animated {
    transform-origin: bottom;
    animation: barGrow 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  /* ── Tooltip slide-fade in ── */
  @keyframes tooltipIn {
    from { opacity: 0; transform: translateY(6px) translateX(-50%) scale(0.92); }
    to   { opacity: 1; transform: translateY(0)  translateX(-50%) scale(1); }
  }

  .tooltip-animated {
    animation: tooltipIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* ── Glow pulse for hovered bar ── */
  @keyframes barGlow {
    0%, 100% { filter: drop-shadow(0 0 4px currentColor); }
    50%       { filter: drop-shadow(0 0 10px currentColor); }
  }

  .bar-glow-green { animation: barGlow 1.4s ease-in-out infinite; color: #34d399; }
  .bar-glow-rose  { animation: barGlow 1.4s ease-in-out infinite; color: #fb7185; }

  /* ── Period toggle pulse ── */
  @keyframes pillPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.08); }
    100% { transform: scale(1); }
  }
  .period-active { animation: pillPop 0.25s ease-out; }
</style>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Top Welcome Header & Quick Action Buttons -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-extrabold text-slate-100">Welcome back, Owner</h2>
      <p class="text-xs text-slate-400">Here's what's happening at Jayraldine's Catering today.</p>
    </div>

    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm" on:click={openExportModal}>
        <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 filter invert" />
        <span>Export Report</span>
      </Button>

      <Button size="sm" on:click={() => onNavigate('bookings')}>
        <img src="assets/icons/svg/plus.svg" alt="" class="w-3.5 h-3.5 filter invert brightness-200" />
        <span>+ New Booking</span>
      </Button>

      <button
        class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-900 text-slate-300 hover:text-[var(--text-primary)] hover:border-slate-500 transition-all"
        on:click={loadDashboardStats}
        title="Refresh dashboard data"
      >
        ↻ Refresh
      </button>
    </div>
  </div>

  <!-- Welcome Hero Slideshow Card -->
  <Card className="relative overflow-hidden p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border-rose-500/40 border-2">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="space-y-3 flex-1">
        <span class="inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider border {slides[currentSlide].badgeColor}">
          {slides[currentSlide].badge}
        </span>
        <h3 class="text-lg font-extrabold text-slate-100 tracking-tight">{slides[currentSlide].title}</h3>
        <p class="text-xs text-slate-300 max-w-2xl leading-relaxed">{slides[currentSlide].desc}</p>
        <div class="pt-1">
          <Button size="sm" className="bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-bold" on:click={slides[currentSlide].btnAction}>
            {slides[currentSlide].btnText}
          </Button>
        </div>
      </div>

      <div class="flex flex-col items-end gap-3 select-none">
        <div class="flex gap-2">
          <button class="w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 hover:bg-rose-600 hover:border-rose-500 transition-colors flex items-center justify-center font-bold" on:click={prevSlide}>‹</button>
          <button class="w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 hover:bg-rose-600 hover:border-rose-500 transition-colors flex items-center justify-center font-bold" on:click={nextSlide}>›</button>
        </div>
        <div class="flex gap-1.5">
          {#each slides as _, i}
            <button class="h-2 rounded-full transition-all {currentSlide === i ? 'w-6 bg-rose-500' : 'w-2 bg-slate-700 hover:bg-slate-500'}" on:click={() => (currentSlide = i)}></button>
          {/each}
        </div>
      </div>
    </div>
  </Card>

  <!-- 4 Primary KPI Summary Cards (Live from DB) -->
  {#if isLoading}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      {#each [1,2,3,4] as _}
        <Card className="border-l-4 border-l-slate-700 space-y-2 animate-pulse">
          <div class="h-4 bg-slate-800 rounded w-3/4"></div>
          <div class="h-8 bg-slate-800 rounded w-1/2 mt-2"></div>
          <div class="h-4 bg-slate-800 rounded w-1/3 mt-1"></div>
        </Card>
      {/each}
    </div>
  {:else if loadError}
    <div class="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm">⚠ {loadError}</div>
  {:else if stats}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-sky-500 space-y-2">
        <div class="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Total Active Bookings</span>
          <img src="assets/icons/svg/bookings.svg" alt="" class="w-4 h-4 opacity-50" />
        </div>
        <h3 class="text-3xl font-extrabold text-slate-100">{stats.totalActiveBookings}</h3>
        <Badge variant="secondary">Pending & Confirmed</Badge>
      </Card>

      <Card className="border-l-4 border-l-emerald-500 space-y-2">
        <div class="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Gross Revenue</span>
          <img src="assets/icons/svg/reports.svg" alt="" class="w-4 h-4 opacity-50" />
        </div>
        <h3 class="text-3xl font-extrabold text-emerald-400">{formatCurrency(stats.grossRevenue)}</h3>
        <Badge variant="green">Confirmed + Completed</Badge>
      </Card>

      <Card className="border-l-4 border-l-red-500 space-y-2">
        <div class="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Operating Expenses</span>
          <img src="assets/icons/svg/billing.svg" alt="" class="w-4 h-4 opacity-50" />
        </div>
        <h3 class="text-3xl font-extrabold text-red-400">{formatCurrency(stats.operatingExpenses)}</h3>
        <Badge variant="secondary">All Expense Categories</Badge>
      </Card>

      <Card className="border-l-4 border-l-amber-500 space-y-2">
        <div class="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Net Profit Surplus</span>
          <img src="assets/icons/svg/billing.svg" alt="" class="w-4 h-4 opacity-50" />
        </div>
        <h3 class="text-3xl font-extrabold {stats.netProfit >= 0 ? 'text-amber-400' : 'text-red-400'}">{formatCurrency(stats.netProfit)}</h3>
        <Badge variant={stats.netProfit >= 0 ? 'amber' : 'red'}>{stats.netMarginPct}% Net Margin</Badge>
      </Card>
    </div>

    <!-- Secondary KPI Row (matches the Python dashboard's daily/operational KPIs) -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card className="border-l-4 border-l-indigo-500 space-y-1 p-3">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Today's Events</p>
        <h4 class="text-xl font-extrabold text-slate-100">{stats.todayEventsCount}</h4>
      </Card>
      <Card className="border-l-4 border-l-teal-500 space-y-1 p-3">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Today's Pax</p>
        <h4 class="text-xl font-extrabold text-slate-100">{stats.todayPax}</h4>
      </Card>
      <Card className="border-l-4 border-l-amber-500 space-y-1 p-3">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Bookings</p>
        <h4 class="text-xl font-extrabold text-amber-400">{stats.pendingBookingsCount}</h4>
      </Card>
      <Card className="border-l-4 border-l-red-500 space-y-1 p-3">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Unpaid Invoices</p>
        <h4 class="text-xl font-extrabold text-red-400">{formatCurrency(stats.unpaidInvoicesTotal)}</h4>
      </Card>
      <Card className="border-l-4 border-l-emerald-500 space-y-1 p-3">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Downpayment Today</p>
        <h4 class="text-xl font-extrabold text-emerald-400">{formatCurrency(stats.downpaymentReceivedToday)}</h4>
      </Card>
    </div>
  {/if}

  <!-- Follow-Ups Due Today Alert Strip -->
  {#if stats && stats.followUpsDueToday.length > 0}
    <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
      <Badge variant="amber">{stats.followUpsDueToday.length} Follow-Up{stats.followUpsDueToday.length > 1 ? 's' : ''} Due</Badge>
      <div class="flex-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-amber-200">
        {#each stats.followUpsDueToday as f (f.id)}
          <span><strong>{f.customer_name}</strong>{f.note ? ` — ${f.note}` : ''} ({f.follow_up_date})</span>
        {/each}
      </div>
      <button class="text-xs text-amber-400 hover:text-amber-300 font-bold flex-shrink-0" on:click={() => onNavigate('customers')}>View →</button>
    </div>
  {/if}

  <!-- Middle Grid: Revenue vs Expenses Chart & Upcoming Events -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

    <!-- ── SVG Chart Card ── -->
    <Card className="md:col-span-2 space-y-4">
      <!-- Header + Period Toggle -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 class="font-bold text-slate-100 text-sm">Revenue vs Operating Expenses</h4>
          <p class="text-[11px] text-slate-400">
            {chartPeriod === 'Weekly' ? 'Last 7 days breakdown' : chartPeriod === 'Monthly' ? 'Last 12 months breakdown' : 'Last 5 years breakdown'}
            {#if hoveredIndex !== null && stats}
              <span class="ml-2 text-rose-400 font-semibold">— {stats.chartData[hoveredIndex]?.label}</span>
            {/if}
          </p>
        </div>

        <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {#each ['Weekly', 'Monthly', 'Yearly'] as p}
            <button
              class="px-3 py-1 rounded-lg text-xs font-bold transition-all {chartPeriod === p ? 'bg-rose-600 text-white period-active shadow-md shadow-rose-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
              on:click={() => { chartPeriod = p as any; hoveredIndex = null; }}
            >
              {p}
            </button>
          {/each}
        </div>
      </div>

      <!-- SVG Bar Chart -->
      {#if isLoading}
        <div class="h-56 flex items-center justify-center">
          <div class="flex flex-col items-center gap-3">
            <div class="flex gap-1.5">
              {#each [1,2,3,4,5] as i}
                <div class="w-5 rounded-t-sm bg-slate-800 animate-pulse" style="height: {30 + i * 14}px; animation-delay: {i * 80}ms;"></div>
              {/each}
            </div>
            <span class="text-slate-500 text-xs">Loading chart data...</span>
          </div>
        </div>
      {:else if stats && stats.chartData.length > 0}
        {@const data = stats.chartData}
        {@const maxVal = chartMax(data)}
        {@const bw = barWidth(data.length)}
        {@const gridLines = getYGridLines(maxVal)}

        <div class="relative select-none" style="height: {SVG_H + 8}px;">
          <svg
            viewBox="0 0 {SVG_W} {SVG_H}"
            class="w-full h-full overflow-visible"
            role="img"
            aria-label="Revenue vs Operating Expenses chart"
          >
            <defs>
              <!-- Revenue gradient -->
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2dd4bf" />
                <stop offset="100%" stop-color="#059669" />
              </linearGradient>
              <!-- Expense gradient -->
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fbbf24" />
                <stop offset="100%" stop-color="#e11d48" />
              </linearGradient>
              <!-- Revenue glow filter -->
              <filter id="glowGreen" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <!-- Expense glow filter -->
              <filter id="glowRose" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <!-- Column highlight fill -->
              <linearGradient id="colHighlight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.04" />
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0.01" />
              </linearGradient>
            </defs>

            <!-- Y-axis grid lines -->
            {#each gridLines as g, gi}
              {@const y = PADDING.top + yPos(g, maxVal)}
              <line
                x1={PADDING.left}
                y1={y}
                x2={SVG_W - PADDING.right}
                y2={y}
                stroke="#1e293b"
                stroke-width={gi === 0 ? 1.5 : 0.8}
                stroke-dasharray={gi === 0 ? '' : '3 4'}
              />
              <text x={PADDING.left - 6} y={y + 3.5} text-anchor="end" font-size="8" fill="#475569" font-family="monospace">
                {g >= 1000 ? `${(g / 1000).toFixed(0)}k` : g.toFixed(0)}
              </text>
            {/each}

            <!-- Column hover highlight background -->
            {#each data as d, i}
              {@const groupW = CHART_W / data.length}
              {@const isHovered = hoveredIndex === i}
              {#if isHovered}
                <rect
                  x={PADDING.left + i * groupW + 2}
                  y={PADDING.top}
                  width={groupW - 4}
                  height={CHART_H}
                  fill="url(#colHighlight)"
                  rx="4"
                  style="pointer-events: none; transition: opacity 0.15s;"
                />
              {/if}
            {/each}

            <!-- Revenue and Expense Bars + X-axis Labels -->
            {#each data as d, i}
              {@const groupW = CHART_W / data.length}
              {@const revX = barX(i, data.length, 0)}
              {@const expX = barX(i, data.length, 1)}
              {@const revH = chartMounted ? Math.max(2, (d.revenue / maxVal) * CHART_H) : 0}
              {@const expH = chartMounted ? Math.max(2, (d.expenses / maxVal) * CHART_H) : 0}
              {@const revY = PADDING.top + CHART_H - revH}
              {@const expY = PADDING.top + CHART_H - expH}
              {@const isHovered = hoveredIndex === i}
              {@const isDimmed = hoveredIndex !== null && !isHovered}

              <!-- Revenue Bar -->
              <rect
                x={revX}
                y={revY}
                width={bw}
                height={revH}
                rx="3"
                fill="url(#revGrad)"
                filter={isHovered ? 'url(#glowGreen)' : 'none'}
                opacity={isDimmed ? 0.25 : 1}
                class={chartMounted ? 'bar-animated' : ''}
                style="
                  pointer-events: none;
                  transition: opacity 0.2s ease, filter 0.2s ease;
                  animation-delay: {i * 40}ms;
                  transform-origin: {revX + bw / 2}px {PADDING.top + CHART_H}px;
                "
              />

              <!-- Expense Bar -->
              <rect
                x={expX}
                y={expY}
                width={bw}
                height={expH}
                rx="3"
                fill="url(#expGrad)"
                filter={isHovered ? 'url(#glowRose)' : 'none'}
                opacity={isDimmed ? 0.25 : 1}
                class={chartMounted ? 'bar-animated' : ''}
                style="
                  pointer-events: none;
                  transition: opacity 0.2s ease, filter 0.2s ease;
                  animation-delay: {i * 40 + 20}ms;
                  transform-origin: {expX + bw / 2}px {PADDING.top + CHART_H}px;
                "
              />

              <!-- X-axis label -->
              <text
                x={PADDING.left + i * groupW + groupW / 2}
                y={SVG_H - 4}
                text-anchor="middle"
                font-size="8"
                font-weight={isHovered ? '700' : '500'}
                fill={isHovered ? '#f1f5f9' : isDimmed ? '#334155' : '#64748b'}
                style="pointer-events: none; transition: fill 0.15s ease;"
                font-family="sans-serif"
              >
                {d.label}
              </text>
            {/each}

            <!-- Invisible wide hover zone for each column (rendered LAST so mouse never loses target) -->
            {#each data as d, i}
              {@const groupW = CHART_W / data.length}
              <rect
                x={PADDING.left + i * groupW}
                y={PADDING.top}
                width={groupW}
                height={CHART_H}
                fill="rgba(0,0,0,0)"
                on:mouseenter={() => (hoveredIndex = i)}
                on:mouseleave={() => (hoveredIndex = null)}
                style="cursor: crosshair; pointer-events: all;"
              />
            {/each}

            <!-- Tooltip (SVG foreignObject for rich styling) -->
            {#if hoveredIndex !== null}
              {@const d = data[hoveredIndex]}
              {@const i = hoveredIndex}
              {@const groupW = CHART_W / data.length}
              {@const tipX = Math.min(
                Math.max(PADDING.left + i * groupW + groupW / 2 - 62, PADDING.left),
                SVG_W - PADDING.right - 124
              )}
              {@const topBarH = Math.max(
                chartMounted ? Math.max(2, (d.revenue / maxVal) * CHART_H) : 0,
                chartMounted ? Math.max(2, (d.expenses / maxVal) * CHART_H) : 0
              )}
              {@const tipY = PADDING.top + CHART_H - topBarH - 82}

              <foreignObject
                x={tipX}
                y={Math.max(PADDING.top - 8, tipY)}
                width="124"
                height="76"
                style="overflow: visible; pointer-events: none;"
              >
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  class="tooltip-animated"
                  style="
                    position: absolute;
                    left: 0; top: 0;
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border: 1px solid #334155;
                    border-radius: 10px;
                    padding: 8px 10px;
                    width: 124px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15);
                    font-family: sans-serif;
                  "
                >
                  <div style="font-size:10px; font-weight:800; color:#f1f5f9; margin-bottom:5px; border-bottom: 1px solid #1e293b; padding-bottom:4px;">
                    {d.label}
                  </div>
                  <div style="display:flex; align-items:center; gap:5px; margin-bottom:3px;">
                    <span style="width:8px; height:8px; border-radius:2px; background:linear-gradient(180deg,#2dd4bf,#059669); flex-shrink:0;"></span>
                    <span style="font-size:9px; color:#94a3b8;">Revenue</span>
                    <span style="font-size:9px; font-weight:700; color:#34d399; margin-left:auto;">{formatCurrency(d.revenue)}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:5px; margin-bottom:3px;">
                    <span style="width:8px; height:8px; border-radius:2px; background:linear-gradient(180deg,#fbbf24,#e11d48); flex-shrink:0;"></span>
                    <span style="font-size:9px; color:#94a3b8;">Expenses</span>
                    <span style="font-size:9px; font-weight:700; color:#fb7185; margin-left:auto;">{formatCurrency(d.expenses)}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:5px; border-top:1px solid #1e293b; padding-top:4px; margin-top:2px;">
                    <span style="font-size:9px; color:#94a3b8;">Net</span>
                    <span style="font-size:9px; font-weight:800; color:{d.revenue - d.expenses >= 0 ? '#fbbf24' : '#fb7185'}; margin-left:auto;">
                      {formatCurrency(d.revenue - d.expenses)}
                    </span>
                  </div>
                </div>
              </foreignObject>
            {/if}
          </svg>
        </div>
      {:else}
        <div class="h-56 flex flex-col items-center justify-center gap-2 text-slate-500">
          <span class="text-2xl">📊</span>
          <span class="text-sm">No data for this period yet</span>
        </div>
      {/if}

      <!-- Legend -->
      <div class="flex justify-center items-center gap-6 text-xs pt-1 font-semibold">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm" style="background: linear-gradient(180deg,#2dd4bf,#059669);"></span>
          <span class="text-slate-300">Gross Revenue (₱)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm" style="background: linear-gradient(180deg,#fbbf24,#e11d48);"></span>
          <span class="text-slate-300">Operating Expenses (₱)</span>
        </div>
        {#if hoveredIndex !== null && stats}
          {@const d = stats.chartData[hoveredIndex]}
          <div class="flex items-center gap-2 border-l border-slate-700 pl-4">
            <span class="text-slate-400">Net:</span>
            <span class="font-extrabold {d.revenue - d.expenses >= 0 ? 'text-amber-400' : 'text-rose-400'}">
              {formatCurrency(d.revenue - d.expenses)}
            </span>
          </div>
        {/if}
      </div>
    </Card>

    <!-- Upcoming Events Card with Live Countdowns (from DB) -->
    <Card className="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h4 class="font-bold text-slate-100 text-sm">Upcoming Catering Events</h4>
          <p class="text-[11px] text-slate-400">Live countdowns & status</p>
        </div>
        {#if stats}
          <Badge variant="amber">{stats.upcomingEvents.length} Events Soon</Badge>
        {/if}
      </div>

      <div class="space-y-3 overflow-y-auto max-h-80 pr-1">
        {#if isLoading}
          {#each [1,2,3] as _}
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2 animate-pulse">
              <div class="h-3 bg-slate-800 rounded w-3/4"></div>
              <div class="h-3 bg-slate-800 rounded w-1/2"></div>
              <div class="h-3 bg-slate-800 rounded w-2/3 mt-1"></div>
            </div>
          {/each}
        {:else if stats && stats.upcomingEvents.length > 0}
          {#each stats.upcomingEvents as ev}
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2 hover:border-slate-600 hover:bg-slate-900 transition-all duration-200">
              <div class="flex justify-between items-start gap-2">
                <div class="min-w-0">
                  <h5 class="font-bold text-slate-100 text-xs truncate">{ev.name} — {ev.occasion}</h5>
                  <p class="text-[10px] text-slate-400 truncate">{ev.venue} • {ev.pax} pax</p>
                  <p class="text-[10px] text-slate-500">{ev.event_date} at {ev.event_time}</p>
                </div>
                <Badge variant={ev.status === 'CONFIRMED' ? 'green' : ev.status === 'COMPLETED' ? 'secondary' : 'amber'}>{ev.status}</Badge>
              </div>

              <div class="flex justify-between items-center pt-1 border-t border-slate-800/60">
                <span class="text-[11px] font-extrabold font-mono text-amber-400 flex items-center gap-1">
                  ⏱ {getCountdownText(ev.event_date, ev.event_time)}
                </span>

                {#if ev.status !== 'COMPLETED'}
                  <button
                    class="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400/50 px-2 py-1 rounded-md transition-all duration-150"
                    on:click={() => markEventCompleted(ev.id)}
                  >
                    ✓ Complete
                  </button>
                {:else}
                  <span class="text-[10px] font-bold text-slate-500 px-2 py-1">Done</span>
                {/if}
              </div>
            </div>
          {/each}
        {:else}
          <div class="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
            <span class="text-2xl">🎉</span>
            <span class="text-sm">No upcoming events</span>
            <button class="text-xs text-rose-400 hover:text-rose-300 mt-1" on:click={() => onNavigate('bookings')}>
              + Add a booking
            </button>
          </div>
        {/if}
      </div>
    </Card>
  </div>

  <!-- Recent Activity Feed (from real audit_logs) -->
  <Card className="space-y-3">
    <div class="flex items-center justify-between border-b border-slate-800 pb-3">
      <h4 class="font-bold text-slate-100 text-sm">Recent Activity</h4>
      <p class="text-[11px] text-slate-400">Latest system events</p>
    </div>
    <div class="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
      {#if !stats || stats.recentActivity.length === 0}
        <p class="text-slate-500 text-center py-4">No recent activity yet.</p>
      {:else}
        {#each stats.recentActivity as a (a.id)}
          <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <div class="min-w-0">
              <span class="font-bold text-slate-200">{a.action.replace(/_/g, ' ')}</span>
              <span class="text-slate-400 ml-2 truncate">{a.details}</span>
            </div>
            <span class="text-[10px] text-slate-500 font-mono flex-shrink-0 ml-3">{a.created_at}</span>
          </div>
        {/each}
      {/if}
    </div>
  </Card>
</div>

<!-- Export Report Modal -->
{#if ExportWizardModalComp}
  <svelte:component this={ExportWizardModalComp} show={showExportModal} defaultEntity="all" onClose={() => (showExportModal = false)} />
{/if}
