import { BusinessPlaceholderScreen } from '@/features/business/components/BusinessPlaceholderScreen';

export default function BusinessCustomersScreen() {
  return (
    <BusinessPlaceholderScreen
      description="Müşteri arama, son ziyaret, toplam ziyaret ve izin verilen geçmiş bilgilerini burada göstereceğiz."
      icon={{ ios: 'person.2', android: 'group', web: 'group' }}
      title="Müşteriler"
    />
  );
}
