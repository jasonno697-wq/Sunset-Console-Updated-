// Chromebook Detection
if (/\bCrOS\b/.test(navigator.userAgent)) {
    const indicator = document.getElementById('chromebookIndicator');
    if (indicator) indicator.classList.remove('hidden');
}
