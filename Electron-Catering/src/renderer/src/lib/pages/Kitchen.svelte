<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface KitchenOrder {
    id: number;
    booking_ref: string;
    customer_name: string;
    occasion: string;
    event_date: string;
    event_time: string;
    venue: string;
    pax: number;
    dishes: string[];
    prep_status: 'Queued' | 'In Prep' | 'Ready' | 'Completed';
  }

  let orders: KitchenOrder[] = [];

  onMount(() => {
    orders = [
      {
        id: 1,
        booking_ref: 'BK-2026-0001',
        customer_name: 'Juan Dela Cruz',
        occasion: 'Birthday Party',
        event_date: '2026-08-28',
        event_time: '17:00',
        venue: 'Marco Polo Ballroom, Nivel Hills',
        pax: 100,
        dishes: ['Pork Hamonado (15 kg)', 'Bam-I Noodles (8 trays)', 'Lechon Kawali (12 kg)', 'Pandan Rice (100 pax)', 'Iced Tea'],
        prep_status: 'In Prep'
      },
      {
        id: 2,
        booking_ref: 'BK-2026-0002',
        customer_name: 'Maria Santos',
        occasion: 'Wedding Reception',
        event_date: '2026-09-12',
        event_time: '18:30',
        venue: 'Waterfront Hotel Grand Ballroom',
        pax: 200,
        dishes: ['Lechon Belly (25 kg)', 'Beef Caldereta (20 kg)', 'Fish Fillet Tartar (15 kg)', 'Baked Macaroni (12 trays)', 'Mango Float'],
        prep_status: 'Queued'
      }
    ];
  });

  function updateStatus(order: KitchenOrder, status: KitchenOrder['prep_status']) {
    order.prep_status = status;
    orders = [...orders];
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

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each orders as order}
      <Card className="space-y-4 border-l-4 {order.prep_status === 'In Prep' ? 'border-l-amber-500' : order.prep_status === 'Ready' ? 'border-l-emerald-500' : 'border-l-blue-500'}">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span class="font-mono text-xs font-bold text-emerald-400">{order.booking_ref}</span>
            <h4 class="font-bold text-slate-100 text-sm">{order.customer_name} ({order.occasion})</h4>
          </div>
          <Badge variant={order.prep_status === 'Ready' ? 'green' : order.prep_status === 'In Prep' ? 'amber' : 'blue'}>
            {order.prep_status}
          </Badge>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl">
          <div>Date: <strong class="text-slate-200">{order.event_date}</strong></div>
          <div>Time: <strong class="text-slate-200">{order.event_time}</strong></div>
          <div>Guest Count: <strong class="text-slate-200">{order.pax} Pax</strong></div>
          <div>Venue: <strong class="text-slate-200">{order.venue}</strong></div>
        </div>

        <div>
          <span class="block text-xs font-semibold text-slate-300 mb-2">Preparation Dish Items Checklist</span>
          <ul class="space-y-1.5 text-xs text-slate-300">
            {#each order.dishes as dish}
              <li class="flex items-center gap-2 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                <input type="checkbox" class="rounded bg-slate-900 border-slate-700 text-emerald-500 cursor-pointer" />
                <span>{dish}</span>
              </li>
            {/each}
          </ul>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="outline" size="sm" on:click={() => updateStatus(order, 'In Prep')}>Start Prep</Button>
          <Button variant="default" size="sm" on:click={() => updateStatus(order, 'Ready')}>Mark Ready</Button>
        </div>
      </Card>
    {/each}
  </div>
</div>
