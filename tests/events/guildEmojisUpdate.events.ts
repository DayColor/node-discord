'use strict';

import Cluster from '../../src/Cluster';
import { BotEvents } from '../../src/socket/constants';
import Emoji from '../../src/structures/Emoji';
import Bot from '../../src/structures/bot/Bot';
import { Snowflake } from '../../src/types/types';
import config from '../config.json';

const bot = new Bot(config.token);
bot.connection.connect();

(async function (): Promise<void> {
  bot.events.on(
    BotEvents.GuildEmojisUpdate,
    (before: Cluster<Snowflake, Emoji>, after: Cluster<Snowflake, Emoji>) => {
      console.log(before.first?.name, after.first?.name);
    },
  );

  await bot.events.wait(BotEvents.Ready);
})();

bot.events.on(BotEvents.Debug, console.log);