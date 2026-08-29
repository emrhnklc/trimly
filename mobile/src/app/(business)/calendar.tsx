import { BusinessPlaceholderScreen } from '@/features/business/components/BusinessPlaceholderScreen';

export default function BusinessCalendarScreen() {
  return (
    <BusinessPlaceholderScreen
      description="Çalışan filtreleri, günlük saat çizelgesi, molalar ve izin bloklarını bu sayfada kuracağız."
      icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
      title="Takvim"
    />
  );
}
