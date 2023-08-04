export type UserType = {
  _id: string;
  username: string;
  email: string;
  password?: string;
  newPassword?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
};
export type AlbumType = {
  _id: string;
  code: string;
  isUsed: boolean;
};
