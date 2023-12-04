import Album from '../models/Album';

export class AlbumService {
  public async findAll() {
    try {
      const albums = await Album.find();
      return albums;
    } catch (error: any) {
      console.error('Error finding all albums:', error);
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async findOneById(id: string) {
    const album = await Album.findOne({ _id: id });
    return album;
  }

  public async findOneByCode(code: string) {
    try {
      const album = await Album.findOne({ code });
      if (!album) {
        throw new Error('AlbumNotFound');
      }
      return album;
    } catch (error: any) {
      console.error(`Error finding album by code: ${code}`, error);
      throw error;
    }
  }

  public async validateOneByCode(code: string): Promise<boolean> {
    try {
      const album = await Album.findOne({ code }).exec();
      return !!(album && !album.owner);
    } catch (error: any) {
      console.error(`Error validating album by code: ${code}`, error);
      throw new Error('DatabaseQueryFailed');
    }
  }

  public async updateAlbumUsed(id: string) {
    try {
      const album = await Album.findByIdAndUpdate(
        id,
        { isUsed: true },
        { new: true }
      );

      if (!album) {
        throw new Error('AlbumNotFound');
      }

      return album;
    } catch (error: any) {
      console.error(`Error updating album used status: ${id}`, error);
      throw new Error('DatabaseUpdateFailed');
    }
  }

  public async create(code: string, isUsed: boolean = false) {
    try {
      const album = new Album({ code, isUsed });
      const savedAlbum = await album.save();
      return savedAlbum.toObject();
    } catch (error: any) {
      console.error(`Error creating album with code: ${code}`, error);
      throw new Error('DatabaseSaveFailed');
    }
  }
}
