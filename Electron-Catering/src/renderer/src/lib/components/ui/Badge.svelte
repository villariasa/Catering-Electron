<script lang="ts">
  import { cn } from '$lib/utils';
  
  export let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'green' | 'amber' | 'blue' = 'default';
  export let className: string = '';

  const variants = {
    default: 'border-transparent bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
    secondary: 'border-transparent bg-slate-800 text-slate-300 border border-slate-700',
    destructive: 'border-transparent bg-red-500/20 text-red-400 border border-red-500/30',
    outline: 'text-slate-200 border border-slate-700',
    green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
  };
</script>

<div class={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors', variants[variant], className)}>
  <slot />
</div>
