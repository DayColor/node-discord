import BaseController from './BaseController';
import { Snowflake } from '../../../types/types';
import { BaseStructWithId } from '../../BaseStruct';

/**
 * Base controller with delete capabilities
 * @template T
 */
abstract class BaseDeleteController<T extends BaseStructWithId> extends BaseController<T> {
  /**
   * Deletes a cached item
   * @param {Snowflake} id The ID of the item you wish to delete
   * @returns {Promise<T>}
   */
  abstract delete(id: Snowflake): Promise<T | void>;
}

export default BaseDeleteController;