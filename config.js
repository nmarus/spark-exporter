module.exports = {
  token: process.env.TOKEN,
  maxPageItems: 100,
  maxConcurrent: 3,
  minTime: 100,
  requeueCodes: [ 429, 500, 501, 502, 503 ],
  requeueMinTime: 500,
  removeWebhooksOnStart: true,
  webhookSecret: 'nuyobiznass'
};
