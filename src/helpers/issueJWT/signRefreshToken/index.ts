import fs from 'fs';
import { sign } from 'jsonwebtoken';
import path from 'path';

import { User } from '@src/db/models';

const PRIV_KEY = fs.readFileSync(path.join('./id_rsa_priv.refreshToken.pem'));

export default ({ id, authTokenVersion }: User) => {
  const payload = {
    authTokenVersion,
    iat: Date.now(),
    sub: id,
  };
  const signedToken = sign(
    payload,
    PRIV_KEY,
    { algorithm: 'RS256' },
  );
  return signedToken;
};
