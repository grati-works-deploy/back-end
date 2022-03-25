import { ICreateUserDTO } from '@modules/accounts/dtos/ICreateUserDTO';
import { IFindUserDTO } from '@modules/accounts/dtos/IFindUserDTO';
import { Prisma, User } from '@prisma/client';
import { IUsersRepository } from '@modules/accounts/repositories/IUsersRepository';
import { client } from '@shared/infra/prisma';
import { AppError } from '@shared/errors/AppError';

class UsersRepository implements IUsersRepository {
  async create({
    name,
    username,
    email,
    password,
    activated = false,
  }: ICreateUserDTO): Promise<any> {
    console.log('CHEGUEI AQUI1');
    await client.user
      .create({
        data: {
          name,
          username,
          email,
          password,
          activated,
        },
      })
      .then(user => {
        return user;
      })
      .catch(({ message }) => {
        if (message.includes('Unique constraint failed on the fields')) {
          if (message.includes('username'))
            throw new AppError('Username already in use');
          else if (message.includes('email'))
            throw new AppError('Email already in use');
        }

        throw new AppError('Unexpected error: ', message);
      });
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    const user = await client.user.update({
      where: { id },
      data,
    });

    return user;
  }

  async findByEmail(
    email: string,
    include?: Prisma.UserInclude,
  ): Promise<IFindUserDTO> {
    const user = await client.user.findUnique({
      where: { email },
      include,
    });

    return user as IFindUserDTO;
  }

  async findByUsername(
    username: string,
    include?: Prisma.UserInclude,
  ): Promise<IFindUserDTO> {
    const user = await client.user.findUnique({
      where: { username },
      include,
    });

    return user as IFindUserDTO;
  }

  async findById(
    id: number,
    include?: Prisma.UserInclude,
  ): Promise<IFindUserDTO> {
    const user = await client.user.findUnique({
      where: { id },
      include,
    });

    return user as IFindUserDTO;
  }

  async activate(id: number): Promise<void> {
    await client.user.update({
      where: { id },
      data: { activated: true },
    });
  }
}

export { UsersRepository };
