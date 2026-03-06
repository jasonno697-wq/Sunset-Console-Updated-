// Manifest Viewer Logic
const viewManifestBtn = document.getElementById('viewManifestBtn');
const manifestSection = document.getElementById('manifestSection');
const manifestContent = document.getElementById('manifestContent');

viewManifestBtn.addEventListener('click', () => {
    manifestSection.classList.toggle('hidden');
    if (!manifestSection.classList.contains('hidden') && window.__SYSTEM_MANIFEST__) {
        const html = atob(window.__SYSTEM_MANIFEST__);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const codeBlocks = doc.querySelectorAll('section.glass > div.space-y-4');
        
        manifestContent.innerHTML = '';
        codeBlocks.forEach(block => {
            const clone = block.cloneNode(true);
            // Style the cloned block for index24
            const h3 = clone.querySelector('h3');
            if (h3) h3.className = "text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2";
            const pre = clone.querySelector('pre');
            if (pre) pre.className = "bg-black/60 p-4 rounded-xl border border-white/5 overflow-x-auto text-[10px] text-white/40";
            manifestContent.appendChild(clone);
        });
    }
});
