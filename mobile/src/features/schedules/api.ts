import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client';
import type {
  BusinessWorkingHours,
  CreateMemberScheduleBlockInput,
  MemberScheduleBlock,
  UpdateBusinessWorkingHoursInput,
} from './types';

export function getBusinessWorkingHours(barbershopId: string) {
  return apiGet<BusinessWorkingHours[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/working-hours`,
  );
}

export function updateBusinessWorkingHours(
  barbershopId: string,
  input: UpdateBusinessWorkingHoursInput,
  accessToken: string,
) {
  return apiPut<BusinessWorkingHours[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/working-hours`,
    input,
    accessToken,
  );
}

export function getMemberWorkingHours(
  barbershopId: string,
  memberId: string,
  accessToken: string,
) {
  return apiGet<BusinessWorkingHours[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/working-hours/members/${encodeURIComponent(memberId)}`,
    undefined,
    accessToken,
  );
}

export function updateMemberWorkingHours(
  barbershopId: string,
  memberId: string,
  input: UpdateBusinessWorkingHoursInput,
  accessToken: string,
) {
  return apiPut<BusinessWorkingHours[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/working-hours/members/${encodeURIComponent(memberId)}`,
    input,
    accessToken,
  );
}

export function getUpcomingScheduleBlocks(
  barbershopId: string,
  memberId: string,
  accessToken: string,
) {
  return apiGet<MemberScheduleBlock[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}/schedule-blocks`,
    undefined,
    accessToken,
  );
}

export function createMemberScheduleBlock(
  barbershopId: string,
  memberId: string,
  input: CreateMemberScheduleBlockInput,
  accessToken: string,
) {
  return apiPost<MemberScheduleBlock>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}/schedule-blocks`,
    input,
    accessToken,
  );
}

export function deleteMemberScheduleBlock(
  barbershopId: string,
  memberId: string,
  blockId: string,
  accessToken: string,
) {
  return apiDelete<{ success: boolean }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}/schedule-blocks/${encodeURIComponent(blockId)}`,
    accessToken,
  );
}
