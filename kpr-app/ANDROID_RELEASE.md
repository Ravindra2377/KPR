# Android Release Pipeline

## 1. Generate and secure the release keystore

```bash
cd android
mkdir -p ../keystores
keytool -genkey -v \
  -keystore ../keystores/kpr-release-key.keystore \
  -alias kpr_release_key \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass <STORE_PASSWORD> -keypass <KEY_PASSWORD> \
  -dname "CN=KPR, OU=KPR Team, O=KPR, L=Bengaluru, ST=KA, C=IN"
```

Keep the keystore and its passwords out of Git. Store the passwords in a secure vault or your local `~/.gradle/gradle.properties`.

## 2. Configure Gradle properties for secrets

Add the following to `~/.gradle/gradle.properties` (do **not** commit this file):

```
KPR_STORE_FILE=/absolute/path/to/kpr-app/keystores/kpr-release-key.keystore
KPR_KEY_ALIAS=kpr_release_key
KPR_STORE_PASSWORD=<your store password>
KPR_KEY_PASSWORD=<your key password>
```

CI systems can export the same values as environment variables to avoid storing secrets in repo files.

## 3. Build and sign the release AAB

```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

Then find the bundle at `android/app/build/outputs/bundle/release/app-release.aab` and verify it with `apksigner` if desired.

## 4. Additional recommendations

* Update `versionCode` and `versionName` in `android/app/build.gradle` for every release (e.g. `100`, `1.0.0`).
* Keep `proguard-rules.pro` aligned with the libraries you bundle (React Native, Hermes, Jitsi, etc.).
* Consider a GitHub Actions workflow or Fastlane lane that decrypts the keystore, sets the Gradle properties, and runs `bundleRelease` before uploading to Play's internal track.
* Enable Play App Signing to let Google guard the production key, and use an upload key of your own.
* Run `npm run lint && npm test` before every release to catch regressions.

## 5. CI + Fastlane

### GitHub Actions

Copy `.github/workflows/android-release.yml` from the repo to run a signed release pipeline that:

1. Decodes `KPR_KEYSTORE_BASE64` into `keystores/kpr-release-key.jks`.
2. Writes Android `gradle.properties` with `KPR_STORE_*` secrets (set them in your repo secrets).
3. Runs `npm ci`, `npm run lint`, `npm test`, and `./gradlew clean bundleRelease`.
4. Uploads the generated `app-release.aab` as an artifact and, optionally, calls `r0adkll/upload-google-play` when `upload_to_play` is `true` or the `UPLOAD_TO_PLAY` env var is set.

Required secrets for the workflow:

```
KPR_KEYSTORE_BASE64
KPR_KEY_ALIAS
KPR_STORE_PASSWORD
KPR_KEY_PASSWORD
PLAY_STORE_JSON (optional)
UPLOAD_TO_PLAY (optional, true/false)
```

### Fastlane

Use `bundle exec fastlane android release upload_to_play:false` locally or in CI (make sure environment variables are populated and `KPR_KEYSTORE_BASE64` is available).

Ensure `fastlane/google_play_service_account.json` is accessible when `upload_to_play` is `true`, or override `PLAY_STORE_JSON_PATH` with the path to your service account JSON.
