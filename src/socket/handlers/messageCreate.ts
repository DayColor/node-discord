import Bot from '../../structures/bot/Bot';
import Message from '../../structures/message/Message';
import ChannelUtils from '../../utils/ChannelUtils';
import { Payload } from '../BotSocketShard';
import { BotEvent } from '../constants';

export default async ({ d }: Payload, bot: Bot): Promise<void> => {
  const { guild_id: guildId, channel_id: channelId } = d;

  const channel = await ChannelUtils.findText(bot, guildId, channelId);

  const message = new Message(bot, d, channel);

  // Add the message to the cache
  channel.messages.cache.add(message);

  // Set the last message ID of the channel to that message
  channel.lastMessageId = message.id;

  bot.events.emit(BotEvent.MessageCreate, message);
};
