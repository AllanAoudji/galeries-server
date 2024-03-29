import { compare } from 'bcrypt';
import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  BlackList,
  Frame,
  Galerie,
  GalerieUser,
  Image,
  Invitation,
  Like,
  ProfilePicture,
  Ticket,
  User,
} from '@src/db/models';

import {
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import {
  normalizeJoiErrors,
  validateDeleteUserMeBody,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  let passwordsMatch: boolean;

  // Check if user is created with Google or Facebook.
  // If true, the user can't delete his account.
  // (you need a password for it,
  // but account created with Google or Facebook doesn't have one).
  if (user.facebookId || user.googleId) {
    return res.status(400).send({
      errors: 'you can\'t delete your account if you\'re logged in with Facebook or Google',
    });
  }

  // Check if request.body is valid.
  const {
    error,
    value,
  } = validateDeleteUserMeBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Return error if
  // deleteAccountSentence/userNameOrEmail/password
  // are not send or not match.
  const errors: {
    deleteAccountSentence?: string;
    password?: string;
    userNameOrEmail?: string;
  } = {};
  if (value.deleteAccountSentence !== 'delete my account') {
    errors.deleteAccountSentence = 'wrong sentence';
  }
  try {
    passwordsMatch = await compare(value.password, user.password);
    if (!passwordsMatch) {
      errors.password = WRONG_PASSWORD;
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  if (
    value.userNameOrEmail !== user.email
    && `@${value.userNameOrEmail}` !== user.userName
  ) {
    errors.userNameOrEmail = 'wrong user name or email';
  }
  if (Object.keys(errors).length) {
    return res.status(400).send({
      errors,
    });
  }

  // Destroy all profile pictures/images
  // and images from Google buckets.
  try {
    const profilePictures = await ProfilePicture.findAll({
      include: [
        {
          all: true,
        },
      ],
      where: {
        userId: user.id,
      },
    });
    await Promise.all(
      profilePictures.map(async (profilePicture) => {
        const {
          cropedImage,
          originalImage,
          pendingImage,
        } = profilePicture;
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
          .bucket(cropedImage.bucketName)
          .file(cropedImage.fileName)
          .delete();
        await gc
          .bucket(originalImage.bucketName)
          .file(originalImage.fileName)
          .delete();
        await gc
          .bucket(pendingImage.bucketName)
          .file(pendingImage.fileName)
          .delete();
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // TODO: test this features
  // set Ticket.userId to null
  // if current user is the author
  // of the ticket.
  try {
    await Ticket.update({
      userId: null,
    }, {
      where: {
        userId: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // TODO: Test it.
  // Destroy all black list where blackList.userId === currentUser.id.
  // Put blackList.adminId to null where blackList.adminId === currentUser.id.
  // Put blackList.updatedById to null where blackList.updatedById === currentUser.id.
  try {
    await BlackList.destroy({
      where: {
        userId: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  try {
    await BlackList.update(
      { adminId: null },
      {
        where: {
          adminId: user.id,
        },
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  try {
    await BlackList.update(
      { updatedById: null },
      {
        where: {
          updatedById: user.id,
        },
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all frames/galeriePictures/images
  // and images from Google buckets.
  try {
    const frames = await Frame.findAll({
      include: [{
        all: true,
        include: [{
          all: true,
        }],
      }],
      where: {
        userId: user.id,
      },
    });
    await Promise.all(
      frames.map(async (frame) => {
        await frame.destroy();
        await Promise.all(
          frame.galeriePictures.map(
            async (galeriePicture) => {
              const {
                cropedImage,
                originalImage,
                pendingImage,
              } = galeriePicture;
              // TODO:
              // not sure it's required.
              await galeriePicture.destroy();
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
            },
          ),
        );
        await Like.destroy({
          where: { frameId: frame.id },
        });
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all likes and decrement there
  // relative frame.
  // TODO:
  // Need to test it.
  try {
    const likes = await Like.findAll({
      where: {
        userId: user.id,
      },
    });
    await Promise.all(
      likes.map(async (like) => {
        await like.destroy();
        await Frame.increment({
          numOfLikes: -1,
        }, {
          where: {
            id: like.id,
          },
        });
      }),

    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all galerieUser related to this user.
  // If user is the creator of the galerie
  // and if it is the only one left on this galerie,
  // destroy this galerie.
  // Else, set this galerie as archived.
  try {
    const galerieUsers = await GalerieUser.findAll({
      where: {
        userId: user.id,
      },
    });

    // Destroy all galerieUsers.
    await Promise.all(
      galerieUsers.map(async (galerieUser) => {
        await galerieUser.destroy();
        // If user's role is 'creator'
        // destroy all invitations.
        // if there is still user remain
        // on this galerie, set galerie.archived === true
        // else destroy this galerie.
        // TODO:
        // test it.
        if (galerieUser.role === 'creator') {
          await Invitation.destroy({
            where: {
              galerieId: galerieUser.galerieId,
            },
          });
          const allUsers = await GalerieUser.findAll({
            where: {
              galerieId: galerieUser.galerieId,
            },
          });
          if (allUsers.length === 0) {
            await Galerie.destroy({
              where: {
                id: galerieUser.galerieId,
              },
            });
          } else {
            await Galerie.update({
              archived: true,
            }, {
              where: {
                id: galerieUser.galerieId,
              },
            });
          }
        }
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all invitations.
  try {
    await Invitation.destroy({
      where: {
        userId: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy user.
  try {
    await user.destroy();
  } catch (err) {
    return res.status(500).send();
  }

  // Destroy session and log out.
  req.logOut();
  req.session.destroy((sessionError) => {
    if (sessionError) {
      res.status(401).send({
        errors: sessionError,
      });
    }
  });
  return res.status(200).send({
    action: 'DELETE',
  });
};
