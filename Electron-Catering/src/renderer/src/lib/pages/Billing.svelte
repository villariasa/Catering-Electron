<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  interface Invoice {
    id: number;
    inv_number: string;
    booking_ref: string;
    customer_name: string;
    event_date: string;
    total_amount: number;
    amount_paid: number;
    balance: number;
    status: 'Paid' | 'Partial' | 'Unpaid';
    verified: boolean;
  }

  let invoices: Invoice[] = [];
  let loading = true;
  let searchQuery = '';
  let showPaymentModal = false;
  let selectedInvoice: Invoice | null = null;
  let paymentAmount = 0;
  let paymentMethod = 'Cash';
  let paymentRef = '';

  onMount(async () => {
    // Initial sample invoices matching legacy Python app
    invoices = [
      { id: 1, inv_number: 'INV-2026-0001', booking_ref: 'BK-2026-0001', customer_name: 'Juan Dela Cruz', event_date: '2026-08-28', total_amount: 45000, amount_paid: 15000, balance: 30000, status: 'Partial', verified: true },
      { id: 2, inv_number: 'INV-2026-0002', booking_ref: 'BK-2026-0002', customer_name: 'Maria Santos', event_date: '2026-09-12', total_amount: 130000, amount_paid: 130000, balance: 0, status: 'Paid', verified: true },
      { id: 3, inv_number: 'INV-2026-0003', booking_ref: 'BK-2026-0003', customer_name: 'Carlos Reyes', event_date: '2026-09-25', total_amount: 67500, amount_paid: 0, balance: 67500, status: 'Unpaid', verified: false }
    ];
    loading = false;
  });

  $: filteredInvoices = invoices.filter(inv =>
    inv.inv_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.booking_ref.toLowerCase().includes(searchQuery.toLowerCase())
  );

  $: totalReceivables = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  $: totalCollected = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);

  function openPaymentModal(inv: Invoice) {
    selectedInvoice = inv;
    paymentAmount = inv.balance;
    showPaymentModal = true;
  }

  function setPreset(percent: number) {
    if (!selectedInvoice) return;
    if (percent === 100) paymentAmount = selectedInvoice.balance;
    else if (percent === 50) paymentAmount = Math.round(selectedInvoice.total_amount * 0.5);
    else if (percent === 30) paymentAmount = Math.round(selectedInvoice.total_amount * 0.3);
  }

  function handleRecordPayment() {
    if (!selectedInvoice || paymentAmount <= 0) return alert('Enter valid payment amount');

    selectedInvoice.amount_paid += paymentAmount;
    selectedInvoice.balance = Math.max(0, selectedInvoice.total_amount - selectedInvoice.amount_paid);
    selectedInvoice.status = selectedInvoice.balance === 0 ? 'Paid' : selectedInvoice.amount_paid > 0 ? 'Partial' : 'Unpaid';
    selectedInvoice.verified = true;

    invoices = [...invoices];
    showPaymentModal = false;
    alert(`Payment of ₱${paymentAmount.toLocaleString()} recorded for ${selectedInvoice.inv_number}!`);
  }

  function toggleVerify(inv: Invoice) {
    inv.verified = !inv.verified;
    invoices = [...invoices];
  }
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Header & KPI Bar -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="border-l-4 border-l-emerald-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Payments Collected</p>
      <h3 class="text-2xl font-extrabold text-emerald-400 mt-2">₱{totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Verified cash inflows</p>
    </Card>

    <Card className="border-l-4 border-l-amber-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Receivables</p>
      <h3 class="text-2xl font-extrabold text-amber-400 mt-2">₱{totalReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Uncollected invoice balances</p>
    </Card>

    <Card className="border-l-4 border-l-blue-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Invoices</p>
      <h3 class="text-2xl font-extrabold text-blue-400 mt-2">{invoices.length}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Issued billing receipts</p>
    </Card>
  </div>

  <!-- Search & Data Table -->
  <Card>
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <h3 class="font-bold text-slate-100 text-sm flex items-center gap-2">
          <img src="assets/icons/svg/billing.svg" alt="" class="w-4 h-4 opacity-70" />
          <span>Billing & Payment Invoices</span>
        </h3>
        <p class="text-xs text-slate-400">Manage billing invoices, record deposits, downpayments, and verify payments.</p>
      </div>

      <div class="w-full md:w-72">
        <Input bind:value={searchQuery} placeholder="Search Invoice # or Customer..." />
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
            <th class="py-3 px-2">Invoice #</th>
            <th class="py-3 px-2">Booking Ref</th>
            <th class="py-3 px-2">Customer</th>
            <th class="py-3 px-2">Event Date</th>
            <th class="py-3 px-2 text-right">Total Amount</th>
            <th class="py-3 px-2 text-right">Amount Paid</th>
            <th class="py-3 px-2 text-right">Balance Due</th>
            <th class="py-3 px-2 text-center">Status</th>
            <th class="py-3 px-2 text-center">Verified</th>
            <th class="py-3 px-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          {#each filteredInvoices as inv}
            <tr class="hover:bg-slate-800/40 transition-colors">
              <td class="py-3 px-2 font-mono text-emerald-400 font-semibold">{inv.inv_number}</td>
              <td class="py-3 px-2 font-mono text-slate-300">{inv.booking_ref}</td>
              <td class="py-3 px-2 font-medium text-slate-200">{inv.customer_name}</td>
              <td class="py-3 px-2 text-slate-400">{inv.event_date}</td>
              <td class="py-3 px-2 text-right font-semibold text-slate-200">₱{inv.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td class="py-3 px-2 text-right font-semibold text-emerald-400">₱{inv.amount_paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td class="py-3 px-2 text-right font-semibold text-amber-400">₱{inv.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td class="py-3 px-2 text-center">
                <Badge variant={inv.status === 'Paid' ? 'green' : inv.status === 'Partial' ? 'amber' : 'destructive'}>
                  {inv.status}
                </Badge>
              </td>
              <td class="py-3 px-2 text-center">
                <input
                  type="checkbox"
                  checked={inv.verified}
                  class="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  on:change={() => toggleVerify(inv)}
                />
              </td>
              <td class="py-3 px-2 text-right space-x-2">
                {#if inv.balance > 0}
                  <Button size="sm" on:click={() => openPaymentModal(inv)}>
                    + Record Payment
                  </Button>
                {:else}
                  <Badge variant="secondary">Paid in Full</Badge>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>
</div>

<!-- Record Payment Modal Dialog -->
{#if showPaymentModal && selectedInvoice}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
    <Card className="max-w-md w-full p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-bold text-slate-100 text-sm">Record Payment — {selectedInvoice.inv_number}</h3>
        <button class="text-slate-400 hover:text-slate-200" on:click={() => (showPaymentModal = false)}>✕</button>
      </div>

      <div class="space-y-3 text-xs">
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p class="text-slate-400">Customer: <strong class="text-slate-200">{selectedInvoice.customer_name}</strong></p>
          <p class="text-slate-400">Total Invoice Amount: <strong class="text-slate-200">₱{selectedInvoice.total_amount.toLocaleString()}</strong></p>
          <p class="text-slate-400">Current Balance Due: <strong class="text-amber-400">₱{selectedInvoice.balance.toLocaleString()}</strong></p>
        </div>

        <div>
          <span class="block text-slate-400 mb-1">Quick Payment Presets</span>
          <div class="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" on:click={() => setPreset(100)}>Full Balance</Button>
            <Button variant="outline" size="sm" on:click={() => setPreset(50)}>50% Down</Button>
            <Button variant="outline" size="sm" on:click={() => setPreset(30)}>30% Down</Button>
          </div>
        </div>

        <div>
          <label for="pmt-amt" class="block text-slate-300 font-semibold mb-1">Payment Amount (₱)</label>
          <Input id="pmt-amt" type="number" bind:value={paymentAmount} placeholder="Enter payment amount" />
        </div>

        <div>
          <label for="pmt-method" class="block text-slate-300 font-semibold mb-1">Payment Method</label>
          <select id="pmt-method" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs" bind:value={paymentRef}>
            <option value="Cash">Cash</option>
            <option value="GCash">GCash</option>
            <option value="Bank Transfer">Bank Transfer (BDO / BPI)</option>
            <option value="Check">Check</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
        <Button variant="secondary" size="sm" on:click={() => (showPaymentModal = false)}>Cancel</Button>
        <Button size="sm" on:click={handleRecordPayment}>Confirm Payment</Button>
      </div>
    </Card>
  </div>
{/if}
