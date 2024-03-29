import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';

import * as email from '@src/helpers/email';
import {
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
  TOKEN_NOT_FOUND,
  WRONG_PASSWORD,
  WRONG_TOKEN,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import * as verifyConfirmation from '@src/helpers/verifyConfirmation';
import {
  createUser,
  login,
  postUpdateEmailConfirm,
} from '@src/helpers/test';

import initApp from '@src/server';

const emailMocked = jest.spyOn(email, 'sendValidateEmailMessage');
const signMocked = jest.spyOn(jwt, 'sign');
const userPassword = 'Password0!';

describe('/users', () => {
  let app: Server;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      user = await createUser({});
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
    } catch (err) {
      done(err);
    }
    jest.clearAllMocks();
    done();
  });

  afterAll(async (done) => {
    try {
      await sequelize.sync({ force: true });
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('/me', () => {
    describe('/updateEmail', () => {
      describe('/confirm', () => {
        describe('POST', () => {
          describe('should return status 204 and', () => {
            it('send an email and sign a token', async () => {
              const newEmail = 'user2@email.com';
              jest.spyOn(verifyConfirmation, 'sendEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  emailTokenVersion: user.emailTokenVersion,
                  id: user.id,
                }));
              const { status } = await postUpdateEmailConfirm(
                app,
                token,
                'Bearer token',
                {
                  email: newEmail,
                  password: userPassword,
                },
              );
              expect(status).toBe(204);
              expect(signMocked)
                .toHaveBeenCalledTimes(1);
              expect(emailMocked)
                .toBeCalledWith(newEmail, expect.any(String));
              expect(emailMocked)
                .toHaveBeenCalledTimes(1);
            });
            it('should increment emailTokenVersion and updateEmailTokenVersion', async () => {
              jest.spyOn(verifyConfirmation, 'sendEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  emailTokenVersion: user.emailTokenVersion,
                  id: user.id,
                }));
              await postUpdateEmailConfirm(
                app,
                token,
                'Bearer token',
                {
                  email: 'user2@email.com',
                  password: userPassword,
                },
              );
              const {
                emailTokenVersion,
                updatedEmailTokenVersion,
              } = user;
              await user.reload();
              expect(user.emailTokenVersion)
                .toBe(emailTokenVersion + 1);
              expect(user.updatedEmailTokenVersion)
                .toBe(updatedEmailTokenVersion + 1);
            });
            it('should trim req email and password', async () => {
              const newEmail = 'user2@email.com';
              jest.spyOn(verifyConfirmation, 'sendEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  id: user.id,
                  emailTokenVersion: user.emailTokenVersion,
                }));
              await postUpdateEmailConfirm(
                app,
                token,
                'Bearer token',
                {
                  email: ` ${newEmail} `,
                  password: userPassword,
                },
              );
              expect(emailMocked)
                .toBeCalledWith(newEmail, expect.any(String));
            });
          });
          describe('should return 400', () => {
            beforeEach(() => {
              jest.spyOn(verifyConfirmation, 'sendEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  id: user.id,
                  emailTokenVersion: user.emailTokenVersion,
                }));
            });
            describe('if email', () => {
              it('is not set', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  'Bearer token',
                  {
                    password: userPassword,
                  },
                );
                expect(errors).toEqual({
                  email: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('is an empty string', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  'Bearer token',
                  {
                    email: '',
                    password: userPassword,
                  },
                );
                expect(errors).toEqual({
                  email: FIELD_IS_EMPTY,
                });
                expect(status).toBe(400);
              });
              it('is not a string', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  'Bearer token',
                  {
                    email: 1234,
                    password: userPassword,
                  },
                );
                expect(errors).toEqual({
                  email: FIELD_NOT_A_STRING,
                });
                expect(status).toBe(400);
              });
              it('is not an email', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  'Bearer token',
                  {
                    email: 'not an email',
                    password: userPassword,
                  },
                );
                expect(errors).toEqual({
                  email: FIELD_IS_EMAIL,
                });
                expect(status).toBe(400);
              });
              it('is the same than the old one', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  'Bearer token',
                  {
                    email: user.email,
                    password: userPassword,
                  },
                );
                expect(errors).toEqual({
                  email: 'should be a different one',
                });
                expect(status).toBe(400);
              });
            });
            describe('if password', () => {
              it('is not set', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  'Bearer token',
                  {
                    email: 'user2@email.com',
                  },
                );
                expect(errors).toEqual({
                  password: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('not match', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  'Bearer token',
                  {
                    email: 'user2@email.com',
                    password: 'wrong password',
                  },
                );
                expect(errors).toEqual({
                  password: WRONG_PASSWORD,
                });
                expect(status).toBe(400);
              });
            });
          });
          describe('should return 401 if', () => {
            describe('confirmToken', () => {
              it('is not send', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  undefined,
                  {
                    email: 'user2@email.com',
                    password: userPassword,
                  },
                );
                expect(errors).toBe(TOKEN_NOT_FOUND);
                expect(status).toBe(401);
              });
              it('is not \'Bearer ...\'', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  'confirmToken',
                  {
                    email: 'user2@email.com',
                    password: userPassword,
                  },
                );
                expect(errors).toBe(WRONG_TOKEN);
                expect(status).toBe(401);
              });
              it('is not the correct id', async () => {
                jest.spyOn(verifyConfirmation, 'sendEmailToken')
                  .mockImplementationOnce(() => ({
                    OK: true,
                    id: `${user.id}${user.id}`,
                    emailTokenVersion: user.emailTokenVersion,
                  }));
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  'Bearer token',
                  {
                    email: 'user2@email.com',
                    password: userPassword,
                  },
                );
                expect(errors).toBe(WRONG_TOKEN_USER_ID);
                expect(status).toBe(401);
              });
              it('has not the correct version', async () => {
                jest.spyOn(verifyConfirmation, 'sendEmailToken')
                  .mockImplementationOnce(() => ({
                    OK: true,
                    id: user.id,
                    emailTokenVersion: user.emailTokenVersion + 1,
                  }));
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUpdateEmailConfirm(
                  app,
                  token,
                  'Bearer token',
                  {
                    email: 'user2@email.com',
                    password: userPassword,
                  },
                );
                expect(errors).toBe(WRONG_TOKEN_VERSION);
                expect(status).toBe(401);
              });
            });
          });
        });
      });
    });
  });
});
