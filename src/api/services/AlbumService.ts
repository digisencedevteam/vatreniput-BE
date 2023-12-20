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

  public async updateAlbumUsed(id: string) {
    const album = await Album.findByIdAndUpdate(
      id,
      { isUsed: true },
      { new: true }
    );
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
