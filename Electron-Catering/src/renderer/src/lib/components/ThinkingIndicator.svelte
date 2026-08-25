<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let stepIndex = 0;
  const steps = [
    'Checking your bookings...',
    'Looking at the numbers...',
    'Putting it together...',
    'Almost ready...'
  ];

  let interval: any = null;

  onMount(() => {
    interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
    }, 1200);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<div class="flex justify-start msg-in my-1 select-none">
  <div class="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-bl-sm p-4 flex items-center gap-4 max-w-sm shadow-lg">
    <!-- Jarvis-style Orb -->
    <div class="relative w-12 h-12 flex-shrink-0">
      <svg viewBox="0 0 48 48" class="w-full h-full">
        <circle cx="24" cy="24" r="21" fill="none" stroke="#334155" stroke-width="1" />
        <!-- Outer ring — slow clockwise sweep -->
        <circle
          cx="24" cy="24" r="21" fill="none"
          stroke="url(#jarvisGrad1)" stroke-width="1.5" stroke-linecap="round"
          stroke-dasharray="70 90" class="orb-ring-outer"
        />
        <!-- Middle ring — faster counter-clockwise sweep -->
        <circle
          cx="24" cy="24" r="15" fill="none"
          stroke="url(#jarvisGrad2)" stroke-width="1.5" stroke-linecap="round"
          stroke-dasharray="30 65" class="orb-ring-middle"
        />
        <!-- Inner pulsing core -->
        <circle cx="24" cy="24" r="6" fill="url(#jarvisCore)" class="orb-core" />
        <defs>
          <linearGradient id="jarvisGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fb7185" />
            <stop offset="100%" stop-color="#e11d48" />
          </linearGradient>
          <linearGradient id="jarvisGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#34d399" />
            <stop offset="100%" stop-color="#059669" />
          </linearGradient>
          <radialGradient id="jarvisCore">
            <stop offset="0%" stop-color="#fecdd3" />
            <stop offset="100%" stop-color="#e11d48" />
          </radialGradient>
        </defs>
      </svg>
    </div>

    <div class="space-y-1.5 flex-1 min-w-0">
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] font-bold text-rose-400">Chef Jay</span>
        <span class="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
      </div>
      <p class="text-[10px] font-mono font-semibold text-slate-300 tracking-wide">{steps[stepIndex]}</p>
      <div class="flex gap-1">
        {#each [0, 1, 2] as i}
          <span class="w-1 h-1 rounded-full bg-rose-500 orb-dot" style="animation-delay: {i * 0.15}s"></span>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes spinCW {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes spinCCW {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }
  @keyframes coreGlow {
    0%, 100% { opacity: 0.65; filter: drop-shadow(0 0 2px #e11d48); }
    50% { opacity: 1; filter: drop-shadow(0 0 6px #e11d48); }
  }
  @keyframes dotBounce {
    0%, 100% { opacity: 0.3; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(-2px); }
  }

  .orb-ring-outer {
    transform-origin: 24px 24px;
    animation: spinCW 2.4s linear infinite;
  }
  .orb-ring-middle {
    transform-origin: 24px 24px;
    animation: spinCCW 1.6s linear infinite;
  }
  .orb-core {
    animation: coreGlow 1.4s ease-in-out infinite;
  }
  .orb-dot {
    animation: dotBounce 1s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .orb-ring-outer, .orb-ring-middle, .orb-core, .orb-dot {
      animation: none;
    }
  }

  @keyframes msgSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .msg-in { animation: msgSlideIn 0.2s ease-out forwards; }
</style>
