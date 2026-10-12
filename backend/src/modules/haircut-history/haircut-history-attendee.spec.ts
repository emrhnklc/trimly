import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import { HaircutHistoryService } from './haircut-history.service';

describe('customer haircut history attendees', () => {
  it('scopes history to the authenticated account and returns archived attendee metadata', async () => {
    const archivedAttendee = {
      id: 'dependent-1',
      firstName: 'Ali',
      lastName: 'Kaya',
      archivedAt: new Date('2026-10-08T00:00:00.000Z'),
    };
    const findMany = jest
      .fn<Promise<unknown[]>, [Prisma.HaircutRecordFindManyArgs]>()
      .mockResolvedValue([
        {
          id: 'self-record',
          photos: [],
          appointment: {
            dependentProfileId: null,
            attendeeNameSnapshot: 'Emir Kaya',
            dependentProfile: null,
          },
        },
        {
          id: 'child-record',
          photos: [{ id: 'photo-1' }],
          appointment: {
            dependentProfileId: archivedAttendee.id,
            attendeeNameSnapshot: 'Ali Kaya',
            dependentProfile: archivedAttendee,
          },
        },
      ]);
    const service = new HaircutHistoryService({
      haircutRecord: { findMany },
    } as unknown as PrismaService);

    const records = await service.findForCustomer('account-1');

    expect(findMany).toHaveBeenCalledTimes(1);
    const query = findMany.mock.calls[0][0];
    expect(query.where).toEqual({ appointment: { customerId: 'account-1' } });
    expect(query.select?.appointment).toMatchObject({
      select: {
        dependentProfileId: true,
        attendeeNameSnapshot: true,
        dependentProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            archivedAt: true,
          },
        },
      },
    });
    expect(records[0].photos).toEqual([]);
    expect(records[1].appointment.dependentProfile).toEqual(archivedAttendee);
    expect(records[1].photos[0].url).toBe(
      '/haircut-records/child-record/photos/photo-1',
    );
  });
});
