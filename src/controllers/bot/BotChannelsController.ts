import {
  Channel,
  DMChannel,
  GuildChannel,
  GuildTextChannel,
  TextBasedChannel,
} from '../../structures/channels';
import { Snowflake } from '../../types';
import { BaseDeleteController, BaseFetchController } from '../base';

/**
 * Provides an interface for the bot's channels cache.
 * The channels are mapped by their IDs
 */
export class BotChannelsController extends BaseFetchController<Channel>
  implements BaseDeleteController<Channel> {
  /**
   * Deletes a channel
   * @param {Snowflake} id The ID of the channel you wish to delete
   * @returns {Promise<void | Channel>}
   */
  public delete(id: Snowflake): Promise<void | Channel> {
    return this.bot.api.deleteChannel(id);
  }

  /**
   * Fetches a channel
   * @param {Snowflake} id The ID of the channel you wish to fetch
   * @returns {Promise<Channel>}
   */
  public fetch(id: Snowflake): Promise<Channel> {
    return this.bot.api.fetchChannel(id);
  }

  /** @inheritDoc */
  public async get(id: Snowflake): Promise<Channel> {
    const channel = await super.get(id);

    if (channel instanceof GuildChannel) {
      channel.guild.channels.cache.add(channel);
    } else if (channel instanceof DMChannel) {
      channel.recipient.dm = channel;
    }

    return channel;
  }

  /**
   * Gets or fetches a text channel by its ID
   * @param {Snowflake} id The ID of the text channel
   * @returns {Promise<TextBasedChannel>}
   */
  public async getText(id: Snowflake): Promise<TextBasedChannel> {
    const channel = await this.get(id);

    if (!(channel instanceof GuildTextChannel || channel instanceof DMChannel)) {
      throw new TypeError('The channel is not a valid text channel');
    }

    return channel;
  }

  /**
   * Gets or fetches a guild channel by its ID
   * @param {Snowflake} id The ID of the text channel
   * @returns {Promise<TextBasedChannel>}
   */
  public async getGuildChannel(id: Snowflake): Promise<GuildChannel> {
    const channel = await this.get(id);

    if (!(channel instanceof GuildChannel)) {
      throw new TypeError('The channel is not a valid guild channel');
    }

    return channel;
  }
}
