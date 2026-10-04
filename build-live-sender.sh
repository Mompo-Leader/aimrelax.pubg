#!/usr/bin/env bash
set -euo pipefail

echo '=== AIMRELAX LIVE V2 — EXPLICIT APK SIGNING ==='
command -v flutter >/dev/null || { echo 'ERROR: Flutter SDK is required.'; exit 1; }
[[ -f pubspec.yaml ]] || { echo 'ERROR: Run from Flutter project root.'; exit 1; }
# Always ensure a complete modern Flutter Android host project.
# Older AIMRELAX bundles may contain only a custom AndroidManifest.xml,
# which causes Flutter's deleted Android v1 embedding error.
if [[ ! -f android/app/build.gradle.kts || ! -f android/app/src/main/kotlin/com/aimrelax/aimrelax_live/MainActivity.kt ]]; then
  echo 'Android host project is incomplete; regenerating modern Flutter Android project...'
  rm -rf android
  flutter create --platforms=android --org=com.aimrelax --project-name=aimrelax_live .
fi
bash scripts/prepare_signing.sh
python3 scripts/configure_android.py
python3 scripts/verify_auth_config.py
flutter pub get
flutter analyze
flutter clean
flutter pub get
flutter build apk --release
UNSIGNED="build/app/outputs/flutter-apk/app-release.apk"
[[ -s "$UNSIGNED" ]] || { echo 'ERROR: APK missing'; exit 1; }
source android/signing.env
APKSIGNER=$(find "${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}/build-tools" -type f -name apksigner | sort -V | tail -n 1)
[[ -n "$APKSIGNER" ]] || { echo 'ERROR: apksigner not found'; exit 1; }
mkdir -p release
SIGNED="release/AIMRELAX-LIVE-V2-ANDROID-SIGNED.apk"
rm -f "$SIGNED"
"$APKSIGNER" sign --ks "$AIMRELAX_KEYSTORE" --ks-key-alias "$AIMRELAX_KEY_ALIAS" \
  --ks-pass "pass:$AIMRELAX_STORE_PASSWORD" --key-pass "pass:$AIMRELAX_KEY_PASSWORD" \
  --out "$SIGNED" "$UNSIGNED"
"$APKSIGNER" verify --verbose --print-certs "$SIGNED"
unzip -l "$SIGNED" | grep -E 'META-INF/.*\.(RSA|DSA|EC|SF)$' || { echo 'ERROR: signature entries missing'; exit 1; }
ls -lh "$SIGNED"
echo '=== SIGNED APK VERIFIED ==='
