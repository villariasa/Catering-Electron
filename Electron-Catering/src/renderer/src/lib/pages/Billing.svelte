<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import type { Invoice } from '../../../../preload/types';

  let invoices: Invoice[] = [];
  let loading = true;
  let searchQuery = '';
  let showPaymentModal = false;
  let selectedInvoice: Invoice | null = null;
  let paymentAmount = 0;
  let paymentMethod = 'Cash';
  let paymentRef = '';
  let saving = false;
  let emailingId: number | null = null;
  let downloadingId: number | null = null;

  async function handleEmailReceipt(inv: Invoice) {
    emailingId = inv.id;
    try {
      const result = await window.electronAPI.invoices.emailReceipt(inv.id);
      if (result.success) toast.success(`Receipt emailed for ${inv.invoice_ref}!`);
      else toast.error(result.error || 'Failed to email receipt.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to email receipt.');
    } finally {
      emailingId = null;
    }
  }

  async function handleDownloadReceipt(inv: Invoice) {
    downloadingId = inv.id;
    try {
      const result = await window.electronAPI.invoices.saveReceiptPdf(inv.id);
      if (result.success) toast.success(`Receipt PDF saved to:\n${result.path}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to generate receipt PDF.');
    } finally {
      downloadingId = null;
    }
  }

  async function fetchInvoices() {
    loading = true;
    try {
      invoices = await window.electronAPI.invoices.getAll();
    } catch (e) {
      console.error('[Billing] Failed to load invoices:', e);
    } finally {
      loading = false;
    }
  }

  onMount(fetchInvoices);

  $: filteredInvoices = invoices.filter(inv =>
    inv.invoice_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.booking_ref.toLowerCase().includes(searchQuery.toLowerCase())
  );

  $: totalReceivables = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  $: totalCollected = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);

  function openPaymentModal(inv: Invoice) {
    selectedInvoice = inv;
    paymentAmount = inv.balance;
    paymentMethod = 'Cash';
    paymentRef = '';
    showPaymentModal = true;
  }

  function setPreset(percent: number) {
    if (!selectedInvoice) return;
    if (percent === 100) paymentAmount = selectedInvoice.balance;
    else if (percent === 50) paymentAmount = Math.min(selectedInvoice.balance, Math.round(selectedInvoice.total_amount * 0.5));
    else if (percent === 30) paymentAmount = Math.min(selectedInvoice.balance, Math.round(selectedInvoice.total_amount * 0.3));
  }

  async function handleRecordPayment() {
    if (!selectedInvoice || paymentAmount <= 0) return toast.error('Enter valid payment amount');
    if (paymentAmount > selectedInvoice.balance + 0.01) return toast.error(`Payment exceeds the remaining balance of ₱${selectedInvoice.balance.toLocaleString()}`);

    saving = true;
    try {
      const updated = await window.electronAPI.invoices.recordPayment({
        invoiceId: selectedInvoice.id,
        amount: paymentAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        method: paymentMethod,
        referenceNo: paymentRef || undefined,
      });

      invoices = invoices.map(inv => (inv.id === updated.id ? updated : inv));
      showPaymentModal = false;
      toast.success(`Payment of ₱${paymentAmount.toLocaleString()} recorded for ${updated.invoice_ref}!`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to record payment.');
    } finally {
      saving = false;
    }
  }
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Header & KPI Bar -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="border-l-4 border-l-emerald-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Payments Collected</p>
      <h3 class="text-2xl font-extrabold text-emerald-400 mt-2">₱{totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Recorded cash inflows</p>
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
        <p class="text-xs text-slate-400">Manage billing invoices and record deposits/downpayments.</p>
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
            <th class="py-3 px-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          {#if loading}
            <tr><td colspan="9" class="py-6 text-center text-slate-500">Loading invoices...</td></tr>
          {:else if filteredInvoices.length === 0}
            <tr><td colspan="9" class="py-6 text-center text-slate-500">No invoices found.</td></tr>
          {:else}
            {#each filteredInvoices as inv (inv.id)}
              <tr class="hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-2 font-mono text-emerald-400 font-semibold">{inv.invoice_ref}</td>
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
                <td class="py-3 px-2 text-right space-x-2 whitespace-nowrap">
                  {#if inv.balance > 0}
                    <Button size="sm" on:click={() => openPaymentModal(inv)}>
                      Record Payment
                    </Button>
                  {:else}
                    <Badge variant="secondary">Paid in Full</Badge>
                  {/if}
                  <Button size="sm" variant="outline" disabled={downloadingId === inv.id} on:click={() => handleDownloadReceipt(inv)}>
                    {downloadingId === inv.id ? '...' : 'PDF'}
                  </Button>
                  <Button size="sm" variant="outline" disabled={emailingId === inv.id} on:click={() => handleEmailReceipt(inv)}>
                    {emailingId === inv.id ? '...' : 'Email'}
                  </Button>
                </td>
              </tr>
            {/each}
          {/if}
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
        <h3 class="font-bold text-slate-100 text-sm">Record Payment — {selectedInvoice.invoice_ref}</h3>
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
            <Button variant="outline" size="sm" type="button" on:click={() => setPreset(100)}>Full Balance</Button>
            <Button variant="outline" size="sm" type="button" on:click={() => setPreset(50)}>50% Down</Button>
            <Button variant="outline" size="sm" type="button" on:click={() => setPreset(30)}>30% Down</Button>
          </div>
        </div>

        <div>
          <label for="pmt-amt" class="block text-slate-300 font-semibold mb-1">Payment Amount (₱)</label>
          <Input id="pmt-amt" type="number" bind:value={paymentAmount} placeholder="Enter payment amount" />
        </div>

        <div>
          <label for="pmt-method" class="block text-slate-300 font-semibold mb-1">Payment Method</label>
          <select id="pmt-method" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs" bind:value={paymentMethod}>
            <option value="Cash">Cash</option>
            <option value="GCash">GCash</option>
            <option value="Bank Transfer">Bank Transfer (BDO / BPI)</option>
            <option value="Check">Check</option>
          </select>
        </div>

        <div>
          <label for="pmt-ref" class="block text-slate-300 font-semibold mb-1">Reference No. (optional)</label>
          <Input id="pmt-ref" bind:value={paymentRef} placeholder="e.g. GCash transaction ID" />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
        <Button variant="secondary" size="sm" type="button" disabled={saving} on:click={() => (showPaymentModal = false)}>Cancel</Button>
        <Button size="sm" disabled={saving} on:click={handleRecordPayment}>{saving ? 'Saving...' : 'Confirm Payment'}</Button>
      </div>
    </Card>
  </div>
{/if}
