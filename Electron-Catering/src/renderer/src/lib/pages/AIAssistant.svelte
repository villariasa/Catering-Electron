<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import ThinkingIndicator from '$lib/components/ThinkingIndicator.svelte';
  import StreamingMessage from '$lib/components/StreamingMessage.svelte';
  import DocumentPreviewCard from '$lib/components/DocumentPreviewCard.svelte';
  import type { GeneratedDocument } from '../../../preload/types';

  export let currentScreen: string = 'AI Assistant';

  type FormType = 'customer' | 'booking' | 'expense' | 'package';

  interface ChatMessage {
    id: number;
    sender: 'user' | 'ai';
    text: string;
    actions?: string[];
    isError?: boolean;
    isStreaming?: boolean;
    formType?: FormType;
    formData?: any;
    formSubmitted?: boolean;
    document?: GeneratedDocument | null;
  }

  function defaultFormData(type: FormType) {
    switch (type) {
      case 'customer':
        return { name: '', contact_number: '', email: '', address: '', loyalty_tier: 'New' };
      case 'booking':
        return {
          customer_name: '',
          occasion: 'Wedding Reception',
          event_date: new Date().toISOString().split('T')[0],
          event_time: '18:00',
          venue: '',
          pax: 100,
          total_amount: 50000,
          amount_paid: 15000
        };
      case 'expense':
        return { category: 'Ingredients', description: '', amount: 5000, expense_date: new Date().toISOString().split('T')[0] };
      case 'package':
        return { name: '', description: '', price_per_pax: 350, min_pax: 50 };
    }
  }

  const VERB_WORDS = ['add', 'create', 'new', 'make', 'record', 'log', 'register', 'book'];
  const NOUN_KEYWORDS: { type: FormType; word: string }[] = [
    { type: 'customer', word: 'customer' },
    { type: 'booking', word: 'booking' },
    { type: 'booking', word: 'event' },
    { type: 'expense', word: 'expense' },
    { type: 'package', word: 'package' }
  ];

  // Plain Levenshtein edit distance — lets us catch typos like "expence" or "custmer".
  function editDistance(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
    return dp[a.length][b.length];
  }

  function detectFormIntent(text: string): FormType | null {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    if (words.length < 2) return null;

    const hasVerb = words.some((w) => VERB_WORDS.includes(w));
    if (!hasVerb) return null;

    for (const w of words) {
      if (w.length < 4) continue;
      for (const { type, word } of NOUN_KEYWORDS) {
        const maxDistance = w.length <= 5 ? 1 : w.length <= 7 ? 2 : 3;
        if (w === word || editDistance(w, word) <= maxDistance) return type;
      }
    }
    return null;
  }

  function pushInlineForm(type: FormType) {
    messages = [
      ...messages,
      {
        id: Date.now(),
        sender: 'ai',
        text: '',
        formType: type,
        formData: defaultFormData(type),
        formSubmitted: false
      }
    ];
    scrollToBottom();
  }

  function cancelInlineForm(msg: ChatMessage) {
    messages = messages.map((m) =>
      m.id === msg.id ? { ...m, formType: undefined, text: 'Form cancelled.' } : m
    );
  }

  async function submitInlineForm(msg: ChatMessage) {
    const f = msg.formData;
    let prompt = '';
    let confirmText = '';

    if (msg.formType === 'customer') {
      if (!f.name || !f.contact_number) return;
      prompt = `Add a new customer named "${f.name}" with phone ${f.contact_number}, email "${f.email || 'N/A'}", address "${f.address || 'Cebu City'}", loyalty tier ${f.loyalty_tier}.`;
      confirmText = `Submitted new customer: **${f.name}**`;
    } else if (msg.formType === 'booking') {
      if (!f.customer_name || !f.venue) return;
      prompt = `Create a new booking for ${f.customer_name} — ${f.occasion} on ${f.event_date} at ${f.event_time}, venue ${f.venue}, ${f.pax} pax, total ₱${f.total_amount}, downpayment ₱${f.amount_paid}.`;
      confirmText = `Submitted new booking for **${f.customer_name}**`;
    } else if (msg.formType === 'expense') {
      if (!f.description || !f.amount) return;
      prompt = `Record an expense: ${f.category} — ${f.description} for ₱${f.amount} on ${f.expense_date}.`;
      confirmText = `Submitted expense: **${f.description}**`;
    } else if (msg.formType === 'package') {
      if (!f.name || !f.price_per_pax) return;
      prompt = `Add a new catering package: "${f.name}" at ₱${f.price_per_pax} per pax, minimum ${f.min_pax} guests, description: ${f.description || 'Standard package'}.`;
      confirmText = `Submitted new package: **${f.name}**`;
    }

    messages = messages.map((m) =>
      m.id === msg.id ? { ...m, formSubmitted: true, formType: undefined, text: confirmText } : m
    );

    await sendQuery(prompt);
  }

  let messages: ChatMessage[] = [
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm **Chef Jay**, your AI business assistant.\n\nI have **real-time read and write access** to your entire Jayraldine's Catering database.\n\n**I can:**\n• Answer questions about revenue, bookings, customers, and expenses\n• Add new customers, bookings, expenses, and menu packages\n• Update booking statuses (mark as completed, cancelled, etc.)\n• Delete records you no longer need\n\nJust tell me naturally what you want to do — I'll pop up a quick form right here in the chat.",
      isStreaming: false
    }
  ];

  let inputQuery = '';
  let isThinking = false;
  let chatContainer: HTMLDivElement;

  function renderMarkdown(text: string): string {
    return text
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

  async function scrollToBottom() {
    await tick();
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function sendQuery(queryText?: string) {
    const q = (queryText || inputQuery).trim();
    if (!q || isThinking) return;

    // If the user typed a free-text add/create request, show the inline
    // form in the chatbox instead of forwarding straight to the AI.
    if (!queryText) {
      const intent = detectFormIntent(q);
      if (intent) {
        messages = [...messages, { id: Date.now(), sender: 'user', text: q }];
        inputQuery = '';
        pushInlineForm(intent);
        return;
      }
    }

    // 1. Build history payload from PRIOR messages for multi-turn context
    const historyPayload = messages.map(m => ({
      role: m.sender === 'user' ? ('user' as const) : ('model' as const),
      text: m.text
    }));

    // 2. Append user message to UI
    messages = [...messages, { id: Date.now(), sender: 'user', text: q }];
    inputQuery = '';
    isThinking = true;
    const startTime = Date.now();
    await scrollToBottom();

    try {
      if (!window.electronAPI || !window.electronAPI.ai) {
        throw new Error("Electron API is not available or app is running outside Electron window.");
      }
      const timeoutMs = 30000;
      const res: any = await Promise.race([
        window.electronAPI.ai.query(q, historyPayload, currentScreen),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Chef Jay is taking too long to respond. Please try again.')), timeoutMs))
      ]);

      isThinking = false;
      messages = [
        ...messages,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.answer,
          actions: res.actions || [],
          isError: !res.success,
          isStreaming: true,
          document: res.generatedDocument || null
        }
      ];
    } catch (e: any) {
      isThinking = false;
      messages = [
        ...messages,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `Connection error: ${e?.message || 'Unable to reach Chef Jay AI. Check your internet connection.'}`,
          isError: true,
          isStreaming: false
        }
      ];
    } finally {
      await scrollToBottom();
    }
  }

  function clearChat() {
    messages = [messages[0]]; // keep the welcome message
  }

  onMount(scrollToBottom);
