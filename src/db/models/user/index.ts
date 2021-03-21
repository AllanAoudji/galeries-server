import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
  Default,
} from 'sequelize-typescript';

import BlackList from '../blackList';
import Frame from '../frame';
import Galerie from '../galerie';
import GalerieUser from '../galerieUser';
import Invitation from '../invitation';
import ProfilePicture from '../profilePicture';
import Ticket from '../ticket';
import Like from '../like';

interface UserI {
  authTokenVersion: number;
  blackListId?: string;
  confirmed: boolean;
  confirmTokenVersion: number;
  currentProfilePictureId?: string;
  defaultProfilePicture?: string;
  email?: string;
  emailTokenVersion: number;
  facebookId?: string;
  galeries?: Galerie[];
  GalerieUser: GalerieUser;
  googleId?: string;
  id: string;
  password: string;
  profilePictures: ProfilePicture[];
  pseudonym?: string;
  resetPasswordTokenVersion: number;
  role: 'superAdmin' | 'admin' | 'user';
  tickets: Ticket[];
  updatedEmailTokenVersion: number;
  userName: string;
}

@Table({
  tableName: 'users',
})
export default class User extends Model implements UserI {
  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  authTokenVersion!: number;

  @ForeignKey(() => BlackList)
  @Column({
    type: DataType.BIGINT,
  })
  blackListId!: string;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  confirmed!: boolean;

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  confirmTokenVersion!: number;

  @ForeignKey(() => ProfilePicture)
  @Column({
    type: DataType.BIGINT,
  })
  currentProfilePictureId!: string;

  @Column({
    type: DataType.STRING,
  })
  defaultProfilePicture!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  email!: string;

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  emailTokenVersion!: number;

  @Column({
    type: DataType.STRING,
  })
  facebookId!: string;

  @Column({
    type: DataType.STRING,
  })
  googleId!: string;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
  })
  password!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  pseudonym!: string;

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  resetPasswordTokenVersion!: number;

  @Default('user')
  @Column({
    type: DataType.STRING,
  })
  role!: 'superAdmin' | 'admin' | 'user';

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  updatedEmailTokenVersion!: number;

  @Column({
    allowNull: false,
    type: DataType.STRING,
    unique: true,
  })
  userName!: string;

  @BelongsTo(() => BlackList)
  blackList!: BlackList;

  @BelongsTo(() => ProfilePicture)
  currentProfilePicture!: ProfilePicture;

  @BelongsToMany(() => Galerie, () => GalerieUser)
  galeries!: Galerie[];

  @BelongsToMany(() => Frame, () => Like)
  likes!: Frame[];

  @HasMany(() => ProfilePicture)
  profilePictures!: ProfilePicture[];

  @HasMany(() => Ticket)
  tickets!: Ticket[];

  @HasMany(() => Frame)
  frames!: Frame[];

  @HasMany(() => Invitation)
  invitations!: Invitation[];

  GalerieUser!: GalerieUser;
}
