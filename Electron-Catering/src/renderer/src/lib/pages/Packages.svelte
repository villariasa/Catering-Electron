<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ImportWizardModal from '$lib/components/ImportWizardModal.svelte';
  import ExportWizardModal from '$lib/components/ExportWizardModal.svelte';

  let activeTab: 'packages' | 'dishes' = 'packages';
  let searchQuery = '';
  let selectedCategory = 'All';

  let showImportModal = false;
  let showExportModal = false;

  // Packages list
  let packages = [
    { id: 1, name: 'Executive Grand Buffet', category: 'Buffet', price_per_pax: 650, min_pax: 50, description: 'Full 5-course catering package including Lechon Belly, Beef Caldereta, Fish Fillet, Bam-I, and Dessert Float.', dishes_count: 8 },
    { id: 2, name: 'Classic Fiesta Buffet', category: 'Buffet', price_per_pax: 450, min_pax: 30, description: 'Popular 4-course menu with Fried Chicken, Pork Humba, Sotanghon, and Buko Pandan.', dishes_count: 5 },
    { id: 3, name: 'VIP Plated Dinner', category: 'Plated', price_per_pax: 850, min_pax: 20, description: 'Luxury 6-course individually plated dining with Roast Beef, Salmon Steak, and Wine pairing.', dishes_count: 10 }
  ];

  // Individual dishes list
  let dishes = [
    { id: 101, name: 'Lechon Pork Belly (Crispy Skin)', category: 'Pork', unit_cost: 350, description: 'Cebu-style roasted pork belly with herbs and crispy skin.' },
    { id: 102, name: 'Beef Caldereta Special', category: 'Beef', unit_cost: 380, description: 'Tender beef stewed in liver spread sauce, bell peppers, and cheese.' },
    { id: 103, name: 'Fish Fillet with Tartar Sauce', category: 'Seafood', unit_cost: 280, description: 'Crispy deep-fried dory fillet served with homemade tartar sauce.' },
    { id: 104, name: 'BAM-I Special Cebuano Noodles', category: 'Pasta/Noodles', unit_cost: 180, description: 'Sautéed egg noodles and vermicelli with pork, chicken, shrimp, and vegetables.' },
    { id: 105, name: 'Mango Float & Buko Pandan', category: 'Dessert', unit_cost: 120, description: 'Chilled graham mango layers and pandan-flavored coconut jelly.' }
  ];

  const categories = ['All', 'Buffet', 'Plated', 'Pork', 'Beef', 'Chicken', 'Seafood', 'Pasta/Noodles', 'Dessert'];

  // Add Item Modals State
  let showAddPackageModal = false;
  let showAddDishModal = false;

  let pkgName = '';
  let pkgCat = 'Buffet';
  let pkgPrice = 500;
  let pkgMinPax = 30;
  let pkgDesc = '';

  let dishName = '';
  let dishCat = 'Pork';
  let dishCost = 250;
  let dishDesc = '';

  function handleAddPackage() {
    if (!pkgName.trim()) return alert('Package name is required');
    packages = [{ id: Date.now(), name: pkgName, category: pkgCat, price_per_pax: pkgPrice, min_pax: pkgMinPax, description: pkgDesc, dishes_count: 6 }, ...packages];
    showAddPackageModal = false;
    pkgName = '';
    alert('Catering package saved successfully!');
  }

  function handleAddDish() {
    if (!dishName.trim()) return alert('Dish name is required');
    dishes = [{ id: Date.now(), name: dishName, category: dishCat, unit_cost: dishCost, description: dishDesc }, ...dishes];
    showAddDishModal = false;
    dishName = '';
    alert('Dish item added to menu catalog!');
  }

  $: filteredPackages = packages.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  $: filteredDishes = dishes.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.description.toLowerCase().includes(searchQuery.toLowerCase());
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
      <Button variant="outline" size="sm" on:click={() => (showImportModal = true)}>📥 Import Menu</Button>
      <Button variant="outline" size="sm" on:click={() => (showExportModal = true)}>📤 Export Menu</Button>
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

  <!-- Tab 1: Catering Packages Grid -->
  {#if activeTab === 'packages'}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each filteredPackages as pkg}
        <Card className="space-y-4 flex flex-col justify-between hover:border-rose-500/50 transition-colors">
          <div class="space-y-2">
            <div class="flex justify-between items-start gap-2">
              <h4 class="font-bold text-slate-100 text-base">{pkg.name}</h4>
              <Badge variant="rose">₱{pkg.price_per_pax} / pax</Badge>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed">{pkg.description}</p>
          </div>

          <div class="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span class="text-slate-400">Min: <strong class="text-slate-200">{pkg.min_pax} pax</strong></span>
            <span class="text-emerald-400 font-bold">{pkg.dishes_count} Included Dishes</span>
          </div>
        </Card>
      {/each}
    </div>
  {:else}
    <!-- Tab 2: Individual Dishes Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each filteredDishes as d}
        <Card className="space-y-3 hover:border-emerald-500/50 transition-colors">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-bold text-slate-100 text-sm">{d.name}</h4>
              <Badge variant="secondary">{d.category}</Badge>
            </div>
            <span class="font-bold text-emerald-400 text-sm">₱{d.unit_cost}</span>
          </div>
          <p class="text-xs text-slate-400">{d.description}</p>
        </Card>
      {/each}
    </div>
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
          <Button variant="secondary" size="sm" type="button" on:click={() => (showAddPackageModal = false)}>Cancel</Button>
          <Button size="sm" type="submit">Save Package</Button>
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
          <Button variant="secondary" size="sm" type="button" on:click={() => (showAddDishModal = false)}>Cancel</Button>
          <Button size="sm" type="submit">Save Dish Item</Button>
        </div>
      </form>
    </Card>
  </div>
{/if}

<!-- Import / Export Modals -->
<ImportWizardModal show={showImportModal} defaultEntity="packages" onClose={() => (showImportModal = false)} />
<ExportWizardModal show={showExportModal} defaultEntity="packages" onClose={() => (showExportModal = false)} />
