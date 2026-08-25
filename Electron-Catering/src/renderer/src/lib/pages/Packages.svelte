<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ImportWizardModal from '$lib/components/ImportWizardModal.svelte';
  import ExportWizardModal from '$lib/components/ExportWizardModal.svelte';
  import type { PackageItem, MenuItem } from '../../../../preload/types';

  let activeTab: 'packages' | 'dishes' = 'packages';
  let searchQuery = '';
  let selectedCategory = 'All';
  let loading = true;

  let showImportModal = false;
  let showExportModal = false;

  let packages: PackageItem[] = [];
  let dishes: MenuItem[] = [];
  let itemCounts: Record<number, number> = {};

  const categories = ['All', 'Buffet', 'Plated', 'VIP', 'Pork', 'Beef', 'Chicken', 'Seafood', 'Pasta/Noodles', 'Dessert'];

  async function loadData() {
    loading = true;
    try {
      const [pkgs, items, counts] = await Promise.all([
        window.electronAPI.packages.getAll(),
        window.electronAPI.menuItems.getAll(),
        window.electronAPI.packages.getItemCounts(),
      ]);
      packages = pkgs;
      dishes = items;
      itemCounts = counts;
    } catch (e) {
      console.error('[Packages] Failed to load data:', e);
    } finally {
      loading = false;
    }
  }

  onMount(loadData);

  // Manage Dishes picker state
  let showManageDishesModal = false;
  let managingPackage: PackageItem | null = null;
  let selectedItemIds: Set<number> = new Set();
  let savingDishLinks = false;

  async function openManageDishes(pkg: PackageItem) {
    if (!pkg.id) return;
    managingPackage = pkg;
    showManageDishesModal = true;
    try {
      const ids = await window.electronAPI.packages.getItemIds(pkg.id);
      selectedItemIds = new Set(ids);
    } catch (e) {
      console.error('[Packages] Failed to load package dishes:', e);
      selectedItemIds = new Set();
    }
  }

  function toggleDishSelection(itemId: number) {
    if (selectedItemIds.has(itemId)) selectedItemIds.delete(itemId);
    else selectedItemIds.add(itemId);
    selectedItemIds = new Set(selectedItemIds);
  }

  async function saveDishLinks() {
    if (!managingPackage?.id) return;
    savingDishLinks = true;
    try {
      await window.electronAPI.packages.setItems(managingPackage.id, Array.from(selectedItemIds));
      itemCounts = { ...itemCounts, [managingPackage.id]: selectedItemIds.size };
      showManageDishesModal = false;
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save dish selection.');
    } finally {
      savingDishLinks = false;
    }
  }

  // Add Item Modals State
  let showAddPackageModal = false;
  let showAddDishModal = false;
  let saving = false;

  let pkgName = '';
  let pkgCat = 'Buffet';
  let pkgPrice = 500;
  let pkgMinPax = 30;
  let pkgDesc = '';

  let dishName = '';
  let dishCat = 'Pork';
  let dishCost = 250;
  let dishDesc = '';

  async function handleAddPackage() {
    if (!pkgName.trim()) return toast.error('Package name is required');
    saving = true;
    try {
      const created = await window.electronAPI.packages.create({
        name: pkgName.trim(),
        category: pkgCat,
        price_per_pax: pkgPrice,
        min_pax: pkgMinPax,
        description: pkgDesc || undefined,
      });
      packages = [created, ...packages];
      showAddPackageModal = false;
      pkgName = '';
      pkgDesc = '';
      toast.success('Catering package saved successfully!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save package.');
    } finally {
      saving = false;
    }
  }

  async function handleDeletePackage(pkg: PackageItem) {
    if (!pkg.id || !confirm(`Delete package "${pkg.name}"?`)) return;
    try {
      await window.electronAPI.packages.delete(pkg.id);
      packages = packages.filter((p) => p.id !== pkg.id);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete package.');
    }
  }

  async function handleAddDish() {
    if (!dishName.trim()) return toast.error('Dish name is required');
    saving = true;
    try {
      const created = await window.electronAPI.menuItems.create({
        name: dishName.trim(),
        category: dishCat,
        price: dishCost,
        description: dishDesc || undefined,
      });
      dishes = [created, ...dishes];
      showAddDishModal = false;
      dishName = '';
      dishDesc = '';
      toast.success('Dish item added to menu catalog!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save dish.');
    } finally {
      saving = false;
    }
  }

  async function handleDeleteDish(dish: MenuItem) {
    if (!dish.id || !confirm(`Delete dish "${dish.name}"?`)) return;
    try {
      await window.electronAPI.menuItems.delete(dish.id);
      dishes = dishes.filter((d) => d.id !== dish.id);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete dish.');
    }
  }

  $: filteredPackages = packages.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  $: filteredDishes = dishes.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
    return matchesSearch && matchesCat;
  });
