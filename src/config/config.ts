export default {
  summary: {
    maxPointsCount: 5,
  },
  notifier: {
    checkInterval: 1000 * 60 * 5, // 5 minutes
  },
  subscriptions: {
    checkInterval: 1000 * 60 * 5, // 5 minutes
    maxTriesToRenew: 3,
  },
};
