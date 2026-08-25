<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';
  import type { Customer, FollowUp, Booking } from '../../../preload/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ImportWizardModal from '$lib/components/ImportWizardModal.svelte';
  import ExportWizardModal from '$lib/components/ExportWizardModal.svelte';

  let customers: Customer[] = [];
  let allBookings: Booking[] = [];
  let loading = true;
  let searchQuery = '';
  let tierFilter = 'All';

  // Drawer / Modals state
  let showAddModal = false;
  let showImportModal = false;
  let showExportModal = false;
  let showProfileDrawer = false;
  let selectedCustomer: Customer | null = null;

  // Follow-ups panel state
  let followUps: FollowUp[] = [];
  let newFollowUpDate = new Date().toISOString().split('T')[0];
  let newFollowUpNote = '';

  // New Customer Form State
  let name = '';
  let phone = '09171234567';
  let email = '';
  let address = 'Cebu City';

  async function fetchCustomers() {
    loading = true;
    try {
      const [custs, bookings] = await Promise.all([
        window.electronAPI.customers.getAll(),
        window.electronAPI.bookings.getAll(),
      ]);
      customers = custs;
      allBookings = bookings;
    } catch (e) {
      console.error('[Customers] Failed to load:', e);
    } finally {
      loading = false;
    }
  }

  async function handleAddCustomer() {
    if (!name.trim()) return toast.error('Customer name is required');
    const newC: Customer = {
      name,
      contact_number: phone,
      email,
      address,
      loyalty_tier: 'New'
    };

    try {
      await window.electronAPI.customers.create(newC);
      await fetchCustomers();
      showAddModal = false;
      name = '';
      toast.success('Customer saved to SQLite database!');
    } catch (e) {
      toast.error(`Failed to add customer: ${e}`);
    }
  }

  async function handleViewProfile(c: Customer) {
    selectedCustomer = c;
    showProfileDrawer = true;
    followUps = [];
    if (c.id) {
      try {
        followUps = await window.electronAPI.customers.getFollowUps(c.id);
      } catch (e) {
        console.error('[Customers] Failed to load follow-ups:', e);
      }
    }
  }

  async function handleAddFollowUp() {
    if (!selectedCustomer?.id || !newFollowUpDate) return;
    try {
      const created = await window.electronAPI.customers.addFollowUp(selectedCustomer.id, newFollowUpDate, newFollowUpNote || undefined);
      followUps = [...followUps, created];
      newFollowUpNote = '';
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add follow-up.');
    }
  }

  async function handleToggleFollowUp(f: FollowUp) {
    try {
      await window.electronAPI.customers.toggleFollowUp(f.id);
      followUps = followUps.map((x) => (x.id === f.id ? { ...x, is_done: !x.is_done } : x));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update follow-up.');
    }
  }

  async function handleDeleteFollowUp(f: FollowUp) {
    try {
      await window.electronAPI.customers.deleteFollowUp(f.id);
      followUps = followUps.filter((x) => x.id !== f.id);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete follow-up.');
    }
  }

  function bookingsFor(c: Customer | null): Booking[] {
    if (!c) return [];
    return allBookings
      .filter((b) => b.customer_name.trim().toLowerCase() === c.name.trim().toLowerCase() && b.status !== 'CANCELLED')
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
  }

  onMount(fetchCustomers);

  $: selectedCustomerBookings = bookingsFor(selectedCustomer);

  $: filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.contact_number.includes(searchQuery) ||
                          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTier = tierFilter === 'All' || c.loyalty_tier === tierFilter;
    return matchesSearch && matchesTier;
  });
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Header Bar -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h3 class="text-lg font-extrabold text-slate-100 flex items-center gap-2">
        <img src="assets/icons/svg/customers.svg" alt="" class="w-5 h-5 opacity-80" />
        <span>Customers Directory CRM & Client Profiles</span>
      </h3>
      <p class="text-xs text-slate-400">Registered catering clients, contact profiles, loyalty tiers, and order history.</p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" on:click={() => (showImportModal = true)}>📥 Import Clients</Button>
      <Button variant="outline" size="sm" on:click={() => (showExportModal = true)}>📤 Export Clients</Button>
      <Button size="sm" on:click={() => (showAddModal = true)}>+ Add Customer</Button>
    </div>
  </div>

  <!-- Search & Loyalty Filter Bar -->
  <Card className="p-4 space-y-3 bg-slate-900/80 border-slate-800">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="w-full md:w-72">
        <Input bind:value={searchQuery} placeholder="Search client by name or phone..." />
      </div>

      <div class="flex items-center gap-2 text-xs">
        <span class="text-slate-400 font-semibold">Loyalty Tier:</span>
        {#each ['All', 'VIP', 'Regular', 'New'] as t}
          <button
            class="px-3 py-1.5 rounded-xl font-extrabold border transition-all {tierFilter === t ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}"
            on:click={() => (tierFilter = t)}
          >
            {t}
          </button>
        {/each}
      </div>
    </div>
  </Card>

  <!-- Customers Table Grid -->
  <Card className="overflow-hidden">
    {#if loading}
      <p class="text-xs text-slate-400 p-8 text-center">Loading customer profiles from SQLite database...</p>
    {:else if filteredCustomers.length === 0}
      <p class="text-xs text-slate-400 p-8 text-center">No customers found matching "{searchQuery}".</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <th class="py-3 px-4">Client Name</th>
              <th class="py-3 px-4">Contact Phone</th>
              <th class="py-3 px-4">Email Address</th>
              <th class="py-3 px-4">Address Location</th>
              <th class="py-3 px-4 text-center">Loyalty Tier</th>
              <th class="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            {#each filteredCustomers as c}
              <tr class="hover:bg-slate-800/40 transition-colors cursor-pointer" on:click={() => handleViewProfile(c)}>
                <td class="py-3 px-4 font-extrabold text-slate-100 flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black flex items-center justify-center text-xs">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span>{c.name}</span>
                </td>
                <td class="py-3 px-4 text-slate-300 font-mono">{c.contact_number}</td>
                <td class="py-3 px-4 text-slate-300">{c.email || '—'}</td>
                <td class="py-3 px-4 text-slate-400 truncate max-w-xs">{c.address || '—'}</td>
                <td class="py-3 px-4 text-center">
                  <Badge variant={c.loyalty_tier === 'VIP' ? 'amber' : c.loyalty_tier === 'Regular' ? 'green' : 'blue'}>
                    {c.loyalty_tier}
                  </Badge>
                </td>
                <td class="py-3 px-4 text-center">
                  <Button size="sm" variant="outline" on:click={(e) => { e.stopPropagation(); handleViewProfile(c); }}>
                    View Profile Drawer ➔
                  </Button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </Card>
</div>

<!-- Add Customer Modal -->
{#if showAddModal}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
    <Card className="max-w-md w-full p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-extrabold text-slate-100 text-sm">Add New Customer Profile</h3>
        <button class="text-slate-400 hover:text-slate-200 font-bold" on:click={() => (showAddModal = false)}>✕</button>
      </div>

      <form on:submit|preventDefault={handleAddCustomer} class="space-y-3 text-xs">
        <div>
          <label for="c-name" class="block text-slate-300 font-semibold mb-1">Full Name *</label>
          <Input id="c-name" bind:value={name} placeholder="e.g. Maria Santos" />
        </div>

        <div>
          <label for="c-phone" class="block text-slate-300 font-semibold mb-1">Contact Phone Number</label>
          <Input id="c-phone" bind:value={phone} />
        </div>

        <div>
          <label for="c-email" class="block text-slate-300 font-semibold mb-1">Email Address</label>
          <Input id="c-email" bind:value={email} placeholder="maria@gmail.com" />
        </div>

        <div>
          <label for="c-addr" class="block text-slate-300 font-semibold mb-1">Delivery / Home Address</label>
          <Input id="c-addr" bind:value={address} />
        </div>

        <p class="text-[10px] text-slate-500">Loyalty tier is calculated automatically from confirmed bookings — new clients start at "New".</p>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="secondary" size="sm" type="button" on:click={() => (showAddModal = false)}>Cancel</Button>
          <Button size="sm" type="submit">Save Customer Profile</Button>
        </div>
      </form>
    </Card>
  </div>
{/if}

<!-- Sliding Customer Profile Side Drawer (Right Side Panel) -->
{#if showProfileDrawer && selectedCustomer}
  <!-- Backdrop Mask Overlay (Solid Semi-Transparent - No Blur) -->
  <div
    class="fixed inset-0 bg-slate-950/75 z-50 animate-fade-in cursor-pointer"
    on:click={() => (showProfileDrawer = false)}
  ></div>

  <!-- Right Slide-In Side Drawer Container with Smooth Right-to-Left Slide Animation -->
  <aside class="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-slate-950 border-l-2 border-rose-500/50 shadow-2xl z-50 flex flex-col justify-between p-6 space-y-6 animate-slide-in-right select-none">
    <div class="space-y-5 overflow-y-auto pr-1">
      <!-- Drawer Header & Close Button -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-rose-500/20">
            {selectedCustomer.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-extrabold text-slate-100 text-base">{selectedCustomer.name}</h3>
              <Badge variant={selectedCustomer.loyalty_tier === 'VIP' ? 'amber' : selectedCustomer.loyalty_tier === 'Regular' ? 'green' : 'blue'}>
                {selectedCustomer.loyalty_tier}
              </Badge>
            </div>
            <p class="text-xs text-rose-400 font-mono font-semibold">{selectedCustomer.contact_number}</p>
          </div>
        </div>

        <button
          type="button"
          class="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center"
          on:click={() => (showProfileDrawer = false)}
        >
          ✕
        </button>
      </div>

      <!-- Contact Information Card -->
      <Card className="space-y-2.5 p-4 border-l-4 border-l-rose-500">
        <h4 class="font-extrabold text-slate-100 text-xs uppercase tracking-wider">Contact & Address</h4>
        
        <div class="space-y-2 text-xs">
          <div class="flex justify-between border-b border-slate-800/80 pb-1.5">
            <span class="text-slate-400 font-medium">Email:</span>
            <span class="text-slate-200 font-semibold">{selectedCustomer.email || '—'}</span>
          </div>

          <div class="flex justify-between border-b border-slate-800/80 pb-1.5">
            <span class="text-slate-400 font-medium">Phone:</span>
            <span class="text-slate-200 font-semibold font-mono">{selectedCustomer.contact_number}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-slate-400 font-medium">Address:</span>
            <span class="text-slate-200 font-semibold text-right max-w-[200px]">{selectedCustomer.address || '—'}</span>
          </div>
        </div>
      </Card>

      <!-- Customer CRM Financial & Event History Summary -->
      <Card className="space-y-3 p-4 border-l-4 border-l-emerald-500">
        <h4 class="font-extrabold text-slate-100 text-xs uppercase tracking-wider">Catering Order History</h4>

        <div class="grid grid-cols-2 gap-2 text-center text-xs">
          <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase font-semibold block">Total Events</span>
            <span class="text-base font-extrabold text-slate-100">{selectedCustomer.total_bookings ?? 0} Bookings</span>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase font-semibold block">Total Paid</span>
            <span class="text-base font-extrabold text-emerald-400">₱{(selectedCustomer.total_spent ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </Card>

      <!-- Client Recent Bookings Table -->
      <Card className="space-y-3 p-4">
        <h4 class="font-extrabold text-slate-100 text-xs uppercase tracking-wider">Recent Reservations</h4>

        <div class="space-y-2 text-xs">
          {#if selectedCustomerBookings.length === 0}
            <p class="text-slate-500 text-center py-3">No bookings found for this customer.</p>
          {:else}
            {#each selectedCustomerBookings as b (b.id)}
              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <span class="font-bold text-slate-100 block">{b.occasion}</span>
                  <span class="text-[10px] text-slate-400">{b.event_date} • {b.venue}</span>
                </div>
                <Badge variant={b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'green' : 'blue'}>{b.status}</Badge>
              </div>
            {/each}
          {/if}
        </div>
      </Card>

      <!-- Follow-Ups Panel -->
      <Card className="space-y-3 p-4 border-l-4 border-l-amber-500">
        <h4 class="font-extrabold text-slate-100 text-xs uppercase tracking-wider">Follow-Ups</h4>

        <div class="space-y-2 text-xs">
          {#if followUps.length === 0}
            <p class="text-slate-500 text-center py-2">No follow-ups scheduled.</p>
          {:else}
            {#each followUps as f (f.id)}
              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                <input type="checkbox" checked={f.is_done} class="rounded bg-slate-900 border-slate-700 text-emerald-500 cursor-pointer" on:change={() => handleToggleFollowUp(f)} />
                <div class="flex-1">
                  <span class="block font-semibold {f.is_done ? 'line-through text-slate-500' : 'text-slate-200'}">{f.note || 'Follow-up'}</span>
                  <span class="text-[10px] text-slate-400">{f.follow_up_date}</span>
                </div>
                <button class="text-slate-600 hover:text-red-400" on:click={() => handleDeleteFollowUp(f)}>x</button>
              </div>
            {/each}
          {/if}
        </div>

        <div class="flex gap-2 pt-2 border-t border-slate-800">
          <Input type="date" bind:value={newFollowUpDate} className="flex-shrink-0 w-32" />
          <Input bind:value={newFollowUpNote} placeholder="Note (optional)" className="flex-1" />
          <Button size="sm" type="button" on:click={handleAddFollowUp}>Add</Button>
        </div>
      </Card>
    </div>

    <!-- Drawer Footer Actions -->
    <div class="pt-4 border-t border-slate-800 flex gap-3">
      <Button variant="secondary" className="w-1/2" on:click={() => (showProfileDrawer = false)}>
        Close Drawer
      </Button>
      <Button className="w-1/2" on:click={() => toast.info(`Creating new booking reservation for ${selectedCustomer?.name}`)}>
        + New Booking
      </Button>
    </div>
  </aside>
{/if}

<!-- Import / Export Modals -->
<ImportWizardModal show={showImportModal} defaultEntity="customers" onClose={() => (showImportModal = false)} />
<ExportWizardModal show={showExportModal} defaultEntity="customers" onClose={() => (showExportModal = false)} />

<style>
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  .animate-slide-in-right {
    animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
