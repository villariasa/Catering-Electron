<script lang="ts">
  import * as XLSX from 'xlsx';
  import { toast } from '$lib/stores/toast';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { GeneratedDocument } from '../../../preload/types';

  export let doc: GeneratedDocument;

  let downloading = false;
  const PREVIEW_ROW_LIMIT = 8;
  $: previewRows = doc.rows.slice(0, PREVIEW_ROW_LIMIT);
  $: hiddenCount = Math.max(0, doc.totalRows - previewRows.length);

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toCsv(): string {
    const lines = [doc.columns.map((c) => `"${c}"`).join(',')];
    for (const row of doc.rows) {
      lines.push(row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','));
    }
    return lines.join('\n');
  }

  async function handleDownload() {
    downloading = true;
    try {
      if (doc.format === 'pdf') {
        if (!doc.pdfBase64) throw new Error('PDF data missing.');
        const result = await window.electronAPI.documents.savePdf({ filename: doc.filename, pdfBase64: doc.pdfBase64 });
        if (result.success) toast.success(`Saved to ${result.path}`);
      } else if (doc.format === 'csv') {
        downloadBlob(new Blob([toCsv()], { type: 'text/csv;charset=utf-8;' }), doc.filename);
        toast.success(`Downloaded ${doc.filename}`);
      } else {
        const ws = XLSX.utils.aoa_to_sheet([doc.columns, ...doc.rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, doc.title.slice(0, 31));
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        downloadBlob(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), doc.filename);
        toast.success(`Downloaded ${doc.filename}`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to download document.');
    } finally {
      downloading = false;
    }
  }
</script>

<div class="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
  <div class="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/60">
    <div class="flex items-center gap-2 min-w-0">
      <span class="font-bold text-slate-100 text-[11px] truncate">{doc.title}</span>
      <Badge variant="secondary" className="text-[9px] py-0 px-1.5">{doc.format.toUpperCase()}</Badge>
      <span class="text-[10px] text-slate-500 flex-shrink-0">{doc.totalRows} row{doc.totalRows === 1 ? '' : 's'}</span>
    </div>
    <Button size="sm" disabled={downloading} on:click={handleDownload}>
      {downloading ? 'Saving...' : `Download ${doc.format.toUpperCase()}`}
    </Button>
  </div>

  {#if doc.format === 'pdf' && doc.pdfBase64}
    <iframe
      title={doc.title}
      src={`data:application/pdf;base64,${doc.pdfBase64}`}
      class="w-full h-72 border-0"
    ></iframe>
  {:else}
    <div class="overflow-x-auto max-h-56 overflow-y-auto">
      <table class="w-full text-left text-[10px]">
        <thead class="sticky top-0 bg-slate-900">
          <tr class="text-slate-400 uppercase font-semibold tracking-wide">
            {#each doc.columns as col}
              <th class="px-2.5 py-1.5 whitespace-nowrap">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          {#each previewRows as row, i}
            <tr class={i % 2 === 0 ? 'bg-slate-950/40' : ''}>
              {#each row as cell}
                <td class="px-2.5 py-1.5 text-slate-300 whitespace-nowrap">{cell}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
      {#if hiddenCount > 0}
        <p class="text-center text-[10px] text-slate-500 py-1.5 border-t border-slate-800/60">+{hiddenCount} more row{hiddenCount === 1 ? '' : 's'} in the full download</p>
      {/if}
    </div>
  {/if}
</div>
