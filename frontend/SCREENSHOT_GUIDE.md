# 📸 Screenshot Guide for Documentation

This branch (`screenshots-demo`) has **realistic demo data pre-loaded** for taking high-quality screenshots for articles and documentation.

---

## 🚀 Quick Start

1. **Make sure you're on the right branch:**
   ```bash
   git branch
   # Should show: * screenshots-demo
   ```

2. **Open the app:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

3. **Use the Screenshot Mode panel** on the Welcome Screen

---

## 📷 Screenshots to Take

### **Screenshot 1: Welcome Screen**
**File:** `01-welcome-screen.png`

- **Location:** http://localhost:3000
- **What to capture:** Full page with:
  - Medical Intake logo
  - 4 feature cards
  - Screenshot Mode panel (shows demo capabilities)
  - Start Voice Intake button

**How to capture:**
- Take full-page screenshot (no cropping needed)
- Resolution: 1920x1080 or higher

---

### **Screenshot 2: Conversation Screen (Step 1)**
**File:** `02-conversation-screen.png`

- **How to get there:** Click **"Step 1: Talk"** button in Screenshot Mode
- **What to capture:** Split-screen layout showing:
  - **Left side:** Microphone button (inactive state)
  - **Right side:** 12 realistic conversation messages between patient and AI
  - Progress bar at top (33% filled)
  - "Continue to Review" button visible

**Demo data loaded:**
- Patient reporting severe migraine headaches
- Discussion about medications (Lisinopril, Ibuprofen)
- Allergies mentioned (Penicillin, Shellfish)
- Medical history discussed

**Tips:**
- Full-page screenshot
- Scroll to bottom to show "Continue to Review" button
- Transcript should show professional medical conversation

---

### **Screenshot 3: Conversation Screen (Active State)**
**File:** `03-conversation-active.png`

- **How to get there:** Click microphone button on Conversation Screen
- **What to capture:**
  - Microphone button in ACTIVE state (primary color)
  - "REC" badge visible in top-right of button
  - 48-bar audio visualizer animating below button
  - Ripple effect around microphone
  - Status: "Listening..."

**Tips:**
- This captures the voice-first UI in action
- Animated visualizer bars should be visible
- Shows real-time audio feedback

---

### **Screenshot 4: Review Screen (Step 2)**
**File:** `04-review-screen.png`

- **How to get there:** Click **"Step 2: Review"** button in Screenshot Mode
- **What to capture:** Full page with editable cards:
  - **Chief Complaint card** with detailed migraine description
  - **Current Medications** (3 medications: Lisinopril, Ibuprofen, Multivitamin)
  - **Allergies** (2 life-threatening allergies with reactions)
  - **Medical History** (Hypertension, Appendectomy, Seasonal allergies)
  - Progress bar at 66%
  - "Go Back" and "Continue to Confirmation" buttons

**Demo data highlights:**
- Professional medical terminology
- Detailed medication doses and frequencies
- Severity levels on allergies (life-threatening, serious)
- Edit/Add/Remove buttons visible on each card

**Tips:**
- Full-page screenshot or scroll to capture all cards
- Shows how AI extraction resulted in structured data
- Demonstrates edit capabilities

---

### **Screenshot 5: Confirmation Screen (Step 3)**
**File:** `05-confirmation-screen.png`

- **How to get there:** Click **"Step 3: Confirm"** button in Screenshot Mode
- **What to capture:** Final review page with:
  - Read-only summary of all medical data
  - HIPAA consent checkbox
  - "Confirm & Submit" button
  - Progress bar at 100%

**Demo data shows:**
- CHIEF COMPLAINT section
- CURRENT MEDICATIONS (3) with formatting
- ALLERGIES (2) with severity
- MEDICAL HISTORY section
- SOCIAL HISTORY (smoking, alcohol, occupation)

**Tips:**
- Full-page screenshot
- Shows professional medical intake summary
- Consent language visible

---

### **Screenshot 6: Success Screen**
**File:** `06-success-screen.png`

