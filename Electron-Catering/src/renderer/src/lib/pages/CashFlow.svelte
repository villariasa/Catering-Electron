<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import type { CashFlowEntry } from '../../../../preload/types';

  let ledger: CashFlowEntry[] = [];
  let loading = true;

  // Add Cash Entry Modal state
  let showAddModal = false;
  let entryType: 'Inflow' | 'Outflow' = 'Inflow';
  let refNo = '';
  let particulars = '';
  let amount = 0;
  let date = new Date().toISOString().split('T')[0];
  let saving = false;

  async function loadLedger() {
    loading = true;
    try {
      ledger = await window.electronAPI.cashFlow.getAll();
    } catch (e) {
      console.error('[CashFlow] Failed to load ledger:', e);
    } finally {
      loading = false;
    }
  }

  onMount(loadLedger);

  async function handleAddCashEntry() {
    if (!particulars.trim() || amount <= 0) {
      return toast.error('Please enter valid description and positive amount');
    }

    saving = true;
    try {
      ledger = await window.electronAPI.cashFlow.create({
        date,
        ref_no: refNo.trim() || undefined,
        particulars: particulars.trim(),
        deposit: entryType === 'Inflow' ? amount : 0,
        withdrawal: entryType === 'Outflow' ? amount : 0,
      });

      showAddModal = false;
      const newBalance = ledger.length ? ledger[ledger.length - 1].running_balance : 0;
      particulars = '';
      amount = 0;
      refNo = '';
      toast.success(`Cash Flow entry recorded successfully! New Running Balance: ₱${newBalance.toLocaleString()}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to record cash entry.');
    } finally {
      saving = false;
    }
  }

  async function handleDeleteEntry(entry: CashFlowEntry) {
    if (!confirm(`Delete entry "${entry.particulars}"?`)) return;
    try {
      ledger = await window.electronAPI.cashFlow.delete(entry.id);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete entry.');
    }
  }

  $: totalInflow = ledger.reduce((sum, e) => sum + e.deposit, 0);
  $: totalOutflow = ledger.reduce((sum, e) => sum + e.withdrawal, 0);
  $: netSurplus = totalInflow - totalOutflow;
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="border-l-4 border-l-emerald-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cash Inflow (Deposits)</p>
      <h3 class="text-2xl font-extrabold text-emerald-400 mt-2">₱{totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Customer downpayments & cash deposits</p>
    </Card>

    <Card className="border-l-4 border-l-red-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cash Outflow (Expenses)</p>
      <h3 class="text-2xl font-extrabold text-red-400 mt-2">₱{totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Operating expenses & supplier payouts</p>
    </Card>

    <Card className="border-l-4 border-l-blue-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Cash Flow / Operating Surplus</p>
      <h3 class="text-2xl font-extrabold text-blue-400 mt-2">₱{netSurplus.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Net operating cash balance</p>
    </Card>
  </div>

  <!-- Cash Flow Ledger Table -->
  <Card>
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <h3 class="font-bold text-slate-100 text-sm flex items-center gap-2">
          <img src="assets/icons/svg/billing.svg" alt="" class="w-4 h-4 opacity-70" />
          <span>Cash Flow Ledger</span>
        </h3>
        <p class="text-xs text-slate-400">Sequential record of cash deposits, operational withdrawals, and running cash balances.</p>
      </div>

      <div class="flex items-center gap-2">
        <Button size="sm" on:click={() => (showAddModal = true)}>
          <img src="assets/icons/svg/plus.svg" alt="" class="w-3.5 h-3.5 filter invert brightness-200" />
          <span>Record Cash Entry</span>
        </Button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
            <th class="py-3 px-2">Date</th>
            <th class="py-3 px-2">Ref / Voucher #</th>
            <th class="py-3 px-2">Particulars / Description</th>
            <th class="py-3 px-2 text-right">Inflow / Deposit</th>
            <th class="py-3 px-2 text-right">Outflow / Expense</th>
            <th class="py-3 px-2 text-right">Running Cash Balance</th>
            <th class="py-3 px-2 text-center">Type</th>
            <th class="py-3 px-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          {#if loading}
            <tr><td colspan="8" class="py-6 text-center text-slate-500">Loading ledger...</td></tr>
          {:else if ledger.length === 0}
            <tr><td colspan="8" class="py-6 text-center text-slate-500">No cash flow entries yet.</td></tr>
          {:else}
            {#each ledger as entry (entry.id)}
              <tr class="hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-2 text-slate-300 font-medium">{entry.date}</td>
                <td class="py-3 px-2 font-mono text-emerald-400">{entry.ref_no || '—'}</td>
                <td class="py-3 px-2 text-slate-200 font-medium">{entry.particulars}</td>
                <td class="py-3 px-2 text-right font-semibold text-emerald-400">
                  {entry.deposit > 0 ? `₱${entry.deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                </td>
                <td class="py-3 px-2 text-right font-semibold text-red-400">
                  {entry.withdrawal > 0 ? `₱${entry.withdrawal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                </td>
                <td class="py-3 px-2 text-right font-bold text-slate-100">
                  ₱{entry.running_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td class="py-3 px-2 text-center">
                  <Badge variant={entry.deposit > 0 ? 'green' : 'destructive'}>
                    {entry.deposit > 0 ? 'Inflow' : 'Outflow'}
                  </Badge>
                </td>
                <td class="py-3 px-2 text-right">
                  <button class="text-slate-600 hover:text-red-400 text-xs" on:click={() => handleDeleteEntry(entry)}>Delete</button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </Card>
</div>

<!-- Record Cash Flow Entry Modal Dialog -->
{#if showAddModal}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
    <Card className="max-w-md w-full p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-bold text-slate-100 text-sm">Record Cash Flow Transaction Entry</h3>
        <button class="text-slate-400 hover:text-slate-200" on:click={() => (showAddModal = false)}>✕</button>
      </div>

      <form on:submit|preventDefault={handleAddCashEntry} class="space-y-3 text-xs">
        <div>
          <label for="flow-type" class="block text-slate-300 font-semibold mb-1">Transaction Type</label>
          <select id="flow-type" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs font-semibold" bind:value={entryType}>
            <option value="Inflow">Inflow (Cash Deposit / Payment Received)</option>
            <option value="Outflow">Outflow (Expense / Withdrawal / Supplier Payout)</option>
          </select>
        </div>

        <div>
          <label for="flow-ref" class="block text-slate-300 font-semibold mb-1">Voucher / Reference # (Optional)</label>
          <Input id="flow-ref" bind:value={refNo} placeholder="e.g., DEP-005 or EXP-101" />
        </div>

        <div>
          <label for="flow-desc" class="block text-slate-300 font-semibold mb-1">Particulars / Description</label>
          <Input id="flow-desc" bind:value={particulars} placeholder="e.g., Downpayment for Wedding Catering" />
        </div>

        <div>
          <label for="flow-amt" class="block text-slate-300 font-semibold mb-1">Amount (₱)</label>
          <Input id="flow-amt" type="number" bind:value={amount} placeholder="Enter transaction amount" />
        </div>

        <div>
          <label for="flow-date" class="block text-slate-300 font-semibold mb-1">Transaction Date</label>
          <Input id="flow-date" type="date" bind:value={date} />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="secondary" size="sm" type="button" disabled={saving} on:click={() => (showAddModal = false)}>Cancel</Button>
          <Button size="sm" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Record Cash Entry'}</Button>
        </div>
      </form>
    </Card>
  </div>
{/if}
