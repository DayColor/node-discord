import User from '../../structures/User';
import Bot from '../../structures/bot/Bot';
import { Payload } from '../BotSocketShard';
import { BotEvent } from '../constants';

export default async ({ d }: Payload, bot: Bot): Promise<void> => {
  const { guild_id: guildId } = d;

  const guild = await bot.guilds.get(guildId);

  const user = new User(bot, d.user);

  // Member of the guild or the previously defined user
  const member = guild.members.get(user.id) || user;

  // Add the member to the Guild's bans Cluster
  guild.bans.set(member.id, member);

  bot.events.emit(BotEvent.GuildBanAdd, guild, member);
};
