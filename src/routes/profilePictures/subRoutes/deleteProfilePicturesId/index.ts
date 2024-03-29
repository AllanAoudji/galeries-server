import {
  Response,
  Request,
} from 'express';
import { Op } from 'sequelize';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import { INVALID_UUID } from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { profilePictureId } = req.params;
  const currentUser = req.user as User;
  let profilePicture: ProfilePicture | null;

  // Check if request.params.blackListId
  // is a UUID v4.
  if (!uuidValidatev4(profilePictureId)) {
    return res.status(400).send({
      errors: INVALID_UUID('profile picture'),
    });
  }

  // Check if profile picture exist.
  try {
    profilePicture = await ProfilePicture.findOne({
      include: [
        {
          all: true,
        },
      ],
      where: {
        id: profilePictureId,
        userId: currentUser.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!profilePicture) {
    return res.status(404).send({
      errors: 'profile picture not found',
    });
  }

  // Delete profile picture/images
  // and all image from Google buckets.
  const {
    cropedImage,
    originalImage,
    pendingImage,
  } = profilePicture;
  try {
    await profilePicture.destroy();
    await Image.destroy({
      where: {
        [Op.or]: [
          {
            id: cropedImage.id,
          },
          {
            id: originalImage.id,
          },
          {
            id: pendingImage.id,
          },
        ],
      },
    });
    await gc
      .bucket(originalImage.bucketName)
      .file(originalImage.fileName)
      .delete();
    await gc
      .bucket(cropedImage.bucketName)
      .file(cropedImage.fileName)
      .delete();
    await gc
      .bucket(pendingImage.bucketName)
      .file(pendingImage.fileName)
      .delete();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      profilePictureId,
    },
  });
};
