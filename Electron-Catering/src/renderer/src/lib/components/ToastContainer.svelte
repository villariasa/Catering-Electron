<script lang="ts">
  import { toast } from '$lib/stores/toast';
</script>

<div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
  {#each $toast as t (t.id)}
    <div
      class="pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-start gap-3 animate-toast-in
      {t.type === 'success' ? 'bg-emerald-950 border-emerald-500/40 text-emerald-200' : t.type === 'error' ? 'bg-red-950 border-red-500/40 text-red-200' : 'bg-slate-900 border-slate-700 text-slate-200'}"
    >
      <span class="mt-0.5 flex-shrink-0">
        {#if t.type === 'success'}✓{:else if t.type === 'error'}✕{:else}ℹ{/if}
      </span>
      <span class="flex-1 leading-snug whitespace-pre-line">{t.message}</span>
      <button class="opacity-60 hover:opacity-100 flex-shrink-0" on:click={() => toast.dismiss(t.id)}>✕</button>
    </div>
  {/each}
</div>

<style>
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(24px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-toast-in {
    animation: toastIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
</style>
