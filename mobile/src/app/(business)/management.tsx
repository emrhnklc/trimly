import { BusinessPlaceholderScreen } from '@/features/business/components/BusinessPlaceholderScreen';

export default function BusinessManagementScreen() {
  return (
    <BusinessPlaceholderScreen
      description="Hizmetler, gelirler, çalışanlar, çalışma saatleri ve mağaza ayarları bu yönetim alanında toplanacak."
      icon={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
      title="Yönetim"
    />
  );
}
