export default {
  async scheduled(_event, env) {
    if (env.WHATSAPP_SENDING_ENABLED !== 'true') {
      console.log('[WhatsApp result dispatcher] Scheduled; sending remains paused until billing is funded.');
      return;
    }

    if (!env.APP_URL || !env.CRON_SECRET) {
      console.error('[WhatsApp result dispatcher] Missing APP_URL or CRON_SECRET.');
      return;
    }

    try {
      const response = await fetch(
        `${env.APP_URL.replace(/\/+$/, '')}/api/cron/dispatch-whatsapp-results`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
          signal: AbortSignal.timeout(55_000),
        },
      );

      if (!response.ok) {
        console.error(`[WhatsApp result dispatcher] App endpoint returned HTTP ${response.status}.`);
        return;
      }

      const result = await response.json().catch(() => null);
      if (!result?.success) {
        console.error('[WhatsApp result dispatcher] App did not complete the delivery batch.');
        return;
      }

      console.log('[WhatsApp result dispatcher] Delivery batch completed.', result.delivery);
    } catch (error) {
      console.error('[WhatsApp result dispatcher] Request failed.', error?.message || 'unknown error');
    }
  },
};
