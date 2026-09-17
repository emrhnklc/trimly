import { apiGet, apiPatch, apiPost, apiUpload } from '@/lib/api/client';
import { appendImageFile } from '@/lib/api/upload';
import type { Campaign, CampaignInput } from './types';

const campaignPath = (barbershopId: string) =>
  `/barbershops/${encodeURIComponent(barbershopId)}/campaigns`;

export function getActiveCampaigns(accessToken: string) {
  return apiGet<Campaign[]>('/campaigns', undefined, accessToken);
}

export function getActiveBarbershopCampaigns(barbershopId: string, accessToken: string) {
  return apiGet<Campaign[]>(campaignPath(barbershopId), undefined, accessToken);
}

export function getManagementCampaigns(barbershopId: string, accessToken: string) {
  return apiGet<Campaign[]>(`${campaignPath(barbershopId)}/management`, undefined, accessToken);
}

export function createCampaign(
  barbershopId: string,
  input: CampaignInput,
  accessToken: string,
) {
  return apiPost<Campaign>(campaignPath(barbershopId), input, accessToken);
}

export function updateCampaign(
  barbershopId: string,
  campaignId: string,
  input: Partial<CampaignInput> & { isActive?: boolean },
  accessToken: string,
) {
  return apiPatch<Campaign>(
    `${campaignPath(barbershopId)}/${encodeURIComponent(campaignId)}`,
    input,
    accessToken,
  );
}

export function uploadCampaignImage(
  barbershopId: string,
  campaignId: string,
  photo: { uri: string; mimeType?: string | null },
  accessToken: string,
) {
  const formData = new FormData();
  appendImageFile(formData, 'file', photo, 'campaign');
  return apiUpload<Campaign>(
    `${campaignPath(barbershopId)}/${encodeURIComponent(campaignId)}/image`,
    formData,
    accessToken,
  );
}
