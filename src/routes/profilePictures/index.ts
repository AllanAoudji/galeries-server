import { Router } from 'express';

import { uploadFile } from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteProfilePicturesId,
  getProfilePictures,
  getProfilePicturesId,
  postProfilePictures,
  putProfilePicturesId,
} from './subRoutes';

const router = Router();

const profilePicturesRoutes: () => Router = () => {
  router.delete('/:profilePictureId/', passport.authenticate('jwt', { session: false }), deleteProfilePicturesId);

  router.get('/', passport.authenticate('jwt', { session: false }), getProfilePictures);
  router.get('/:profilePictureId/', passport.authenticate('jwt', { session: false }), getProfilePicturesId);

  router.post('/', passport.authenticate('jwt', { session: false }), uploadFile, postProfilePictures);

  router.put('/:profilePictureId/', passport.authenticate('jwt', { session: false }), putProfilePicturesId);

  return router;
};
export default profilePicturesRoutes;
