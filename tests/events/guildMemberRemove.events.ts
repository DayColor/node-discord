'use strict';

import { BotEvent } from '../../src/socket/constants';
import User from '../../src/structures/User';
import Bot from '../../src/structures/bot/Bot';
import Member from '../../src/structures/member/Member';
import config from '../config.json';

const bot = new Bot(config.token);
bot.connection.connect();

(async function (): Promise<void> {
  bot.events.on(BotEvent.GuildMemberRemove, (member: Member | User) => {
    if (member instanceof Member) {
      console.log(
        'member of type Member',
        member.id,
        member.user?.username,
        member.nick,
        member.guild.name,
      );
    } else {
      console.log('member of type User', member.id, member.username);
    }
  });

  await bot.events.wait(BotEvent.Ready);
})();

bot.events.on(BotEvent.Debug, console.log);
