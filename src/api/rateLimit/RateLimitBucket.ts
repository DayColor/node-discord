import util from 'util';
import { Headers, Response } from 'node-fetch';
import { RateLimitQueue } from './RateLimitQueue';
import { Params, RequestFile, ReturnedData } from './Requests';
import { Bot } from '../../bot';
import { GatewayCloseCode } from '../../socket';
import { APIRequest } from '../APIRequest';
import { HttpMethod } from '../constants';
import { StatusCode, RateLimitHeaders, EndpointRoute } from '../endpoints';

export const ValidCodes: StatusCode[] = [StatusCode.OK, StatusCode.Created, StatusCode.NoContent];

export class RateLimitBucket {
  /**
   * The bot instance
   */
  private readonly bot: Bot;

  /**
   * The bot's token
   */
  private readonly token: string;

  /**
   * The queue associated to this bucket
   */
  private readonly queue: RateLimitQueue;

  /**
   * The route this bucket references
   */
  private readonly route: EndpointRoute;

  /**
   * The HTTP method this bucket references
   */
  private readonly method: HttpMethod;

  /**
   * The number of remaining requests this bucket has until the next reset {@link reset}
   */
  public remaining: number | undefined;

  /**
   * The number of total requests that can be made
   */
  private limit: number | undefined;

  /**
   * The Unix timestamp of the next refill for this bucket
   */
  private reset: number | undefined;

  /**
   * The current setTimeout that will run once the next refill is reached
   */
  private timeout: NodeJS.Timeout | undefined;

  constructor(bot: Bot, token: string, route: EndpointRoute, method: HttpMethod) {
    this.bot = bot;
    this.token = token;

    this.queue = new RateLimitQueue(this);

    this.route = route;
    this.method = method;

    /*
     Initialize the number of remaining requests to 1
     in order to determine the 'limit' and 'remaining' values after sending the first request.
     */
    this.remaining = 1;
  }

  /**
   * Creates a new API request and sends it if the bucket is capable of doing so
   * @param {string} endpoint The request endpoint
   * @param {Params} params The request params / body
   * @param {RequestFile[]} files The files sent in this request
   * @returns {Promise<ReturnedData | undefined>}
   */
  public async send<T = ReturnedData | undefined>(
    endpoint: string,
    params: Params,
    files?: RequestFile[],
  ): Promise<T> {
    // The rate limit is reached. Add request to the queue
    if (this.remaining !== undefined && this.remaining <= 0) {
      this.bot.debug(
        `You reached the rate limit for ${endpoint}. Your request will still go through, but make sure you don't do this again!`,
      );

      return this.queue.add(endpoint, params, files);
    }

    // Decrements the remaining number of requests (to later be updated by the fixed value)
    if (this.remaining) {
      this.remaining--;
    }

    // Creates a new API request
    const apiRequest = new APIRequest(
      this.token,
      endpoint,
      params,
      this.method,
      APIRequest.parseFiles(files),
    );

    const response = await apiRequest.send();

    // Sets the rate limit information given from the response's headers
    this.setLimits(response.headers);

    const json =
      response.status !== StatusCode.NoContent
        ? ((await response.json()) as ReturnedData)
        : undefined;

    if (json) {
      // Validates the response before proceeding
      this.validateResponse(response, json);
    }

    return (json as unknown) as T;
  }

  /**
   * Refill this bucket
   */
  private async refillBucket(): Promise<void> {
    // Set the remaining number of requests in this bucket back to its limit
    this.remaining = this.limit;

    // Delete the stored setTimeout function
    this.timeout = undefined;

    // Empties the queue
    await this.queue.free();
  }

  /**
   * Validates the response. Throws an error in case it is not valid
   * @param {Response} response The response received from sending an API request
   * @param {ReturnedData} json The parsed response in JSON
   */
  private validateResponse(response: Response, json: ReturnedData): void {
    switch (response.status) {
      case StatusCode.UnAuthorized:
        this.bot.connection.disconnectAll(GatewayCloseCode.AuthenticationFailed);
        throw new Error('Your Bot token is invalid! This connection has been terminated');
      case StatusCode.Forbidden:
        throw new Error(
          `The request to ${response.url} was rejected to to insufficient bot permissions`,
        );
      case StatusCode.TooManyRequests:
        throw new Error("You have reached Discord's API rate limit. Please slow down");
    }

    if (!ValidCodes.includes(response.status)) {
      // Debug the json response
      this.bot.debug('Error!', json);

      if (Array.isArray(json)) {
        throw new TypeError(
          `${response.url} - an error has occurred with an array response type - ${util.inspect(
            json,
          )}`,
        );
      } else {
        throw new Error(
          `${response.url} (${response.status} code) - ${
            json.message || json.content || util.inspect(json)
          }`,
        );
      }
    }
  }

  // TODO: Global rate limit
  /**
   * Sets the rate limit information given from the response's headers
   * @param {Headers} headers The response's headers
   */
  private setLimits(headers: Headers): void {
    // Retrieve all the rate limit information from the request headers
    const remaining = headers.get(RateLimitHeaders.Remaining);
    const limit = headers.get(RateLimitHeaders.Limit);
    const reset = headers.get(RateLimitHeaders.Reset);
    const resetAfter = headers.get(RateLimitHeaders.ResetAfter);

    // Set the parsed value of the rate limit information

    // Use the cached remaining number if this is not the first request for async requests
    this.remaining = this.limit ? this.remaining : remaining ? parseInt(remaining) : undefined;

    this.limit = limit ? parseInt(limit) : undefined;
    this.reset = reset ? parseFloat(reset) : undefined;

    if (!this.reset && !resetAfter) return;

    // Initialize the timeout for the bucket's refill if one hasn't been initialized before
    if (!this.timeout) {
      // The timeout until the bucket refills
      const refillTimeout =
        ((resetAfter && parseFloat(resetAfter)) || Date.now() - this.reset!) * 1000;

      this.timeout = setTimeout(this.refillBucket.bind(this), refillTimeout);
    }
  }
}
