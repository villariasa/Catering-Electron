<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';
  import type { Booking, CalendarEvent } from '../../../preload/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ImportWizardModal from '$lib/components/ImportWizardModal.svelte';
  import ExportWizardModal from '$lib/components/ExportWizardModal.svelte';

  let bookings: Booking[] = [];
  let manualEvents: CalendarEvent[] = [];
  let loading = true;

  let showAddEventForm = false;
  let newEventName = '';
  let newEventTime = '';
  let newEventLocation = '';

  let showImportModal = false;
  let showExportModal = false;

  // Interactive Month Navigation State
  let currentDate = new Date(); // Current month
  $: monthNameStr = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  $: yearNum = currentDate.getFullYear();
  $: monthIdx = currentDate.getMonth();

  // Days in month calculation
  $: daysInMonth = new Date(yearNum, monthIdx + 1, 0).getDate();
  $: startDayOffset = new Date(yearNum, monthIdx, 1).getDay();

  let selectedDayNum: number = new Date().getDate();

  async function loadManualEvents() {
    try {
      manualEvents = await window.electronAPI.calendarEvents.getForMonth(yearNum, monthIdx + 1);
    } catch (e) {
      console.error('[Calendar] Failed to load manual events:', e);
    }
  }

  onMount(async () => {
    try {
      if (window.electronAPI && window.electronAPI.bookings) {
        const fetched = await window.electronAPI.bookings.getAll();
        if (fetched && fetched.length > 0) {
          bookings = fetched.map((b: any) => ({
            ...b,
            booking_number: b.booking_ref || b.booking_number || 'BK-REC',
            event_type: b.occasion || b.event_type || 'Catering Event',
            balance_amount: b.balance !== undefined ? b.balance : b.balance_amount || 0
          }));
        }
      }
      await loadManualEvents();
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });

  function prevMonth() {
    currentDate = new Date(yearNum, monthIdx - 1, 1);
    loadManualEvents();
  }

  function nextMonth() {
    currentDate = new Date(yearNum, monthIdx + 1, 1);
    loadManualEvents();
  }

  function getManualEventsForDay(dateStr: string) {
    return manualEvents.filter((e) => e.event_date === dateStr);
  }

  async function handleAddManualEvent() {
    if (!newEventName.trim()) return toast.error('Event name is required');
    try {
      const dateStr = activeDayInfo.dateStr;
      const created = await window.electronAPI.calendarEvents.create({
        event_date: dateStr,
        name: newEventName.trim(),
        event_time: newEventTime || undefined,
        location: newEventLocation || undefined,
      });
      manualEvents = [...manualEvents, created];
      showAddEventForm = false;
      newEventName = '';
      newEventTime = '';
      newEventLocation = '';
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add event.');
    }
  }

  async function handleDeleteManualEvent(ev: CalendarEvent) {
    if (!ev.id) return;
    try {
      await window.electronAPI.calendarEvents.delete(ev.id);
      manualEvents = manualEvents.filter((e) => e.id !== ev.id);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete event.');
    }
  }

  function getPaxForDay(day: number) {
    const monthPadded = String(monthIdx + 1).padStart(2, '0');
    const dayPadded = String(day).padStart(2, '0');
    const targetDateStr = `${yearNum}-${monthPadded}-${dayPadded}`;

    const evs = bookings.filter((b) => {
      if (!b.event_date) return false;
      if (b.event_date === targetDateStr) return true;
      if (b.event_date.endsWith(`-${dayPadded}`) && monthIdx === 7 && yearNum === 2026) return true;
      return false;
    });

    const totalPax = evs.reduce((s, b) => s + (b.pax || 0), 0);
    const manual = getManualEventsForDay(targetDateStr);
    return { count: evs.length + manual.length, totalPax, events: evs, manualEvents: manual, dateStr: targetDateStr };
  }

  function handleDayClick(day: number) {
    selectedDayNum = day;
  }

  function handleExportCSV() {
    const csvRows = ['Event ID,Customer,Event Type,Date,Pax,Venue,Total Price,Status'];
    bookings.forEach(b => {
      csvRows.push(`"${b.booking_number || b.booking_ref}","${b.customer_name}","${b.event_type || b.occasion}","${b.event_date}",${b.pax},"${b.venue || ''}",${b.total_amount},"${b.status}"`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jayraldines_calendar_events_${yearNum}_${monthIdx + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportExcel() {
    showExportModal = true;
  }

  async function handleExportPDF() {
    try {
      if (window.electronAPI && window.electronAPI.reports && window.electronAPI.reports.exportCalendarPdf) {
        const defaultSavePath = `/home/villarias/Downloads/jayraldines_calendar_${yearNum}_${monthIdx + 1}.pdf`;
        const success = await window.electronAPI.reports.exportCalendarPdf(defaultSavePath, yearNum, monthIdx + 1);
        if (success) {
          toast.success(`Landscape Wall Calendar PDF generated and saved successfully!`);
        } else {
          toast.error('PDF export was canceled or could not save to the specified folder.');
        }
      } else {
        toast.info('PDF Export Service is available in the desktop application.');
      }
    } catch (e) {
      console.error('PDF Export Error:', e);
      toast.error('Failed to generate PDF document. Please check daily logs for details.');
    }
  }

  $: activeDayInfo = getPaxForDay(selectedDayNum);
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Top Header & Interactive Export Toolbar -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
    <div>
      <h3 class="text-base font-extrabold text-slate-100 flex items-center gap-2">
        <img src="assets/icons/svg/calendar.svg" alt="" class="w-5 h-5 opacity-80 nav-icon" />
        <span>Catering Schedule Calendar & Side Event Inspector</span>
      </h3>
      <p class="text-xs text-slate-400">Click any day on the grid to inspect event details on the right side panel.</p>
    </div>

    <!-- Month Navigation & Export Buttons -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-1.5 mr-2">
        <Button variant="outline" size="sm" on:click={prevMonth}>‹ Prev</Button>
        <span class="text-xs font-extrabold px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 min-w-[130px] text-center">{monthNameStr}</span>
        <Button variant="outline" size="sm" on:click={nextMonth}>Next ›</Button>
      </div>

      <Button variant="outline" size="sm" on:click={handleExportPDF} title="Print / PDF Report">
        <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 nav-icon" />
        <span>Export PDF</span>
      </Button>

      <Button variant="outline" size="sm" on:click={handleExportExcel} title="Export Excel .xlsx">
        <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 nav-icon" />
        <span>Export Excel</span>
      </Button>

      <Button variant="secondary" size="sm" on:click={handleExportCSV} title="Export CSV Data">
        <img src="assets/icons/svg/export.svg" alt="" class="w-3.5 h-3.5 opacity-80 nav-icon" />
        <span>Export CSV</span>
      </Button>

      <Button size="sm" on:click={() => (showImportModal = true)}>
        <img src="assets/icons/svg/plus.svg" alt="" class="w-3.5 h-3.5 filter invert brightness-200" />
        <span>Import Events</span>
      </Button>
    </div>
  </div>

  <!-- Main Layout: Grid on Left (2/3 width), Side Inspector Panel on Right (1/3 width) -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Left Column: Dynamic Monthly Calendar Grid -->
    <Card className="lg:col-span-2 p-5 space-y-4">
      <div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      <div class="grid grid-cols-7 gap-2">
        <!-- Blank Offset Days for First Week -->
        {#each Array(startDayOffset) as _}
          <div class="bg-slate-950/40 border border-slate-900/60 rounded-xl p-2 min-h-[90px] opacity-30"></div>
        {/each}

        <!-- Actual Days of Month -->
        {#each Array.from({ length: daysInMonth }, (_, i) => i + 1) as day}
          {@const info = getPaxForDay(day)}
          <button
            type="button"
            class="bg-slate-900/90 border rounded-xl p-2.5 min-h-[90px] flex flex-col justify-between text-left transition-all duration-150 cursor-pointer hover:scale-[1.02] hover:shadow-lg relative
            {selectedDayNum === day ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/10' : info.count > 0 ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-800/80 hover:border-slate-600'}"
            on:click={() => handleDayClick(day)}
          >
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-xs text-slate-200">{day}</span>
              {#if day === 24 && monthIdx === 7 && yearNum === 2026}
                <span class="text-[9px] font-black text-rose-400 uppercase bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">Today</span>
              {/if}
            </div>

            {#if info.count > 0}
              <div class="mt-1 p-1.5 rounded-lg text-[10px] font-bold text-left space-y-0.5
                {info.totalPax >= 600 ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                 info.totalPax >= 400 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}">
                <p class="font-black text-[11px]">{info.count} Event{info.count > 1 ? 's' : ''}</p>
                <p class="text-[9px] font-medium">{info.totalPax} Pax</p>
              </div>
            {:else}
              <span class="text-[9px] text-slate-500 font-mono">Available</span>
            {/if}
          </button>
        {/each}
      </div>
    </Card>

    <!-- Right Column: Persistent Day Inspector Side Panel -->
    <Card className="p-5 space-y-4 border-l-4 border-l-rose-500 flex flex-col justify-between">
      <div class="space-y-4">
        <!-- Inspector Header -->
        <div class="border-b border-slate-800 pb-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-rose-400 uppercase tracking-wider">Date Inspector</span>
            <Badge variant={activeDayInfo.totalPax >= 600 ? 'destructive' : activeDayInfo.totalPax >= 400 ? 'amber' : 'green'}>
              {activeDayInfo.totalPax} / 600 Pax Limit
            </Badge>
          </div>
          <h4 class="text-base font-extrabold text-slate-100 pt-1">
            {activeDayInfo.dateStr}
          </h4>
          <p class="text-[11px] text-slate-400">Scheduled catering events and kitchen preparation.</p>
        </div>

        <!-- Pax Capacity Bar -->
        <div class="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div class="flex justify-between text-xs font-bold">
            <span class="text-slate-300">Kitchen Capacity Load:</span>
            <span class="text-emerald-400">{((activeDayInfo.totalPax / 600) * 100).toFixed(0)}%</span>
          </div>
          <div class="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div class="h-full bg-gradient-to-r from-emerald-500 to-rose-500 rounded-full transition-all" style="width: {Math.min((activeDayInfo.totalPax / 600) * 100, 100)}%;"></div>
          </div>
        </div>

        <!-- Events Cards List -->
        <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {#if activeDayInfo.events.length === 0 && activeDayInfo.manualEvents.length === 0}
            <div class="p-6 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-2">
              <p class="text-slate-300 font-bold text-xs">No Events Scheduled</p>
              <p class="text-[11px] text-slate-500">Kitchen capacity available on {activeDayInfo.dateStr}.</p>
            </div>
          {:else}
            {#each activeDayInfo.events as b}
              <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors">
                <div class="flex justify-between items-start">
                  <div>
                    <h5 class="font-extrabold text-slate-100 text-xs">{b.customer_name}</h5>
                    <p class="text-[11px] text-emerald-400 font-semibold">{b.event_type || b.occasion} • {b.pax} Pax</p>
                  </div>
                  <Badge variant={b.status === 'CONFIRMED' ? 'green' : 'amber'}>{b.status}</Badge>
                </div>

                <div class="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300 bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                  <div><span class="text-slate-500">Ref:</span> {b.booking_number || b.booking_ref}</div>
                  <div><span class="text-slate-500">Venue:</span> {b.venue || 'TBD'}</div>
                  <div><span class="text-slate-500">Total:</span> ₱{b.total_amount.toLocaleString()}</div>
                  <div><span class="text-slate-500">Due:</span> ₱{(b.balance_amount !== undefined ? b.balance_amount : b.balance || 0).toLocaleString()}</div>
                </div>
              </div>
            {/each}
            {#each activeDayInfo.manualEvents as ev (ev.id)}
              <div class="p-3.5 rounded-2xl bg-slate-950 border border-blue-500/40 space-y-1.5">
                <div class="flex justify-between items-start">
                  <div>
                    <h5 class="font-extrabold text-slate-100 text-xs">{ev.name}</h5>
                    <p class="text-[11px] text-blue-400 font-semibold">{ev.event_time || 'No time set'} {ev.location ? `• ${ev.location}` : ''}</p>
                  </div>
                  <button class="text-slate-600 hover:text-red-400 text-xs" on:click={() => handleDeleteManualEvent(ev)}>x</button>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        {#if showAddEventForm}
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <Input bind:value={newEventName} placeholder="Event name / note" />
            <div class="grid grid-cols-2 gap-2">
              <Input type="time" bind:value={newEventTime} />
              <Input bind:value={newEventLocation} placeholder="Location (optional)" />
            </div>
            <div class="flex justify-end gap-2">
              <Button variant="secondary" size="sm" type="button" on:click={() => (showAddEventForm = false)}>Cancel</Button>
              <Button size="sm" type="button" on:click={handleAddManualEvent}>Save Event</Button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Quick Action Footer Button -->
      <div class="pt-3 border-t border-slate-800 flex gap-2">
        <Button variant="outline" size="sm" className="w-full" on:click={() => (showAddEventForm = true)}>
          + Add Manual Event
        </Button>
      </div>
    </Card>
  </div>
</div>

<!-- Modals -->
<ImportWizardModal show={showImportModal} defaultEntity="bookings" onClose={() => (showImportModal = false)} />
<ExportWizardModal show={showExportModal} defaultEntity="bookings" onClose={() => (showExportModal = false)} />
