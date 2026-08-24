<script lang="ts">
  import type { User } from '../../../../preload/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  export let onLoginSuccess: (user: User) => void;

  let username = 'owner';
  let password = 'password123';
  let errorMessage = '';
  let loading = false;

  async function handleLogin() {
    if (!username || !password) {
      errorMessage = 'Please enter both username and password';
      return;
    }

    loading = true;
    errorMessage = '';

    try {
      if (window.electronAPI && window.electronAPI.auth) {
        const res = await window.electronAPI.auth.login({ username, password });
        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          errorMessage = res.error || 'Authentication failed';
        }
      } else {
        // Browser Mode Fallback (http://localhost:5173 test)
        if (username.trim().toLowerCase() === 'owner' && password === 'password123') {
          const mockUser: User = {
            id: 1,
            username: 'owner',
            full_name: 'Jayraldine (Owner)',
            role: 'OWNER',
          };
          onLoginSuccess(mockUser);
        } else {
          errorMessage = 'Invalid username or password (Default: owner / password123)';
        }
      }
    } catch (e) {
      errorMessage = `Login error: ${e}`;
    } finally {
      loading = false;
    }
  }
</script>

<div class="h-screen w-screen bg-slate-950 flex items-center justify-center p-6 select-none animate-fade-in">
  <Card className="max-w-md w-full p-8 border border-slate-800/80 shadow-2xl space-y-6">
    <!-- Official Jayraldine's Catering Brand Header -->
    <div class="text-center space-y-3">
      <img
        src="assets/logo.png"
        alt="Jayraldine's Catering Official Logo"
        class="w-20 h-20 object-contain mx-auto rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-xl shadow-emerald-500/10"
      />
      <div>
        <h1 class="text-2xl font-extrabold text-slate-100 tracking-tight">Jayraldine's Catering</h1>
        <p class="text-xs text-emerald-400 font-semibold tracking-wider uppercase mt-1">Owner Desktop Access System</p>
      </div>
    </div>

    <!-- Error Alert -->
    {#if errorMessage}
      <div class="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold text-center animate-fade-in flex items-center justify-center gap-2">
        <img src="assets/icons/svg/x-circle.svg" alt="" class="w-4 h-4 filter invert-[50%] sepia-[100%] saturate-[500%] hue-rotate-[320deg]" />
        <span>{errorMessage}</span>
      </div>
    {/if}

    <!-- Login Form -->
    <form on:submit|preventDefault={handleLogin} class="space-y-4 text-xs">
      <div>
        <label for="usr-input" class="block text-slate-300 font-semibold mb-1.5 flex items-center gap-2">
          <img src="assets/icons/svg/user.svg" alt="" class="w-3.5 h-3.5 opacity-60" />
          <span>Owner Username</span>
        </label>
        <Input
          id="usr-input"
          type="text"
          bind:value={username}
          placeholder="Enter username (owner)"
        />
      </div>

      <div>
        <label for="pwd-input" class="block text-slate-300 font-semibold mb-1.5 flex items-center gap-2">
          <img src="assets/icons/svg/settings.svg" alt="" class="w-3.5 h-3.5 opacity-60" />
          <span>Password</span>
        </label>
        <Input
          id="pwd-input"
          type="password"
          bind:value={password}
          placeholder="Enter password"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className="w-full justify-center text-xs font-bold mt-2"
      >
        <img src="assets/icons/svg/check.svg" alt="" class="w-4 h-4 filter invert brightness-200" />
        <span>{loading ? 'Authenticating Owner...' : 'Sign In as Owner'}</span>
      </Button>
    </form>

    <div class="text-center pt-2 border-t border-slate-800/80">
      <p class="text-xs text-slate-400">Default Credentials: <code class="text-emerald-400 bg-slate-900 px-2 py-0.5 rounded font-mono font-bold">owner</code> / <code class="text-emerald-400 bg-slate-900 px-2 py-0.5 rounded font-mono font-bold">password123</code></p>
    </div>
  </Card>
</div>
