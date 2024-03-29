import {
  Request,
  Response,
} from 'express';
import { customAlphabet } from 'nanoid';

import {
  Galerie,
  Invitation,
  User,
} from '@src/db/models';

import { INVALID_UUID } from '@src/helpers/errorMessages';
import {
  invitationExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@root/src/helpers/fetchCurrentProfilePicture';
import {
  normalizeJoiErrors,
  validatePostGaleriesIdInvationsBody,
} from '@src/helpers/schemas';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  const objectInvitationExcluder: { [key:string]: undefined} = {};
  const objectUserExcluder: { [key:string]: undefined} = {};
  let currentProfilePicture;
  let galerie: Galerie | null;
  let invitation: Invitation | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
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

  // Check if galerie is not archived.
  if (galerie.archived) {
    return res.status(400).send({
      errors: 'you cannot post invitation on an archived galerie',
    });
  }

  // Check if current user's role is
  // creator or admin.
  const { role } = galerie
    .users
    .filter((user) => user.id === currentUser.id)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to create an invitation',
    });
  }

  // Validate request.body.
  const {
    error,
    value,
  } = validatePostGaleriesIdInvationsBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // create invitation.
  try {
    invitation = await Invitation.create({
      ...value,
      userId: currentUser.id,
      galerieId,
      code: `${customAlphabet('1234567890', 4)()}-${customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 10)()}`,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch current profile picture.
  try {
    currentProfilePicture = await fetchCurrentProfilePicture(currentUser);
  } catch (err) {
    return res.status(500).send(err);
  }

  invitationExcluder.forEach((e) => {
    objectInvitationExcluder[e] = undefined;
  });
  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  const returnedInvitation = {
    ...invitation.toJSON(),
    ...objectInvitationExcluder,
    user: {
      ...currentUser.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture,
    },
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      galerieId,
      invitation: returnedInvitation,
    },
  });
};
