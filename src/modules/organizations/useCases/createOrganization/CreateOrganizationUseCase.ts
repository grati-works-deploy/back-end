import { inject, injectable, container } from 'tsyringe';
import { IUsersRepository } from '@modules/accounts/repositories/IUsersRepository';
import { IOrganizationsRepository } from '@modules/organizations/repositories/IOrganizationsRepository';
import { AppError } from '@shared/errors/AppError';

import { SendOrganizationCreateMailUseCase } from '@modules/organizations/useCases/mail/sendOrganizationCreateMail/SendOrganizationCreateMailUseCase';
import { Organization } from '@prisma/client';

@injectable()
class CreateOrganizationUseCase {
  constructor(
    @inject('OrganizationsRepository')
    private organizationsRepository: IOrganizationsRepository,
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) {}

  async execute(authorId: string, name: string): Promise<Organization | void> {
    if (!authorId) {
      throw new AppError('Author id is required', 400, 'author.id.required');
    }

    const owner = await this.usersRepository.findById(Number(authorId));

    if (!owner) {
      throw new AppError('Owner not found', 404, 'owner.not_found');
    }

    try {
      await this.organizationsRepository
        .create({
          name,
          owner: {
            connect: {
              id: Number(owner.id),
            },
          },
        })
        .then(async organization => {
          await this.organizationsRepository.addUser(organization.id, owner);
          const userMail = owner.email;
          const sendOrganizationCreateMailUseCase = container.resolve(
            SendOrganizationCreateMailUseCase,
          );
          await sendOrganizationCreateMailUseCase.execute(
            userMail,
            name,
            organization.id,
          );

          return organization;
        });
    } catch ({ message }) {
      throw new AppError(message);
    }
  }
}

export { CreateOrganizationUseCase };
