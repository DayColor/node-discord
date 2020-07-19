import MessageAttachment from './MessageAttachment';
import MessageEmbed, { MessageEmbedData } from './MessageEmbed';
import MessageMentions from './MessageMentions';
import MessageReaction from './MessageReaction';
import Cluster from '../../Cluster';
import { Snowflake, TextBasedChannel } from '../../types/types';
import BaseStruct, { GatewayStruct } from '../BaseStruct';
import Timestamp from '../Timestamp';
import User from '../User';
import Bot from '../bot/Bot';
import MessageFlags from '../flags/MessageFlags';
import Guild from '../guild/Guild';
import Member from '../member/Member';

/**
 * The type of a message
 */
enum MessageType {
  Default,
  RecipientAdd,
  RecipientRemove,
  Call,
  ChannelNameChange,
  ChannelIconChange,
  ChannelPinnedMessage,
  GuildMemberJoin,
  UserPremiumGuildSubscription,
  UserPremiumGuildSubscriptionTier1,
  UserPremiumGuildSubscriptionTier2,
  UserPremiumGuildSubscriptionTier3,
  ChannelFollowAdd,
  GuildDiscoveryDisqualified,
  GuildDiscoveryRequalified,
}

export interface PartialMessage {
  id: Snowflake;
  guild?: Guild;
  channel: TextBasedChannel;
}

/**
 * Message activity types
 */
export enum MessageActivityType {
  Join = 1,
  Spectate,
  Listen,
  JoinRequest,
}

/**
 * Information about the message activity
 */
export interface MessageActivity {
  /**
   * The type of the message activity
   */
  type: MessageActivityType;

  /**
   * The party_id from a Rich Presence event
   * https://discord.com/developers/docs/rich-presence/how-to#updating-presence-update-presence-payload-fields
   */
  partyId?: string;
}

/**
 * Information about the message application
 */
export interface MessageApplication {
  /**
   * The ID of the application
   */
  id: Snowflake;

  /**
   * The ID of the embed's image asset
   */
  coverImage?: string;

  /**
   * The application's description
   */
  description: string;

  /**
   * The ID of the application's icon
   */
  icon: string | null;

  /**
   * The name of the application
   */
  name: string;
}

/**
 * Information about the message reference for crossposted messages
 */
export interface MessageReference {
  /**
   * ID of the originating message
   */
  messageId?: Snowflake;

  /**
   * ID of the originating message's channel
   */
  channelId: Snowflake;

  /**
   * ID of the originating message's guild
   */
  guildId?: Snowflake;
}

/**
 * The message data for when sending new messages
 */
export interface MessageData {
  /**
   * The message's raw content
   */
  content?: string;

  /**
   * The message's embed data
   */
  embed?: Partial<Omit<MessageEmbedData, 'type' | 'provider' | 'video'>> | MessageEmbed;
}

/**
 * The message options for when sending a new message
 */
export interface MessageOptions {
  /**
   * A nonce that can be used for identifying the sent message
   */
  nonce: number | string;

  /**
   * Whether this is a Text To Speech (TTS) message
   */
  tts: boolean;
}

/**
 * The message data for when editing a message
 */
export interface MessageEditData extends MessageData {
  /**
   * The new flags of the message
   */
  flags?: MessageFlags;
}

/**
 * Represents a message sent in a {@link TextChannel} within Discord
 */
class Message extends BaseStruct {
  /**
   * The message's ID
   */
  public id!: Snowflake;

  /**
   * The guild the message was sent in. Possibly null if message was sent over a DM
   */
  public guild: Guild | undefined;

  /**
   * The channel the message was sent in
   */
  public channel: TextBasedChannel;

  /**
   * The author of this message.
   * Might not be a valid {@link User} object if message was generated by a webhook
   */
  public author: User | undefined;

  /**
   * The member properties for this message's author.
   * Might not exist if message was sent over a DM
   */
  public member: Member | undefined;

  /**
   * The content of the message
   */
  public content!: string;

  /**
   * Timestamp of when this message was sent
   */
  public sentAt!: Timestamp;

  /**
   * Timestamp of when this message was edited.
   * Possibly null if message has not been edited
   */
  public editedAt!: Timestamp | null;

  /**
   * Whether this was a TTS message
   */
  public tts!: boolean;

  /**
   * Whether this message mentions everyone
   */
  public mentionsEveryone!: boolean;

  /**
   * All types of mentionable instances mentioned in this message
   */
  public mentions!: MessageMentions;

  /**
   * {@link Cluster} of all {@link MessageAttachment}s attached to this message
   */
  public attachments!: Cluster<Snowflake, MessageAttachment>;

  /**
   * All embedded content associated to this message
   */
  public embeds!: MessageEmbed[];

  /**
   * {@link Cluster} of all {@link MessageReaction} added to this message.
   * The reactions are mapped by the emoji name or emoji ID.
   */
  public reactions: Cluster<string, MessageReaction>;

  /**
   * Used for validating a message was sent
   */
  public nonce: number | string | undefined;

  /**
   * Whether this message is pinned
   */
  public pinned!: boolean;

  /**
   * The Webhook ID in case this message was generated by a Webhook
   */
  public webhookId: Snowflake | undefined;

  /**
   * The type of the message
   */
  public type!: MessageType;

  /**
   * Sent with Rich Presence-related chat embeds
   */
  public activity: MessageActivity | undefined;

