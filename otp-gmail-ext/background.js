// background.js (MV3, module)
if (part.parts && part.parts.length) part.parts.forEach(walk);
};
walk(payload);
return acc;
}


function findOtpCandidates(text) {
const out = new Set();
let m;
while ((m = CODE_REGEX.exec(text)) !== null) {
out.add(m[1]);
}
return [...out];
}


async function fetchLatestOtp() {
const msgs = await listRecentMessages();
if (!msgs.length) return null;


// Fetch details in parallel (up to 10)
const details = await Promise.allSettled(msgs.map(m => getMessage(m.id)));
// Sort by internalDate (newest first)
const ok = details
.filter(d => d.status === 'fulfilled')
.map(d => d.value)
.sort((a, b) => Number(b.internalDate) - Number(a.internalDate));


for (const msg of ok) {
const bodyText = (msg.snippet || '') + '\n' + extractTextFromPayload(msg.payload);
const codes = findOtpCandidates(bodyText);
if (codes.length) {
// Heuristic: Prefer 6-digit if present
const six = codes.find(c => c.length === 6);
const chosen = six || codes[0];
return { code: chosen, messageId: msg.id, date: new Date(Number(msg.internalDate)).toISOString() };
}
}
return null;
}


// --- Messaging ---
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
(async () => {
if (req?.type === 'FETCH_OTP') {
try {
const result = await fetchLatestOtp();
sendResponse({ ok: true, result });
} catch (e) {
sendResponse({ ok: false, error: e.message || String(e) });
}
}
else if (req?.type === 'PASTE_OTP') {
try {
const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
if (!tab?.id) throw new Error('No active tab');
await chrome.tabs.sendMessage(tab.id, { type: 'OTP_CODE', code: req.code });
sendResponse({ ok: true });
} catch (e) {
sendResponse({ ok: false, error: e.message || String(e) });
}
}
})();
return true; // async
});
