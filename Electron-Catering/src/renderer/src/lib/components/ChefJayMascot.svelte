<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { processChefJayAIQuery } from '../ai_engine';

  let isOpen = false;
  let inputQuery = '';
  let isThinking = false;

  interface Message {
    sender: 'user' | 'chef';
    text: string;
    time: string;
    options?: { label: string; send: string }[];
  }

  let messages: Message[] = [
    {
      sender: 'chef',
      text: "Hello! I'm Chef Jay AI! Ask me about your bookings, unpaid invoices, revenue, or recipe portioning!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: [
        { label: 'Compare Revenue vs Expenses', send: 'compare revenue vs expenses' },
        { label: 'Unpaid Invoices', send: 'unpaid invoices' },
        { label: 'Portions for 200 Pax', send: 'portions for 200 pax' }
      ]
    }
  ];

  function toggleDrawer() {
    isOpen = !isOpen;
  }

  function handleSend(queryText?: string) {
    const text = queryText || inputQuery;
    if (!text.trim() || isThinking) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messages = [...messages, { sender: 'user', text, time: timeStr }];
    inputQuery = '';
    isThinking = true;

    setTimeout(() => {
      const res = processChefJayAIQuery(text);
      messages = [...messages, { sender: 'chef', text: res.answer, time: timeStr, options: res.options }];
      isThinking = false;
    }, 350);
  }
</script>

<!-- Global Floating Chef Jay AI Avatar Widget (Bottom Right Corner) -->
<div class="fixed bottom-6 right-6 z-50 select-none flex flex-col items-end gap-3">
  <!-- Chef Jay AI Chat Drawer Popover -->
  {#if isOpen}
    <Card className="w-96 sm:w-[420px] h-[520px] flex flex-col shadow-2xl border-2 border-rose-500/50 animate-slide-down p-4 bg-slate-950 rounded-2xl">
      <!-- Drawer Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-3">
          <img
            src="assets/chef_anime_avatar.png"
            alt="Chef Jay AI Avatar"
            class="w-10 h-10 object-cover rounded-full border-2 border-rose-500 shadow-md"
          />
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-extrabold text-slate-100 text-sm">Chef Jay AI</h4>
              <Badge variant="green" className="text-[9px] py-0 px-1.5">LOCAL NLP AI</Badge>
            </div>
            <p class="text-[11px] text-emerald-400 font-medium">Online • Jayraldine Assistant</p>
          </div>
        </div>

        <button
          type="button"
          class="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 font-bold hover:bg-red-500 hover:text-slate-50 transition-colors flex items-center justify-center text-xs cursor-pointer"
          on:click={toggleDrawer}
        >
          ✕
        </button>
      </div>

      <!-- Messages Feed -->
      <div class="flex-1 overflow-y-auto space-y-3 py-3 px-1 text-xs">
        {#each messages as msg}
          <div class="flex flex-col {msg.sender === 'user' ? 'items-end' : 'items-start'}">
            <span class="text-[10px] text-slate-400 mb-0.5 px-1">{msg.sender === 'user' ? 'You' : 'Chef Jay AI'} • {msg.time}</span>
            <div class="max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line {msg.sender === 'user' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-900 border border-slate-800 text-slate-100'}">
              {msg.text}
            </div>

            {#if msg.options && msg.options.length > 0}
              <div class="flex flex-wrap gap-1.5 mt-2 max-w-[88%]">
                {#each msg.options as opt}
                  <button
                    class="px-2 py-1 rounded-lg bg-slate-900 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-[10px] transition-all cursor-pointer"
                    on:click={() => handleSend(opt.send)}
                  >
                    {opt.label} ➔
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/each}

        {#if isThinking}
          <div class="flex items-start gap-2">
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono animate-pulse">
              Chef Jay AI is querying database records...
            </div>
          </div>
        {/if}
      </div>

      <!-- Input Bar -->
      <form on:submit|preventDefault={() => handleSend()} class="flex gap-2 pt-2 border-t border-slate-800">
        <Input bind:value={inputQuery} placeholder="Ask Chef Jay about revenue, unpaid accounts, or portions..." />
        <Button type="submit" size="sm">Send</Button>
      </form>
    </Card>
  {/if}

  <!-- Floating Mascot Button Badge -->
  <button
    type="button"
    class="w-14 h-14 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-center shadow-2xl border-2 border-white/20 hover:scale-105 transition-all cursor-pointer relative group"
    on:click={toggleDrawer}
  >
    <img src="assets/chef_anime_avatar.png" alt="Chef Jay AI" class="w-11 h-11 rounded-full object-cover" />
    <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 animate-ping"></span>
    <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
  </button>
</div>
