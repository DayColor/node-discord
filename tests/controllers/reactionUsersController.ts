'use strict';

import { BotEvent } from '../../src/socket/constants';
import Bot from '../../src/structures/bot/Bot';
import { ChannelType } from '../../src/structures/channels/Channel';
import GuildChannel from '../../src/structures/channels/GuildChannel';
import GuildTextChannel from '../../src/structures/channels/GuildTextChannel';
import config from '../config.json';

const bot = new Bot(config.token);
bot.connection.connect();

(async function (): Promise<void> {
  await bot.events.wait(BotEvent.Ready);

  const guild = bot.guilds.get('702476896008405002');
  if (!guild) throw new Error('No guilds found');

  const channel = guild.channels.cache.filter<GuildTextChannel>(
    (channel: GuildChannel) => channel.type === ChannelType.GuildText,
  ).first;
  if (!channel) throw new Error('No channels found');

  const message = await channel.sendMessage('Test message');

  // Validate fetchAll's functionality
  message.react(guild.emojis.first!);

  await bot.events.wait(BotEvent.MessageReactionAdd);

  const reaction = message.reactions.cache.first;

  if (!reaction) throw new Error('Reaction not found!');

  await reaction.users.fetchAll();
  console.log(reaction.users.size, 'number of users that reacted', 'expected: 1'); // expected: 1

  // eslint-disable-next-line no-constant-condition
  while (1) {
    await Promise.race([
      bot.events.wait(BotEvent.MessageReactionAdd),
      bot.events.wait(BotEvent.MessageReactionRemove),
      bot.events.wait(BotEvent.MessageReactionRemoveAll),
      bot.events.wait(BotEvent.MessageReactionRemoveEmoji),
    ]);

    // Expected the size to change based on the event
    console.log(typeof message.reactions.cache.first, message.reactions.cache.first?.users.size);
  }
})();