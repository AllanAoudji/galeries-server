import Joi from 'joi';

import {
  FIELD_IS_EMPTY,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MAX_LENGTH_TWO_HUNDRER,
  FIELD_MIN_LENGTH_OF_THREE,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const galerieSchema = Joi.object({
  description: Joi.string()
    .allow('')
    .trim()
    .max(200)
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.max': FIELD_MAX_LENGTH_TWO_HUNDRER,
    }),
  name: Joi.string()
    .trim()
    .empty()
    .min(3)
    .max(30)
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'string.min': FIELD_MIN_LENGTH_OF_THREE,
    }),
});

export default (galerie: {
  name: string;
}) => galerieSchema
  .validate(galerie, options);
