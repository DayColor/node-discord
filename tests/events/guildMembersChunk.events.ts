'use strict';

import { BotEvents } from '../../src/socket/constants';
import { GuildMembersChunk } from '../../src/socket/handlers/guildMembersChunk';
import Bot from '../../src/structures/bot/Bot';
import Guild from '../../src/structures/guild/Guild';
import config from '../config.json';

const bot = new Bot(config.token);
bot.connection.connect();

(async function (): Promise<void> {
  bot.events.on(
    BotEvents.GuildMembersChunk,
    (guild: Guild, nonce: string | undefined, chunk: GuildMembersChunk) => {
      console.log(guild.members.size, nonce, chunk);
    },
  );

  await bot.events.wait(BotEvents.Ready);
})();

bot.events.on(BotEvents.Debug, console.log);