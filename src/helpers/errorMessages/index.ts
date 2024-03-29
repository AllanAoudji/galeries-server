// TODO:
// Better errors var name...

export const ALREADY_CONFIRMED = 'your account is already confirmed';
export const ALREADY_TAKEN = 'already taken';
export const FIELD_HAS_SPACES = 'can not contain spaces';
export const FIELD_NOT_A_STRING = 'should be a type of \'text\'';
export const FIELD_NOT_A_NUMBER = 'should be a type of \'number\'';
export const FIELD_IS_CONFIRM_PASSWORD = 'must match password';
export const FIELD_IS_EMAIL = 'should be a valid email';
export const FIELD_IS_EMPTY = 'cannot be an empty field';
export const FIELD_IS_PASSWORD = 'need at least on lowercase, one uppercase, one number and one special char';
export const FIELD_IS_REQUIRED = 'is required';
export const FIELD_MAX_LENGTH_THRITY = 'should have a maximum length of 30';
export const FIELD_MAX_LENGTH_TWO_HUNDRER = 'should have a maximum length of 200';
export const FIELD_MIN_LENGTH_OF_FIVE = 'should have a minimum length of 5';
export const FIELD_MIN_LENGTH_OF_TEN = 'should have a minimum length of 10';
export const FIELD_MIN_LENGTH_OF_THREE = 'should have a minimum length of 3';
export const FIELD_MIN_LENGTH_OF_HEIGH = 'should have a minimum length of 8';
export const FILE_IS_IMAGE = 'uploaded file must be an image';
export const FILE_IS_REQUIRED = 'file is required';
export const FILES_ARE_REQUIRED = 'files are required';
export const INVALID_UUID = (
  type:
  'black list' |
  'frame' |
  'galerie' |
  'galerie picture' |
  'invitation' |
  'profile picture' |
  'ticket' |
  'user',
) => `${type} id is not valide`;
export const NOT_ADMIN = 'you need to be an admin';
export const NOT_AUTHENTICATED = 'not authenticated';
export const NOT_CONFIRMED = 'You\'re account need to be confimed';
export const NOT_SUPER_ADMIN = 'you need to be a super admin';
export const TOKEN_NOT_FOUND = 'token not found';
export const USER_NOT_FOUND = 'user not found';
export const USER_IS_BLACK_LISTED = 'you\'re account is black listed';
export const USER_IS_LOGGED_IN = 'you are already authenticated';
export const WRONG_PASSWORD = 'wrong password';
export const WRONG_TOKEN = 'wrong token';
export const WRONG_TOKEN_VERSION = 'wrong token version';
export const WRONG_TOKEN_USER_ID = 'token user id are not the same as your current id';
