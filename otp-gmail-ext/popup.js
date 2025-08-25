// popup.js


const fetchBtn = document.getElementById('fetchBtn');
const pasteBtn = document.getElementById('pasteBtn');
const result = document.getElementById('result');
const codeBox = document.getElementById('codeBox');
const meta = document.getElementById('meta');


let lastCode = null;


function setStatus(text, ok = true) {
result.textContent = text;
result.className = ok ? 'ok' : 'err';
}


fetchBtn.addEventListener('click', async () => {
setStatus('Requesting Gmail access and searching…');
codeBox.textContent = '';
pasteBtn.disabled = true;
lastCode = null;


const res = await chrome.runtime.sendMessage({ type: 'FETCH_OTP' });
if (!res?.ok) {
setStatus(res?.error || 'Something went wrong', false);
return;
}
const { result: data } = res;
if (data?.code) {
lastCode = data.code;
codeBox.textContent = data.code;
pasteBtn.disabled = false;
setStatus('Code found ✓');
meta.textContent = data.date ? `From latest message at ${new Date(data.date).toLocaleString()}` : '';
} else {
setStatus('No recent codes found');
}
});


pasteBtn.addEventListener('click', async () => {
if (!lastCode) return;
const res = await chrome.runtime.sendMessage({ type: 'PASTE_OTP', code: lastCode });
if (res?.ok) {
setStatus('Pasted (if a field was detected) ✓');
} else {
setStatus(res?.error || 'Could not paste', false);
}
});
