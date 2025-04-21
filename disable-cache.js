// This file is used to disable Next.js static generation cache
module.exports = class NoCache {
  constructor(options) {
    // No options needed
  }

  async get() {
    // Always return null to force dynamic rendering
    return null;
  }

  async set() {
    // Do nothing
    return;
  }
};
