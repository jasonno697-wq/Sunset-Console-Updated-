// Matrix Background
const matrix = document.getElementById('matrix');
const chars = '0123456789ABCDEF';
const rows = 50;
const cols = 100;

for(let i = 0; i < rows; i++) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    for(let j = 0; j < cols; j++) {
        const span = document.createElement('span');
        span.innerText = chars[Math.floor(Math.random() * chars.length)];
        span.style.fontSize = '10px';
        span.style.margin = '2px';
        row.appendChild(span);
    }
    matrix.appendChild(row);
}

setInterval(() => {
    const spans = matrix.getElementsByTagName('span');
    const randomIdx = Math.floor(Math.random() * spans.length);
    if (spans[randomIdx]) {
        spans[randomIdx].innerText = chars[Math.floor(Math.random() * chars.length)];
        spans[randomIdx].style.color = '#f97316';
        setTimeout(() => {
            spans[randomIdx].style.color = '';
        }, 500);
    }
}, 50);
