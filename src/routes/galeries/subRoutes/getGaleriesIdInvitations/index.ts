import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  Invitation,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import { INVALID_UUID } from '@src/helpers/errorMessages';
import {
  invitationExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const limit = 20;
  const { galerieId } = req.params;
  const { page } = req.query;
  const currentUser = req.user as User;
  const returnedInvitations: Array<any> = [];
  let galerie: Galerie | null;
  let offset: number;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
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

  // Check if user'role for this galerie
  // is not 'user'.
  const { role } = galerie
    .users
    .filter((user) => user.id === currentUser.id)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to fetch the invitations',
    });
  }

  try {
    // Fetch all invitations.
    const invitations = await Invitation.findAll({
      attributes: {
        exclude: invitationExcluder,
      },
      include: [{
        attributes: {
          exclude: userExcluder,
        },
        model: User,
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: {
        galerieId,
      },
    });

    await Promise.all(
      invitations.map(async (invitation) => {
        let currentProfilePicture;
        let invitationHasExpired = false;
        let userIsBlackListed: boolean = false;
        // Check if invitation is not exipired.
        if (invitation.time) {
          const time = new Date(
            invitation.createdAt.getTime() + invitation.time,
          );
          invitationHasExpired = time < new Date(Date.now());
        }

        // If invitation has expired,
        // destroy this invitation.
        if (invitationHasExpired) {
          await invitation.destroy();
        } else {
          // check if user is blackListed.
          userIsBlackListed = await checkBlackList(invitation.user);

          // If user is black listed,
          // there no need to fetch current profile picture.
          // invitation.user = null.
          if (!userIsBlackListed) {
            // fetch current profile picture.
            currentProfilePicture = await fetchCurrentProfilePicture(invitation.user);
          }
          // Composed final invitation
          // and push it in returnedInvitations.
          const invitationWithUserWithProfilePicture: any = {
            ...invitation.toJSON(),
            user: !userIsBlackListed ? {
              ...invitation.user.toJSON(),
              currentProfilePicture,
            } : null,
          };
          returnedInvitations.push(invitationWithUserWithProfilePicture);
        }
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      invitations: returnedInvitations,
    },
  });
};
