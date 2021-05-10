import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Frame,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteGaleriesIdFrameId,
  login,
  postGaleriesIdFrames,
  postGalerie,
} from '@src/helpers/test';

import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');
const userPassword = 'Password0!';

describe('/galeries', () => {
  let app: Server;
  let galerieId: string;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await cleanGoogleBuckets();
      await sequelize.sync({ force: true });
      user = await createUser({});
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
      const {
        body: {
          data: {
            galerie,
          },
        },
      } = await postGalerie(app, token, {
        name: 'galerie\'s name',
      });
      galerieId = galerie.id;
    } catch (err) {
      done(err);
    }
    done();
  });

  afterAll(async (done) => {
    try {
      await cleanGoogleBuckets();
      await sequelize.sync({ force: true });
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('/:id', () => {
    describe('/frames', () => {
      describe('/:frameId', () => {
        describe('DELETE', () => {
          describe('it should return status 200 and', () => {
            it('delete frame', async () => {
              const {
                body: {
                  data: {
                    frame: {
                      id: frameId,
                    },
                  },
                },
              } = await postGaleriesIdFrames(app, token, galerieId);
              const {
                body: {
                  action,
                  data,
                },
                status,
              } = await deleteGaleriesIdFrameId(app, token, galerieId, frameId);
              const [bucketCropedImages] = await gc
                .bucket(GALERIES_BUCKET_PP_CROP)
                .getFiles();
              const [bucketOriginalImages] = await gc
                .bucket(GALERIES_BUCKET_PP)
                .getFiles();
              const [bucketPendingImages] = await gc
                .bucket(GALERIES_BUCKET_PP_PENDING)
                .getFiles();
              const frame = await Frame.findByPk(frameId);
              const galeriePictures = await GaleriePicture.findAll({
                where: {
                  frameId,
                },
              });
              const images = await Image.findAll();
              expect(action).toBe('DELETE');
              expect(bucketCropedImages.length).toBe(0);
              expect(bucketOriginalImages.length).toBe(0);
              expect(bucketPendingImages.length).toBe(0);
              expect(data.frameId).toBe(String(frameId));
              expect(data.galerieId).toBe(String(galerieId));
              expect(frame).toBeNull();
              expect(galeriePictures.length).toBe(0);
              expect(images.length).toBe(0);
              expect(status).toBe(200);
            });
            it('TODO: should destroy all likes', async () => {});
          });
          describe('it should return error 400', () => {
            it('TODO: frame is not upload by this user', async () => {});
            it('TODO: user\'s role is \'user\'', async () => {});
          });
          describe('it should return error 404', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdFrameId(app, token, '100', '100');
              expect(body.errors).toBe('galerie not found');
              expect(status).toBe(404);
            });
            it('frame not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdFrameId(app, token, galerieId, '100');
              expect(body.errors).toBe('frame not found');
              expect(status).toBe(404);
            });
            it('galerie exist but user is not subscribe to it', async () => {
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body: {
                  token: tokenTwo,
                },
              } = await login(app, userTwo.email, userPassword);
              const {
                body: {
                  data: {
                    galerie,
                  },
                },
              } = await postGalerie(app, tokenTwo, {
                name: 'galerie\'s name',
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdFrameId(app, token, galerie.id, '100');
              expect(body.errors).toBe('galerie not found');
              expect(status).toBe(404);
            });
            it('frame exist but not belong to the galerie', async () => {
              const {
                body: {
                  data: {
                    galerie,
                  },
                },
              } = await postGalerie(app, token, {
                name: 'galerie\'s name',
              });
              const {
                body: {
                  data: {
                    frame,
                  },
                },
              } = await postGaleriesIdFrames(app, token, galerie.id);
              const {
                body,
                status,
              } = await deleteGaleriesIdFrameId(app, token, galerieId, frame.id);
              expect(body.errors).toBe('frame not found');
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
