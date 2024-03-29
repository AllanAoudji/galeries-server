import {
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  INVALID_UUID,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import { userExcluder } from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUser = req.user as User;
  let currentProfilePicture;
  let user: User | null;
  let userIsBlackListed: boolean;

  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Don't allow to fetch current user.
  // To do that, use GET /users/me instead.
  if (userId === currentUser.id) {
    return res.status(400).send({
      errors: 'params.id cannot be the same as your current one',
    });
  }

  // Fetch confirmed/non blacklisted user with id.
  try {
    user = await User.findOne({
      attributes: {
        exclude: userExcluder,
      },
      where: {
        confirmed: true,
        id: userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }

  // Check if user is black listed.
  try {
    userIsBlackListed = await checkBlackList(user);
  } catch (err) {
    return res.status(500).send(err);
  }

  // TODO:
  // If currentUser.role === 'admin' || 'superAdmin'
  // include blackList user with a field user.isBlackListed.
  if (userIsBlackListed) {
    return res.status(404).send({
      errors: 'user is black listed',
    });
  }

  // Fetch current profile picture
  try {
    currentProfilePicture = await fetchCurrentProfilePicture(user);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Compose final returned user.
  const userWithProfilePicture: any = {
    ...user.toJSON(),
    currentProfilePicture,
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      user: userWithProfilePicture,
    },
  });
};
