import {
  Request,
  Response,
} from 'express';

import {
  Ticket,
  User,
} from '@src/db/models';

import { INVALID_UUID } from '@src/helpers/errorMessages';
import {
  ticketExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  let ticket: Ticket | null;
  let returnTicket = {};

  // Check if request.params.blackListId
  // is a UUID v4.
  if (!uuidValidatev4(ticketId)) {
    return res.status(400).send({
      errors: INVALID_UUID('ticket'),
    });
  }

  // Fetch ticket.
  try {
    ticket = await Ticket.findByPk(ticketId, {
      attributes: {
        exclude: ticketExcluder,
      },
      include: [
        {
          as: 'user',
          attributes: {
            exclude: userExcluder,
          },
          model: User,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if ticket exist.
  if (!ticket) {
    return res.status(404).send({
      errors: 'ticket not found',
    });
  }

  // Fetch current profile picture.
  try {
    let currentProfilePicture;
    if (ticket.user) {
      currentProfilePicture = await fetchCurrentProfilePicture(ticket.user);
    }
    returnTicket = {
      ...ticket.toJSON(),
      user: ticket.user ? {
        ...ticket.user.toJSON(),
        currentProfilePicture,
      } : null,
    };
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      ticket: returnTicket,
    },
  });
};
