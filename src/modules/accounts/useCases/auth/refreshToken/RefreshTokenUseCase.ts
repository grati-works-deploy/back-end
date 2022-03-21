import { inject, injectable } from 'tsyringe';
import { verify, sign } from 'jsonwebtoken';

import { IUsersTokensRepository } from '@modules/accounts/repositories/IUsersTokensRepository';
import { IDateProvider } from '@shared/container/providers/DateProvider/IDateProvider';
import auth from '@config/auth';

interface IPayload {
  sub: string;
  email: string;
}

interface ITokenResponse {
  token: string;
  refresh_token: string;
}

@injectable()
class RefreshTokenUseCase {
  constructor(
    @inject('UsersTokensRepository')
    private usersTokensRepository: IUsersTokensRepository,
    @inject('DayjsDateProvider')
    private dateProvider: IDateProvider,
  ) {}

  async execute(token: string): Promise<ITokenResponse> {
    const { email, sub } = verify(token, auth.secret_refresh_token) as IPayload;

    const user_id = sub;

    const userToken =
      await this.usersTokensRepository.findByUserIdAndRefreshToken(
        Number(user_id),
        token,
      );

    if (!userToken) {
      throw new Error('Refresh Token does not exists');
    }

    await this.usersTokensRepository.deleteById(userToken.id);

    const expires_at = this.dateProvider.addDays(auth.expires_in_refresh_token);

    const refresh_token = sign({ email }, auth.secret_refresh_token, {
      subject: sub,
      expiresIn: `${auth.expires_in_refresh_token}d`,
    });

    await this.usersTokensRepository.create({
      expires_at,
      token: refresh_token,
      user_id: Number(user_id),
      type: 'refresh_token',
    });

    const newToken = sign({}, auth.secret_token, {
      subject: user_id,
      expiresIn: auth.expires_in_token,
    });

    const { id, name, email, profile_picture } = await this.usersRepository.findByEmail(email);

    return {
      token: newToken,
      refresh_token,
      user: {
        id,
        name,
        email,
        profile_picture 
      }
    };
  }
}

export { RefreshTokenUseCase };
