<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface InventoryItem {
    id: number;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    min_stock: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  }

  let inventory: InventoryItem[] = [];

  onMount(() => {
    inventory = [
      { id: 1, name: 'Pork Belly (Raw)', category: 'Meat', quantity: 45, unit: 'kg', min_stock: 20, status: 'In Stock' },
      { id: 2, name: 'Cooking Oil', category: 'Supplies', quantity: 8, unit: 'Liters', min_stock: 15, status: 'Low Stock' },
      { id: 3, name: 'Bam-I Noodles', category: 'Dry Goods', quantity: 25, unit: 'Packs', min_stock: 10, status: 'In Stock' },
      { id: 4, name: 'LPG Gas Cylinder 50kg', category: 'Fuel', quantity: 2, unit: 'Tanks', min_stock: 3, status: 'Low Stock' }
    ];
  });
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <div>
    <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
      <img src="assets/icons/svg/inventory.svg" alt="" class="w-5 h-5 opacity-80" />
      <span>Inventory & Supply Stock</span>
    </h3>
    <p class="text-xs text-slate-400">Manage ingredient stock levels, kitchen supplies, and reorder alerts.</p>
  </div>

  <Card>
    <div class="flex items-center justify-between mb-4">
      <h4 class="font-bold text-slate-100 text-sm">Catering Stock Directory</h4>
      <Button size="sm">+ Add Item</Button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
            <th class="py-3 px-2">Item Name</th>
            <th class="py-3 px-2">Category</th>
            <th class="py-3 px-2 text-right">Current Stock</th>
            <th class="py-3 px-2 text-right">Min Level</th>
            <th class="py-3 px-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          {#each inventory as item}
            <tr class="hover:bg-slate-800/40 transition-colors">
              <td class="py-3 px-2 font-medium text-slate-200">{item.name}</td>
              <td class="py-3 px-2 text-slate-400">{item.category}</td>
              <td class="py-3 px-2 text-right font-bold text-slate-100">{item.quantity} {item.unit}</td>
              <td class="py-3 px-2 text-right text-slate-400">{item.min_stock} {item.unit}</td>
              <td class="py-3 px-2 text-center">
                <Badge variant={item.status === 'In Stock' ? 'green' : 'amber'}>
                  {item.status}
                </Badge>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>
</div>
