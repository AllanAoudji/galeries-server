import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import Galerie from '../galerie';
import GaleriePicture from '../galeriePicture';
import Like from '../like';
import User from '../user';

interface FrameI {
  description?: string;
  galerieId?: string;
  id: string;
  numOfLikes: number;
  userId?: string;
}

@Table({
  tableName: 'frame',
})
export default class Frame extends Model implements FrameI {
  @Column({
    type: DataType.STRING,
  })
  description!: string;

  @ForeignKey(() => Galerie)
  @Column({
    type: DataType.UUID,
  })
  galerieId!: string;

  @Column({
    allowNull: false,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  // Each time someone like this frame,
  // increment by one.
  // Each time someone unlike this frame,
  // decrement by one.
  // numOfLikes prevent to fetch all users
  // who likes this frames to display the length
  // of all this users.
  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  numOfLikes!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => Galerie)
  galerie!: Galerie;

  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => GaleriePicture)
  galeriePictures!: GaleriePicture[];

  @HasMany(() => Like)
  likes!: Like[];
}
