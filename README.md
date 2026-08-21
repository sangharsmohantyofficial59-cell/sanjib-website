# Sanjib Kumar Mohanty — Website Setup

## Folder structure
```
sanjib-website/
├── index.html
├── /assets
│   ├── /images
│   │   ├── /hero        ← main portrait photos
│   │   ├── /courses     ← 6 course thumbnails
│   │   ├── /ventures    ← 6 venture logos
│   │   └── /icons       ← personal logo
│   ├── /css/style.css
│   └── /js/script.js
└── /automation
    ├── apps-script-automation.gs
    └── pipeline-template.xlsx
```

## 1. Drop in your images (exact filenames — no code changes needed)

| Save as | Folder | What it is |
|---|---|---|
| `sanjib-portrait-main.png` | `/assets/images/hero/` | Main hero portrait |
| `sanjib-logo.png` | `/assets/images/icons/` | Personal logo (header) |
| `course-gyaan-shakti.png` | `/assets/images/courses/` | Gyaan Shakti thumbnail |
| `course-srujan-shakti.png` | `/assets/images/courses/` | Srujan Shakti thumbnail |
| `course-dhan-shakti.png` | `/assets/images/courses/` | Dhan Shakti thumbnail |
| `course-lakshya-shakti.png` | `/assets/images/courses/` | Lakshya Shakti thumbnail |
| `course-azad-shakti.png` | `/assets/images/courses/` | Azad Shakti thumbnail |
| `course-gaati-shakti.png` | `/assets/images/courses/` | Gaati Shakti thumbnail |
| `venture-digital-shakti.png` | `/assets/images/ventures/` | Digital Shakti School logo |
| `venture-gyanav-exim.png` | `/assets/images/ventures/` | Gyanav Exim logo |
| `venture-bhulakshmi.png` | `/assets/images/ventures/` | Bhulakshmi Realtor logo |
| `venture-bharat-travels.png` | `/assets/images/ventures/` | Bharat Travels logo |
| `venture-bharat-bazaar.png` | `/assets/images/ventures/` | Bharat Bazaar24 logo |
| `venture-karana-trust.png` | `/assets/images/ventures/` | Karana Community Trust logo |

If a file is missing, the header logo hides gracefully; other images will just show broken-image icons until added — add them before going live.

## 2. Change the weekly theme

The page loads one theme file followed by the shared stylesheet:

```html
<link rel="stylesheet" href="assets/css/style-theme1-signature-gold.css">
<link rel="stylesheet" href="assets/css/style.css">
```

To change the weekly look, edit only the first filename in `index.html`:

- `style-theme1-signature-gold.css`
- `style-theme2-ocean-blue.css`
- `style-theme3-festive-diwali.css`
- `style-theme4-fresh-mint.css`
- `style-theme5-light-professional.css`

Keep `style.css` linked after the theme file. It contains the shared layout, components, and animations.

## 3. Wire the lead-capture pipeline

1. Open `automation/pipeline-template.xlsx` in Google Sheets (upload it, or create a new Sheet named "Pipeline" and paste the same header row).
2. In that Sheet: Extensions → Apps Script → paste in `automation/apps-script-automation.gs`.
3. Edit the `CONFIG` block at the top — set `TEAM_EMAILS` to Sanjib's real inbox(es).
4. Deploy → New deployment → Web app → Execute as "Me" → Who has access: "Anyone" → copy the deployment URL.
5. Open `assets/js/script.js`, find `SCRIPT_URL`, paste the URL in.
6. (Optional) Set the weekly digest trigger: clock icon → Add trigger → `weeklyDigest` → time-driven → weekly, Monday.

Until step 5 is done, the form works in a safe fallback mode — it won't fail visibly, it just won't reach the Sheet yet.

## 4. Hosting

This is a static site — no server or database needed. It can go on:
- GitHub Pages (free)
- Netlify / Vercel (free tier)
- Any standard shared hosting — just upload the whole `sanjib-website/` folder

## Notes
- Single-page site with anchor navigation (About, Framework, Courses, Ventures, Contact) — better for lead conversion than splitting across multiple pages.
- The "6-step framework" section maps directly to the six course names, since that structure already existed in Sanjib's original site copy — nothing invented.
- WhatsApp button uses the existing number (ending 7981) from the current site.
