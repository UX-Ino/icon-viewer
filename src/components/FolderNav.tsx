import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChangeEvent, useEffect, useRef } from "react";
import { IconData } from "@/data/iconData";

interface FolderNavProps {
  folders: string[];
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
  onScanComplete: (newIconData: IconData) => void;
}

export function FolderNav({ folders, selectedFolder, onSelectFolder, onScanComplete }: FolderNavProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    try {
      input.setAttribute('webkitdirectory', '');
      input.setAttribute('directory', '');
      input.setAttribute('mozdirectory', '');
      (input as unknown as { webkitdirectory?: boolean }).webkitdirectory = true;
      (input as unknown as { directory?: boolean }).directory = true;
      (input as unknown as { mozdirectory?: boolean }).mozdirectory = true;
    } catch {}
  }, []);

  const handleFolderSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newIconData: IconData = {};
    const imageExtensions = [".png", ".svg", ".ico", ".jpg", ".jpeg"];

    for (const file of Array.from(files)) {
      const relativePath = file.webkitRelativePath;
      const extension = relativePath.substring(relativePath.lastIndexOf('.')).toLowerCase();

      if (imageExtensions.includes(extension)) {
        const parts = relativePath.split('/');
        const folder = parts.slice(0, -1).join('/');
        const name = parts[parts.length - 1];
        const url = URL.createObjectURL(file);

        if (!newIconData[folder]) {
          newIconData[folder] = [];
        }
        newIconData[folder].push({ name, path: url });
      }
    }
    onScanComplete(newIconData);
  };

  const handleDownloadHTML = async () => {
    // blob -> dataURL 변환기
    const blobToDataURL = (blob: Blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // 0) 파일명 규칙: 폴더명_아이콘뷰.html
    const selectedFromGlobal = window.__SELECTED_FOLDER__;
    const baseName = selectedFromGlobal == null || selectedFromGlobal === '' ? '모든아이콘' : selectedFromGlobal;
    const safeName = String(baseName).replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_');

    // 1) 동일 오리진 CSS를 수집해 인라인화
    const linkEls = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    const cssTexts: string[] = [];
    await Promise.all(linkEls.map(async (link) => {
      try {
        const abs = new URL(link.href, location.href);
        if (abs.origin !== location.origin) return;
        const res = await fetch(abs.toString());
        const css = await res.text();
        cssTexts.push(`/* inlined: ${abs.pathname} */\n` + css);
      } catch {}
    }));

    // 2) 가능하면 React 의존 없이 동작하는 독립 HTML 생성
    const globalData = window.__ICON_DATA__ as IconData | undefined;
    if (globalData && Object.keys(globalData).length > 0) {
      // 데이터 URL로 사전 변환
      const dataUrlMap: Record<string, { name: string; path: string }[]> = {};
      for (const [folder, items] of Object.entries(globalData)) {
        dataUrlMap[folder] = [];
        for (const item of items) {
          try {
            const res = await fetch(item.path);
            const b = await res.blob();
            const dataUrl = await blobToDataURL(b);
            dataUrlMap[folder].push({ name: item.name, path: dataUrl });
          } catch {}
        }
      }

      const folders = Object.keys(dataUrlMap);
      const foldersJson = JSON.stringify(folders);
      const perFolderScripts: string[] = [];
      for (const folder of folders) {
        const safeId = encodeURIComponent(folder);
        const json = JSON.stringify(dataUrlMap[folder]);
        perFolderScripts.push(`<script type="application/json" id="DATA-${safeId}">${json}</script>`);
      }

      const styleBlock = cssTexts.length ? `<style data-inlined-styles>\n${cssTexts.join('\n\n')}\n</style>` : '';

      const parts: string[] = [];
      parts.push('<!doctype html>');
      parts.push('<html>');
      parts.push('<head>');
      parts.push('<meta charset="utf-8" />');
      parts.push('<meta name="viewport" content="width=device-width, initial-scale=1" />');
      parts.push('<title>Icon Viewer Export</title>');
      parts.push(styleBlock);
      parts.push('</head>');
      parts.push('<body>');
      parts.push('<div class="size-full flex">');
      parts.push('<div class="w-64 border-r border-border bg-card h-screen flex flex-col">');
      parts.push('<div class="p-4 border-b border-border flex justify-between items-center"><h2>Icon Viewer</h2></div>');
      parts.push('<nav class="flex-1 p-2 overflow-auto" id="lnb"></nav>');
      parts.push('</div>');
      parts.push('<div class="flex-1 overflow-auto">');
      parts.push('<div class="p-6">');
      parts.push('<div class="mb-4"><h1 id="title">모든 아이콘</h1><p class="text-muted-foreground"><span id="count">0</span>개의 아이콘</p></div>');
      parts.push('<div class="grid grid-cols-8 gap-4" id="grid"></div>');
      parts.push('</div></div></div>');
      for (const script of perFolderScripts) {
        parts.push(script);
      }
      parts.push('<script>');
      parts.push(`const FOLDERS = ${foldersJson};`);
      parts.push('let selected = null;');
      parts.push("function readFolder(name){ const el=document.getElementById('DATA-'+encodeURIComponent(name)); if(!el) return []; try { return JSON.parse(el.textContent||'[]'); } catch { return []; } }");
      parts.push('function currentIcons(){ if(selected===null){ const all=[]; for(const f of FOLDERS){ all.push(...readFolder(f)); } return all; } return readFolder(selected); }');
      parts.push("function renderNav(){ const lnb=document.getElementById('lnb'); lnb.innerHTML=''; const allBtn=document.createElement('button'); allBtn.textContent='📁 모든 아이콘'; allBtn.className='w-full text-left px-3 py-2 rounded-md transition-colors '+(selected===null?'bg-accent text-accent-foreground':'hover:bg-accent/50'); allBtn.onclick=()=>{selected=null; render();}; const liAll=document.createElement('div'); liAll.appendChild(allBtn); lnb.appendChild(liAll); FOLDERS.forEach(folder=>{ const btn=document.createElement('button'); btn.textContent='📂 '+folder; btn.className='w-full text-left px-3 py-2 rounded-md transition-colors text-sm '+(selected===folder?'bg-accent text-accent-foreground':'hover:bg-accent/50'); btn.onclick=()=>{selected=folder; render();}; const li=document.createElement('div'); li.appendChild(btn); lnb.appendChild(li); }); }");
      parts.push("function renderGrid(){ const grid=document.getElementById('grid'); grid.innerHTML=''; const icons=currentIcons(); for(const icon of icons){ const card=document.createElement('div'); card.className='flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group'; const img=document.createElement('img'); img.src=icon.path; img.alt=icon.name; img.className='w-12 h-12 object-contain mb-2'; const p=document.createElement('p'); p.className='text-xs text-center break-all line-clamp-2 group-hover:text-accent-foreground'; p.textContent=icon.name; card.appendChild(img); card.appendChild(p); grid.appendChild(card);} document.getElementById('count').textContent=String(icons.length); document.getElementById('title').textContent=selected||'모든 아이콘'; }");
      parts.push('function render(){ renderNav(); renderGrid(); } render();');
      parts.push('</script>');
      parts.push('</body></html>');

      const blob = new Blob(parts, { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_아이콘뷰.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    // 3) 폴백: 현재 DOM을 클론하여 이미지/스타일만 인라인 (기존 방식)
    const cloned = document.documentElement.cloneNode(true) as HTMLElement;
    const origImgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
    const clonedImgs = Array.from(cloned.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(origImgs.map(async (img, i) => {
      const target = clonedImgs[i];
      if (!target) return;
      const src = img.getAttribute('src') || '';
      if (src.startsWith('blob:')) {
        try { const res = await fetch(src); const b = await res.blob(); const dataUrl = await blobToDataURL(b); target.setAttribute('src', dataUrl); } catch {}
      }
    }));

    if (cssTexts.length > 0) {
      const style = document.createElement('style');
      style.setAttribute('data-inlined-styles', 'true');
      style.textContent = cssTexts.join('\n\n');
      const clonedHead = cloned.querySelector('head');
      if (clonedHead) clonedHead.appendChild(style);
      Array.from(cloned.querySelectorAll('link[rel="stylesheet"]')).forEach((el) => el.remove());
    }

    // 불필요한 업로드/다운로드 UI 제거
    try {
      // 업로드 input과 레이블 제거
      const up = cloned.querySelector('#folder-upload');
      if (up && up.parentElement) {
        // 연결된 label 제거
        const label = cloned.querySelector('label[for="folder-upload"]');
        if (label && label.parentElement) label.parentElement.removeChild(label);
        up.parentElement.removeChild(up);
      }
      // Download/Upload 텍스트 버튼 제거
      cloned.querySelectorAll('button').forEach(btn => {
        const t = (btn.textContent || '').trim().toLowerCase();
        if (t === 'download' || t === 'upload') {
          btn.remove();
        }
      });
    } catch {}

    const html = '<!doctype html>' + cloned.outerHTML;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}_아이콘뷰.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="w-64 border-r border-border bg-card h-screen flex flex-col">
      <div className="p-4 border-b border-border flex justify-between gap-2 flex-col">
        <h2>Icon Viewer</h2>
        <div className="flex items-center gap-2">
          <Button asChild>
            <label htmlFor="folder-upload">Upload</label>
          </Button>
          <Button variant="outline" onClick={handleDownloadHTML}>Download</Button>
        </div>
        <input
          type="file"
          id="folder-upload"
          ref={fileInputRef}
          webkitdirectory={true}
          directory={true}
          mozdirectory={true}
          multiple
          onChange={handleFolderSelect}
          className="hidden"
        />
      </div>
      
      <ScrollArea className="flex-1">
        <nav className="p-2">
          <ul className="space-y-1">
            {/* R-6: "모든 아이콘" default menu at top */}
            <li>
              <button
                onClick={() => onSelectFolder(null)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedFolder === null
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                📁 모든 아이콘
              </button>
            </li>
            
            {/* R-5: Generate LNB menu from folder keys */}
            {folders.map((folder) => (
              <li key={folder}>
                <button
                  onClick={() => onSelectFolder(folder)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                    selectedFolder === folder
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  📂 {folder}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </ScrollArea>
    </div>
  );
}