- **How to get there:**
  1. Go to Confirmation Screen (Step 3)
  2. Check the consent checkbox
  3. Click "Confirm & Submit"
  4. Wait 1.5 seconds (auto-navigates)
- **What to capture:**
  - Large green checkmark
  - "Intake Complete!" heading
  - "What Happens Next" card with 4 numbered steps
  - Reference number (INT-xxxxx-xxxx)
  - Download PDF and Start New Intake buttons

**Tips:**
- Clean success state
- Shows post-submission experience
- Reference number for patient records

---

## 🎨 Screenshot Best Practices

### Browser Setup:
1. **Use Chrome or Firefox** (consistent rendering)
2. **Window size:** 1920x1080 or 2560x1440 (for Retina)
3. **Zoom:** 100% (no zoom in/out)
4. **Hide bookmarks bar** for clean look

### Extensions to Use:
- **Full Page Screen Capture** (Chrome)
- **GoFullPage** (for scrolling screenshots)
- Or native screenshot tools:
  - macOS: `Cmd + Shift + 4` → Space → Click window
  - Windows: `Win + Shift + S`

### After Capture:
1. **Compress images:**
   ```bash
   # Using ImageOptim (Mac) or TinyPNG (web)
   # Target: < 500KB per image
   ```

2. **Name consistently:**
   ```
   01-welcome-screen.png
   02-conversation-screen.png
   03-conversation-active.png
   04-review-screen.png
   05-confirmation-screen.png
   06-success-screen.png
   ```

3. **Save to folder:**
   ```
   medical-intake-app/docs/screenshots/
   ```

---

## 🔄 After Taking Screenshots

When you're done, switch back to main branch:

```bash
# Commit any notes if needed
git add -A
git commit -m "Added screenshots for documentation"

# Switch back to main
git checkout main

# Screenshots branch will remain for future updates
```

---

## 📊 Demo Data Details

The realistic demo data includes:

**Patient Profile:**
- **Chief Complaint:** Severe migraine headaches (2 weeks)
- **Medications:**
  - Lisinopril 10mg (daily) for hypertension
  - Ibuprofen 400mg (3x/day) for pain
  - Multivitamin
- **Allergies:**
  - Penicillin (life-threatening: hives, breathing difficulty)
  - Shellfish (serious: throat swelling)
- **Medical History:**
  - Hypertension (controlled)
  - Appendectomy (5 years ago)
  - Seasonal allergies
- **Social History:**
  - Former smoker (quit 2 years ago)
  - Social drinker (2-3/week)
  - Software Engineer

This creates a **realistic, HIPAA-compliant demo** suitable for professional documentation.

---

## 🎯 Alternative Demo Data

The `demo-data.ts` file includes 3 scenarios:
1. **Migraine** (default) - Current setup
2. **Diabetes** - Type 2 diabetes follow-up
3. **Asthma** - Asthma exacerbation

To switch scenarios, edit `WelcomeScreen.tsx` line 22:
```typescript
// Change from:
setData(demoIntakeData);

// To:
setData(demoDataSets.diabetes); // or demoDataSets.asthma
```

---

## ✨ Tips for Great Screenshots

1. **Capture at different times** for variety (reference numbers change)
2. **Show tooltips/hover states** if applicable
3. **Capture both light and dark mode** (if supported)
4. **Include browser UI** for context (or don't for cleaner look - your choice)
5. **Add annotations later** using tools like:
   - Snagit
   - Skitch
   - Figma
   - Photoshop

---

## 🐛 Troubleshooting

**Problem:** "Demo data not loading"
- **Solution:** Make sure you're on `screenshots-demo` branch
- Run `npm run dev` again

**Problem:** "Messages don't show up"
- **Solution:** Click the demo button again, or refresh page

**Problem:** "Can't see Continue button"
- **Solution:** Scroll down on Conversation Screen

**Problem:** "Want different data"
- **Solution:** Edit `lib/demo-data.ts` with your own scenarios

---

**Ready to take screenshots!** Open http://localhost:3000 and use the Screenshot Mode panel 📸
