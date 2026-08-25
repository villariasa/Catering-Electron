<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';
  import type { Booking, Customer, PackageItem, MenuItem, Occasion } from '../../../preload/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ImportWizardModal from '$lib/components/ImportWizardModal.svelte';
  import ExportWizardModal from '$lib/components/ExportWizardModal.svelte';

  let bookings: Booking[] = [];
  let customers: Customer[] = [];
  let packages: PackageItem[] = [];
  let dishes: MenuItem[] = [];
  let occasionsList: Occasion[] = [];
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
  let creating = false;

  // ── Booking Wizard State (4 steps: Customer & Event -> Package -> Add-Ons -> Payment & Review) ──
  let wizardStep = 1;

  // Step 1: Customer & Event
  let customerSearch = '';
  let selectedCustomer: Customer | null = null;
  let showNewCustomerForm = false;
  let newCustomerName = '';
  let newCustomerPhone = '';
  let newCustomerEmail = '';
  let newCustomerAddress = '';
  let occasion = '';
  let eventDate = new Date().toISOString().split('T')[0];
  let eventTime = '18:00';
  let venue = '';
  let pax = 50;

  // Step 2: Package
  let selectedPackageId: number | 'custom' = 'custom';
  let customPricePerPax = 500;

  // Step 3: Add-Ons
  let addonQuantities: Record<number, number> = {};

  // Step 4: Payment & Review
  let amountPaid = 0;
  let specialNotes = '';

  $: filteredCustomers = customerSearch.trim()
    ? customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.contact_number.includes(customerSearch)).slice(0, 8)
    : [];

  $: selectedPackage = selectedPackageId === 'custom' ? null : packages.find((p) => p.id === selectedPackageId) || null;
  $: pricePerPax = selectedPackage ? selectedPackage.price_per_pax : customPricePerPax;
  $: packageSubtotal = pax * pricePerPax;
  $: selectedAddons = dishes.filter((d) => d.id !== undefined && (addonQuantities[d.id] || 0) > 0);
  $: addonsTotal = selectedAddons.reduce((s, d) => s + (d.price * (addonQuantities[d.id!] || 0)), 0);
  $: calculatedTotal = packageSubtotal + addonsTotal;
  $: minDownpayment = Math.round(calculatedTotal * 0.3);
  $: calculatedBalance = Math.max(0, calculatedTotal - amountPaid);
  $: calculatedPaymentStatus = amountPaid >= calculatedTotal && calculatedTotal > 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';
  $: addonsSummary = selectedAddons.map((d) => `${d.name} x${addonQuantities[d.id!]}`).join(', ');

  function resetWizard() {
    wizardStep = 1;
    customerSearch = '';
    selectedCustomer = null;
    showNewCustomerForm = false;
    newCustomerName = '';
    newCustomerPhone = '';
    newCustomerEmail = '';
    newCustomerAddress = '';
    occasion = occasionsList[0]?.name || '';
    eventDate = new Date().toISOString().split('T')[0];
    eventTime = '18:00';
    venue = '';
    pax = 50;
    selectedPackageId = 'custom';
    customPricePerPax = 500;
    addonQuantities = {};
    amountPaid = 0;
    specialNotes = '';
  }

  function openCreateWizard() {
    resetWizard();
    showCreateModal = true;
  }

  function selectCustomer(c: Customer) {
    selectedCustomer = c;
    customerSearch = '';
    showNewCustomerForm = false;
  }

  function toggleAddon(dish: MenuItem) {
    if (dish.id === undefined) return;
    const current = addonQuantities[dish.id] || 0;
    addonQuantities = { ...addonQuantities, [dish.id]: current > 0 ? 0 : 1 };
  }

  function setAddonQty(dishId: number, qty: number) {
    addonQuantities = { ...addonQuantities, [dishId]: Math.max(0, qty) };
  }

  function goToStep(step: number) {
    if (step === 2) {
      if (!selectedCustomer && !(showNewCustomerForm && newCustomerName.trim() && newCustomerPhone.trim())) {
        return toast.error('Select an existing customer or fill in the new customer details.');
      }
      if (!occasion) return toast.error('Occasion is required.');
      if (!eventDate) return toast.error('Event date is required.');
      if (!venue.trim()) return toast.error('Venue is required.');
      if (pax <= 0) return toast.error('Pax count must be greater than 0.');
    }
    wizardStep = step;
  }

  async function fetchBookings() {
    loading = true;
    try {
      const [bk, cust, pkgs, items, occs] = await Promise.all([
        window.electronAPI.bookings.getAll(),
        window.electronAPI.customers.getAll(),
        window.electronAPI.packages.getAll(),
        window.electronAPI.menuItems.getAll(),
        window.electronAPI.settings.getOccasions(),
      ]);
      bookings = bk;
      customers = cust;
      packages = pkgs;
      dishes = items;
      occasionsList = occs;
    } catch (e) {
      console.error('[Bookings] Failed to load:', e);
    } finally {
      loading = false;
    }
  }

  async function handleCreateBooking() {
    creating = true;
    try {
      let customer = selectedCustomer;

      if (!customer && showNewCustomerForm) {
        if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
          creating = false;
          return toast.error('New customer name and phone are required.');
        }
        customer = await window.electronAPI.customers.create({
          name: newCustomerName.trim(),
          contact_number: newCustomerPhone.trim(),
          email: newCustomerEmail || undefined,
          address: newCustomerAddress || undefined,
          loyalty_tier: 'New',
        });
      }

      if (!customer) {
        creating = false;
        return toast.error('Please select or add a customer.');
      }

      const newRef = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newBk: Omit<Booking, 'id'> = {
        booking_ref: newRef,
        customer_id: customer.id,
        customer_name: customer.name,
        occasion,
        event_date: eventDate,
        event_time: eventTime,
        venue,
        pax,
        package_id: selectedPackage?.id,
        addons: addonsSummary || undefined,
        total_amount: calculatedTotal,
        amount_paid: amountPaid,
        balance: calculatedBalance,
        status: 'PENDING',
        payment_status: calculatedPaymentStatus,
      };

      await window.electronAPI.bookings.create(newBk);
      await fetchBookings();
      showCreateModal = false;
      toast.success(`Booking ${newRef} created and awaiting approval!`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create booking.');
    } finally {
      creating = false;
    }
  }

  function handleViewDetails(b: Booking) {
    selectedBooking = b;
    showDetailModal = true;
  }

  async function handleSendReceiptEmail(b: Booking) {
    try {
      const invoices = await window.electronAPI.invoices.getAll();
      const invoice = invoices.find((inv) => inv.booking_id === b.id);
      if (!invoice) return toast.error('No invoice found for this booking yet.');

      const result = await window.electronAPI.invoices.emailReceipt(invoice.id);
      if (result.success) toast.success(`Receipt emailed to ${b.customer_name}!`);
      else toast.error(result.error || 'Failed to email receipt.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to email receipt.');
    }
  }

  async function handleApprove(b: Booking) {
    if (!b.id) return;
    try {
      await window.electronAPI.bookings.updateStatus(b.id, 'CONFIRMED');
      b.status = 'CONFIRMED';
      bookings = [...bookings];
      toast.success(`Booking ${b.booking_ref} approved!`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve booking.');
    }
  }

  async function handleDecline(b: Booking) {
    if (!b.id) return;
    const reason = prompt('Cancellation reason (optional):') || undefined;
    try {
      await window.electronAPI.bookings.updateStatus(b.id, 'CANCELLED', reason);
      b.status = 'CANCELLED';
      bookings = [...bookings];
    } catch (e: any) {
      toast.error(e?.message || 'Failed to decline booking.');
    }
  }

  async function handleMarkCompleted(b: Booking) {
    if (!b.id) return;
    try {
      await window.electronAPI.bookings.updateStatus(b.id, 'COMPLETED');
      b.status = 'COMPLETED';
      bookings = [...bookings];
      toast.success(`Booking ${b.booking_ref} marked as COMPLETED!`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update booking status.');
    }
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
      <Button variant="outline" size="sm" on:click={() => (showImportModal = true)}>Import CSV/Excel</Button>
      <Button variant="outline" size="sm" on:click={() => (showExportModal = true)}>Export Data</Button>
      <Button size="sm" on:click={openCreateWizard}>+ Create New Booking</Button>
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
            {#each occasionsList as occ (occ.id)}
              <option value={occ.name}>{occ.name}</option>
            {/each}
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
                    {#if b.status === 'PENDING'}
                      <button class="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-[10px] font-bold text-emerald-400" on:click={() => handleApprove(b)}>
                        Approve
                      </button>
                      <button class="px-2 py-1 rounded bg-red-600/20 hover:bg-red-600/40 text-[10px] font-bold text-red-400" on:click={() => handleDecline(b)}>
                        Decline
                      </button>
                    {:else if b.status !== 'COMPLETED' && b.status !== 'CANCELLED'}
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

  <!-- Create New Booking — 4-Step Wizard -->
  {#if showCreateModal}
    <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <Card className="max-w-2xl w-full p-6 space-y-4 my-8">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="font-extrabold text-slate-100 text-base flex items-center gap-2">
            <img src="assets/icons/svg/plus.svg" alt="" class="w-4 h-4 filter invert" />
            <span>Create New Catering Reservation</span>
          </h3>
          <button class="text-slate-400 hover:text-slate-200 font-bold" on:click={() => (showCreateModal = false)}>✕</button>
        </div>

        <!-- Stepper Indicator -->
        <div class="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
          <div class="p-2 rounded-xl border {wizardStep === 1 ? 'bg-rose-600/20 border-rose-500 text-rose-400' : wizardStep > 1 ? 'bg-emerald-600/10 border-emerald-600/40 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">1. Customer & Event</div>
          <div class="p-2 rounded-xl border {wizardStep === 2 ? 'bg-rose-600/20 border-rose-500 text-rose-400' : wizardStep > 2 ? 'bg-emerald-600/10 border-emerald-600/40 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">2. Package</div>
          <div class="p-2 rounded-xl border {wizardStep === 3 ? 'bg-rose-600/20 border-rose-500 text-rose-400' : wizardStep > 3 ? 'bg-emerald-600/10 border-emerald-600/40 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">3. Add-Ons</div>
          <div class="p-2 rounded-xl border {wizardStep === 4 ? 'bg-rose-600/20 border-rose-500 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-500'}">4. Payment & Review</div>
        </div>

        <!-- Step 1: Customer & Event -->
        {#if wizardStep === 1}
          <div class="space-y-4 text-xs">
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Select Customer *</label>
              {#if selectedCustomer}
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div>
                    <span class="font-bold text-slate-100">{selectedCustomer.name}</span>
                    <span class="text-slate-400 ml-2">{selectedCustomer.contact_number}</span>
                  </div>
                  <button type="button" class="text-slate-400 hover:text-red-400 font-bold" on:click={() => (selectedCustomer = null)}>Change</button>
                </div>
              {:else if showNewCustomerForm}
                <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-200">New Customer</span>
                    <button type="button" class="text-slate-400 hover:text-slate-200" on:click={() => (showNewCustomerForm = false)}>Cancel</button>
                  </div>
                  <Input bind:value={newCustomerName} placeholder="Full name *" />
                  <div class="grid grid-cols-2 gap-2">
                    <Input bind:value={newCustomerPhone} placeholder="Phone *" />
                    <Input bind:value={newCustomerEmail} placeholder="Email (optional)" />
                  </div>
                  <Input bind:value={newCustomerAddress} placeholder="Address (optional)" />
                </div>
              {:else}
                <Input bind:value={customerSearch} placeholder="Search customer by name or phone..." />
                {#if filteredCustomers.length > 0}
                  <div class="mt-1.5 border border-slate-800 rounded-xl bg-slate-950 max-h-40 overflow-y-auto">
                    {#each filteredCustomers as c (c.id)}
                      <button type="button" class="w-full text-left px-3 py-2 hover:bg-slate-900 border-b border-slate-800/60 last:border-0" on:click={() => selectCustomer(c)}>
                        <span class="font-bold text-slate-200">{c.name}</span>
                        <span class="text-slate-400 ml-2">{c.contact_number}</span>
                      </button>
                    {/each}
                  </div>
                {/if}
                <button type="button" class="text-blue-400 hover:text-blue-300 font-semibold mt-2" on:click={() => (showNewCustomerForm = true)}>
                  + Add New Customer
                </button>
              {/if}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label for="bk-occ" class="block text-slate-300 font-semibold mb-1">Occasion Type *</label>
                <select id="bk-occ" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs" bind:value={occasion}>
                  <option value="">Select occasion...</option>
                  {#each occasionsList as occ (occ.id)}
                    <option value={occ.name}>{occ.name}</option>
                  {/each}
                </select>
              </div>
              <div>
                <label for="bk-date" class="block text-slate-300 font-semibold mb-1">Event Date *</label>
                <Input id="bk-date" type="date" bind:value={eventDate} />
              </div>
              <div>
                <label for="bk-time" class="block text-slate-300 font-semibold mb-1">Event Time</label>
                <Input id="bk-time" type="time" bind:value={eventTime} />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label for="bk-venue" class="block text-slate-300 font-semibold mb-1">Venue Location & Address *</label>
                <Input id="bk-venue" bind:value={venue} placeholder="e.g. Waterfront Hotel Grand Ballroom" />
              </div>
              <div>
                <label for="bk-pax" class="block text-slate-300 font-semibold mb-1">Guest Pax Count *</label>
                <Input id="bk-pax" type="number" bind:value={pax} />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="secondary" size="sm" type="button" on:click={() => (showCreateModal = false)}>Cancel</Button>
              <Button size="sm" type="button" on:click={() => goToStep(2)}>Next: Package →</Button>
            </div>
          </div>

        <!-- Step 2: Package Selection -->
        {:else if wizardStep === 2}
          <div class="space-y-4 text-xs">
            <p class="text-slate-400">Choose a catering package, or use a custom per-pax rate.</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                class="p-3 rounded-xl border text-left transition-all {selectedPackageId === 'custom' ? 'border-rose-500 bg-rose-500/10' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'}"
                on:click={() => (selectedPackageId = 'custom')}
              >
                <span class="font-bold text-slate-100 block">Custom Rate</span>
                <span class="text-slate-400 text-[11px]">Set your own price per pax</span>
              </button>
              {#each packages as pkg (pkg.id)}
                <button
                  type="button"
                  class="p-3 rounded-xl border text-left transition-all {selectedPackageId === pkg.id ? 'border-rose-500 bg-rose-500/10' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'}"
                  on:click={() => (selectedPackageId = pkg.id ?? 'custom')}
                >
                  <span class="font-bold text-slate-100 block">{pkg.name}</span>
                  <span class="text-emerald-400 font-bold text-[11px]">₱{pkg.price_per_pax}/pax</span>
                  <span class="text-slate-500 text-[10px] block">Min {pkg.min_pax} pax</span>
                </button>
              {/each}
            </div>

            {#if selectedPackageId === 'custom'}
              <div>
                <label for="bk-custom-price" class="block text-slate-300 font-semibold mb-1">Custom Price per Pax (₱)</label>
                <Input id="bk-custom-price" type="number" bind:value={customPricePerPax} />
              </div>
            {/if}

            <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
              <span class="text-slate-400">Package Subtotal ({pax} pax × ₱{pricePerPax})</span>
              <span class="font-extrabold text-slate-100">₱{packageSubtotal.toLocaleString()}</span>
            </div>

            <div class="flex justify-between gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" type="button" on:click={() => (wizardStep = 1)}>← Back</Button>
              <Button size="sm" type="button" on:click={() => (wizardStep = 3)}>Next: Add-Ons →</Button>
            </div>
          </div>

        <!-- Step 3: Add-Ons -->
        {:else if wizardStep === 3}
          <div class="space-y-4 text-xs">
            <p class="text-slate-400">Add optional extra dishes from the catalog on top of the base package.</p>

            {#if dishes.length === 0}
              <p class="text-slate-500 text-center py-6">No dishes in the catalog yet. You can skip this step.</p>
            {:else}
              <div class="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {#each dishes as d (d.id)}
                  <div class="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={d.id !== undefined && (addonQuantities[d.id] || 0) > 0}
                      class="rounded bg-slate-900 border-slate-700 text-emerald-500 cursor-pointer"
                      on:change={() => toggleAddon(d)}
                    />
                    <span class="flex-1 text-slate-200 font-medium">{d.name}</span>
                    <span class="text-emerald-400 font-bold">₱{d.price}</span>
                    {#if d.id !== undefined && (addonQuantities[d.id] || 0) > 0}
                      <input
                        type="number"
                        min="1"
                        value={addonQuantities[d.id]}
                        class="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs"
                        on:input={(e) => setAddonQty(d.id ?? -1, Number((e.target as HTMLInputElement).value))}
                      />
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}

            <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
              <span class="text-slate-400">Add-Ons Total ({selectedAddons.length} item{selectedAddons.length === 1 ? '' : 's'})</span>
              <span class="font-extrabold text-slate-100">₱{addonsTotal.toLocaleString()}</span>
            </div>

            <div class="flex justify-between gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" type="button" on:click={() => (wizardStep = 2)}>← Back</Button>
              <Button size="sm" type="button" on:click={() => (wizardStep = 4)}>Next: Payment & Review →</Button>
            </div>
          </div>

        <!-- Step 4: Payment & Review -->
        {:else}
          <form on:submit|preventDefault={handleCreateBooking} class="space-y-4 text-xs">
            <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <p class="flex justify-between"><span class="text-slate-400">Customer:</span><strong class="text-slate-100">{selectedCustomer?.name || newCustomerName}</strong></p>
              <p class="flex justify-between"><span class="text-slate-400">Event:</span><strong class="text-slate-100">{occasion} — {eventDate} {eventTime}</strong></p>
              <p class="flex justify-between"><span class="text-slate-400">Venue:</span><strong class="text-slate-100">{venue}</strong></p>
              <p class="flex justify-between"><span class="text-slate-400">Package:</span><strong class="text-slate-100">{selectedPackage ? selectedPackage.name : 'Custom Rate'} ({pax} pax)</strong></p>
              {#if addonsSummary}
                <p class="flex justify-between"><span class="text-slate-400">Add-Ons:</span><strong class="text-slate-100 text-right max-w-[60%]">{addonsSummary}</strong></p>
              {/if}
            </div>

            <div>
              <label for="bk-dp" class="block text-slate-300 font-semibold mb-1">Downpayment (₱)</label>
              <Input id="bk-dp" type="number" bind:value={amountPaid} />
            </div>

            <div class="grid grid-cols-3 gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Grand Total</span>
                <span class="text-sm font-extrabold text-slate-100">₱{calculatedTotal.toLocaleString()}</span>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Suggested 30% DP</span>
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

            <div class="flex justify-between gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" type="button" disabled={creating} on:click={() => (wizardStep = 3)}>← Back</Button>
              <Button size="sm" type="submit" disabled={creating}>{creating ? 'Saving...' : 'Submit for Approval'}</Button>
            </div>
          </form>
        {/if}
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
          {#if selectedBooking.package_name}
            <p><strong>Package:</strong> {selectedBooking.package_name}</p>
          {/if}
          {#if selectedBooking.addons}
            <p><strong>Add-Ons:</strong> {selectedBooking.addons}</p>
          {/if}
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