  /**
   * Sent with Rich Presence-related chat embeds
   */
  public application: MessageApplication | undefined;

  /**
   * Reference data sent with crossposted messages
   */
  public messageReference: MessageReference | undefined;

  /**
   * Describes extra features of the message
   */
  public flags: MessageFlags | undefined;

  /**
   * Whether this message is deleted from its channel
   */
  public deleted: boolean;

  constructor(bot: Bot, message: GatewayStruct, channel: TextBasedChannel) {
    super(bot, message);

    this.channel = channel;

    this.reactions = new Cluster<Snowflake, MessageReaction>();

    this.deleted = false;

    this.init(message);
  }

  /**
   * @ignore
   * @param {GatewayStruct} message The message data
   * @returns {this}
   */
  public init(message: GatewayStruct): this {
    if (message.guild_id) {
      this.guild = this.bot.guilds.get(message.guild_id);
    }

    this.id = message.id;
    this.webhookId = message.webhook_id;

    if (!this.webhookId) {
      this.author = new User(this.bot, message.author);
    }

    this.content = message.content;
    this.sentAt = new Timestamp(message.timestamp);
    this.editedAt = message.edited_timestamp ? new Timestamp(message.edited_timestamp) : null;
    this.tts = message.tts;
    this.mentionsEveryone = message.mention_everyone;

    this.mentions = new MessageMentions(this, {
      users: message.mentions,
      roles: message.mention_roles,
      crosspostedChannels: message.mention_channels,
    });

    this.attachments = new Cluster<Snowflake, MessageAttachment>(
      message.attachments.map((attachment: GatewayStruct) => [
        attachment.id,
        new MessageAttachment(this, attachment),
      ]),
    );

    this.embeds = message.embeds.map((embed: GatewayStruct) => new MessageEmbed(this, embed));

    if (message.reactions) {
      this.reactions.merge(
        message.reactions.map((reaction: GatewayStruct) => [
          reaction.emoji.id,
          new MessageReaction(this, reaction),
        ]),
      );
    }

    this.nonce = message.nonce;
    this.pinned = message.pinned;
    this.type = message.type;

    if (message.activity) {
      this.activity = {
        type: message.activity.type,
        partyId: message.activity.party_id,
      };
    }

    if (message.application) {
      this.application = {
        id: message.application.id,
        coverImage: message.application.cover_image,
        description: message.application.description,
        icon: message.application.icon,
        name: message.application.name,
      };
    }

    if (message.message_reference) {
      this.messageReference = {
        messageId: message.message_reference.message_id,
        channelId: message.message_reference.channel_id,
        guildId: message.message_reference.guild_id,
      };
    }

    if (message.flags) {
      this.flags = new MessageFlags(message.flags);
    }

    return this;
  }

  /**
   * Creates a reaction for a message. This method requires the {@link Permission.ReadMessageHistory} permission to be present on the Bot. Additionally, if nobody else has reacted to the message using this emoji, this method requires the {@link Permission.AddReactions} permission to be present on the Bot.
   * @param {string} emoji The emoji to react to this message with
   * @returns {Promise<void>}
   */
  public addReaction(emoji: string): Promise<void> {
    return this.bot.api.addMessageReaction(this.channel.id, this.id, emoji);
  }

  /**
   * Deletes a reaction a user reacted with.
   * If no `userId` argument was provided, the Bot will remove its own reaction.
   * @param {string} emoji The emoji to remove from this message
   * @param {Snowflake} userId The ID of the user of which reaction should be removed
   * @returns {Promise<void>}
   */
  public removeReaction(emoji: string, userId: Snowflake = '@me'): Promise<void> {
    return this.bot.api.removeMessageReaction(this.channel.id, this.id, emoji, userId);
  }

  /**
   * Removes all reactions on a message. This method requires the {@link Permission.ManageMessages} permission to be present on the Bot
   * @returns {Promise<void>}
   */
  public removeReactions(): Promise<void> {
    return this.bot.api.removeMessageReactions(this.channel.id, this.id);
  }

  /**
   * Edits a previously sent message.
   * The fields `content`, `embed` and `flags` can be edited by the original message author. Other users can only edit `flags` and only if they have the {@link Permission.ManageMessages} permission in the corresponding channel.
   * @param {string | MessageEditData} data The updated message data.
   * Can be:
   * 1. Raw content to be edited to
   * @example ```typescript
   * message.edit('Updated content!');
   * ```
   * 2. A {@link MessageEditData} object, containing any of the fields
   * @example ```typescript
   * message.edit({ content: 'Updated content!', embed: { title: 'My Embed!' } });
   * ```
   * @returns {Promise<Message>}
   */
  public edit(data: string | MessageEditData): Promise<Message> {
    return this.bot.api.editMessage(this.channel.id, this.id, data);
  }

  /**
   * Deletes a message.
   * If operating on a {@link GuildChannel} and trying to delete a message that was not sent by the current user, this endpoint requires the {@link Permission.ManageMessages} permission
   * @returns {Promise<void>}
   */
  public delete(): Promise<void> {
    return this.bot.api.deleteMessage(this.channel.id, this.id);
  }

  /**
   * Pins this message.
   * Requires the {@link Permission.ManageMessages} permission
   * @returns {Promise<void>}
   */
  public pin(): Promise<void> {
    return this.bot.api.pinMessage(this.channel.id, this.id);
  }
}

export default Message;
