<script lang="ts">
  import { cn } from '$lib/utils';
  export let className: string = '';
</script>

<div class={cn('rounded-2xl border border-slate-800/80 bg-slate-900/80 text-slate-50 shadow-xl p-6', className)}>
  <slot />
</div>