</script>

<div class="p-6 space-y-6 animate-fade-in overflow-y-auto max-h-[calc(100vh-4rem)]">
  <!-- Header Bar -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h3 class="text-lg font-extrabold text-slate-100 flex items-center gap-2">
        <img src="assets/icons/svg/menu.svg" alt="" class="w-5 h-5 opacity-80" />
        <span>Menu Packages & Dishes Catalog</span>
      </h3>
      <p class="text-xs text-slate-400">Manage catering menu packages, per-pax pricing, and individual dish items.</p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" on:click={() => (showImportModal = true)}>Import Menu</Button>
      <Button variant="outline" size="sm" on:click={() => (showExportModal = true)}>Export Menu</Button>
      {#if activeTab === 'packages'}
        <Button size="sm" on:click={() => (showAddPackageModal = true)}>+ Add Package</Button>
      {:else}
        <Button size="sm" on:click={() => (showAddDishModal = true)}>+ Add Dish Item</Button>
      {/if}
    </div>
  </div>

  <!-- Navigation Tabs & Category Filters -->
  <Card className="p-4 space-y-3 bg-slate-900/80 border-slate-800">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
      <!-- Main Tabs -->
      <div class="flex gap-2">
        <button
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all {activeTab === 'packages' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}"
          on:click={() => (activeTab = 'packages')}
        >
          Catering Packages ({packages.length})
        </button>

        <button
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all {activeTab === 'dishes' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'}"
          on:click={() => (activeTab = 'dishes')}
        >
          Individual Dish Catalog ({dishes.length})
        </button>
      </div>

      <div class="w-full sm:w-64">
        <Input bind:value={searchQuery} placeholder="Search menu or dishes..." />
      </div>
    </div>

    <!-- Category Pills -->
    <div class="flex flex-wrap gap-1.5 text-xs pt-1">
      {#each categories as cat}
        <button
          class="px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all {selectedCategory === cat ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}"
          on:click={() => (selectedCategory = cat)}
        >
          {cat}
        </button>
      {/each}
    </div>
  </Card>

  {#if loading}
    <div class="p-12 text-center text-slate-500">Loading menu catalog...</div>
  {:else if activeTab === 'packages'}
    <!-- Tab 1: Catering Packages Grid -->
    {#if filteredPackages.length === 0}
      <div class="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">No packages found.</div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each filteredPackages as pkg (pkg.id)}
          <Card className="space-y-4 flex flex-col justify-between hover:border-rose-500/50 transition-colors">
            <div class="space-y-2">
              <div class="flex justify-between items-start gap-2">
                <h4 class="font-bold text-slate-100 text-base">{pkg.name}</h4>
                <Badge variant="rose">₱{pkg.price_per_pax} / pax</Badge>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">{pkg.description || 'No description provided.'}</p>
            </div>

            <div class="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span class="text-slate-400">Min: <strong class="text-slate-200">{pkg.min_pax} pax</strong></span>
              <span class="text-emerald-400 font-bold">{itemCounts[pkg.id ?? -1] || 0} Included Dishes</span>
            </div>
            <div class="flex justify-between items-center text-xs pt-1">
              <button class="text-blue-400 hover:text-blue-300 font-semibold" on:click={() => openManageDishes(pkg)}>Manage Dishes</button>
              <button class="text-slate-600 hover:text-red-400" on:click={() => handleDeletePackage(pkg)}>Delete</button>
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  {:else}
    <!-- Tab 2: Individual Dishes Grid -->
    {#if filteredDishes.length === 0}
      <div class="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">No dishes found.</div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {#each filteredDishes as d (d.id)}
          <Card className="space-y-3 hover:border-emerald-500/50 transition-colors">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-slate-100 text-sm">{d.name}</h4>
                <Badge variant="secondary">{d.category}</Badge>
              </div>
              <span class="font-bold text-emerald-400 text-sm">₱{d.price}</span>
            </div>
            <p class="text-xs text-slate-400">{d.description || 'No description provided.'}</p>
            <div class="pt-2 border-t border-slate-800 text-right">
              <button class="text-slate-600 hover:text-red-400 text-xs" on:click={() => handleDeleteDish(d)}>Delete</button>
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- Add Package Modal -->
{#if showAddPackageModal}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
    <Card className="max-w-md w-full p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-extrabold text-slate-100 text-sm">Add Catering Menu Package</h3>
        <button class="text-slate-400 hover:text-slate-200 font-bold" on:click={() => (showAddPackageModal = false)}>✕</button>
      </div>

      <form on:submit|preventDefault={handleAddPackage} class="space-y-3 text-xs">
        <div>
          <label for="pkg-n" class="block text-slate-300 font-semibold mb-1">Package Name</label>
          <Input id="pkg-n" bind:value={pkgName} placeholder="e.g. Deluxe Wedding Buffet" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="pkg-p" class="block text-slate-300 font-semibold mb-1">Price per Pax (₱)</label>
            <Input id="pkg-p" type="number" bind:value={pkgPrice} />
          </div>
          <div>
            <label for="pkg-m" class="block text-slate-300 font-semibold mb-1">Min Pax</label>
            <Input id="pkg-m" type="number" bind:value={pkgMinPax} />
          </div>
        </div>

        <div>
          <label for="pkg-d" class="block text-slate-300 font-semibold mb-1">Description / Dish Inclusions</label>
          <Input id="pkg-d" bind:value={pkgDesc} placeholder="Includes 5 dishes + dessert" />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="secondary" size="sm" type="button" disabled={saving} on:click={() => (showAddPackageModal = false)}>Cancel</Button>
          <Button size="sm" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Package'}</Button>
        </div>
      </form>
    </Card>
  </div>
{/if}

<!-- Add Dish Modal -->
{#if showAddDishModal}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
    <Card className="max-w-md w-full p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-extrabold text-slate-100 text-sm">Add Individual Dish Item</h3>
        <button class="text-slate-400 hover:text-slate-200 font-bold" on:click={() => (showAddDishModal = false)}>✕</button>
      </div>

      <form on:submit|preventDefault={handleAddDish} class="space-y-3 text-xs">
        <div>
          <label for="dsh-n" class="block text-slate-300 font-semibold mb-1">Dish Name</label>
          <Input id="dsh-n" bind:value={dishName} placeholder="e.g. Pork Humba Special" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="dsh-c" class="block text-slate-300 font-semibold mb-1">Category</label>
            <select id="dsh-c" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs" bind:value={dishCat}>
              <option value="Pork">Pork</option>
              <option value="Beef">Beef</option>
              <option value="Chicken">Chicken</option>
              <option value="Seafood">Seafood</option>
              <option value="Pasta/Noodles">Pasta/Noodles</option>
              <option value="Dessert">Dessert</option>
            </select>
          </div>

          <div>
            <label for="dsh-cost" class="block text-slate-300 font-semibold mb-1">Unit Cost (₱)</label>
            <Input id="dsh-cost" type="number" bind:value={dishCost} />
          </div>
        </div>

        <div>
          <label for="dsh-d" class="block text-slate-300 font-semibold mb-1">Dish Description</label>
          <Input id="dsh-d" bind:value={dishDesc} />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="secondary" size="sm" type="button" disabled={saving} on:click={() => (showAddDishModal = false)}>Cancel</Button>
          <Button size="sm" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Dish Item'}</Button>
        </div>
      </form>
    </Card>
  </div>
{/if}

<!-- Manage Dishes (package_items composition picker) -->
{#if showManageDishesModal && managingPackage}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
    <Card className="max-w-lg w-full p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-extrabold text-slate-100 text-sm">Manage Dishes — {managingPackage.name}</h3>
        <button class="text-slate-400 hover:text-slate-200 font-bold" on:click={() => (showManageDishesModal = false)}>✕</button>
      </div>

      <p class="text-[11px] text-slate-400">Select which dishes from the catalog are included in this package.</p>

      <div class="max-h-72 overflow-y-auto space-y-1.5 pr-1 text-xs">
        {#if dishes.length === 0}
          <p class="text-slate-500 text-center py-4">No dishes in the catalog yet. Add some from the Dishes tab first.</p>
        {:else}
          {#each dishes as d (d.id)}
            <label class="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={d.id !== undefined && selectedItemIds.has(d.id)}
                class="rounded bg-slate-900 border-slate-700 text-emerald-500 cursor-pointer"
                on:change={() => d.id !== undefined && toggleDishSelection(d.id)}
              />
              <span class="flex-1 text-slate-200 font-medium">{d.name}</span>
              <Badge variant="secondary">{d.category}</Badge>
              <span class="text-emerald-400 font-bold">₱{d.price}</span>
            </label>
          {/each}
        {/if}
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
        <Button variant="secondary" size="sm" type="button" disabled={savingDishLinks} on:click={() => (showManageDishesModal = false)}>Cancel</Button>
        <Button size="sm" type="button" disabled={savingDishLinks} on:click={saveDishLinks}>{savingDishLinks ? 'Saving...' : `Save (${selectedItemIds.size} selected)`}</Button>
      </div>
    </Card>
  </div>
{/if}

<!-- Import / Export Modals -->
<ImportWizardModal show={showImportModal} defaultEntity="packages" onClose={() => (showImportModal = false)} />
<ExportWizardModal show={showExportModal} defaultEntity="packages" onClose={() => (showExportModal = false)} />
