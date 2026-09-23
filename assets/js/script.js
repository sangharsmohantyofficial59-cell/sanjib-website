// Mobile nav toggle
const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');
menuToggle.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  });
});

/*
  CONNECT TO APPS SCRIPT — one manual step:
  1. Deploy apps-script-automation.gs (in /automation) as a Web App
     (Deploy > New deployment > Web app > Execute as "Me" > Anyone can access)
  2. Paste the deployment URL below, replacing the placeholder.
  Field names already match the script's doPost() and the Pipeline sheet columns.
*/
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxSWlqStW-KtX8dAUKYBJ88Hxi1hE9-_m6fHLD24VIVr9miIUNLmgw0FbYmfDoc-Gfa/exec"; // <-- REPLACE with your Apps Script deployment URL

const form = document.getElementById('leadForm');
const statusEl = document.getElementById('formStatus');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameVal = form.name.value.trim();
  const emailVal = form.email.value.trim();
  const msgVal = form.message.value.trim();

  if (!nameVal || !emailVal || !msgVal) {
    statusEl.textContent = "Please fill in name, email, and message before submitting.";
    statusEl.classList.add('err');
    return;
  }
  statusEl.classList.remove('err');

  const data = Object.fromEntries(new FormData(form).entries());
  data.source = "Website";
  data.timestamp = new Date().toISOString();

  if (SCRIPT_URL.startsWith("PASTE_")) {
    statusEl.textContent = "Form isn't connected to the tracking sheet yet — add the Apps Script URL.";
    console.log("Lead captured (not yet connected):", data);
    form.reset();
    return;
  }

  statusEl.textContent = "Sending...";
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify(data)
    });
    statusEl.textContent = "Thanks — we'll be in touch shortly.";
    form.reset();
  } catch (err) {
    statusEl.textContent = "Something went wrong. Please try WhatsApp or email instead.";
  }
});
