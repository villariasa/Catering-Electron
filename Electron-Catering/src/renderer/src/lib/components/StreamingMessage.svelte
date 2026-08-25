<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  export let text: string = '';
  export let actions: string[] = [];
  export let isError: boolean = false;
  export let speedMs: number = 24; // Smooth 24ms word step

  const dispatch = createEventDispatcher();

  let displayedText: string = '';
  let isRevealing: boolean = true;
  let timerHandle: any = null;

  function renderMarkdown(raw: string): string {
    return raw
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="border-slate-700 my-3"/>')
      // Bullet points
      .replace(/^[\s]*[•\-\*] (.+)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc list-inside space-y-1 my-2 text-slate-200">$1</ul>')
      // Numbered lists
      .replace(/^[\s]*\d+\. (.+)/gm, '<li>$1</li>')
      // Headings
      .replace(/^### (.+)/gm, '<p class="font-extrabold text-slate-100 text-[11px] uppercase tracking-wider mt-3 mb-1">$1</p>')
      .replace(/^## (.+)/gm, '<p class="font-extrabold text-slate-100 text-sm mt-3 mb-1">$1</p>')
      // Code inline
      .replace(/`(.+?)`/g, '<code class="bg-slate-800 text-emerald-400 px-1 py-0.5 rounded text-[10px] font-mono">$1</code>')
      // Line breaks
      .replace(/\n/g, '<br/>');
  }

  function tokenizeText(rawText: string): string[] {
    const tokens: string[] = [];
    // Match currency like ₱97,500, markdown bold/italic, code tags, newlines, or individual words
    const regex = /(₱[\d,]+(?:\.\d+)?|\*\*.+?\*\*|\*.+?\*|`[^\`]+`|\[[^\]]+\]|\n|[\S]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(rawText)) !== null) {
      tokens.push(match[0]);
    }
    return tokens;
  }

  function startReveal() {
    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      displayedText = text;
      isRevealing = false;
      dispatch('complete');
      return;
    }

    const tokens = tokenizeText(text);
    if (tokens.length === 0) {
      displayedText = text;
      isRevealing = false;
      dispatch('complete');
      return;
    }

    let index = 0;
    displayedText = '';

    timerHandle = setInterval(() => {
      if (index < tokens.length) {
        const token = tokens[index];
        if (token === '\n' || displayedText.endsWith('\n') || displayedText.length === 0) {
          displayedText += token;
        } else {
          displayedText += ' ' + token;
        }
        index++;
        dispatch('chunk');
      } else {
        clearInterval(timerHandle);
        timerHandle = null;
        displayedText = text; // Ensure exact match at the end
        isRevealing = false;
        dispatch('complete');
      }
    }, speedMs);
  }

  onMount(() => {
    startReveal();
  });

  onDestroy(() => {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  });
</script>

<div class="space-y-1">
  <!-- AI Header row with typing indicator badge -->
  <div class="flex items-center gap-1.5 mb-2">
    <div class="w-5 h-5 rounded-lg bg-gradient-to-br from-rose-600 to-pink-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
      AI
    </div>
    <span class="text-[10px] font-bold text-rose-400">Chef Jay</span>

    {#if isRevealing}
      <span class="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded animate-pulse">
        <span>✍️</span>
        <span>typing...</span>
      </span>
    {/if}

    {#if isError}
      <span class="text-[9px] text-red-400 font-bold">• Error</span>
    {/if}
    {#if actions && actions.length > 0}
      <Badge variant="green" className="text-[8px] py-0 px-1">
        {actions.length} action{actions.length > 1 ? 's' : ''} performed
      </Badge>
    {/if}
  </div>

  <!-- Progressively Revealed Text with Blinking Terminal Cursor -->
  <div class="leading-relaxed space-y-1 text-[11px]">
    {@html renderMarkdown(displayedText)}
    {#if isRevealing}
      <span class="inline-block w-2 h-3.5 bg-rose-400 font-bold animate-blink ml-1 align-middle"></span>
    {/if}
  </div>

  <!-- Database Actions Summary (shown after reveal or during if actions exist) -->
  {#if actions && actions.length > 0 && (!isRevealing || displayedText.length > 30)}
    <div class="mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 space-y-1.5 animate-fade-in">
      <p class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Database Actions Executed</p>
      {#each actions as action}
        <div class="flex items-start gap-1.5 text-[10px] text-emerald-300 font-medium">
          {@html renderMarkdown(action)}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  @keyframes blinkCursor {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .animate-blink {
    animation: blinkCursor 0.7s infinite;
  }
</style>
