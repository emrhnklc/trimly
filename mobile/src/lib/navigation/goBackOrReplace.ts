import type { Href, ImperativeRouter } from 'expo-router';

/**
 * Pops only the closest stack so the source screen stays mounted. A concrete
 * route is used only when the screen was opened without a dismissible stack.
 */
export function goBackOrReplace(router: ImperativeRouter, fallback: Href) {
  if (router.canDismiss()) {
    router.dismiss();
    return;
  }

  router.replace(fallback);
}
