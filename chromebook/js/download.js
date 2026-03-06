// Download Logic
const downloadBtn = document.getElementById('downloadBtn');
downloadBtn.addEventListener('click', () => {
    if (window.__SYSTEM_MANIFEST__) {
        const binaryString = atob(window.__SYSTEM_MANIFEST__);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sunset-console-full-system.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        // Fallback to server route if not injected
        window.location.href = '/public/publicdownload.html';
    }
});
