import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DependentRelationship } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import { DependentsService } from './dependents.service';

describe('DependentsService', () => {
  const findFirst = jest.fn();
  const countDependents = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const remove = jest.fn();
  const countAppointments = jest.fn();
  const prisma = {
    dependentProfile: {
      count: countDependents,
      create,
      delete: remove,
      findFirst,
      update,
    },
    appointment: { count: countAppointments },
  } as unknown as PrismaService;
  const service = new DependentsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('never returns a dependent profile owned by another account', async () => {
    findFirst.mockResolvedValue(null);

    await expect(service.findOne('owner-1', 'dependent-2')).rejects.toThrow(
      NotFoundException,
    );
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          archivedAt: null,
          id: 'dependent-2',
          ownerId: 'owner-1',
        },
      }),
    );
  });

  it('limits one account to ten active dependent profiles', async () => {
    countDependents.mockResolvedValue(10);

    await expect(
      service.create('owner-1', {
        birthDate: '2018-04-12',
        firstName: 'Ali',
        lastName: 'Kaya',
        relationship: DependentRelationship.CHILD,
      }),
    ).rejects.toThrow(ConflictException);
    expect(create).not.toHaveBeenCalled();
  });

  it('requires a custom label when the relationship is other', async () => {
    countDependents.mockResolvedValue(0);

    await expect(
      service.create('owner-1', {
        birthDate: '2018-04-12',
        firstName: 'Ali',
        lastName: 'Kaya',
        relationship: DependentRelationship.DEPENDENT,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('stores the custom relationship label for other relatives', async () => {
    countDependents.mockResolvedValue(0);
    create.mockResolvedValue({ id: 'dependent-1' });

    await service.create('owner-1', {
      birthDate: '2018-04-12',
      firstName: 'Ali',
      lastName: 'Kaya',
      relationship: DependentRelationship.DEPENDENT,
      relationshipLabel: 'Kuzenim',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          relationshipLabel: 'Kuzenim',
        }) as object,
      }),
    );
  });

  it('archives a profile with preserved appointment history', async () => {
    findFirst.mockResolvedValue({ id: 'dependent-1' });
    countAppointments.mockResolvedValueOnce(0).mockResolvedValueOnce(2);
    update.mockResolvedValue({ id: 'dependent-1' });

    await expect(service.remove('owner-1', 'dependent-1')).resolves.toEqual({
      deleted: true,
    });
    expect(update).toHaveBeenCalledWith({
      data: { archivedAt: expect.any(Date) as Date },
      where: { id: 'dependent-1' },
    });
    expect(remove).not.toHaveBeenCalled();
  });
});
