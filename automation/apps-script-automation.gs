/**
 * LEAD AUTOMATION SCRIPT — Google Apps Script
 * Handles leads for both "Sanjib Mohanty.com" and "Gyanavexim"
 *
 * WHAT THIS DOES
 * 1. doPost()       — receives form submissions, writes row to sheet, notifies team, acks client
 * 2. notifyTeam()   — instantly emails team with full lead details
 * 3. sendAck()      — sends thank-you email to the person who submitted
 * 4. weeklyDigest() — Monday morning summary of open leads (set as a time trigger)
 *
 * SETUP
 * 1. Open your Google Sheet > Extensions > Apps Script
 * 2. Paste this ENTIRE file into Code.gs (replace everything)
 * 3. Deploy > New deployment > Web app > Execute as "Me" > Who has access: "Anyone"
 * 4. Copy the deployment URL into assets/js/script.js → SCRIPT_URL
 * 5. For weekly digest: Triggers > Add Trigger > weeklyDigest > Time-driven > Week timer > Monday 9–10am
 */

// ====== CONFIG — edit these ======
const CONFIG = {
  DEFAULT_SHEET: "Sanjib Mohanty.com - CRM",
  TEAM_EMAILS: ["sanjib.maximum@gmail.com"],  // YOU get an email for every new lead

  // Sanjib Mohanty website
  BRAND_NAME: "Sanjib Kumar Mohanty",
  ACK_SUBJECT: "Thanks for reaching out!",
  ACK_SENDER_NAME: "Team Sanjib Mohanty",

  // Gyanavexim website
  GYANAV_BRAND_NAME: "Gyanavexim Team",
  GYANAV_ACK_SUBJECT: "Thank you for contacting Gyanavexim!"
};
// ===================================

/**
 * Converts a date/ISO-string to IST formatted string.
 * e.g. "23-09-2026 14:37:00 IST"
 */
function toIST(dateInput) {
  const d = (typeof dateInput === "string") ? new Date(dateInput) : dateInput;
  return Utilities.formatDate(d, "Asia/Kolkata", "dd-MM-yyyy HH:mm:ss 'IST'");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const isGyanav = (data.website === "Gyanavexim");

    // Pick the correct sheet tab
    const targetSheetName = isGyanav ? "Gyanavexim" : "Sanjib Mohanty.com - CRM";
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(targetSheetName);
    if (!sheet) throw new Error("Sheet not found: " + targetSheetName);

    // Convert submission time to IST for storage
    const submittedIST = toIST(data.submittedAt || new Date());
    const createdIST   = toIST(new Date());

    let row;
    if (isGyanav) { 
      // Gyanavexim tab: Timestamp (IST), Name, Mobile, Email, Subject, Message
      row = [
        submittedIST,
        data.name    || "",
        data.mobile  || "",
        data.email   || "",
        data.subject || "",
        data.message || ""
      ];
    } else {
      // CRM tab: 11 columns — all timestamps in IST
      row = [
        submittedIST,
        data.name    || "",
        data.email   || "",
        data.phone   || data.mobile || "",
        data.type    || data.subject || "",
        data.message || "",
        data.website || data.source || "Website",
        "Lead",
        "",
        "Review and respond",
        createdIST
      ];
    }

    sheet.appendRow(row);

    // ✅ Step 1: Email YOU (the team) with full lead details
    notifyTeam(data, isGyanav, submittedIST);

    // ✅ Step 2: Email the person who submitted (thank-you ack)
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
 * Sends an instant alert to every address in CONFIG.TEAM_EMAILS.
 * Called every time a form is submitted.
 */
function notifyTeam(data, isGyanav, submittedIST) {
  const brand   = isGyanav ? CONFIG.GYANAV_BRAND_NAME : CONFIG.BRAND_NAME;
  const subject = "🔔 New Lead [" + brand + "]: " + (data.name || "Unknown") + " — " + (data.type || data.subject || "General");
  const body =
    "A new lead just came in via the website.\n\n" +
    "──────────────────────────\n" +
    "Name    : " + (data.name    || "-") + "\n" +
    "Email   : " + (data.email   || "-") + "\n" +
    "Phone   : " + (data.phone   || data.mobile || "-") + "\n" +
    "Type    : " + (data.type    || data.subject || "-") + "\n" +
    "Message : " + (data.message || "-") + "\n" +
    "Source  : " + (data.website || data.source || "Website") + "\n" +
    "Time    : " + (submittedIST || toIST(new Date())) + "\n" +
    "──────────────────────────\n\n" +
    "Open the CRM sheet to update the stage and assign a next action.";

  CONFIG.TEAM_EMAILS.forEach(function(addr) {
    MailApp.sendEmail({ to: addr, subject: subject, body: body, name: brand });
  });
}

/**
 * Sends a thank-you acknowledgement to the person who filled the form.
 */
function sendAck(data, isGyanav) {
  const subject    = isGyanav ? CONFIG.GYANAV_ACK_SUBJECT : CONFIG.ACK_SUBJECT;
  const senderName = isGyanav ? CONFIG.GYANAV_BRAND_NAME  : CONFIG.ACK_SENDER_NAME;
  const brand      = isGyanav ? CONFIG.GYANAV_BRAND_NAME  : CONFIG.BRAND_NAME;

  const body =
    "Hi " + (data.name || "there") + ",\n\n" +
    "Thank you for reaching out to " + brand + ". We have received your message and our team will get back to you shortly.\n\n" +
    "Here's a copy of what you sent us:\n\"" + (data.message || "") + "\"\n\n" +
    "Talk soon,\n" + senderName;

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
  const openRows   = values.slice(1).filter(function(r) { return openStages.indexOf(r[stageCol]) !== -1; });

  if (openRows.length === 0) return; // nothing open — skip sending

  var body = "Open pipeline as of " + toIST(new Date()) + ":\n\n";
  openRows.forEach(function(r) {
    body += "• " + r[nameCol] + " | " + r[typeCol] + " | Stage: " + r[stageCol] + " | Next: " + r[nextActionCol] + "\n";
  });
  body += "\nTotal open items: " + openRows.length;

  CONFIG.TEAM_EMAILS.forEach(function(addr) {
    MailApp.sendEmail(addr, "Weekly Pipeline Digest — " + openRows.length + " open", body);
  });
}
