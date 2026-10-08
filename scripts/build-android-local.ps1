param(
  [string]$ApiUrl = 'http://10.0.2.2:3001/api',
  [ValidatePattern('^[A-Z]$')][string]$DriveLetter = 'W'
)
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$uri = $null
if (![Uri]::TryCreate($ApiUrl, [UriKind]::Absolute, [ref]$uri) -or $uri.Scheme -notin @('http', 'https')) {
  throw 'ApiUrl must be an absolute HTTP(S) API URL, including /api.'
}
$createdDrive = $false
$buildRoot = $workspace
if ($workspace -match '[ &]') {
  $alias = "${DriveLetter}:"
  $existing = (& subst) | Where-Object { $_ -like "${alias}*" }
  if ($existing -and $existing -notlike "*=> $workspace") {
    throw "$alias is mapped to another directory. Select an unused DriveLetter."
  }
  if (!$existing) {
    if (Test-Path "${alias}\") { throw "$alias is already in use." }
    & subst $alias $workspace
    if ($LASTEXITCODE -ne 0) { throw 'Could not create short build path.' }
    $createdDrive = $true
  }
  $buildRoot = "${alias}\"
}
try {
  if (!$env:JAVA_HOME) {
    $jdk = Get-ChildItem (Join-Path $buildRoot '.local-tools/java') -Directory | Select-Object -First 1
    if (!$jdk) { throw 'Set JAVA_HOME to an installed JDK 17 or newer.' }
    $env:JAVA_HOME = $jdk.FullName
  }
  if (!$env:ANDROID_HOME) { $env:ANDROID_HOME = Join-Path $buildRoot '.local-tools/android-sdk' }
  if (!(Test-Path (Join-Path $env:ANDROID_HOME 'platforms/android-36'))) {
    throw 'Install Android SDK platform 36 and the SDK-56 native build dependencies first.'
  }
  $env:GRADLE_USER_HOME = Join-Path $buildRoot '.local-tools/gradle'
  $env:APP_ENV = 'development'
  $env:EXPO_PUBLIC_API_URL = $ApiUrl
  $env:NODE_ENV = 'production'
  # Keep the project and pnpm-resolved dependencies on the original drive.
  # Only tool/cache paths use the short alias: mixing W: and D: project roots
  # breaks React Native codegen's relative-path calculation on Windows.
  Push-Location (Join-Path $workspace 'apps/mobile')
  try {
    & pnpm exec expo prebuild --platform android --no-install --template expo-template-bare-minimum@56.0.37
    if ($LASTEXITCODE -ne 0) { throw 'Expo native project generation failed.' }
    Push-Location android
    try {
      # Invoke the checked-in Gradle wrapper JAR directly to avoid unquoted
      # ampersands in Windows batch scripts. Wrapper version remains pinned.
      $wrapper = Join-Path (Get-Location).Path 'gradle/wrapper/gradle-wrapper.jar'
      & (Join-Path $env:JAVA_HOME 'bin/java.exe') '-Xmx64m' '-Xms64m' '-classpath' $wrapper 'org.gradle.wrapper.GradleWrapperMain' ':app:assembleRelease' '--no-daemon' '--max-workers=2' '-PreactNativeArchitectures=arm64-v8a,x86_64' '-Pandroid.enableLintVital=false'
      if ($LASTEXITCODE -ne 0) { throw 'Android APK compilation failed.' }
    } finally { Pop-Location }
    $artifacts = Join-Path $workspace 'artifacts'
    New-Item -ItemType Directory -Force $artifacts | Out-Null
    Copy-Item -LiteralPath 'android/app/build/outputs/apk/release/app-release.apk' -Destination (Join-Path $artifacts 'still-local-preview.apk')
    Write-Host 'Created artifacts/still-local-preview.apk (development API; debug signing; embedded JS).'
    Write-Host 'This local preview is not a production-signed or deployed submission build.'
  } finally { Pop-Location }
} finally {
  if ($createdDrive) { & subst "${DriveLetter}:" /D }
}
