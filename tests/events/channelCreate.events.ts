'use strict';

import { GatewayEvents } from '../../src/socket/constants';
import Bot from '../../src/structures/bot/Bot';
import Channel from '../../src/structures/channels/Channel';
import config from '../config.json';

const bot = new Bot(config.token);
bot.connection.connect();

(async function () {
  await bot.events.wait(GatewayEvents.Ready);

  const [channel] = await bot.events.wait(GatewayEvents.ChannelCreate);

  console.log((channel as Channel).id);
})();
