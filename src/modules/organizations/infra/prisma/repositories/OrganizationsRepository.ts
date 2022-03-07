import { Organization, Prisma, Profile } from '@prisma/client';
import { IOrganizationsRepository } from '@modules/organizations/repositories/IOrganizationsRepository';
import { client } from '@shared/infra/prisma';
import { IAddUserDTO } from '@modules/organizations/dtos/IAddUserDTO';
import { AppError } from '@shared/errors/AppError';

class OrganizationsRepository implements IOrganizationsRepository {
  async create(data: Prisma.OrganizationCreateInput): Promise<Organization> {
    const organization = await client.organization.create({
      data,
    });

    return organization;
  }

  async update(
    organization_id: number,
    data: Prisma.OrganizationUpdateInput,
  ): Promise<void> {
    await client.organization.update({
      where: { id: organization_id },
      data,
    });
  }

  async addUser(
    organization_id: number,
    { email }: IAddUserDTO,
  ): Promise<Organization> {
    const user = await client.user.findUnique({
      where: { email },
    });

    if (user) {
      const addedUser = await client.organization.update({
        where: { id: organization_id },
        data: {
          users: {
            create: {
              user_id: user.id,
            },
          },
        },
      });

      return addedUser;
    }
    throw new AppError('User not found');
  }

  async removeUser(organization_id: number, user_id: number): Promise<void> {
    const profile = await client.profile.findFirst({
      where: { user_id, organization_id },
    });

    await client.profile.delete({
      where: { id: profile.id },
    });
  }

  findById(id: number): Promise<Organization> {
    return client.organization.findUnique({
      where: { id },
    });
  }

  async checkIfUserIsOwner(
    user_id: number,
    organization_id: number,
  ): Promise<boolean> {
    const organization = await client.user.findUnique({
      where: { id: user_id },
      include: {
        owned_organizations: true,
      },
    });

    return organization.owned_organizations.some(
      organization => organization.id === organization_id,
    );
  }

  async getRanking(organization_id: number, page = 0): Promise<Profile[]> {
    const receiversAppears = {};
    const senderAppears = {};

    const feedbacks = await client.feedback.findMany({
      where: { organization_id },
      select: {
        sender_id: true,
        receivers: {
          select: {
            id: true,
          },
        },
      },
    });

    feedbacks.forEach(feedback => {
      feedback.receivers.forEach(receiver => {
        if (receiversAppears[receiver.id]) {
          receiversAppears[receiver.id] += 1;
        } else {
          receiversAppears[receiver.id] = 1;
        }
      });

      if (senderAppears[feedback.sender_id]) {
        senderAppears[feedback.sender_id] += 1;
      } else {
        senderAppears[feedback.sender_id] = 1;
      }
    });

    Object.values(receiversAppears).forEach((appears, key) => {
      receiversAppears[Object.keys(receiversAppears)[key]] =
        Number(appears) * 10;
    });

    Object.values(senderAppears).forEach((appears, key) => {
      receiversAppears[Object.keys(receiversAppears)[key]] +=
        Number(appears) * 5;
    });

    // TODO: order by points

    const ranking = await client.profile.findMany({
      where: { organization_id },
      orderBy: { points: 'desc' },
      skip: page * 10,
      take: 10,
    });

    return ranking;
  }
}

export { OrganizationsRepository };
