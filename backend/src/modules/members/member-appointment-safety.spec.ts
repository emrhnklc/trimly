import { MembersService } from './members.service';
import type { PrismaService } from '../../database/prisma.service';
import type { EmailService } from '../../common/email/email.service';

describe('MembersService existing appointment protection', () => {
  const findMember = jest.fn();
  const updateMember = jest.fn();
  const count = jest.fn();
  const findAppointments = jest.fn();
  const lock = jest.fn();
  const transaction = {
    $executeRaw: lock,
    businessMember: { findFirst: findMember, update: updateMember },
    appointment: { count, findMany: findAppointments },
  };
  const prisma = {
    ...transaction,
    $transaction: (callback: (tx: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
  } as unknown as PrismaService;
  const service = new MembersService(prisma, {} as EmailService);

  beforeEach(() => {
    jest.resetAllMocks();
    findMember.mockResolvedValue({
      id: 'member-1',
      role: 'BARBER',
      isActive: true,
      isBookable: true,
    });
    count.mockResolvedValue(0);
    lock.mockResolvedValue(1);
    updateMember.mockImplementation(({ data }: { data: object }) =>
      Promise.resolve({ id: 'member-1', ...data }),
    );
    findAppointments.mockResolvedValue([]);
  });

  it('returns a tenant-scoped, bounded list with participant snapshots', async () => {
    count.mockResolvedValue(101);
    findAppointments.mockResolvedValue([
      { id: 'appointment-1', attendeeNameSnapshot: 'Ali Kaya' },
    ]);
    await expect(
      service.getAppointmentImpact('shop-1', 'member-1'),
    ).resolves.toMatchObject({
      total: 101,
      appointments: [{ attendeeNameSnapshot: 'Ali Kaya' }],
    });
    expect(findMember).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'member-1', barbershopId: 'shop-1' },
      }),
    );
    expect(findAppointments).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
        where: {
          barbershopId: 'shop-1',
          businessMemberId: 'member-1',
          OR: [
            { status: 'CONFIRMED', endsAt: { gt: expect.any(Date) as Date } },
            { status: 'ARRIVED' },
          ],
        },
      }),
    );
  });

  it('does not disclose another business employee appointments', async () => {
    findMember.mockResolvedValue(null);
    await expect(
      service.getAppointmentImpact('other-shop', 'member-1'),
    ).rejects.toThrow('Çalışan bu işletmeye ait değil.');
    expect(count).not.toHaveBeenCalled();
    expect(findAppointments).not.toHaveBeenCalled();
  });

  it.each([{ isActive: false }, { role: 'APPRENTICE' as const }])(
    'blocks removal of employee access while appointments need resolution: %j',
    async (input) => {
      count.mockResolvedValue(2);
      await expect(
        service.updateMember('shop-1', 'member-1', input),
      ).rejects.toThrow('2 mevcut randevu çözülmeden');
      expect(updateMember).not.toHaveBeenCalled();
      expect(lock).toHaveBeenCalled();
      expect(count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            barbershopId: 'shop-1',
            businessMemberId: 'member-1',
          }) as object,
        }),
      );
    },
  );

  it('allows deactivation after appointments are resolved without deleting history or reassigning appointments', async () => {
    await expect(
      service.updateMember('shop-1', 'member-1', { isActive: false }),
    ).resolves.toMatchObject({ isActive: false, isBookable: false });
    expect(updateMember).toHaveBeenCalledWith({
      where: { id: 'member-1' },
      data: { isActive: false, isBookable: false },
      select: { id: true, role: true, isActive: true, isBookable: true },
    });
  });

  it('requires explicit acknowledgement to close new bookings with existing appointments', async () => {
    count.mockResolvedValue(3);
    await expect(
      service.updateBookable('shop-1', 'member-1', false),
    ).rejects.toThrow('3 mevcut randevu var.');
    expect(updateMember).not.toHaveBeenCalled();
  });

  it('acknowledged booking closure only changes the member flag', async () => {
    count.mockResolvedValue(3);
    await expect(
      service.updateBookable('shop-1', 'member-1', false, true),
    ).resolves.toMatchObject({ isBookable: false });
    expect(updateMember).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isBookable: false } }),
    );
  });

  it('cannot reopen an inactive employee', async () => {
    findMember.mockResolvedValue({
      id: 'member-1',
      isActive: false,
      role: 'BARBER',
    });
    await expect(
      service.updateBookable('shop-1', 'member-1', true),
    ).rejects.toThrow('Pasif bir çalışan');
    expect(updateMember).not.toHaveBeenCalled();
  });

  it('cannot reopen an apprentice', async () => {
    findMember.mockResolvedValue({
      id: 'member-1',
      isActive: true,
      role: 'APPRENTICE',
    });
    await expect(
      service.updateBookable('shop-1', 'member-1', true),
    ).rejects.toThrow('Çırak rolündeki çalışan');
  });

  it('preserves the ownership transfer requirement', async () => {
    findMember.mockResolvedValue({ id: 'member-1', role: 'OWNER' });
    await expect(
      service.updateMember('shop-1', 'member-1', { isActive: false }),
    ).rejects.toThrow('Sahiplik devri ayrı bir işlemdir.');
    expect(updateMember).not.toHaveBeenCalled();
  });
});
