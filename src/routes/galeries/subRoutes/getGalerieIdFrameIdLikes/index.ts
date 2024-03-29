import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Frame,
  Galerie,
  Like,
  User,
} from '@src/db/models';

import { INVALID_UUID } from '@src/helpers/errorMessages';
import { userExcluder } from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
    galerieId,
  } = req.params;
  const limit = 20;
  const { page } = req.query;
  const currentUser = req.user as User;
  const usersWithProfilePicture: Array<any> = [];
  let frame: Frame | null;
  let galerie: Galerie | null;
  let likes: Array<Like>;
  let offset: number;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  // Check if request.params.galerie
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }
  // Check if request.params.frameId
  // is a UUID v4.
  if (!uuidValidatev4(frameId)) {
    return res.status(400).send({
      errors: INVALID_UUID('frame'),
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: currentUser.id,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }

  // Fetch Frame.
  try {
    frame = await Frame.findOne({
      where: {
        galerieId,
        id: frameId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if frame exist
  if (!frame) {
    return res.status(404).send({
      errors: 'frame not found',
    });
  }

  // Fetch likes
  try {
    likes = await Like.findAll({
      include: [
        {
          attributes: {
            exclude: userExcluder,
          },
          model: User,
          where: {
            id: {
              [Op.not]: currentUser.id,
            },
          },
        },
      ],
      limit,
      offset,
      order: [
        ['createdAt', 'DESC'],
      ],
      where: {
        frameId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch users profile pictures.
  try {
    await Promise.all(
      likes.map(async (like) => {
        const currentProfilePicture = await fetchCurrentProfilePicture(like.user);

        const returnedUser = {
          ...like.user.toJSON(),
          currentProfilePicture,
        };

        usersWithProfilePicture.push(returnedUser);
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      frameId,
      users: usersWithProfilePicture,
    },
  });
};