</script>

<style>
  @keyframes msgSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .msg-in { animation: msgSlideIn 0.22s ease-out forwards; }
</style>

<div class="p-6 flex flex-col h-[calc(100vh-4rem)] gap-4 animate-fade-in">
  <!-- Header -->
  <div class="flex items-center justify-between border-b border-slate-800 pb-4 flex-shrink-0">
    <div class="flex items-center gap-3">
      <!-- AI Avatar -->
      <div class="relative w-10 h-10 flex-shrink-0">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-500 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-rose-500/30">
          AI
        </div>
        <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse"></span>
      </div>

      <div>
        <h3 class="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <span>Chef Jay AI Assistant</span>
          <Badge variant="amber" className="text-[9px] py-0 px-1.5">Live DB Access</Badge>
        </h3>
        <p class="text-xs text-slate-400">Real-time access to your catering database</p>
      </div>
    </div>

    <div class="flex gap-2">
      <Button variant="outline" size="sm" on:click={() => pushInlineForm('customer')}>
        Add Customer
      </Button>
      <button
        class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-900 text-slate-400 hover:text-[var(--text-primary)] hover:border-slate-500 transition-all cursor-pointer"
        on:click={clearChat}
        title="Clear chat history"
      >
        Clear
      </button>
      <Button variant="outline" size="sm" on:click={() => sendQuery('Give me a complete business briefing — revenue, upcoming events, unpaid invoices, and key financial metrics.')}>
        Daily Briefing
      </Button>
    </div>
  </div>

  <!-- Chat + Quick Prompts -->
  <Card className="flex-1 flex flex-col overflow-hidden p-0 gap-0">
    <!-- Message Stream -->
    <div bind:this={chatContainer} class="flex-1 overflow-y-auto space-y-4 p-5 text-xs">
      {#each messages as msg (msg.id)}
        <div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'} msg-in">
          <div class="max-w-[85%] {msg.sender === 'user'
            ? 'bg-gradient-to-br from-rose-600 to-pink-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-rose-900/40'
            : msg.isError
              ? 'bg-red-950/50 border border-red-500/30 text-red-300 rounded-2xl rounded-bl-sm'
              : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-2xl rounded-bl-sm'
          } px-4 py-3 space-y-1"
          >
            {#if msg.sender === 'ai'}
              {#if msg.formType}
                <!-- Inline Form (rendered directly in the chatbox) -->
                <div class="flex items-center gap-1.5 mb-2">
                  <div class="w-5 h-5 rounded-lg bg-gradient-to-br from-rose-600 to-pink-500 text-white text-[9px] font-black flex items-center justify-center">
                    AI
                  </div>
                  <span class="text-[10px] font-bold text-rose-400">Chef Jay</span>
                </div>

                {#if msg.formType === 'customer'}
                  <form on:submit|preventDefault={() => submitInlineForm(msg)} class="space-y-3 text-xs w-72 max-w-full">
                    <p class="font-extrabold text-slate-100 text-xs">Add New Customer</p>
                    <div>
                      <label class="block text-slate-300 font-bold mb-1">Customer Full Name *</label>
                      <Input bind:value={msg.formData.name} placeholder="e.g. Maria Clara" required />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Contact Number *</label>
                        <Input bind:value={msg.formData.contact_number} placeholder="09171234567" required />
                      </div>
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Loyalty Tier</label>
                        <select bind:value={msg.formData.loyalty_tier} class="w-full h-11 bg-slate-950 border border-slate-700 rounded-xl px-3 text-slate-200 font-semibold text-xs focus:outline-none focus:border-rose-500">
                          <option value="New">New</option>
                          <option value="Regular">Regular</option>
                          <option value="VIP">VIP</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label class="block text-slate-300 font-bold mb-1">Email Address</label>
                      <Input bind:value={msg.formData.email} placeholder="client@example.com" />
                    </div>
                    <div>
                      <label class="block text-slate-300 font-bold mb-1">Address / Location</label>
                      <Input bind:value={msg.formData.address} placeholder="e.g. Lahug, Cebu City" />
                    </div>
                    <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <Button variant="ghost" size="sm" type="button" on:click={() => cancelInlineForm(msg)}>Cancel</Button>
                      <Button type="submit" size="sm">Save & Submit to Chef Jay</Button>
                    </div>
                  </form>
                {:else if msg.formType === 'booking'}
                  <form on:submit|preventDefault={() => submitInlineForm(msg)} class="space-y-3 text-xs w-80 max-w-full">
                    <p class="font-extrabold text-slate-100 text-xs">Add New Booking</p>
                    <div>
                      <label class="block text-slate-300 font-bold mb-1">Customer Name *</label>
                      <Input bind:value={msg.formData.customer_name} placeholder="e.g. Juan Dela Cruz" required />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Occasion / Event</label>
                        <select bind:value={msg.formData.occasion} class="w-full h-11 bg-slate-950 border border-slate-700 rounded-xl px-3 text-slate-200 font-semibold text-xs focus:outline-none focus:border-rose-500">
                          <option value="Wedding Reception">Wedding Reception</option>
                          <option value="Birthday Party">Birthday Party</option>
                          <option value="Corporate Event">Corporate Event</option>
                          <option value="Fiesta Celebration">Fiesta Celebration</option>
                          <option value="Anniversary">Anniversary</option>
                          <option value="Debut">Debut</option>
                          <option value="Private Dinner">Private Dinner</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Event Date *</label>
                        <Input type="date" bind:value={msg.formData.event_date} required />
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Event Time</label>
                        <Input type="time" bind:value={msg.formData.event_time} />
                      </div>
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Guest Count (Pax) *</label>
                        <Input type="number" bind:value={msg.formData.pax} min="1" required />
                      </div>
                    </div>
                    <div>
                      <label class="block text-slate-300 font-bold mb-1">Venue Address *</label>
                      <Input bind:value={msg.formData.venue} placeholder="e.g. Marco Polo Plaza Hotel, Cebu" required />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Total Amount (₱) *</label>
                        <Input type="number" bind:value={msg.formData.total_amount} min="0" required />
                      </div>
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Downpayment (₱)</label>
                        <Input type="number" bind:value={msg.formData.amount_paid} min="0" />
                      </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <Button variant="ghost" size="sm" type="button" on:click={() => cancelInlineForm(msg)}>Cancel</Button>
                      <Button type="submit" size="sm">Create Booking</Button>
                    </div>
                  </form>
                {:else if msg.formType === 'expense'}
                  <form on:submit|preventDefault={() => submitInlineForm(msg)} class="space-y-3 text-xs w-72 max-w-full">
                    <p class="font-extrabold text-slate-100 text-xs">Record Business Expense</p>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Expense Category *</label>
                        <select bind:value={msg.formData.category} class="w-full h-11 bg-slate-950 border border-slate-700 rounded-xl px-3 text-slate-200 font-semibold text-xs focus:outline-none focus:border-rose-500">
                          <option value="Ingredients">Ingredients & Food Supply</option>
                          <option value="Labor/Wages">Staff & Chef Labor</option>
                          <option value="Transportation">Fuel & Delivery</option>
                          <option value="Utilities">Electricity & Water</option>
                          <option value="Equipment">Kitchen Equipment</option>
                          <option value="Marketing">Advertising & Marketing</option>
                          <option value="Miscellaneous">Miscellaneous</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Amount (₱) *</label>
                        <Input type="number" bind:value={msg.formData.amount} min="1" required />
                      </div>
                    </div>
                    <div>
                      <label class="block text-slate-300 font-bold mb-1">Description *</label>
                      <Input bind:value={msg.formData.description} placeholder="e.g. Pork belly, chicken, and spices from Carbon market" required />
                    </div>
                    <div>
                      <label class="block text-slate-300 font-bold mb-1">Expense Date</label>
                      <Input type="date" bind:value={msg.formData.expense_date} />
                    </div>
                    <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <Button variant="ghost" size="sm" type="button" on:click={() => cancelInlineForm(msg)}>Cancel</Button>
                      <Button type="submit" size="sm">Record Expense</Button>
                    </div>
                  </form>
                {:else if msg.formType === 'package'}
                  <form on:submit|preventDefault={() => submitInlineForm(msg)} class="space-y-3 text-xs w-72 max-w-full">
                    <p class="font-extrabold text-slate-100 text-xs">Create Menu Package</p>
                    <div>
                      <label class="block text-slate-300 font-bold mb-1">Package Name *</label>
                      <Input bind:value={msg.formData.name} placeholder="e.g. Premium Seafood & Lechon Buffet" required />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Price Per Pax (₱) *</label>
                        <Input type="number" bind:value={msg.formData.price_per_pax} min="1" required />
                      </div>
                      <div>
                        <label class="block text-slate-300 font-bold mb-1">Minimum Guests *</label>
                        <Input type="number" bind:value={msg.formData.min_pax} min="1" required />
                      </div>
                    </div>
                    <div>
                      <label class="block text-slate-300 font-bold mb-1">Description & Included Items</label>
                      <Input bind:value={msg.formData.description} placeholder="e.g. Includes Roast Lechon, Steamed Lapu-Lapu, Rice, Dessert, Iced Tea" />
                    </div>
                    <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <Button variant="ghost" size="sm" type="button" on:click={() => cancelInlineForm(msg)}>Cancel</Button>
                      <Button type="submit" size="sm">Create Package</Button>
                    </div>
                  </form>
                {/if}
              {:else if msg.isStreaming}
                <StreamingMessage
                  text={msg.text}
                  actions={msg.actions || []}
                  isError={msg.isError || false}
                  on:chunk={scrollToBottom}
                  on:complete={() => (msg.isStreaming = false)}
                />
              {:else}
                <!-- Static AI Message Display -->
                <div class="flex items-center gap-1.5 mb-2">
                  <div class="w-5 h-5 rounded-lg bg-gradient-to-br from-rose-600 to-pink-500 text-white text-[9px] font-black flex items-center justify-center">
                    AI
                  </div>
                  <span class="text-[10px] font-bold text-rose-400">Chef Jay</span>
                  {#if msg.isError}
                    <span class="text-[9px] text-red-400 font-bold">• Error</span>
                  {/if}
                  {#if msg.actions && msg.actions.length > 0}
                    <Badge variant="green" className="text-[8px] py-0 px-1">
                      {msg.actions.length} action{msg.actions.length > 1 ? 's' : ''} performed
                    </Badge>
                  {/if}
                </div>

                <div class="leading-relaxed space-y-1 text-[11px]">
                  {@html renderMarkdown(msg.text)}
                </div>

                {#if msg.actions && msg.actions.length > 0}
                  <div class="mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 space-y-1.5">
                    <p class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Database Actions Executed</p>
                    {#each msg.actions as action}
                      <div class="flex items-start gap-1.5 text-[10px] text-emerald-300 font-medium">
                        {@html renderMarkdown(action)}
                      </div>
                    {/each}
                  </div>
                {/if}

                {#if msg.document}
                  <DocumentPreviewCard doc={msg.document} />
                {/if}
              {/if}
            {:else}
              <p class="leading-relaxed font-semibold">{msg.text}</p>
            {/if}
          </div>
        </div>
      {/each}

      <!-- Thinking Indicator (Kitchen Ticket Motif) -->
      {#if isThinking}
        <ThinkingIndicator />
      {/if}
    </div>

    <!-- Input Bar -->
    <form
      on:submit|preventDefault={() => sendQuery()}
      class="flex gap-2 px-5 pb-4 pt-2 flex-shrink-0 border-t border-slate-800/40"
    >
      <Input
        id="ai-chat-input"
        bind:value={inputQuery}
        placeholder="Ask Chef Jay about your bookings, revenue, clients, expenses..."
        disabled={isThinking}
        className="flex-1"
      />
      <Button type="submit" disabled={isThinking || !inputQuery.trim()}>
        {#if isThinking}
          Working...
        {:else}
          Ask Chef Jay
        {/if}
      </Button>
    </form>
  </Card>
</div>
