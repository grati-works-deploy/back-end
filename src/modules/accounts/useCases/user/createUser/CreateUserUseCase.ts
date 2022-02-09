import { inject, injectable } from 'tsyringe';
import { hash } from 'bcryptjs';
import { IUsersRepository } from '@modules/accounts/repositories/IUsersRepository';
import { ICreateUserDTO } from '@modules/accounts/dtos/ICreateuserDTO';
import { AppError } from '@shared/errors/AppError';

@injectable()
class CreateUserUseCase {
    constructor(
        @inject("UsersRepository")
        private usersRepository: IUsersRepository
    ) {}
    async execute({ name, username, email, password }: ICreateUserDTO): Promise<void>  {
        const userAlreadyExists = await this.usersRepository.findByEmail(email);

        if (userAlreadyExists) {
            throw new AppError('User already exists');
        }

        const hashedPassword = await hash(password, 8);

        await this.usersRepository.create({
            name,
            username,
            email,
            password: hashedPassword
        });
    }
}

export { CreateUserUseCase };