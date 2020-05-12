/**
 * Handles the conversion of timestamps receives from the Discord API into UNIX timestamps
 * @class
 */
class Timestamp {
  public date?: string;

  constructor(date: string | undefined) {
    this.date = date;
  }

  public unix(): number | undefined {
    return this.date ? Date.parse(this.date) : undefined;
  }
}

export default Timestamp;