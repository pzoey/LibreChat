const { createUserKeyRouter, getAppConfigOptionsFromUser } = require('@librechat/api');
const { updateUserKey, deleteUserKey, getUserKeyExpiry } = require('~/models');
const { requireJwtAuth } = require('~/server/middleware');
const { getAppConfig } = require('~/server/services/Config/app');

module.exports = createUserKeyRouter({
  requireJwtAuth,
  store: { updateUserKey, deleteUserKey, getUserKeyExpiry },
  getAppConfig: (user) => getAppConfig(getAppConfigOptionsFromUser(user)),
});
