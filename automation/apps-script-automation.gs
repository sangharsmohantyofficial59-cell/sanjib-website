/**
 * LEAD AUTOMATION SCRIPT — Google Apps Script
 * Handles leads for both "Sanjib Mohanty.com" and "Gyanavexim"
 *
 * WHAT THIS DOES
 * 1. doPost()       — receives form submissions, writes row to sheet
 * 2. notifyTeam()   — instantly emails the team when a new lead arrives  ← THIS was missing before
 * 3. sendAck()      — sends a thank-you email to the person who submitted
 * 4. weeklyDigest() — Monday morning summary of open leads (set as a time trigger)
 *
 * SETUP
 * 1. Open your Google Sheet > Extensions > Apps Script
 * 2. Paste this file in, replacing the existing code
 * 3. Deploy > New deployment > Web app > Execute as "Me" > Who has access: "Anyone"
 * 4. Copy the deployment URL into assets/js/script.js → SCRIPT_URL
 * 5. For weekly digest: Triggers > Add Trigger > weeklyDigest > Time-driven > Week timer > Monday 9–10am
 */

// ====== CONFIG — edit these ======
const CONFIG = {
  DEFAULT_SHEET: "Sanjib Mohanty.com - CRM",
  TEAM_EMAILS: ["sanjib.maximum@gmail.com"],  // gets instant lead alert emails

  // Sanjib Mohanty website
  BRAND_NAME: "Sanjib Kumar Mohanty",
  ACK_SUBJECT: "Thanks for reaching out!",
  ACK_SENDER_NAME: "Team Sanjib Mohanty",

  // Gyanavexim website
  GYANAV_BRAND_NAME: "Gyanavexim Team",
  GYANAV_ACK_SUBJECT: "Thank you for contacting Gyanavexim!"
};
// ===================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const isGyanav = (data.website === "Gyanavexim");

    // Pick the correct sheet tab
    const targetSheetName = isGyanav ? "Gyanavexim" : "Sanjib Mohanty.com - CRM";
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(targetSheetName);
    if (!sheet) throw new Error("Sheet not found: " + targetSheetName);

    let row;
    if (isGyanav) {
      // Gyanavexim tab: Timestamp, Name, Mobile, Email, Subject, Message
      row = [
        data.submittedAt || new Date().toISOString(),
        data.name    || "",
        data.mobile  || "",
        data.email   || "",
        data.subject || "",
        data.message || ""
      ];
    } else {
      // CRM tab: 11 columns
      row = [
        data.submittedAt || new Date().toISOString(),
        data.name    || "",
        data.email   || "",
        data.phone   || data.mobile || "",
        data.type    || data.subject || "",
        data.message || "",
        data.website || data.source || "Website",
        "Lead",
        "",
        "Review and respond",
        new Date().toISOString()
      ];
    }

    sheet.appendRow(row);

    // 1. Notify the team (YOU get an email for every new lead)
    notifyTeam(data, isGyanav);

    // 2. Send thank-you ack to the person who submitted
    if (data.email) sendAck(data, isGyanav);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sends an instant alert email to every address in CONFIG.TEAM_EMAILS.
 */
function notifyTeam(data, isGyanav) {
  const brand   = isGyanav ? CONFIG.GYANAV_BRAND_NAME : CONFIG.BRAND_NAME;
  const subject = `New Lead [${brand}]: ${data.name || "Unknown"} — ${data.type || data.subject || "General"}`;
  const body =
    `A new lead just came in via the website.\n\n` +
    `Name:    ${data.name    || "-"}\n` +
    `Email:   ${data.email   || "-"}\n` +
    `Phone:   ${data.phone   || data.mobile || "-"}\n` +
    `Type:    ${data.type    || data.subject || "-"}\n` +
    `Message: ${data.message || "-"}\n` +
    `Source:  ${data.website || data.source || "Website"}\n` +
    `Time:    ${data.submittedAt || new Date().toISOString()}\n\n` +
    `Open the CRM sheet to update the stage and assign next action.`;

  CONFIG.TEAM_EMAILS.forEach(addr => {
    MailApp.sendEmail({ to: addr, subject: subject, body: body, name: brand });
  });
}

/**
 * Sends a thank-you acknowledgement to the person who submitted the form.
 */
function sendAck(data, isGyanav) {
  const subject    = isGyanav ? CONFIG.GYANAV_ACK_SUBJECT : CONFIG.ACK_SUBJECT;
  const senderName = isGyanav ? CONFIG.GYANAV_BRAND_NAME  : CONFIG.ACK_SENDER_NAME;
  const brand      = isGyanav ? CONFIG.GYANAV_BRAND_NAME  : CONFIG.BRAND_NAME;

  const body =
    `Hi ${data.name || "there"},\n\n` +
    `Thank you for reaching out to ${brand}. We have received your message and our team will get back to you shortly.\n\n` +
    `Here's a copy of what you sent us:\n"${data.message || ""}"\n\n` +
    `Talk soon,\n${senderName}`;

  MailApp.sendEmail({ to: data.email, subject: subject, body: body, name: senderName });
}

/**
 * Weekly digest — set as a time-driven trigger (Monday, 9–10am).
 * Summarises all open leads so nothing falls through the cracks.
 */
function weeklyDigest() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.DEFAULT_SHEET);
  if (!sheet) throw new Error("Sheet not found: " + CONFIG.DEFAULT_SHEET);

  const values  = sheet.getDataRange().getValues();
  const headers = values[0];
  const stageCol      = headers.indexOf("Stage");
  const nameCol       = headers.indexOf("Name");
  const typeCol       = headers.indexOf("Inquiry Type");
  const nextActionCol = headers.indexOf("Next Action");

  const openStages = ["Lead", "Qualified", "Opportunity"];
  const openRows   = values.slice(1).filter(r => openStages.includes(r[stageCol]));

  if (openRows.length === 0) return; // nothing open — skip

  let body = `Open pipeline as of ${new Date().toDateString()}:\n\n`;
  openRows.forEach(r => {
    body += `• ${r[nameCol]} | ${r[typeCol]} | Stage: ${r[stageCol]} | Next: ${r[nextActionCol]}\n`;
  });
  body += `\nTotal open items: ${openRows.length}`;

  CONFIG.TEAM_EMAILS.forEach(addr => {
    MailApp.sendEmail(addr, `Weekly Pipeline Digest — ${openRows.length} open`, body);
  });
}
