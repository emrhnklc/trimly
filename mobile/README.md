# Trimly Mobile

The customer and business mobile workspaces for Trimly, built with React Native, TypeScript, Expo and Expo Router.

For the product overview, architecture, backend setup and full local development guide, see the [main README](../README.md).

## Quick start

Start the backend first, then run from this directory:

```bash
npm ci
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `.env` to an API address reachable by your device:

- iOS Simulator: `http://localhost:3000`
- Android Studio emulator: `http://10.0.2.2:3000`
- Physical phone: `http://<your-computer-LAN-IP>:3000`

```bash
npx expo start --go --lan
```

Use a compatible Expo Go version. Native development builds can be started with `npm run ios` or `npm run android` when the corresponding native tooling is installed. Restart Expo after changing environment variables.

## Source layout

- `src/app/` — file-based routes and customer/business navigation.
- `src/features/` — feature-specific screens, state and API integration.
- `src/components/` — shared UI components.
- `src/lib/` — API client and navigation utilities.
- `src/theme/` — shared theme configuration.
- `assets/` — bundled images and branding.

## Checks

```bash
npx tsc --noEmit
npm run lint
```

Never place secrets in `EXPO_PUBLIC_*` environment variables; these values are included in the client bundle.
