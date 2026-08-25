<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import ThinkingIndicator from '$lib/components/ThinkingIndicator.svelte';
  import StreamingMessage from '$lib/components/StreamingMessage.svelte';
  import type { GeneratedDocument } from '../../../preload/types';

  export let currentScreen: string = '';

  // xlsx (~280kB) is only needed once the AI actually generates a document to preview —
  // loading it eagerly here would add it to the app's startup bundle since this mascot
  // is always mounted.
  let DocumentPreviewCardComp: any = null;
  async function ensureDocumentPreviewLoaded() {
    if (!DocumentPreviewCardComp) {
      DocumentPreviewCardComp = (await import('$lib/components/DocumentPreviewCard.svelte')).default;
    }
  }
  $: if (messages.some((m) => m.document)) ensureDocumentPreviewLoaded();

  let isOpen = false;
  let inputQuery = '';
  let isThinking = false;
  let drawerContainer: HTMLDivElement;

  interface Message {
    id: number;
    sender: 'user' | 'chef';
    text: string;
    time: string;
    actions?: string[];
    isStreaming?: boolean;
    isError?: boolean;
    document?: GeneratedDocument | null;
  }

  let messages: Message[] = [
    {
      id: 1,
      sender: 'chef',
      text: "Hello! I'm Chef Jay AI 🤖 Ask me about your catering bookings, unpaid invoices, revenue, or to record expenses & new bookings!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: false
    }
  ];

  function toggleDrawer() {
    isOpen = !isOpen;
  }

  async function scrollToBottom() {
    if (drawerContainer) {
      drawerContainer.scrollTop = drawerContainer.scrollHeight;
    }
  }

  async function handleSend(queryText?: string) {
    const text = (queryText || inputQuery).trim();
    if (!text || isThinking) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Map history of prior messages
    const historyPayload = messages.map(m => ({
      role: m.sender === 'user' ? ('user' as const) : ('model' as const),
      text: m.text
    }));

    messages = [...messages, { id: Date.now(), sender: 'user', text, time: timeStr }];
    inputQuery = '';
    isThinking = true;
    const startTime = Date.now();
    scrollToBottom();

    try {
      if (!window.electronAPI || !window.electronAPI.ai) {
        throw new Error("Electron API is not available or app is running outside Electron window.");
      }
      const timeoutMs = 30000;
      const res: any = await Promise.race([
        window.electronAPI.ai.query(text, historyPayload, currentScreen),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Chef Jay is taking too long to respond. Please try again.')), timeoutMs))
      ]);

      const elapsed = Date.now() - startTime;
      const minDelay = Math.max(0, 350 - elapsed);
      if (minDelay > 0) {
        await new Promise(r => setTimeout(r, minDelay));
      }

      isThinking = false;
      messages = [
        ...messages,
        {
          id: Date.now() + 1,
          sender: 'chef',
          text: res.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: res.actions || [],
          isStreaming: true,
          isError: !res.success,
          document: res.generatedDocument || null
        }
      ];
    } catch (e: any) {
      isThinking = false;
      messages = [
        ...messages,
        {
          id: Date.now() + 1,
          sender: 'chef',
          text: `⚠️ Connection error: ${e?.message || 'Unable to reach Chef Jay AI.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
          isStreaming: false
        }
      ];
    } finally {
      scrollToBottom();
    }
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
              <Badge variant="green" className="text-[9px] py-0 px-1.5">FLASH LITE ⚡</Badge>
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
      <div bind:this={drawerContainer} class="flex-1 overflow-y-auto space-y-3 py-3 px-1 text-xs">
        {#each messages as msg (msg.id)}
          <div class="flex flex-col {msg.sender === 'user' ? 'items-end' : 'items-start'}">
            <span class="text-[10px] text-slate-400 mb-0.5 px-1">{msg.sender === 'user' ? 'You' : 'Chef Jay AI'} • {msg.time}</span>
            <div class="max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line {msg.sender === 'user' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-900 border border-slate-800 text-slate-100'}">
              {#if msg.sender === 'chef' && msg.isStreaming}
                <StreamingMessage
                  text={msg.text}
                  actions={msg.actions || []}
                  isError={msg.isError || false}
                  on:chunk={scrollToBottom}
                  on:complete={() => (msg.isStreaming = false)}
                />
              {:else}
                {msg.text}
              {/if}

              {#if msg.document}
                {#if DocumentPreviewCardComp}
                  <svelte:component this={DocumentPreviewCardComp} doc={msg.document} />
                {/if}
              {/if}
            </div>
          </div>
        {/each}

        {#if isThinking}
          <ThinkingIndicator />
        {/if}
      </div>

      <!-- Input Bar -->
      <form on:submit|preventDefault={() => handleSend()} class="flex gap-2 pt-2 border-t border-slate-800">
        <Input bind:value={inputQuery} placeholder="Ask Chef Jay about revenue, unpaid accounts, or portions..." disabled={isThinking} />
        <Button type="submit" size="sm" disabled={isThinking || !inputQuery.trim()}>Send</Button>
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
