<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { KitchenOrder } from '../../../../preload/types';

  let orders: KitchenOrder[] = [];
  let loading = true;
  let addingTaskFor: number | null = null;
  let newTaskLabel = '';

  async function loadOrders() {
    try {
      orders = await window.electronAPI.kitchen.getAllOrders();
    } catch (e) {
      console.error('[Kitchen] Failed to load orders:', e);
    } finally {
      loading = false;
    }
  }

  onMount(loadOrders);

  async function updateStatus(order: KitchenOrder, status: KitchenOrder['status']) {
    try {
      await window.electronAPI.kitchen.updateOrderStatus(order.id, status);
      orders = orders.map((o) => (o.id === order.id ? { ...o, status } : o));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update order status.');
    }
  }

  async function toggleTask(order: KitchenOrder, taskId: number) {
    try {
      await window.electronAPI.kitchen.toggleTask(taskId);
      orders = orders.map((o) =>
        o.id === order.id
          ? { ...o, tasks: (o.tasks || []).map((t) => (t.id === taskId ? { ...t, is_done: !t.is_done } : t)) }
          : o
      );
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update task.');
    }
  }

  function startAddTask(order: KitchenOrder) {
    addingTaskFor = order.id;
    newTaskLabel = '';
  }

  async function submitAddTask(order: KitchenOrder) {
    if (!newTaskLabel.trim()) return;
    try {
      const task = await window.electronAPI.kitchen.addTask(order.id, newTaskLabel.trim());
      orders = orders.map((o) => (o.id === order.id ? { ...o, tasks: [...(o.tasks || []), task] } : o));
      addingTaskFor = null;
      newTaskLabel = '';
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add task.');
    }
  }

  async function removeTask(order: KitchenOrder, taskId: number) {
    try {
      await window.electronAPI.kitchen.deleteTask(taskId);
      orders = orders.map((o) => (o.id === order.id ? { ...o, tasks: (o.tasks || []).filter((t) => t.id !== taskId) } : o));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete task.');
    }
  }
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <div>
    <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
      <img src="assets/icons/svg/kitchen.svg" alt="" class="w-5 h-5 opacity-80" />
      <span>Kitchen Display System (KDS)</span>
    </h3>
    <p class="text-xs text-slate-400">Order prep tickets for kitchen staff grouped by catering date & time.</p>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each [1,2] as _}
        <div class="rounded-2xl border border-slate-800 p-5 space-y-4 animate-pulse bg-slate-900/60">
          <div class="h-4 bg-slate-800 rounded w-1/2"></div>
          <div class="h-4 bg-slate-800 rounded w-3/4"></div>
          <div class="h-16 bg-slate-800 rounded"></div>
        </div>
      {/each}
    </div>
  {:else if orders.length === 0}
    <div class="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2">
      <p class="font-bold text-slate-300">No Active Kitchen Orders</p>
      <p class="text-xs">All upcoming events are complete or no bookings found in the database.</p>
    </div>
  {:else}
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each orders as order (order.id)}
      <Card className="space-y-4 border-l-4 {order.status === 'In Prep' ? 'border-l-amber-500' : order.status === 'Ready' ? 'border-l-emerald-500' : order.status === 'Completed' ? 'border-l-slate-600' : 'border-l-blue-500'}">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span class="font-mono text-xs font-bold text-emerald-400">{order.booking_ref || order.order_ref}</span>
            <h4 class="font-bold text-slate-100 text-sm">{order.customer_name} ({order.occasion})</h4>
          </div>
          <Badge variant={order.status === 'Ready' ? 'green' : order.status === 'In Prep' ? 'amber' : order.status === 'Completed' ? 'secondary' : 'blue'}>
            {order.status}
          </Badge>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl">
          <div>Date: <strong class="text-slate-200">{order.event_date || '—'}</strong></div>
          <div>Time: <strong class="text-slate-200">{order.event_time || '—'}</strong></div>
          <div>Guest Count: <strong class="text-slate-200">{order.pax} Pax</strong></div>
          <div>Venue: <strong class="text-slate-200">{order.venue || '—'}</strong></div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="block text-xs font-semibold text-slate-300">Preparation Dish Items Checklist</span>
            <button class="text-[10px] font-bold text-emerald-400 hover:text-emerald-300" on:click={() => startAddTask(order)}>+ Add Item</button>
          </div>
          <ul class="space-y-1.5 text-xs text-slate-300">
            {#each order.tasks || [] as task (task.id)}
              <li class="flex items-center gap-2 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                <input
                  type="checkbox"
                  checked={task.is_done}
                  class="rounded bg-slate-900 border-slate-700 text-emerald-500 cursor-pointer"
                  on:change={() => toggleTask(order, task.id)}
                />
                <span class={task.is_done ? 'line-through text-slate-500' : ''}>{task.label}</span>
                <button class="ml-auto text-slate-600 hover:text-red-400 text-xs" on:click={() => removeTask(order, task.id)}>x</button>
              </li>
            {/each}
            {#if addingTaskFor === order.id}
              <li class="flex items-center gap-2 p-2">
                <input
                  type="text"
                  bind:value={newTaskLabel}
                  placeholder="New checklist item..."
                  class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  on:keydown={(e) => e.key === 'Enter' && submitAddTask(order)}
                />
                <button class="text-emerald-400 text-xs font-bold" on:click={() => submitAddTask(order)}>Add</button>
                <button class="text-slate-500 text-xs" on:click={() => (addingTaskFor = null)}>Cancel</button>
              </li>
            {/if}
          </ul>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          {#if order.status !== 'Completed'}
            <Button variant="outline" size="sm" on:click={() => updateStatus(order, 'In Prep')}>Start Prep</Button>
            <Button variant="outline" size="sm" on:click={() => updateStatus(order, 'Ready')}>Mark Ready</Button>
            <Button variant="default" size="sm" on:click={() => updateStatus(order, 'Completed')}>Complete</Button>
          {:else}
            <Badge variant="secondary">Completed</Badge>
          {/if}
        </div>
      </Card>
    {/each}
  </div>
  {/if}
</div>
