# Service Master (SM) QR Voting System — Administrator Manual

This manual provides instructions for station managers and system administrators on configuring monthly campaigns, printing QR posters and employee badges, monitoring live voting, and moderating flagged votes.

---

## 1. Quick Start & Accessing the Admin Portal

1. Navigate to your voting portal: `http://localhost:3000` (or your production URL).
2. Click the **Admin** button in the top right navigation bar (or navigate to `/admin/login`).
3. Enter your administrator credentials:
   - **Default Username**: `admin`
   - **Default Password**: `admin123`
4. Upon successful login, you will land on the **Vote Monitoring & Fraud Audit System**.

---

## 2. Setting Up a Monthly Campaign

To configure a new monthly campaign:
1. Click the **Settings & Rules** tab in the dashboard navigation.
2. Set the **Campaign Title** (e.g., `Service Master of the Month - October 2026`).
3. Choose the **Start Date** and **End Date**.
4. Configure **Station Operating Hours**:
   - Check **Enforce Station Hours** to only accept ballots during business hours.
   - Enter **Opening Time** (e.g., `06:00`) and **Closing Time** (e.g., `22:00`).
   - Ballots attempted outside these hours will be politely informed that voting is closed for the shift.
5. Click **Save Settings**.

---

## 3. QR Code Generation & Printing Guide

The system supports two distinct voting modes:

### Mode A: General Voting Poster (For Entrance, Counters & Table Tents)
- **Use Case**: One shared QR code displayed on acrylic counter stands, station entrances, or receipt slips.
- **Workflow**: Customer scans QR $\rightarrow$ opens ballot page showing all nominees $\rightarrow$ customer picks their Service Master $\rightarrow$ confirms vote.
- **How to Print**:
  1. Open the **QR Studio** tab.
  2. Select **Mode A: General Voting Poster**.
  3. Enter your station/branch name (e.g., `Petron San Pedro Main`).
  4. Click **Print Full Poster (Letter/A4)** to open the printer dialog, or click **Download QR Image (PNG)** to incorporate the high-res graphic into custom marketing materials.

### Mode B: Service Master Specific Badges (Personal QR)
- **Use Case**: Unique QR code assigned to each Service Master, printed on their lanyard card, chest badge, or station bay tool chest.
- **Workflow**: Customer scans SM's QR $\rightarrow$ lands directly on the confirmation card for that exact SM $\rightarrow$ taps "Confirm Vote".
- **How to Print**:
  1. Open **QR Studio** $\rightarrow$ select **Mode B: Individual SM Badge**.
  2. Select the desired Service Master to preview their badge.
  3. Click **Print Single Badge** for one employee, or click the **Batch Print All Badges** tab to print all active employee badges in a clean card layout on standard perforated card stock.

---

## 4. Fraud Detection & Moderation Queue

The system automatically monitors every vote submission against 7 anti-cheat rules:

| Rule | Trigger Condition | System Action |
| :--- | :--- | :--- |
| **Self-Voting Shield** | Voter device fingerprint or IP matches SM's registered hardware profile | **FLAGGED** for manual admin review |
| **Duplicate Voting** | Same device fingerprint attempts to vote multiple times on the same day | **BLOCKED** with helpful notice |
| **Rapid-Fire Spam** | More than 5 votes cast from the same IP address within 10 minutes | **FLAGGED** as rapid-fire bot attack |
| **Operating Hours** | Vote cast outside configured shift times (e.g., 2 AM) | **BLOCKED** outside operating hours |
| **Emergency Kill Switch**| Administrator has engaged emergency freeze | **BLOCKED** across all channels |

### Reviewing Flagged Votes
1. Click the **Fraud Queue** tab in the dashboard. If flagged votes exist, a notification badge with the count will appear.
2. Review the forensic metadata:
   - Nominee Service Master
   - Timestamp and branch
   - Detection reason (e.g., `possible_self_vote`, `rapid_fire`)
   - Device fingerprint hash & IP address
3. Take action:
   - **Approve Vote**: If the customer or supervisor confirms the vote was legitimate, click **Approve Vote**. The vote will be marked valid and immediately reflected in official leaderboard tallies.
   - **Reject**: If identified as unauthorized staff voting or bot spam, click **Reject**. The vote is permanently excluded from results and recorded in the audit trail.

---

## 5. Service Master Management & Anti-Self-Vote Calibration

To prevent staff from scanning their own QR code:
1. Open the **SM Directory** tab.
2. Click **Add Service Master** or click the **Edit** icon on an existing SM card.
3. Fill in their name, branch, station, shift, photo, and bio.
4. **Anti-Self-Voting Shield Calibration**:
   - To register an SM's smartphone: Have the SM open the portal on their phone, or open the edit modal and paste their device hash, or click **Use This Device Fingerprint** when configuring on their device.
   - Once registered, if that phone or IP ever attempts to cast a vote for themselves, the system immediately flags it as `possible_self_vote`.

---

## 6. Emergency Kill Switch & Test Mode

- **Emergency Kill Switch**:
  - Located on the **Overview** and **Settings** tabs.
  - In case of suspicious physical activity or campaign dispute, toggle the switch to immediately shut down voting across all QR codes and web pages.
- **Test Mode**:
  - Allows managers to simulate scanning and voting to test printer outputs and connectivity without polluting official campaign tallies or triggering rate limits.

---

## 7. Data Export & Audit Reports

1. Open the **Leaderboard** tab and click **Export Leaderboard (CSV)** to download monthly rankings and percentages for payroll bonuses or bulletin board postings.
2. Open the **Audit Trail** tab and click **Export to CSV** to download the complete, immutable transaction log for compliance and audit review.
