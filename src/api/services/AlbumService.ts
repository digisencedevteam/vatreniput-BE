import { AlbumType } from '../../types/index';
import Album from '../models/Album';

export class AlbumService {
  public async findAll() {
    const albums = await Album.find();
    return albums;
  }

  public async findOneById(id: string) {
    const album = await Album.findOne({ _id: id });
    return album;
  }

  public async findOneByCode(code: string) {
    const album = await Album.findOne({ code });
    return album;
  }

  public async validateOneByCode(code: string) {
    const album = await Album.findOne({ code });
    console.log(album, 'ALBUM', code);
    if (!album || album.isUsed) {
      return false;
    }
    return true;
  }

  public async updateAlbumUsed(id: string) {
    const album = await Album.findByIdAndUpdate(
      id,
      { isUsed: true },
      { new: true }
    );
    if (!album) {
      throw new Error('Album not found');
    }
    return album;
  }

  public async create(
    code: string,
    isUsed: boolean = false
  ): Promise<AlbumType> {
    const album = new Album({
      code,
      isUsed,
    });

    const savedAlbum = await album.save();

    return savedAlbum.toObject();
  }
}
