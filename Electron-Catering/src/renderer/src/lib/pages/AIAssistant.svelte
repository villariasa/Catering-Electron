<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { processChefJayAIQuery, type AIResponse } from '../ai_engine';

  interface ChatMessage {
    id: number;
    sender: 'user' | 'ai';
    text: string;
    chart?: AIResponse['chart'];
    options?: AIResponse['options'];
  }

  let messages: ChatMessage[] = [
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm Chef Jay — your AI Assistant created by my liege! Ask me about revenue vs expenses, unpaid invoices, suki customer tiers, or ingredient portions for 200 pax!",
      options: [
        { label: 'Compare Revenue vs Expenses', send: 'compare revenue vs expenses' },
        { label: 'Unpaid Invoices', send: 'unpaid invoices' },
        { label: 'Portions for 200 Pax', send: 'portions for 200 pax' }
      ]
    }
  ];

  let inputQuery = '';
  let isThinking = false;
  let chatContainer: HTMLDivElement;

  function scrollToBottom() {
    setTimeout(() => {
      if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
  }

  function sendQuery(queryText?: string) {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    // Add user message
    messages = [...messages, { id: Date.now(), sender: 'user', text: q }];
    inputQuery = '';
    isThinking = true;
    scrollToBottom();

    setTimeout(() => {
      const res = processChefJayAIQuery(q);
      messages = [
        ...messages,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.answer,
          chart: res.chart,
          options: res.options
        }
      ];
      isThinking = false;
      scrollToBottom();
    }, 350);
  }

  onMount(() => {
    scrollToBottom();
  });
</script>

<div class="p-6 space-y-6 animate-fade-in flex flex-col h-[calc(100vh-4rem)]">
  <!-- Header -->
  <div class="flex items-center justify-between border-b border-slate-800 pb-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-rose-500/20">
        AI
      </div>
      <div>
        <h3 class="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <span>Chef Jay AI Assistant</span>
          <Badge variant="amber" className="text-[9px] py-0 px-1.5">Offline Local NLP</Badge>
        </h3>
        <p class="text-xs text-slate-400">Conversational business copilot for instant database lookup, financial trends & portion calculations.</p>
      </div>
    </div>

    <Button variant="outline" size="sm" on:click={() => sendQuery('briefing')}>
      Daily Briefing
    </Button>
  </div>

  <!-- Chat Container -->
  <Card className="flex-1 flex flex-col overflow-hidden p-5 space-y-4">
    <!-- Chat Stream -->
    <div bind:this={chatContainer} class="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
      {#each messages as msg}
        <div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in">
          <div class="max-w-2xl p-4 rounded-2xl space-y-3 {msg.sender === 'user' ? 'bg-rose-600 text-white font-semibold shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-200'}">
            <p class="leading-relaxed whitespace-pre-line">{msg.text}</p>

            <!-- Embedded Bar Chart if generated -->
            {#if msg.chart}
              <div class="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div class="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <span class="font-extrabold text-slate-100 text-[11px]">{msg.chart.title}</span>
                  <Badge variant="green" className="text-[8px]">QtChart Specification</Badge>
                </div>

                <div class="space-y-2 pt-1">
                  {#each msg.chart.labels as label, idx}
                    {@const val = msg.chart.series[0].values[idx] || 0}
                    {@const maxVal = Math.max(...msg.chart.series[0].values, 1)}
                    <div class="space-y-1">
                      <div class="flex justify-between text-[10px] font-mono">
                        <span class="text-slate-300 font-bold">{label}</span>
                        <span class="text-emerald-400 font-bold">₱{val.toLocaleString()}</span>
                      </div>
                      <div class="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div class="h-full bg-gradient-to-r from-emerald-500 to-rose-500 rounded-full" style="width: {(val / maxVal) * 100}%;"></div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Suggested Follow-up Action Buttons -->
            {#if msg.options && msg.options.length > 0}
              <div class="flex flex-wrap gap-2 pt-2">
                {#each msg.options as opt}
                  <button
                    class="px-2.5 py-1 rounded-lg bg-slate-950 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-[10px] transition-all cursor-pointer"
                    on:click={() => sendQuery(opt.send)}
                  >
                    {opt.label} ➔
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}

      {#if isThinking}
        <div class="flex justify-start">
          <div class="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono animate-pulse">
            Chef Jay AI is querying database records...
          </div>
        </div>
      {/if}
    </div>

    <!-- Quick Prompts Toolbar -->
    <div class="flex items-center gap-2 pt-2 border-t border-slate-800 overflow-x-auto text-xs">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Suggested:</span>
      <button class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-[11px] whitespace-nowrap font-medium cursor-pointer" on:click={() => sendQuery('Compare revenue vs expenses')}>
        Compare Revenue vs Expenses
      </button>
      <button class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-[11px] whitespace-nowrap font-medium cursor-pointer" on:click={() => sendQuery('Show unpaid invoices')}>
        Unpaid Invoices
      </button>
      <button class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-[11px] whitespace-nowrap font-medium cursor-pointer" on:click={() => sendQuery('Average profit per booking')}>
        Average Booking Profit
      </button>
      <button class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-[11px] whitespace-nowrap font-medium cursor-pointer" on:click={() => sendQuery('Portions for 200 pax')}>
        200 Pax Portions
      </button>
    </div>

    <!-- Query Input Bar -->
    <form on:submit|preventDefault={() => sendQuery()} class="flex gap-2">
      <Input bind:value={inputQuery} placeholder="Ask Chef Jay AI about revenues, expenses, suki clients, or portions..." />
      <Button type="submit">Ask Chef Jay</Button>
    </form>
  </Card>
</div>
