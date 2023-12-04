import bcrypt from 'bcrypt';
import User from '../models/User';
import { UserType } from '../../types';
import Album from '../models/Album';
import { generateSecureToken, sendVerificationEmail } from '../helpers/helper';

export class UserService {
  public async registerUser(data: UserType, code: string) {
    const { email, password, username, firstName, lastName } = data;
    const existingUser = await User.findOne().or([{ email }, { username }]);
    if (existingUser) {
      throw new Error('Email ili korisničko ime već postoje');
    }
    const album = await Album.findOne({ code });
    if (!album || album.owner) {
      throw new Error(
        'Ipričavamo se, ali naš sustav nije pronašao aktivni album preko vašeg QR koda. Molimo vas da još jednom provjerite vaš album i pokušate ponovno. Hvala!'
      );
    }
    const hashedPassword = password && (await bcrypt.hash(password, 10));

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
    await Album.findOneAndUpdate({ code }, { owner: savedUser._id });

    return savedUser.toObject();
  }

  public async getUserByEmail(email: string): Promise<any> {
    const user = await User.findOne({ email });
    return user;
  }

  public async getUserByVerificationToken(token: string): Promise<any> {
    const user = await User.findOne({
      verificationToken: token,
    }).exec();

    return user;
  }

  public async findOneWithoutPassword(_id: string): Promise<UserType | null> {
    try {
      const user = await User.findOne({ _id });
      if (!user) {
        throw new Error('Korisnik nije pronađen.');
      }
      const {
        _id: userId,
        password: _,
        ...userWithoutPassword
      } = user.toObject();
      return { _id: userId.toString(), ...userWithoutPassword };
    } catch (error) {
      console.error(`Error fetching user with ID ${_id}:`, error);
      throw new Error('Došlo je do greške pri dohvaćanju detalja korisnika.');
    }
  }

  public async findOneByEmail(email: string): Promise<UserType | null> {
    try {
      const user = await User.findOne({ email }).lean();
      if (!user) {
        throw new Error('Korisnik s navedenom email adresom nije pronađen.');
      }
      return user;
    } catch (error) {
      console.error(`Greška pri traženju korisnika s emailom: ${email}`, error);
      throw new Error('Došlo je do greške pri traženju korisnika.');
    }
  }

  public async findOneById(userId: string): Promise<UserType | null> {
    try {
      const user = await User.findOne({ _id: userId }).lean();
      if (!user) {
        throw new Error('UserNotFound');
      }
      return user;
    } catch (error) {
      console.error(`Error finding user by ID: ${userId}`, error);
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async updateUser(
    userId: string,
    updateData: Partial<UserType>
  ): Promise<any> {
    try {
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      });
      if (!updatedUser) {
        throw new Error('UserUpdateFailed');
      }
      return updatedUser.toObject();
    } catch (error) {
      console.error(`Error updating user: ${userId}`, error);
      throw new Error('DatabaseUpdateFailed');
    }
  }

  public async deleteUser(userId: string) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new Error('Korisnik nije pronađen ili je već obrisan.');
      }
      return user;
    } catch (error) {
      console.error(`Greška pri brisanju korisnika s ID-om: ${userId}`, error);
      throw new Error('Došlo je do greške pri brisanju korisnika.');
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
      const updatedUser = await User.findByIdAndUpdate(userId, updateData);
      if (!updatedUser) {
        throw new Error('Korisnik nije pronađen.');
      }
    } catch (error) {
      console.error(
        `Greška pri ažuriranju vremena zadnje prijave za korisnika s ID-om: ${userId}`,
        error
      );
      throw new Error(
        'Došlo je do greške pri ažuriranju vremena zadnje prijave.'
      );
    }
  }
}
