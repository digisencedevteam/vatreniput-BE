import bcrypt from 'bcrypt';
import User from '../models/User';
import { UserType } from '../../types';
import Album from '../models/Album';
import {
  generateSecureToken,
  sendVerificationEmail,
} from '../helpers/helper';

export class UserService {
  public async registerUser(data: UserType, code: string) {
    const { email, password, username, firstName, lastName } = data;
    // Check if the email or username already exists
    const existingUser = await User.findOne().or([
      { email },
      { username },
    ]);
    if (existingUser) {
      throw new Error('Email or username already exists');
    }
    // check if album code is used
    const album = await Album.findOne({ code });
    if (!album || album.owner) {
      throw new Error('Album for regiatration invalid');
    }

    // Hash the password
    const hashedPassword =
      password && (await bcrypt.hash(password, 10));

    // send verification email
    const emailVerificationToken = await generateSecureToken(16);
    await sendVerificationEmail(email, emailVerificationToken);

    // Create a new user
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

    // Save the user to the database
    const savedUser = await newUser.save();

    // Link user to album and mark album as used
    await Album.findOneAndUpdate({ code }, { owner: savedUser._id });

    return savedUser.toObject(); // Convert the savedUser to a plain JavaScript object
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
    const user = await User.findOne({ _id });
    if (user) {
      const {
        _id: userId,
        password: _,
        ...userWithoutPassword
      } = user.toObject();
      return { _id: userId.toString(), ...userWithoutPassword };
    }
    return user;
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
      return null;
    }
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      });
      return user?.toObject();
    } catch (error) {
      throw error;
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
      throw new Error('Unable to update last login');
    }
  }
}
