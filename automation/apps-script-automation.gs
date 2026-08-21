/**
 * LEAD AUTOMATION SCRIPT — Google Apps Script
 * Bind this to the "Sanjib Mohanty.com - CRM" worksheet tab (Extensions > Apps Script).
 * 100% free — runs on standard Gmail/Sheets quotas.
 *
 * WHAT THIS DOES
 * 1. doPost()      — receives form submissions from the website, appends a row to the CRM sheet
 * 2. notifyTeam()  — instantly emails the team when a new lead comes in
 * 3. sendAck()     — instantly emails the lead an acknowledgment
 * 4. weeklyDigest()— sends a Monday-morning summary of open opportunities (set as a time trigger)
 *
 * SETUP
 * 1. Open your Google Sheet > Extensions > Apps Script
 * 2. Paste this file in, replacing the default Code.gs content
 * 3. Update the CONFIG block below with real values
 * 4. Deploy > New deployment > Web app > Execute as "Me" > Who has access: "Anyone"
 * 5. Copy the deployment URL into assets/js/script.js's SCRIPT_URL variable
 * 6. For the weekly digest: click the clock icon (Triggers) > Add Trigger >
 *    function: weeklyDigest > Event source: Time-driven > Week timer > Monday, 9-10am
 */

// ====== CONFIG — edit these ======
const CONFIG = {
  SHEET_NAME: "Sanjib Mohanty.com - CRM",
  TEAM_EMAILS: ["team@example.com"],   // comma-separated list of who gets instant alerts
  BRAND_NAME: "Sanjib Kumar Mohanty",
  ACK_SUBJECT: "Thanks for reaching out!",
  ACK_SENDER_NAME: "Team Sanjib Mohanty",
};
// ===================================

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error(`Worksheet tab not found: ${CONFIG.SHEET_NAME}`);
    const data = JSON.parse(e.postData.contents);

    const row = [
      data.timestamp || new Date().toISOString(),
      data.name || "",
      data.email || "",
      data.phone || "",
      data.type || "",
      data.message || "",
      data.source || "Website",
      "Lead",               // Stage — always starts as "Lead"
      "",                   // Owner — assign manually
      "Review and respond", // Next Action default
      new Date().toISOString(),
    ];
    sheet.appendRow(row);

    notifyTeam(data);
    if (data.email) sendAck(data);

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function notifyTeam(data) {
  const subject = `New Inquiry: ${data.name || "Unknown"} (${data.type || "General"})`;
  const body =
    `New lead just came in.\n\n` +
    `Name: ${data.name}\n` +
    `Email: ${data.email}\n` +
    `Phone: ${data.phone || "-"}\n` +
    `Type: ${data.type}\n` +
    `Message: ${data.message}\n` +
    `Source: ${data.source}\n\n` +
    `Open the CRM sheet to update its stage.`;

  CONFIG.TEAM_EMAILS.forEach(addr => {
    MailApp.sendEmail(addr, subject, body);
  });
}

function sendAck(data) {
  const body =
    `Hi ${data.name || "there"},\n\n` +
    `Thanks for reaching out to ${CONFIG.BRAND_NAME}! We've received your inquiry and ` +
    `the team will get back to you shortly.\n\n` +
    `Here's what you sent us:\n"${data.message}"\n\n` +
    `Talk soon,\n${CONFIG.ACK_SENDER_NAME}`;

  MailApp.sendEmail(data.email, CONFIG.ACK_SUBJECT, body);
}

/**
 * Weekly digest — set this as a time-driven trigger (see Setup step 6).
 * Summarizes anything still open (Lead / Qualified / Opportunity) so nothing falls through.
 */
function weeklyDigest() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error(`Worksheet tab not found: ${CONFIG.SHEET_NAME}`);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const stageCol = headers.indexOf("Stage");
  const nameCol = headers.indexOf("Name");
  const typeCol = headers.indexOf("Inquiry Type");
  const nextActionCol = headers.indexOf("Next Action");

  const openStages = ["Lead", "Qualified", "Opportunity"];
  const openRows = values.slice(1).filter(r => openStages.includes(r[stageCol]));

  if (openRows.length === 0) {
    return; // nothing open, skip sending an empty digest
  }

  let body = `Open pipeline as of ${new Date().toDateString()}:\n\n`;
  openRows.forEach(r => {
    body += `- ${r[nameCol]} | ${r[typeCol]} | Stage: ${r[stageCol]} | Next: ${r[nextActionCol]}\n`;
  });
  body += `\nTotal open items: ${openRows.length}`;

  CONFIG.TEAM_EMAILS.forEach(addr => {
    MailApp.sendEmail(addr, `Weekly Pipeline Digest — ${openRows.length} open`, body);
  });
}
