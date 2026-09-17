export type CampaignDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type CampaignType = 'PRICE_DISCOUNT' | 'GIFT' | 'LOYALTY';
export type CampaignRewardType = 'DISCOUNT' | 'GIFT';
export type CampaignLoyaltyPeriod = 'CALENDAR_MONTH' | 'ROLLING_DAYS';

export type CampaignService = {
  service: {
    id: string;
    name: string;
    price: string;
    durationMinutes: number;
  };
};

export type Campaign = {
  id: string;
  title: string;
  description: string | null;
  campaignType: CampaignType;
  rewardType: CampaignRewardType;
  discountType: CampaignDiscountType | null;
  discountValue: string | null;
  giftDescription: string | null;
  requiredCompletedVisits: number | null;
  loyaltyPeriod: CampaignLoyaltyPeriod | null;
  rollingPeriodDays: number | null;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string;
  usageLimit: number | null;
  perCustomerLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  barbershop: {
    id: string;
    name: string;
    slug: string;
    profileImageUrl: string | null;
    coverImageUrl: string | null;
    timezone: string;
  };
  services: CampaignService[];
  _count: { appointments: number };
  customerProgress?: {
    completedVisits: number;
    isEligible: boolean;
    redeemedCount: number;
    requiredVisits: number;
    remainingVisits: number;
  } | null;
};

export type CampaignInput = {
  title: string;
  description?: string;
  campaignType: CampaignType;
  rewardType?: CampaignRewardType;
  discountType?: CampaignDiscountType;
  discountValue?: string;
  giftDescription?: string;
  requiredCompletedVisits?: number;
  loyaltyPeriod?: CampaignLoyaltyPeriod;
  rollingPeriodDays?: number;
  startsAt: string;
  endsAt: string;
  serviceIds: string[];
  usageLimit?: number;
  perCustomerLimit?: number;
};

export function getCampaignPrice(price: string, campaign: Campaign) {
  const amount = Number(price);
  const value = Number(campaign.discountValue);
  if (
    campaign.rewardType !== 'DISCOUNT' ||
    !campaign.discountType ||
    campaign.discountValue === null ||
    !Number.isFinite(amount) ||
    !Number.isFinite(value)
  ) return amount;

  const discount = campaign.discountType === 'PERCENTAGE'
    ? amount * (value / 100)
    : Math.min(amount, value);
  return Math.max(0, amount - discount);
}

export function formatCampaignDiscount(campaign: Campaign) {
  if (campaign.rewardType === 'GIFT') return campaign.giftDescription || 'Hediye';
  const value = Number(campaign.discountValue);
  return campaign.discountType === 'PERCENTAGE'
    ? `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value)}`
    : `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value)}`;
}
