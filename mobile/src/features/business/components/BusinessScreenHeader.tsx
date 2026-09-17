import type { ReactNode } from 'react';

import { AppIconButton } from '@/components/ui/AppIconButton';
import { BrandedPageHeader } from '@/components/ui/BrandedPageHeader';

type BusinessScreenHeaderProps = {
  onNotificationPress?: () => void;
  rightAccessory?: ReactNode;
  showNotification?: boolean;
  subtitle?: string;
  title: string;
};

export function BusinessScreenHeader({
  onNotificationPress,
  rightAccessory,
  showNotification = false,
  subtitle,
  title,
}: BusinessScreenHeaderProps) {
  return (
    <BrandedPageHeader
      rightAccessory={
        rightAccessory ??
        (showNotification ? (
            <AppIconButton
              accessibilityLabel="Bildirimleri aç"
              icon={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }}
              onPress={onNotificationPress}
              size={19}
              variant="transparent"
            />
          ) : undefined)
      }
      subtitle={subtitle}
      title={title}
    />
  );
}
