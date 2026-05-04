# VIAN Native Android App

This project has been migrated from a PWA to a full native Android application using Kotlin and Jetpack Compose.

## Project Structure

- `app/`: The main Android application module.
  - `src/main/java/com/vian/app/`: Kotlin source code.
  - `src/main/res/`: Android resources (strings, themes).
- `.github/workflows/`: GitHub Actions configuration for CI/CD.
- `web_reference/`: Original PWA source code for reference.

## Building Locally

To build the APK locally, run:
```bash
./gradlew assembleDebug
```
The output APK will be at `app/build/outputs/apk/debug/app-debug.apk`.

## GitHub Actions (CI/CD)

Every time you push to the `main` or `master` branch, GitHub Actions will automatically:
1. Set up the Android environment.
2. Build the debug APK.
3. Upload the APK as a workflow artifact.

You can download the built APK from the **Actions** tab in your GitHub repository.

## Features Implemented (Native)

- **Room Database**: Local persistence for Notes, Expenses, Habits, Journal, and Events.
- **Jetpack Compose**: Modern declarative UI for the Dashboard.
- **Navigation**: Structured navigation between screens.
- **Repository Pattern**: Clean architecture for data management.
