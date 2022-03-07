import { Prisma, Profile } from '@prisma/client';

interface IProfilesRepository {
  create(data: Prisma.ProfileCreateInput): Promise<Profile>;
  update(id: number, data: Prisma.ProfileUpdateInput): Promise<Profile>;
  findById(
    id: number,
    select?: Prisma.ProfileSelect,
  ): Promise<Prisma.Prisma__ProfileClient<object>>;
  findProfileByUserAndOrganizationId(
    organization_id: number,
    user_id: number,
    select?: Prisma.ProfileSelect,
  ): Promise<Prisma.Prisma__ProfileClient<object>>;
  addPoints(id: number, points: number): Promise<void>;
}

export { IProfilesRepository };
