import bcrypt from 'bcrypt';
import User from '../models/User';
import { UserType } from '../../types';
import Album from '../models/Album';
import {
  generateSecureToken,
  sendVerificationEmail,
} from '../helpers/helper';
import {
  BadRequestError,
  HttpError,
  InternalServerError,
  NotFoundError,
} from 'routing-controllers';

export class UserService {
  public async registerUser(data: UserType) {
    const { email, password, username, firstName, lastName } = data;
    if (!email || !password || !username || !firstName || !lastName) {
      throw new BadRequestError(
        'Nepotpuni podaci za registraciju korisnika.'
      );
    }
    const existingUser = await User.findOne().or([
      { email },
      { username },
    ]);
    if (existingUser) {
      throw new Error(
        'Već postoji korisnik sa tim emailom/korisničkim imenom.'
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = await generateSecureToken(16);
    await sendVerificationEmail(email, emailVerificationToken);

    const newUser = new User({
      email,
      password: hashedPassword,
      isEmailVerified: false,
      verificationToken: emailVerificationToken,
      username,
      firstName,
      lastName,
      role: 'regular',
    });

    const savedUser = await newUser.save();

    const album = new Album({
      owner: savedUser._id,
    });
    await album.save();

    return savedUser.toObject();
  }

  public async getUserByEmail(email: string): Promise<any> {
    const user = await User.findOne({ email });
    return user;
  }

  public async getUserByVerificationToken(
    token: string
  ): Promise<any> {
    const user = await User.findOne({
      verificationToken: token,
    }).exec();

    return user;
  }

  public async findOneWithoutPassword(
    _id: string
  ): Promise<UserType | null> {
    const user = await User.findOne({ _id }).lean();
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        _id: user._id.toString(),
      };
    }
    return null;
  }

  public async findOneByEmail(
    email: string
  ): Promise<UserType | null> {
    const user = await User.findOne({ email }).lean();
    return user;
  }

  public async findOneById(userId: string): Promise<UserType | null> {
    const user = await User.findOne({ _id: userId }).lean();
    return user;
  }

  public async updateUser(
    userId: string,
    updateData: Partial<UserType>
  ): Promise<any> {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundError('Korisnik nije pronađen.');
    }
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        {
          new: true,
        }
      );
      if (!updatedUser) {
        throw new BadRequestError(
          'Neuspješno ažuriranje korisničkih podataka.'
        );
      }
      return updatedUser;
    } catch (error) {
      throw new InternalServerError('Interna greška servera.');
    }
  }

  public async deleteUser(userId: string) {
    try {
      const user = await User.findByIdAndDelete(userId);
      return user;
    } catch (error) {
      throw error;
    }
  }

  public async checkUserAccessForTargetUser(
    user: any,
    targetUser: any
  ): Promise<boolean> {
    if (user._id.toString() === targetUser._id.toString()) {
      return true;
    }

    return false;
  }

  public async updateLastLogin(userId: string): Promise<void> {
    const updateData = { lastLogin: new Date() };
    try {
      await User.findByIdAndUpdate(userId, updateData);
    } catch (error) {
      throw new InternalServerError('Neuspješno ažuriranje.');
    }
  }
}
