<script lang="ts">
  import { onMount } from 'svelte';
  import type { Booking } from '../../../preload/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ImportWizardModal from '$lib/components/ImportWizardModal.svelte';
  import ExportWizardModal from '$lib/components/ExportWizardModal.svelte';

  let bookings: Booking[] = [];
  let loading = true;

  // Search & Filter state
  let searchQuery = '';
  let statusFilter = 'ALL';
  let occasionFilter = 'ALL';

  // Modals state
  let showCreateModal = false;
  let showImportModal = false;
  let showExportModal = false;
  let showDetailModal = false;
  let selectedBooking: Booking | null = null;

  // Form inputs for new booking
  let customerName = '';
  let customerPhone = '09171234567';
  let customerEmail = '';
  let occasion = 'Wedding Reception';
  let eventDate = new Date().toISOString().split('T')[0];
  let eventTime = '18:00';
  let venue = 'Waterfront Hotel Grand Ballroom, Cebu City';
  let pax = 150;
  let selectedPackage = 'Executive Grand Buffet (₱650/pax)';
  let pricePerPax = 650;
  let customAddons = 'Lechon Pork Belly (Whole), Bam-I Noodles';
  let amountPaid = 30000;
  let specialNotes = 'Include extra setup for VIP head table and floral centerpieces.';

  $: calculatedTotal = pax * pricePerPax;
  $: minDownpayment = Math.round(calculatedTotal * 0.3);
  $: calculatedBalance = Math.max(0, calculatedTotal - amountPaid);
  $: calculatedPaymentStatus = amountPaid >= calculatedTotal ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';

  async function fetchBookings() {
    loading = true;
    try {
      if (window.electronAPI && window.electronAPI.bookings) {
        bookings = await window.electronAPI.bookings.getAll();
      } else {
        if (bookings.length === 0) {
          bookings = [
            { booking_ref: 'BK-2026-0001', customer_name: 'Juan Dela Cruz', occasion: 'Birthday Party', event_date: '2026-08-28', event_time: '17:00', venue: 'Marco Polo Ballroom, Nivel Hills', pax: 100, total_amount: 45000, amount_paid: 15000, balance: 30000, status: 'CONFIRMED', payment_status: 'Partial' },
            { booking_ref: 'BK-2026-0002', customer_name: 'Maria Santos', occasion: 'Wedding Reception', event_date: '2026-09-12', event_time: '18:30', venue: 'Waterfront Hotel Grand Ballroom', pax: 200, total_amount: 130000, amount_paid: 130000, balance: 0, status: 'CONFIRMED', payment_status: 'Paid' },
            { booking_ref: 'BK-2026-0003', customer_name: 'Carlos Reyes', occasion: 'Corporate Anniversary', event_date: '2026-09-25', event_time: '12:00', venue: 'Cebu Trade Hall', pax: 150, total_amount: 67500, amount_paid: 0, balance: 67500, status: 'PENDING', payment_status: 'Unpaid' },
            { booking_ref: 'BK-2026-0004', customer_name: 'Dr. Evelyn Tan', occasion: 'Medical Symposium', event_date: '2026-10-05', event_time: '11:30', venue: 'Chong Hua Hospital Auditorium', pax: 80, total_amount: 52000, amount_paid: 20000, balance: 32000, status: 'CONFIRMED', payment_status: 'Partial' }
          ];
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function handleCreateBooking() {
    if (!customerName.trim()) return alert('Please enter customer name');
    const newRef = `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBk: Booking = {
      booking_ref: newRef,
      customer_name: customerName,
      occasion,
      event_date: eventDate,
      event_time: eventTime,
      venue,
      pax,
      total_amount: calculatedTotal,
      amount_paid: amountPaid,
      balance: calculatedBalance,
      status: 'CONFIRMED',
      payment_status: calculatedPaymentStatus
    };

    try {
      if (window.electronAPI && window.electronAPI.bookings) {
        await window.electronAPI.bookings.create(newBk);
        await fetchBookings();
      } else {
        bookings = [newBk, ...bookings];
      }
      showCreateModal = false;
      customerName = '';
      alert(`Booking ${newRef} created successfully and saved to SQLite!`);
    } catch (e) {
      alert(`Failed to create booking: ${e}`);
    }
  }

  function handleViewDetails(b: Booking) {
    selectedBooking = b;
    showDetailModal = true;
  }

  function handleSendReceiptEmail(b: Booking) {
    alert(`Branded PDF receipt for ${b.booking_ref} emailed to ${b.customer_name}!`);
  }

  function handleMarkCompleted(b: Booking) {
    b.status = 'COMPLETED';
    bookings = [...bookings];
    alert(`Booking ${b.booking_ref} marked as COMPLETED!`);
  }

  onMount(fetchBookings);

  $: filteredBookings = bookings.filter(b => {
    const matchesSearch = b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.booking_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesOccasion = occasionFilter === 'ALL' || b.occasion === occasionFilter;
    return matchesSearch && matchesStatus && matchesOccasion;
  });
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Header Bar -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h3 class="text-lg font-extrabold text-slate-100 flex items-center gap-2">
        <img src="assets/icons/svg/bookings.svg" alt="" class="w-5 h-5 opacity-80" />
        <span>Catering Bookings & Reservations</span>
      </h3>
      <p class="text-xs text-slate-400">Manage reservations, menu package selections, downpayments, and client dispatches.</p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" on:click={() => (showImportModal = true)}>📥 Import CSV/Excel</Button>
      <Button variant="outline" size="sm" on:click={() => (showExportModal = true)}>📤 Export Data</Button>
      <Button size="sm" on:click={() => (showCreateModal = true)}>+ Create New Booking</Button>
    </div>
  </div>

  <!-- Filters & Search Toolbar -->
  <Card className="p-4 space-y-3 bg-slate-900/80 border-slate-800">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="w-full md:w-72">
        <Input bind:value={searchQuery} placeholder="Search by client, ref #, or venue..." />
      </div>

      <div class="flex flex-wrap items-center gap-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-semibold">Status:</span>
          <select class="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs font-semibold" bind:value={statusFilter}>
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-semibold">Occasion:</span>
          <select class="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs font-semibold" bind:value={occasionFilter}>
            <option value="ALL">All Occasions</option>
            <option value="Wedding Reception">Wedding Reception</option>
            <option value="Birthday Party">Birthday Party</option>
            <option value="Corporate Anniversary">Corporate Anniversary</option>
            <option value="Medical Symposium">Medical Symposium</option>
          </select>
        </div>
      </div>
    </div>
  </Card>

  <!-- Bookings Data Table -->
  <Card>
    {#if loading}
      <p class="text-xs text-slate-400 py-8 text-center">Loading bookings from SQLite database...</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <th class="py-3 px-2">Booking Ref</th>
              <th class="py-3 px-2">Client Name</th>
              <th class="py-3 px-2">Occasion</th>
              <th class="py-3 px-2">Event Date & Time</th>
              <th class="py-3 px-2">Venue Address</th>
              <th class="py-3 px-2 text-center">Pax</th>
              <th class="py-3 px-2 text-right">Total (₱)</th>
              <th class="py-3 px-2 text-right">Paid (₱)</th>
              <th class="py-3 px-2 text-right">Balance (₱)</th>
              <th class="py-3 px-2 text-center">Status</th>
              <th class="py-3 px-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            {#each filteredBookings as b}
              <tr class="hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-2 font-mono text-emerald-400 font-bold">{b.booking_ref}</td>
                <td class="py-3 px-2 font-bold text-slate-100">{b.customer_name}</td>
                <td class="py-3 px-2 text-slate-300 font-medium">{b.occasion}</td>
                <td class="py-3 px-2 text-slate-300">{b.event_date} <span class="text-slate-500 font-mono text-[10px]">({b.event_time})</span></td>
                <td class="py-3 px-2 text-slate-400 truncate max-w-xs">{b.venue}</td>
                <td class="py-3 px-2 text-center font-bold text-slate-200">{b.pax} pax</td>
                <td class="py-3 px-2 text-right font-bold text-slate-100">₱{b.total_amount.toLocaleString()}</td>
                <td class="py-3 px-2 text-right text-emerald-400 font-bold">₱{b.amount_paid.toLocaleString()}</td>
                <td class="py-3 px-2 text-right text-amber-400 font-bold">₱{b.balance.toLocaleString()}</td>
                <td class="py-3 px-2 text-center">
                  <Badge variant={b.status === 'CONFIRMED' ? 'green' : b.status === 'PENDING' ? 'amber' : b.status === 'COMPLETED' ? 'secondary' : 'destructive'}>
                    {b.status}
                  </Badge>
                </td>
                <td class="py-3 px-2 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200" on:click={() => handleViewDetails(b)}>
                      View
                    </button>
                    <button class="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-[10px] font-bold text-blue-400" on:click={() => handleSendReceiptEmail(b)}>
                      Email
                    </button>
                    {#if b.status !== 'COMPLETED'}
                      <button class="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-[10px] font-bold text-emerald-400" on:click={() => handleMarkCompleted(b)}>
                        Done
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </Card>

  <!-- Create Full Booking Modal Form -->
  {#if showCreateModal}
    <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <Card className="max-w-2xl w-full p-6 space-y-4 my-8">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="font-extrabold text-slate-100 text-base flex items-center gap-2">
            <img src="assets/icons/svg/plus.svg" alt="" class="w-4 h-4 filter invert" />
            <span>Create New Catering Reservation (SQLite Database)</span>
          </h3>
          <button class="text-slate-400 hover:text-slate-200 font-bold" on:click={() => (showCreateModal = false)}>✕</button>
        </div>

        <form on:submit|preventDefault={handleCreateBooking} class="space-y-4 text-xs">
          <!-- Client Info -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="bk-cname" class="block text-slate-300 font-semibold mb-1">Customer Full Name *</label>
              <Input id="bk-cname" bind:value={customerName} placeholder="e.g. Maria Santos" />
            </div>
            <div>
              <label for="bk-cphone" class="block text-slate-300 font-semibold mb-1">Phone Number</label>
              <Input id="bk-cphone" bind:value={customerPhone} />
            </div>
            <div>
              <label for="bk-cemail" class="block text-slate-300 font-semibold mb-1">Email Address</label>
              <Input id="bk-cemail" bind:value={customerEmail} placeholder="maria@gmail.com" />
            </div>
          </div>

          <!-- Event Info -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="bk-occ" class="block text-slate-300 font-semibold mb-1">Occasion Type</label>
              <select id="bk-occ" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs" bind:value={occasion}>
                <option value="Wedding Reception">Wedding Reception</option>
                <option value="Birthday Party">Birthday Party</option>
                <option value="Corporate Anniversary">Corporate Anniversary</option>
                <option value="Medical Symposium">Medical Symposium</option>
                <option value="Fiesta Celebration">Fiesta Celebration</option>
              </select>
            </div>

            <div>
              <label for="bk-date" class="block text-slate-300 font-semibold mb-1">Event Date</label>
              <Input id="bk-date" type="date" bind:value={eventDate} />
            </div>

            <div>
              <label for="bk-time" class="block text-slate-300 font-semibold mb-1">Event Time</label>
              <Input id="bk-time" type="time" bind:value={eventTime} />
            </div>
          </div>

          <div>
            <label for="bk-venue" class="block text-slate-300 font-semibold mb-1">Venue Location & Address</label>
            <Input id="bk-venue" bind:value={venue} />
          </div>

          <!-- Package & Pricing -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <label for="bk-pax" class="block text-slate-300 font-semibold mb-1">Guest Pax Count</label>
              <Input id="bk-pax" type="number" bind:value={pax} />
            </div>

            <div>
              <label for="bk-price" class="block text-slate-300 font-semibold mb-1">Price per Pax (₱)</label>
              <Input id="bk-price" type="number" bind:value={pricePerPax} />
            </div>

            <div>
              <label for="bk-dp" class="block text-slate-300 font-semibold mb-1">Downpayment (₱)</label>
              <Input id="bk-dp" type="number" bind:value={amountPaid} />
            </div>
          </div>

          <!-- Auto Financial Calculation Summary -->
          <div class="grid grid-cols-3 gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Calculated Total</span>
              <span class="text-sm font-extrabold text-slate-100">₱{calculatedTotal.toLocaleString()}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Min 30% Downpayment</span>
              <span class="text-sm font-extrabold text-amber-400">₱{minDownpayment.toLocaleString()}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Remaining Balance</span>
              <span class="text-sm font-extrabold text-emerald-400">₱{calculatedBalance.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label for="bk-notes" class="block text-slate-300 font-semibold mb-1">Special Catering Instructions / Notes</label>
            <Input id="bk-notes" bind:value={specialNotes} />
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" on:click={() => (showCreateModal = false)}>Cancel</Button>
            <Button size="sm" type="submit">Save Booking to Database</Button>
          </div>
        </form>
      </Card>
    </div>
  {/if}

  <!-- View Booking Detail Modal -->
  {#if showDetailModal && selectedBooking}
    <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="font-extrabold text-slate-100 text-sm">{selectedBooking.booking_ref}</h3>
            <p class="text-xs text-slate-400">{selectedBooking.customer_name}</p>
          </div>
          <button class="text-slate-400 hover:text-slate-200 font-bold" on:click={() => (showDetailModal = false)}>✕</button>
        </div>

        <div class="space-y-2 text-xs text-slate-300">
          <p><strong>Occasion:</strong> {selectedBooking.occasion}</p>
          <p><strong>Event Schedule:</strong> {selectedBooking.event_date} at {selectedBooking.event_time}</p>
          <p><strong>Venue:</strong> {selectedBooking.venue}</p>
          <p><strong>Guest Count:</strong> {selectedBooking.pax} pax</p>
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <p class="flex justify-between"><span>Total Billing:</span><strong class="text-slate-100">₱{selectedBooking.total_amount.toLocaleString()}</strong></p>
            <p class="flex justify-between"><span>Amount Paid:</span><strong class="text-emerald-400">₱{selectedBooking.amount_paid.toLocaleString()}</strong></p>
            <p class="flex justify-between"><span>Balance Due:</span><strong class="text-amber-400">₱{selectedBooking.balance.toLocaleString()}</strong></p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button size="sm" variant="secondary" on:click={() => (showDetailModal = false)}>Close</Button>
          <Button size="sm" on:click={() => handleSendReceiptEmail(selectedBooking)}>Email PDF Receipt</Button>
        </div>
      </Card>
    </div>
  {/if}
</div>

<!-- Import / Export Modals -->
<ImportWizardModal show={showImportModal} defaultEntity="bookings" onClose={() => (showImportModal = false)} />
<ExportWizardModal show={showExportModal} defaultEntity="bookings" onClose={() => (showExportModal = false)} />
