import Invite from '../../structures/Invite';
import Bot from '../../structures/bot/Bot';
import { Payload } from '../BotSocketShard';
import { BotEvents, GatewayEvents } from '../constants';

export const run = ({ d }: Payload, bot: Bot): void => {
  const invite = new Invite(bot, d);

  if (invite.guild) {
    invite.guild.invites.set(invite.code, invite);
  }

  bot.events.emit(BotEvents.InviteCreate, invite);
};

export const name = GatewayEvents.InviteCreate;
