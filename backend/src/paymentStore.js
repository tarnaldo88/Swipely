const fs = require('node:fs');
const path = require('node:path');

class FilePaymentStore {
  constructor(filePath) {
    this.filePath = filePath || path.resolve(process.cwd(), 'data', 'payment-store.json');
    this.state = {
      processedEventIds: [],
      paymentsByOrderId: {},
    };
    this.load();
  }

  load() {
    try {
      const dir = path.dirname(this.filePath);
      fs.mkdirSync(dir, { recursive: true });

      if (!fs.existsSync(this.filePath)) {
        this.save();
        return;
      }

      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.state = {
        processedEventIds: Array.isArray(parsed?.processedEventIds)
          ? parsed.processedEventIds
          : [],
        paymentsByOrderId: parsed?.paymentsByOrderId || {},
      };
    } catch (error) {
      console.error('Failed to load payment store, using empty state:', error);
      this.state = {
        processedEventIds: [],
        paymentsByOrderId: {},
      };
    }
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  hasProcessedEvent(eventId) {
    return this.state.processedEventIds.includes(eventId);
  }

  markProcessedEvent(eventId) {
    if (!eventId || this.hasProcessedEvent(eventId)) {
      return;
    }

    this.state.processedEventIds.push(eventId);
    this.save();
  }

  getPayment(orderId) {
    return this.state.paymentsByOrderId[orderId] || null;
  }

  setPayment(orderId, record) {
    if (!orderId) {
      return;
    }

    this.state.paymentsByOrderId[orderId] = {
      ...(this.state.paymentsByOrderId[orderId] || {}),
      ...record,
      orderId,
      updatedAt: new Date().toISOString(),
    };
    this.save();
  }
}

module.exports = { FilePaymentStore };
