import { apiGet } from "@/lib/api/client";
import type { BusinessRole } from "@/features/auth/types";

export type MemberProfile = {
  id: string;
  role: BusinessRole;
  isBookable: boolean;
  user: { firstName: string; lastName: string; profileImageUrl: string | null };
  serviceAssignments: {
    service: {
      id: string;
      name: string;
      durationMinutes: number;
      price: string;
    };
  }[];
};
export type PublicMemberProfile = MemberProfile & {
  completedCount: number;
  ratingAverage: number | null;
  ratingCount: number;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customerName: string;
  }[];
};

export function getPublicMemberProfile(
  shop: string,
  member: string,
  token: string,
) {
  return apiGet<PublicMemberProfile>(
    `/barbershops/${encodeURIComponent(shop)}/barbers/${encodeURIComponent(member)}`,
    undefined,
    token,
    { fresh: true },
  );
}
