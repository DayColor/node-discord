import MessageAttachment from './MessageAttachment';
import MessageEmbed from './MessageEmbed';
import MessageMentions from './MessageMentions';
import Cluster from '../../Cluster';
import { Snowflake } from '../../types';
import BaseStruct, { GatewayStruct } from '../BaseStruct';
import Bot from '../Bot';
import Guild from '../Guild';
import Member from '../Member';
import User from '../User';
import TextChannel from '../channels/TextChannel';

/**
 * The type of a message
 */
enum MessageTypes {
  Default,
  ReceipientAdd,
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

class Message extends BaseStruct {
  /**
   * The message's ID
   */
  public id: Snowflake;

  /**
   * The guild the message was sent in. Possibly null if message was sent over a DM
   */
  public guild?: Guild;

  /**
   * The channel the message was sent in
   */
  public channel: TextChannel; // | DMChannel;

  /**
   * The author of this message.
   * Might not be a valid {@link User} object if message was generated by a webhook
   */
  public author: User;

  /**
   * The member properties for this message's author.
   * Might not exist if message was sent over a DM
   */
  public member?: Member;

  /**
   * The content of the message
   */
  public content: string;

  /**
   * Timestamp of when this message was sent
   */
  public sentAt: number;

  /**
   * Timestamp of when this message was edited.
   * Possibly null if message has not been edited
   */
  public editedTimestamp: number | null;

  /**
   * Whether this was a TTS message
   */
  public tts: boolean;

  /**
   * Whether this message mentions everyone
   */
  public mentionsEveryone: boolean;

  /**
   * All types of mentionable instances mentioned in this message
   */
  public mentions: MessageMentions;

  /**
   * {@link Cluster} of all {@link MessageAttachment}s attached to this message
   */
  public attachments: Cluster<Snowflake, MessageAttachment>;

  /**
   * All embedded content associated to this message
   */
  public embeds: MessageEmbed[];

  // public reactions?: MessageReaction;

  /**
   * Used for validating a message was sent
   */
  public nonce?: number | string;

  /**
   * Whether this message is pinned
   */
  public pinned: boolean;

  /**
   * The Webhook ID in case this message was generated by a Webhook
   */
  public webhookId?: undefined;

  /**
   * The type of the message
   */
  public type: MessageTypes;

  public activity?: undefined;

  public application?: undefined;

  public messageReference?: undefined;

  public flags?: undefined;

  constructor(bot: Bot, message?: GatewayStruct, channel?: TextChannel /* | DMChannel*/) {
    super(bot);

    this.guild = message.guild || channel?.guild;

    this.channel = channel;

    if (message) {
      this.build(message);
    }
  }

  protected build(message: GatewayStruct): void {
    this.mentions = new MessageMentions(this, {
      members: message.mentions,
      roles: message.mention_roles,
      channels: message.mention_channels,
    });

    this.attachments = new Cluster<Snowflake, MessageAttachment>(
      message.attachments.map(attachment => [attachment.id, new MessageAttachment(attachment)]),
    );

    this.embeds = message.embeds.map(embed => new MessageEmbed(embed));
  }
}

export default Message;