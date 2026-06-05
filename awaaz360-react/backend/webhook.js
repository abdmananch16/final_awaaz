const { FUEL_WEBHOOK_TOKEN } = require('./config');
const { getFuelPrices } = require('./services');

function setupWebhookRoutes(app) {
  app.get('/webhooks/fuel-prices/refresh', async (req, res) => {
    await handleFuelRefresh(req, res);
  });

  app.post('/webhooks/fuel-prices/refresh', async (req, res) => {
    await handleFuelRefresh(req, res);
  });

  async function handleFuelRefresh(req, res) {
    // Authorization check
    if (FUEL_WEBHOOK_TOKEN) {
      const headerToken = req.headers['x-webhook-token'];
      const queryToken = req.query.token;
      if (headerToken !== FUEL_WEBHOOK_TOKEN && queryToken !== FUEL_WEBHOOK_TOKEN) {
        return res.status(401).json({ ok: false, error: 'unauthorized' });
      }
    }

    try {
      const result = await getFuelPrices();
      if (result.prices.length > 0) {
        res.json({
          ok: true,
          status: result.status,
          updated: result.updated,
          source: result.source,
          prices: result.prices,
        });
      } else {
        res.status(503).json({
          ok: false,
          status: 'error',
          updated: result.updated,
          source: result.source,
          prices: [],
        });
      }
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
}

module.exports = { setupWebhookRoutes };
