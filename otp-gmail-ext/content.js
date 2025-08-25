// content.js — receives code and attempts to paste in obvious OTP fields


function findOtpInputs() {
const doc = document;
// 1) Multi-box inputs (6 boxes of 1 char)
const oneCharInputs = Array.from(doc.querySelectorAll('input'))
.filter(i => (i.maxLength === 1 || i.getAttribute('maxlength') === '1') && /\d/.test(i.getAttribute('inputmode') || '') || i.type === 'tel');


if (oneCharInputs.length >= 4) {
// group inputs that are visible & close to each other
const visible = oneCharInputs.filter(i => i.offsetParent !== null);
// naive: take first 6 visible
if (visible.length >= 4) return visible.slice(0, 8);
}


// 2) Single input likely for codes
const candidates = [
'input[autocomplete="one-time-code"]',
'input[name*="otp" i]',
'input[id*="otp" i]',
'input[name*="code" i]',
'input[id*="code" i]',
'input[name*="verify" i]',
'input[id*="verify" i]'
];
const single = doc.querySelector(candidates.join(','));
if (single) return [single];


// 3) Fallback: first visible numeric-ish input
const fallback = Array.from(doc.querySelectorAll('input'))
.find(i => i.offsetParent !== null && (/tel|text|number/).test(i.type) && (i.autocomplete === 'one-time-code' || (i.inputMode === 'numeric')));
return fallback ? [fallback] : [];
}


function fillOtp(code) {
const inputs = findOtpInputs();
if (!inputs.length) return false;


if (inputs.length > 1) {
// Fill per character
const chars = code.split('');
inputs.forEach((inp, idx) => {
const val = chars[idx] || '';
inp.focus();
inp.value = val;
inp.dispatchEvent(new Event('input', { bubbles: true }));
inp.dispatchEvent(new Event('change', { bubbles: true }));
});
inputs[inputs.length - 1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
return true;
} else {
const inp = inputs[0];
inp.focus();
inp.value = code;
inp.dispatchEvent(new Event('input', { bubbles: true }));
inp.dispatchEvent(new Event('change', { bubbles: true }));
inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
return true;
}
}


chrome.runtime.onMessage.addListener((req) => {
if (req?.type === 'OTP_CODE' && req.code) {
fillOtp(req.code);
}
});
