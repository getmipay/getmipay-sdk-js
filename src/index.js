import Config from './config.js';
import Payments from './services/Payments.js';

export class GetMiPay {
  constructor(options = {}) {
    this.config = new Config(options);
    this.config.validate();
    this.payments = new Payments(this.config);
  }
}