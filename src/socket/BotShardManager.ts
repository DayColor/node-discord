import { Serializable } from 'child_process';
import BotShard from './BotShard';
import { recommendedShardTimeout } from './constants';
import Cluster from '../Cluster';
import { ShardId } from '../types';

/**
 * Creates and manages all bot shards
 * @class
 */
class BotShardManager {
  private readonly token: string;
  private readonly shards: Cluster<ShardId, BotShard>;
  public readonly file: string;
  public readonly shardsAmount: number;

  constructor(file: string, token: string, shardsAmount: number) {
    this.file = file;
    this.token = token;
    this.shardsAmount = shardsAmount;

    this.shards = new Cluster<ShardId, BotShard>();
  }

  /**
   * Starts the shards and stores them inside a {@link Cluster}
   * @param {number} [timeout=5500] Time in milliseconds to wait for after creating each shard
   * @returns {Promise<void>}
   */
  public async start(timeout = recommendedShardTimeout): Promise<void> {
    for (let i = 0; i < this.shardsAmount; i++) {
      const shard = new BotShard(this, i);
      this.shards.set(shard.id, shard);

      shard.spawn();

      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, timeout));
    }
  }

  /**
   * Emits an event for all shards initiated with this manager
   * @param {string} event The event to be emitted
   * @returns {Promise<Serializable[]>}
   */
  public broadcast(event: string): Promise<Serializable[]> {
    const results: Promise<Serializable>[] = [];

    for (const shard of this.shards.values()) {
      results.push(shard.communicate(event));
    }

    return Promise.all(results);
  }

  /**
   * Emits an event for a specific shard.
   * Returns undefined if no shard matching the supplied ID was found
   * @param {string} event The event to be emitted
   * @param {ShardId} shardId The ID of the shard where this event should be emitted
   * @returns {Promise<Serializable> | null}
   */
  public send(event: string, shardId: ShardId): Promise<Serializable> | undefined {
    const shard = this.shards.get(shardId);

    if (!shard) return undefined;

    return shard.communicate(event);
  }
}

export default BotShardManager;
