<script lang="ts">
  import { cn } from '$lib/utils';
  
  export let value: string | number = '';
  export let type: string = 'text';
  export let placeholder: string = '';
  export let id: string = '';
  export let className: string = '';
  export let disabled: boolean = false;
</script>

<input
  {id}
  {type}
  {placeholder}
  {disabled}
  bind:value
  class={cn(
    'flex h-11 w-full rounded-xl border border-slate-700/80 px-3.5 py-2 text-xs font-semibold transition-all focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50 theme-input',
    className
  )}
  style="background-color: var(--input-bg, #0F172A) !important; color: var(--text-primary, #F8FAFC) !important; border-color: var(--border-color, #334155) !important;"
  on:input
  on:change
/>
