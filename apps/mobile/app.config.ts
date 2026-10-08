import type { ExpoConfig } from 'expo/config';
const url = process.env.EXPO_PUBLIC_API_URL;
const release = process.env.APP_ENV === 'production' || process.env.APP_ENV === 'staging';
if (
  release &&
  (!url || !url.startsWith('https://') || /localhost|127\.0\.0\.1|10\.0\.2\.2/.test(url))
)
  throw new Error('APK builds require a deployed HTTPS EXPO_PUBLIC_API_URL');
const config: ExpoConfig = {
  name: 'Still',
  slug: 'still-workspace',
  version: '1.0.0',
  scheme: 'still',
  orientation: 'default',
  userInterfaceStyle: 'light',
  android: { package: 'com.still.workspace', versionCode: 1 },
  plugins: [
    'expo-router',
    ['expo-secure-store', { configureAndroidBackup: true }],
    ['expo-build-properties', { android: { usesCleartextTraffic: !release } }],
  ],
};
export default config;
