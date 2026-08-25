<script lang="ts">
  import { cn } from '$lib/utils';
  
  export let variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default';
  export let size: 'default' | 'sm' | 'lg' | 'icon' = 'default';
  export let className: string = '';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled: boolean = false;

  const variants = {
    default: 'bg-emerald-600 text-slate-50 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-[0.98]',
    destructive: 'bg-red-600 text-slate-50 hover:bg-red-500 shadow-md shadow-red-600/20 active:scale-[0.98]',
    outline: 'border border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:text-[var(--text-primary)] text-slate-200',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/60',
    ghost: 'hover:bg-slate-800 hover:text-[var(--text-primary)] text-slate-300',
    link: 'text-emerald-400 underline-offset-4 hover:underline'
  };

  const sizes = {
    default: 'h-10 px-4 py-2 text-xs font-semibold rounded-xl',
    sm: 'h-8 px-3 text-xs font-semibold rounded-lg',
    lg: 'h-12 px-6 text-sm font-bold rounded-xl',
    icon: 'h-9 w-9 p-0 rounded-xl flex items-center justify-center'
  };
</script>

<button
  {type}
  {disabled}
  class={cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className
  )}
  on:click
>
  <slot />
</button>
