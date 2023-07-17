import bcrypt from 'bcrypt';
import User from '../models/User';
import { UserType } from '../../types';

export class UserService {
  public async registerUser(
    email: string,
    password: string,
    username: string
  ) {
    // Check if the email or username already exists
    const existingUser = await User.findOne().or([
      { email },
      { username },
    ]);
    if (existingUser) {
      throw new Error('Email or username already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
      username,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    return savedUser.toObject(); // Convert the savedUser to a plain JavaScript object
  }

  public async getUserByEmail(
    email: string
  ): Promise<UserType | null> {
    const user = await User.findOne({ email });
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
}
