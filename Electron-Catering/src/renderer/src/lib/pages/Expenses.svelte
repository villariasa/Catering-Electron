<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';
  import type { Expense } from '../../../preload/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  let expenses: Expense[] = [];
  let loading = true;
  let searchQuery = '';
  let selectedCategory = 'All';

  // Add Expense Modal state
  let showAddModal = false;
  let category = 'Ingredients';
  let description = '';
  let amount = 0;
  let date = new Date().toISOString().split('T')[0];

  const categories = [
    'Ingredients',
    'Labor/Wages',
    'Utilities',
    'Transportation',
    'Equipment',
    'Marketing',
    'Miscellaneous'
  ];

  async function fetchExpenses() {
    loading = true;
    try {
      if (window.electronAPI && window.electronAPI.expenses) {
        expenses = await window.electronAPI.expenses.getAll();
      } else {
        if (expenses.length === 0) {
          expenses = [
            { id: 1, category: 'Ingredients', description: 'Fresh Pork Belly & Chicken (Carbon Market)', amount: 12500, expense_date: '2026-08-20' },
            { id: 2, category: 'Labor/Wages', description: 'Kitchen Assistant & Catering Waiters Payroll', amount: 6400, expense_date: '2026-08-22' },
            { id: 3, category: 'Utilities', description: 'LPG Gas Tanks 50kg & Fuel Delivery', amount: 3200, expense_date: '2026-08-23' }
          ];
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function handleAddExpense() {
    if (!description.trim() || amount <= 0) {
      return toast.error('Please enter valid description and positive amount');
    }

    const newExp: Omit<Expense, 'id'> = {
      category,
      description,
      amount,
      expense_date: date
    };

    try {
      if (window.electronAPI && window.electronAPI.expenses) {
        await window.electronAPI.expenses.create(newExp);
        await fetchExpenses();
      } else {
        expenses = [{ id: Date.now(), ...newExp }, ...expenses];
      }

      showAddModal = false;
      description = '';
      amount = 0;
      toast.success('Expense recorded successfully!');
    } catch (e) {
      toast.error(`Failed to add expense: ${e}`);
    }
  }

  onMount(fetchExpenses);

  $: filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || exp.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  $: totalExpenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);
  $: ingredientsSum = expenses.filter(e => e.category === 'Ingredients').reduce((sum, e) => sum + e.amount, 0);
  $: laborSum = expenses.filter(e => e.category === 'Labor/Wages').reduce((sum, e) => sum + e.amount, 0);
  $: utilitiesSum = expenses.filter(e => e.category === 'Utilities').reduce((sum, e) => sum + e.amount, 0);
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card className="border-l-4 border-l-red-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Operating Expenses</p>
      <h3 class="text-2xl font-extrabold text-red-400 mt-2">₱{totalExpenseSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Recorded business outflows</p>
    </Card>

    <Card className="border-l-4 border-l-amber-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingredients & Food</p>
      <h3 class="text-2xl font-extrabold text-amber-400 mt-2">₱{ingredientsSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Raw meat, produce & spices</p>
    </Card>

    <Card className="border-l-4 border-l-blue-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff & Labor Payroll</p>
      <h3 class="text-2xl font-extrabold text-blue-400 mt-2">₱{laborSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Assistant cooks & waiters</p>
    </Card>

    <Card className="border-l-4 border-l-purple-500">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilities & LPG Gas</p>
      <h3 class="text-2xl font-extrabold text-purple-400 mt-2">₱{utilitiesSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Fuel, gas & transport</p>
    </Card>
  </div>

  <!-- Header Controls & Expense Table -->
  <Card>
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <h3 class="font-bold text-slate-100 text-sm flex items-center gap-2">
          <img src="assets/icons/svg/billing.svg" alt="" class="w-4 h-4 opacity-70" />
          <span>Expenses Log & Operating Costs</span>
        </h3>
        <p class="text-xs text-slate-400">Record and track ingredient purchases, labor wages, and utility bills.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <select class="bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 text-xs font-medium" bind:value={selectedCategory}>
          <option value="All">All Categories</option>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>

        <div class="w-48">
          <Input bind:value={searchQuery} placeholder="Search expense..." />
        </div>

        <Button size="sm" on:click={() => (showAddModal = true)}>
          <img src="assets/icons/svg/plus.svg" alt="" class="w-3.5 h-3.5 filter invert brightness-200" />
          <span>+ Record Expense</span>
        </Button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
            <th class="py-3 px-2">Date</th>
            <th class="py-3 px-2">Category</th>
            <th class="py-3 px-2">Description</th>
            <th class="py-3 px-2 text-right">Amount (₱)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          {#each filteredExpenses as exp}
            <tr class="hover:bg-slate-800/40 transition-colors">
              <td class="py-3 px-2 text-slate-300 font-medium">{exp.expense_date}</td>
              <td class="py-3 px-2">
                <Badge variant={exp.category === 'Ingredients' ? 'amber' : exp.category === 'Labor/Wages' ? 'blue' : 'secondary'}>
                  {exp.category}
                </Badge>
              </td>
              <td class="py-3 px-2 text-slate-200 font-medium">{exp.description}</td>
              <td class="py-3 px-2 text-right font-bold text-red-400">₱{exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>
</div>

<!-- Record Expense Modal Dialog -->
{#if showAddModal}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
    <Card className="max-w-md w-full p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-bold text-slate-100 text-sm">Record Business Expense</h3>
        <button class="text-slate-400 hover:text-slate-200" on:click={() => (showAddModal = false)}>✕</button>
      </div>

      <form on:submit|preventDefault={handleAddExpense} class="space-y-3 text-xs">
        <div>
          <label for="exp-cat" class="block text-slate-300 font-semibold mb-1">Expense Category</label>
          <select id="exp-cat" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs" bind:value={category}>
            {#each categories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="exp-desc" class="block text-slate-300 font-semibold mb-1">Description / Items Purchased</label>
          <Input id="exp-desc" bind:value={description} placeholder="e.g., Fresh Pork Belly (Carbon Market)" />
        </div>

        <div>
          <label for="exp-amt" class="block text-slate-300 font-semibold mb-1">Amount (₱)</label>
          <Input id="exp-amt" type="number" bind:value={amount} placeholder="Enter amount" />
        </div>

        <div>
          <label for="exp-date" class="block text-slate-300 font-semibold mb-1">Expense Date</label>
          <Input id="exp-date" type="date" bind:value={date} />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="secondary" size="sm" type="button" on:click={() => (showAddModal = false)}>Cancel</Button>
          <Button size="sm" type="submit">Save Expense Record</Button>
        </div>
      </form>
    </Card>
  </div>
{/if}
