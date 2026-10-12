import { apiGet, apiPatch, apiPost } from '@/lib/api/client';
import type {
  CreateManagementServiceInput,
  DailyBusinessSummary,
  ManagementService,
  UpdateManagementServiceInput,
} from './types';
import type {
  BusinessCancellationPointReason,
  BusinessReliabilityActionType,
} from '@/features/appointments/types';

export type BusinessReliabilityStatus = {
  points90Days: number;
  cancellationCount90Days: number;
  metrics30Days: {
    businessCancellationCount: number;
    handledAppointmentCount: number;
    cancellationRatePercent: number;
    informationalOnly: boolean;
  };
  operationalSignals: {
    cancellationsToday: number;
    maxMemberCancellationsToday: number;
    consecutiveBusinessCancellations: number;
    earlyCancellations7Days: number;
  };
  recentCancellations: {
    id: string;
    appointmentId: string;
    cancelledAt: string;
    reason: string;
    points: number;
    pointReason: BusinessCancellationPointReason;
    minutesBeforeStart: number;
    appealStatus: 'NOT_REQUESTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    appealReason: string | null;
    appealReviewNote: string | null;
    appointment: {
      attendeeNameSnapshot: string;
      serviceNameSnapshot: string;
      startsAt: string;
    };
    businessMember: {
      user: { firstName: string; lastName: string };
    };
  }[];
  actions: {
    id: string;
    type: BusinessReliabilityActionType;
    businessMemberId: string | null;
    businessMember: {
      user: { firstName: string; lastName: string };
    } | null;
    startsAt: string;
    endsAt: string | null;
    resolvedAt: string | null;
  }[];
};

export function requestBusinessCancellationAppeal(
  barbershopId: string,
  eventId: string,
  reason: string,
  accessToken: string,
) {
  return apiPatch<{ success: true }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/reliability/cancellations/${encodeURIComponent(eventId)}/appeal`,
    { reason },
    accessToken,
  );
}

export function getBusinessReliability(barbershopId: string, accessToken: string) {
  return apiGet<BusinessReliabilityStatus>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/reliability`,
    undefined,
    accessToken,
  );
}

export function resolveBusinessMemberHold(
  barbershopId: string,
  actionId: string,
  accessToken: string,
) {
  return apiPatch<{ success: true }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/reliability/member-holds/${encodeURIComponent(actionId)}/resolve`,
    undefined,
    accessToken,
  );
}

export function getManagementServices(barbershopId: string, accessToken: string) {
  return apiGet<ManagementService[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/services/management`,
    undefined,
    accessToken,
  );
}

export function getManagementService(
  barbershopId: string,
  serviceId: string,
  accessToken: string,
) {
  return apiGet<ManagementService>(
    `/barbershops/${encodeURIComponent(barbershopId)}/services/management/${encodeURIComponent(serviceId)}`,
    undefined,
    accessToken,
  );
}

export function createManagementService(
  barbershopId: string,
  input: CreateManagementServiceInput,
  accessToken: string,
) {
  return apiPost<ManagementService>(
    `/barbershops/${encodeURIComponent(barbershopId)}/services`,
    input,
    accessToken,
  );
}

export function updateManagementService(
  barbershopId: string,
  serviceId: string,
  input: UpdateManagementServiceInput,
  accessToken: string,
) {
  return apiPatch<ManagementService>(
    `/barbershops/${encodeURIComponent(barbershopId)}/services/${encodeURIComponent(serviceId)}`,
    input,
    accessToken,
  );
}

export function getDailyBusinessSummary(
  barbershopId: string,
  date: string,
  accessToken: string,
) {
  return apiGet<DailyBusinessSummary>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/daily-summary`,
    { date },
    accessToken,
  );
}
