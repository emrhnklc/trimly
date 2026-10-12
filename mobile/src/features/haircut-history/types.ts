export type CustomerHaircutRecord = {
  id: string;
  styleName: string | null;
  notes: string | null;
  createdAt: string;
  photos: {
    id: string;
    mimeType: string;
    sizeBytes: number;
    sortOrder: number;
    url: string;
  }[];
  appointment: {
    id: string;
    dependentProfileId: string | null;
    attendeeNameSnapshot: string;
    dependentProfile: {
      id: string;
      firstName: string;
      lastName: string;
      archivedAt: string | null;
    } | null;
    serviceId: string;
    serviceNameSnapshot: string;
    priceSnapshot: string;
    durationMinutes: number;
    startsAt: string;
    barbershop: {
      id: string;
      name: string;
      slug: string;
    };
    businessMember: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
        profileImageUrl: string | null;
      };
    };
  };
};
