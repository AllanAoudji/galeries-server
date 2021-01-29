import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import { User } from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import {
  sendUpdateEmailMessage,
} from '@src/helpers/email';
import {
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import {
  validateSendUpdateEmailSchema,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

const SEND_EMAIL_SECRET = accEnv('SEND_EMAIL_SECRET');

export default async (req: Request, res: Response) => {
  const { error, value } = validateSendUpdateEmailSchema(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  const user = req.user as User;
  let passwordsMatch: boolean;
  try {
    passwordsMatch = await compare(value.password, user.password);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!passwordsMatch) {
    return res.status(400).send({
      errors: {
        password: WRONG_PASSWORD,
      },
    });
  }
  try {
    sign(
      {
        id: user.id,
        emailTokenVersion: user.emailTokenVersion,
      },
      SEND_EMAIL_SECRET,
      {
        expiresIn: '30m',
      },
      (err, emailToken) => {
        if (err) throw new Error(`something went wrong: ${err}`);
        if (emailToken) {
          sendUpdateEmailMessage(user.email, 'emailToken');
        }
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).send();
};