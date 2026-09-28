# QR Code Generation & Printing Guide (Petron San Pedro)

This guide explains how to generate, download, and print QR codes for both **Mode A (General Station Voting)** and **Mode B (Individual Service Master Badges)**.

---

## 1. Quick Overview: The Two QR Modes

| Mode | Where to Place | What the QR Encodes | Voter Experience |
| :--- | :--- | :--- | :--- |
| **Mode A: General QR** | Cashier counters, customer lounge table tents, entrance posters, receipt slips | `https://your-domain.ph/vote` | Opens ballot gallery with all Petron San Pedro nominees $\rightarrow$ customer picks their SM $\rightarrow$ confirms vote. |
| **Mode B: SM-Specific QR** | Employee lanyard badges, chest pocket cards, station bay tool chests | `https://your-domain.ph/vote/sm/:id` (e.g. `/vote/sm/sm-001`) | Opens confirmation screen directly for that specific SM $\rightarrow$ 1-tap "Confirm Vote". Takes under 10 seconds! |

---

## 2. Generating QR Codes in the Application

The web system includes a **QR Studio & Print Center** accessible in the Admin Dashboard:

### Method 1: Using the Web App Admin Dashboard (Easiest)

1. Open the Admin Dashboard at [http://localhost:5000/admin](http://localhost:5000/admin) (or your live domain) and log in (`admin` / `admin123`).
2. Click the **QR Studio & Print** tab in the dashboard navigation.
3. Choose the mode you want to generate:

#### For Mode A (General Counter Poster):
- Click **Mode A: General Voting Poster**.
- Customize the station title: `Petron San Pedro`.
- Click **Download QR Image (PNG)** to save the high-res QR code image, OR:
- Click **Print Full Poster (Letter/A4)** to instantly open your browser's print dialog. The poster is pre-styled with station branding, 3 visual customer steps, and anti-fraud notice.

#### For Mode B (Service Master Lanyard Badges):
- Click **Mode B: Individual SM Badge**.
- Select any Service Master from the dropdown (e.g., Carlos Mendoza, Maria Santos).
- Click **Download Badge QR Image**, OR:
- Click **Print Single Badge** to print an individual CR80 (3.375" x 2.125") lanyard card.
- **Batch Print**: Click the **Batch Print All Badges** tab to print all active employee badges at once onto perforated sticker or badge paper!

---

### Method 2: Via REST API Endpoints

The backend provides direct endpoints to fetch QR codes as base64 images or JSON:

1. **General Ballot QR**:
   ```http
   GET http://localhost:5000/api/qr/general
   ```
   *Returns `{ type: "general", targetUrl: ".../vote", qrDataUrl: "data:image/..." }`*

2. **Specific SM QR**:
   ```http
   GET http://localhost:5000/api/qr/sm/sm-001
   ```
   *Returns `{ type: "sm_specific", smId: "sm-001", targetUrl: ".../vote/sm/sm-001", qrDataUrl: "data:image/..." }`*

3. **Batch All SM QRs**:
   ```http
   GET http://localhost:5000/api/qr/all-sms
   ```
   *Returns `{ count: 6, batch: [ { sm, targetUrl, qrDataUrl }, ... ] }`*

---

### Method 3: Using External Graphic Design Tools (Canva, Photoshop, Zebra Printers)

If you are having plastic PVC ID cards or custom acrylic counter stands produced by a printing service, you can encode these exact URLs into any QR generator:

| Service Master | Station / Bay | Target QR Destination URL |
| :--- | :--- | :--- |
| **General Ballot (Mode A)** | Entrance / Cashier Counter | `https://your-domain.ph/vote` |
| **Carlos Mendoza** | Lube Bay 1 (Fast Lube) | `https://your-domain.ph/vote/sm/sm-001` |
| **Maria Santos** | Tire & Wheel Alignment Bay | `https://your-domain.ph/vote/sm/sm-002` |
| **Jerome Bautista** | Engine Diagnostics & Electrical Bay | `https://your-domain.ph/vote/sm/sm-003` |
| **Angelica Ramos** | Express Oil Change Bay 2 | `https://your-domain.ph/vote/sm/sm-004` |
| **Rafael Dalisay** | Brake & Heavy Mechanical Bay | `https://your-domain.ph/vote/sm/sm-005` |
| **Kristine Joy Valdez** | Customer Reception & Inspection Bay | `https://your-domain.ph/vote/sm/sm-006` |

*(Replace `https://your-domain.ph` with your deployed domain, e.g. `http://localhost:5000` during testing).*

---

## 3. Best Practices for Physical Placement at Petron San Pedro

1. **Badge Size & Lanyards**:
   - Ensure the QR code on employee badges is at least **2.5 cm x 2.5 cm** (1 inch x 1 inch) with high contrast (dark blue/black on white) so phone cameras can scan it in 1 second even in station lighting.
2. **Counter Stands**:
   - Place Mode A acrylic stands at the cashier counter and waiting lounge tables at eye level with clear wording: *"Thank your Service Master! Scan with your phone camera to vote."*
3. **Receipt Printing**:
   - If using thermal POS receipt printers, include the Mode A QR code at the bottom of customer receipts.
