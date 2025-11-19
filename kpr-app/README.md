# KPR App

This is the KPR mobile app, built with [**React Native**](https://reactnative.dev) and TypeScript.

The app powers collaboration around "pods" – small, focused groups with roles, applications, members, invites, and activity.

---

## Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### 1. Install dependencies

From the `kpr-app` directory:

```sh
# Using npm
npm install

# OR using Yarn
yarn
```

### 2. Start Metro

Start the Metro dev server from the root of the React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

### 3. Build and run the app

With Metro running, open a new terminal from the `kpr-app` directory and run:

#### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

#### iOS

For iOS, remember to install CocoaPods dependencies (only needed on first clone or when native deps change).

Install bundler + pods:

```sh
bundle install
bundle exec pod install --project-directory=ios
```

Then run:

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see the app running in the Android emulator, iOS Simulator, or on a connected device.

---

## Development Workflow

### Fast Refresh

Edit any file under `src/` (for example `src/App.tsx`) and save. The app will automatically reload with your changes via [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

To force a full reload:

- **Android**: Press `R` twice in the emulator, or open the dev menu with `Ctrl+M` (Windows/Linux) or `Cmd+M` (macOS) and tap **Reload**.
- **iOS**: Press `R` in the iOS Simulator.

### Linting

The project uses ESLint + Prettier.

```sh
npm run lint
```

Lint must pass cleanly before merging changes.

---

## Pods: Owner Dashboard Overview

The **Owner Dashboard** provides a production-quality control panel for managing a pod and its members. It lives at:

- `src/screens/Pods/OwnerDashboard.tsx`

The dashboard has 5 tabs:

1. **Applicants** – review and approve/reject applications
2. **Members** – manage existing members and moderators
3. **Roles** – edit role definitions and capacities
4. **Invites** – search for users and send/cancel invites
5. **Settings** – edit pod metadata (title, subtitle, tags, visibility)

### Applicants Tab

**Key screen & components:**

- `OwnerDashboard.tsx` – tab integration & state updates
- `src/components/pods/ApplicantList.tsx`
- `src/components/pods/ApplicantCard.tsx`
- `src/components/pods/ApprovalActions.tsx`

**Core behaviors:**

- List of pending applicants, showing avatar, name, desired role, and message.
- **Approve**
  - Removes from `podData.applicants`.
  - Adds to `podData.members` with `joinedAt` and `isModerator: false`.
  - Increments the `filled` count on the relevant role.
  - Prepends a `member_joined` activity.
- **Reject**
  - Removes from `podData.applicants`.
  - Shows a confirmation alert.
- Badge counts on the Applicants tab update automatically based on `podData.applicants.length`.

### Members Tab

**Key components:**

- `src/components/pods/MemberList.tsx`
- `src/components/pods/MemberCard.tsx`
- `src/components/pods/MemberActionsMenu.tsx`

**Features:**

- Grid-style member list with:
  - Avatar
  - Name
  - Role
  - Joined X days/weeks/months ago
  - **Owner** and **Mod** badges
- Search bar (name/role) with clear button.
- Sorting controls: **Newest**, **A–Z**, **Role**.
- 3-dot menu per member (hidden for the current user) with:
  - View Profile (placeholder – logs in console)
  - Send Message (DM placeholder – alert)
  - Make/Remove Moderator (with confirmation)
  - Remove from Pod (destructive; confirmation)

**State updates (in `OwnerDashboard`):**

- `handlePromoteMember`
  - Toggles `member.isModerator = true`.
  - Pushes `userId` into `podData.moderators`.
  - Adds a `member_promoted` activity.
- `handleDemoteMember`
  - Sets `member.isModerator = false`.
  - Removes `userId` from `podData.moderators`.
  - Adds a `member_demoted` activity.
- `handleRemoveMember`
  - Removes the member from `podData.members`.
  - Removes `userId` from `podData.moderators`.
  - Decrements `roles[].filled` for that member's role (bounded at 0).
  - Adds a `member_removed` activity.

### Roles Tab

**Key component:**

- `src/components/pods/RoleManager.tsx`

**Purpose:**

- View and edit each role's:
  - Name
  - Description
  - Capacity
  - Filled vs capacity (with progress bar and color-coded status)

**Behaviors:**

- Inline edit mode per role (Edit → Save/Cancel).
- Capacity adjustments with plus/minus buttons (validated):
  - Capacity cannot be less than current `filled`.
  - Capacity must be between 1 and 50.
- `onUpdateRole` callback from `OwnerDashboard` updates `podData.roles` and logs a `role_updated` activity.

### Invites Tab

**Key components:**

- `src/components/pods/UserSearchAutocomplete.tsx`
- `src/components/pods/PendingInvitesList.tsx`
- `src/components/pods/InviteModal.tsx`

**Features:**

- Invites tab button:
  - "Invite New Members" → opens `InviteModal`.
- Invite modal workflow:
  1. **Search user** using `UserSearchAutocomplete` (debounced 300ms):
     - Filters over `mockUsers` from `src/mockData/mockUsers.ts`.
     - Excludes:
       - Existing pod members
       - Current applicants
       - Already invited users
  2. **Select role** from non-full roles with available slots.
  3. **Send invite**:
     - Adds an invite object to `podData.invites`.
     - Prepends an `invite_sent` activity.
- Pending invites list:
  - Shown inside the modal (`PendingInvitesList`) and in the Invites tab itself.
  - Each invite card has a **Cancel** action with confirmation, calling `handleCancelInvite`.
- Invites tab badge uses `podData.invites.length`.

### Settings Tab

**Key component:**

- `src/components/pods/PodSettingsEditor.tsx`

**Editable fields:**

- Pod title
- Pod subtitle
- Tags (up to 5)
- Visibility (`public | private`)

**Behaviors:**

- Inline validation for:
  - Title required; 3–50 chars.
  - Subtitle ≤ 150 chars.
  - Max 5 tags; no duplicates.
- Visibility selector:
  - Public (🌍) – anyone can discover and apply.
  - Private (🔒) – invite-only.
- `onSave` from `OwnerDashboard` merges updates into `podData` and logs a `settings_changed` activity.

---

## Mock Data

Located under `src/mockData/`:

- `mockPods.ts`
  - `mockPod` is the primary source for the Owner Dashboard.
  - Includes: roles, members, applicants, invites, moderators, activities.
- `mockApplicants.ts`, `mockActivities.ts`
  - Additional supporting data for Pods.
- `mockUsers.ts`
  - 100 `SearchableUser` entries used by `UserSearchAutocomplete` for invite search.

These mocks make the Owner Dashboard fully interactive in development without a backend.

---

## Types

Core pod-related types are defined in:

- `src/types/pods.ts`

Notable interfaces:

- `Applicant` – matches applicants flowing through the Applicants tab.
- `Member` – used by the Members tab components.
- `Activity` and `ActivityType` – covers all actions (join, invite, promote, demote, remove, settings changes, etc.).

Keeping these types in sync with `mockPods.ts` and `OwnerDashboard.tsx` ensures the dashboard remains type-safe.

---

## Troubleshooting

If you run into environment or build issues, consult the official React Native docs:

- [Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- [Environment setup](https://reactnative.dev/docs/environment-setup)

---

## Production release

Need a signed Android App Bundle ready for the Play Store? See [ANDROID_RELEASE.md](ANDROID_RELEASE.md) for keystore setup, signing config, and release checklist commands.
