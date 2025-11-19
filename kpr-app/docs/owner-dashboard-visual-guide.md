# Owner Dashboard Visual Guide (Days 1-2)

This document captures the current Owner Dashboard surface in `kpr-app`, translating each visual screen, color token, and interaction flow that exists in the frontend-first build so you can demo it confidently.

---

## Screen-by-screen sketches

### 1. Dashboard Header
```
┌─────────────────────────────────────────────────────┐
│  ←  Owner Dashboard                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [────────────────────────────────]                │
│  │                                 │                │
│  │     Banner Image (Thumbnail)    │   150px height│
│  │                                 │                │
│  [────────────────────────────────]                │
│                                                     │
│  DesignCraft Studio                                │
│  Building the next generation of UI/UX tools       │
│                                                     │
│  [Design] [Development] [Startup]  ← Tag chips     │
│                                                     │
│  👤👤👤 +7 members                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```
- Banner slot with 150px height
- Tag chips surface for pod verticals
- Member count badge reinforces community scale

### 2. Tab Navigation
```
┌─────────────────────────────────────────────────────┐
│  ┌───────────┬─────────┬───────┬─────────┬────────┐ │
│  │Applicants │ Members │ Roles │ Invites │Settings│ │
│  │    (2)    │         │       │   (1)   │        │ │
│  └───────────┴─────────┴───────┴─────────┴────────┘ │
│    ▔▔▔▔▔▔▔▔▔   ← Active indicator                  │
└─────────────────────────────────────────────────────┘
```
- Active tab: blue border (#3b82f6), badge count, bold text
- Inactive tabs: gray text (#6b7280), no border

### 3. Applicants Tab (Day 1)
```
┌─────────────────────────────────────────────────────┐
│  Applicants Tab                                     │
│ (two identical applicant cards with Avatar, role, time, quote, View/Reject/Approve actions)
└─────────────────────────────────────────────────────┘
```
- Applicant cards: white surface, 12px radius, shadow `0 2px 4px rgba(0,0,0,0.1)`
- Avatar: 56px circle
- Approve button: green #10b981 with white text (stateful spinner on tap)
- Reject button: red outline (#ef4444) with red text
- View Profile button (outline) to open candidate details

### 4. Members Tab (Day 2 full view)
```
┌─────────────────────────────────────────────────────┐
│  Members Tab                                        │
│  Search bar + sort tabs + member cards with badges │
└─────────────────────────────────────────────────────┘
```
- Search input: rounded, nuclear icons, clear button
- Sort chips: [Newest], [A-Z], [Role] with active underline
- Member cards: 64px avatars, white, 12px radius, `0 1px 2px rgba(0,0,0,0.1)` shadow, owner/mod badges.
- Role text: #3b82f6 weight 500, join info: #9ca3af 12px

### 5. Search Active State
- Search input retains query (`Priya`) with clear `✕` icon
- Member count updates ("1 member") and the filtered card remains

### 6. Member Actions Menu (Bottom Sheet)
```
┌─────────────────────────────────────────────────────┐
│  [Bottom sheet with action rows (View Profile, Send Message, Make Moderator, Remove from Pod)]  │
└─────────────────────────────────────────────────────┘
```
- Backdrop: `rgba(0,0,0,0.5)`
- Container: white, 20px rounded top corners
- Danger action in red (#ef4444)
- Cancel CTA gray background (#f3f4f6)

### 7. Confirmation Alert (iOS_style)
- Modal with title, body, and two buttons (Cancel, Promote)
- Promote button: bold, blue (#3b82f6)

### 8. Success Alert
- Modal stating promotion success with single Ok button (bold blue)

### 9. Updated Member Card
- Member card now features blue "Mod" badge (#dbeafe background, #1e40af text)

### 10–12. Empty States and No Search Results
- Applicants empty: 64px clipboard icon, 18px bold title, 14px gray helper
- Members empty: 64px user icon, same typography
- No search matches: textual callout centered

---

## Color palette & tokens
| Token | Hex | Usage |
| --- | --- | --- |
| Primary Blue | #3b82f6 | Active tabs, confirmations, primary CTAs |
| Success Green | #10b981 | Approve buttons, positive states |
| Danger Red | #ef4444 | Reject buttons, destructive rows |
| Background | #f9fafb | Page backgrounds |
| Surface | #ffffff | Cards, modals, menus |
| Secondary BG | #f3f4f6 | Cancel CTAs, badges |
| Primary Text | #111827 | Headlines |
| Secondary Text | #6b7280 | Subheadings, disabled copy |
| Tertiary Text | #9ca3af | Micro text |
| Owner Badge BG | #fef3c7 | Owner chip |
| Owner Badge Text | #92400e | Owner chip text |
| Mod Badge BG | #dbeafe | Moderator chip |
| Mod Badge Text | #1e40af | Moderator chip text |
| Border Medium | #d1d5db | Dividers |

---

## Component sizing reference
- Applicant avatar: 56px circle, 12px bottom margin
- Member avatar: 64px circle
- Card radius: 12px
- Card padding: 12–16px
- Card shadow: `0 2px 4px rgba(0,0,0,0.1)` (applicants), `0 1px 2px rgba(0,0,0,0.1)` (members)
- Buttons: 40px height, 8px radius, 16px horizontal padding, 14px font
- Badges: 20px height, 4px radius, 6px horizontal padding, 10px font
- Typography: card titles 16px weight 600, subtitles 14px weight 500, body 14px regular

---

## Interaction flows

### Flow 1: Approve applicant
1. Open Applicants tab (badge count visible)
2. Tap [Approve] → shows spinner (~800ms)
3. Success alert: "Aarya Patel has been approved!"
4. Card removes from list, badge count decrements, member list grows

### Flow 2: Promote member
1. Open Members tab, tap `⋮` on Rohit Sharma
2. Bottom sheet slides up → tap "Make Moderator"
3. Confirmation modal → tap "Promote"
4. Success alert → card now displays Mod badge and activity feed updates

### Flow 3: Search members
1. Start typing `Priya` in search input
2. List filters in real time, header count says "1 member"
3. Clear query via `✕`, full list returns

---

## Current capabilities summary
- Applicants + Members tabs with mock data handlers
- ApprovalActions, ApplicantCard, ApplicantList components showing CTAs and pill badges
- Member search, sort chips, and action menu (bottom sheet + alerts)
- Type-safe data shapes defined in `src/types/pods.ts`
- Lint-passing React Native/TypeScript stack

## What to try right now
```powershell
cd kpr-app
npm start
```
1. Navigate to the Owner Dashboard screen
2. On Applicants tab: confirm two cards, tap Approve, observe alert
3. Switch to Members tab: see 10 cards, search for "Priya", test bottom sheet actions, complete a promotion

---

## Next steps (Day 3+)
- Build Invite system wiring (new components + actions)
- Hook actual backend data when available
- Expand activity feed with the new `member_promoted` / `member_demoted` events

---

Created on November 20, 2025, to help present the Days 1-2 owner dashboard deliverables visually.
