import { Group, Prisma } from '@prisma/client';
import { client } from '@shared/infra/prisma';
import { IGroupsRepository } from '@modules/groups/repositories/IGroupsRepository';
import { AppError } from '@shared/errors/AppError';

class GroupsRepository implements IGroupsRepository {
  async create(
    organization_id: number,
    name: string,
    color?: string,
  ): Promise<Group> {
    const alreadyExistGroupNameInOrganization = await client.group.findFirst({
      where: {
        name,
        organization: {
          id: organization_id,
        },
      },
    });

    if (alreadyExistGroupNameInOrganization) {
      throw new AppError(
        'Group name already exist in this organization',
        400,
        'group.name.already_in_use',
      );
    }

    if (!color) color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    if (color.length === 5) color = `${color}0`;

    const createdGroup = await client.group.create({
      data: {
        organization: {
          connect: {
            id: organization_id,
          },
        },
        name,
        color,
      },
    });

    return createdGroup;
  }

  async edit(group_id: number, data: Prisma.GroupUpdateInput): Promise<void> {
    await client.group.update({
      where: { id: group_id },
      data,
    });
  }

  async addUser(
    organization_id: number,
    group_id: number,
    email: string,
  ): Promise<Group> {
    const user = await client.user.findUnique({
      where: { email },
    });

    let profile = await client.profile.findFirst({
      where: { user_id: user.id, organization_id },
    });

    if (profile === null) {
      profile = await client.profile.create({
        data: {
          organization_id,
          user_id: user.id,
        },
      });
    }

    const updatedGroup = await client.group.update({
      where: { id: group_id },
      data: {
        users: {
          connect: {
            id: profile.id,
          },
        },
      },
    });

    return updatedGroup;
  }

  async delete(group_id: number): Promise<void> {
    await client.group.update({
      where: { id: group_id },
      data: {
        permissions: {
          disconnect: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
      },
    });
    await client.group.delete({ where: { id: group_id } });
  }

  async findByNameAndOrganizationId(
    name: string,
    organization_id: number,
  ): Promise<Prisma.Prisma__GroupClient<any>> {
    const include = {
      permissions: true,
      objective: true,
    };

    let group = await client.group.findFirst({
      where: {
        name,
        organization: {
          id: organization_id,
        },
      },
      include,
    });

    if (name === 'Público' && !group) {
      group = await client.group.create({
        data: {
          organization: {
            connect: {
              id: organization_id,
            },
          },
          name,
          color: '#000000',
        },
        include,
      });
    }

    if (!group) {
      throw new AppError('Group not found', 404, 'group.not_found');
    }

    return group;
  }
}

export { GroupsRepository };
