# Security audit — لغتي تحكي
Date: 2026-11-08
Scope: read-only review of the `main` branch source. No Firebase Console access was used and no live Firestore data or deployed rules were changed.

## Repositories and rollback points
- Main app: `98sb8hrtvn-crypto/lughaty-tahki-v8`
- Penalty game: `98sb8hrtvn-crypto/lughaty-penalty-shootout`
- Safety branch created in each repository: `safety/backup-before-integration-2026-11-08`
- Main app reviewed commit: `051d3bdc73642ef375098f71b1cf85a19c189a50`

## Confirmed source-level risks
1. `firestore.rules` grants public read access to student records, custom challenges, global app settings, feedback, and parent messages.
2. The same rules allow unauthenticated creates/updates/deletes for those collections, subject only to basic shape validation in some paths. Student deletion and multiple collection deletes are not admin-gated.
3. `src/App.tsx` treats `adminUnlockedByPin` as sufficient for teacher privileges. The PIN is checked in the client and a persistent `LT_ADMIN_UNLOCKED` flag is stored in localStorage. Client-side state/localStorage is not an authorization boundary.
4. `app_settings/global` is publicly readable and writable under the checked-in rules; the settings payload contains `adminPin`.
5. The app subscribes to entire collections for students, custom challenges, feedback, and parent messages. This exposes records to any client allowed by the current rules.
6. Parent messages are described as private in the UI, but collection-wide reads are permitted by the checked-in rules.
7. Student document writes use a public profile identifier as the ownership comparison in the checked-in rules; this is not a strong identity proof.
8. The app's student workflow does not establish Firebase Authentication for each student before syncing their profile. A rules change requiring authenticated student UIDs would therefore require a coordinated app migration.

## Why no rules were deployed
A restrictive rules-only change would likely break student registration/progress syncing and teacher workflows because the app currently relies on client-side PIN state and unauthenticated student profiles. A safe fix must coordinate:
- verified teacher identity enforced by Firebase Auth custom claims or a server-controlled allowlist;
- a student identity/ownership model (Firebase Auth UID or a trusted backend-issued identity);
- collection-specific read/write policies, including private parent-message access;
- migration and compatibility handling for existing student documents;
- emulator/rules tests for allowed and denied operations.

## Safe next steps
1. Confirm the actual deployed Firestore rules and database project in Firebase Console (not infer from the repository file).
2. Export/backup the Firestore database before migration.
3. Design and test the identity model and rules in a non-production Firebase project / Emulator Suite.
4. Update app authentication and data access in a separate feature branch.
5. Test registration, login, scoring, leaderboard, teacher settings, announcements, feedback, and parent messages with student and teacher test accounts.
6. Deploy rules and app changes in a coordinated release only after passing tests and confirming rollback.

## Explicitly not done
- No production Firestore rules changed.
- No student records changed or deleted.
- No `main` branch files changed.
- No Netlify or Google AI Studio deployment triggered.
