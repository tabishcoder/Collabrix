/**
 * Azure Communication Services — identity and VoIP tokens.
 * Requires env: AZURE_CONNECTION_STRING (ACS resource connection string).
 */
const { CommunicationIdentityClient } = require('@azure/communication-identity');
const AcsUserIdentity = require('../../models/AcsUserIdentity');

let identityClient;

function getIdentityClient() {
  if (!identityClient) {
    const connectionString = process.env.AZURE_CONNECTION_STRING;
    if (!connectionString || !String(connectionString).trim()) {
      const err = new Error('AZURE_CONNECTION_STRING is not configured');
      err.statusCode = 503;
      throw err;
    }
    identityClient = new CommunicationIdentityClient(connectionString);
  }
  return identityClient;
}

function mapAcsError(err) {
  const out = new Error(err.message || 'Azure Communication Services error');
  out.statusCode = 503;
  out.cause = err;
  return out;
}

/**
 * Ensures a Collabrix user has a persisted ACS communication user id.
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {Promise<string>} communicationUserId
 */
async function ensureCommunicationUser(userId) {
  const existing = await AcsUserIdentity.findOne({ user: userId }).lean();
  if (existing?.communicationUserId) return existing.communicationUserId;

  const client = getIdentityClient();
  let communicationUserId;
  try {
    const acsUser = await client.createUser();
    communicationUserId = acsUser.communicationUserId;
  } catch (err) {
    throw mapAcsError(err);
  }

  try {
    await AcsUserIdentity.create({ user: userId, communicationUserId });
  } catch (err) {
    if (err.code === 11000) {
      const again = await AcsUserIdentity.findOne({ user: userId }).lean();
      if (again?.communicationUserId) return again.communicationUserId;
    }
    throw err;
  }

  return communicationUserId;
}

/**
 * Issues a VoIP-scoped token for calling (ACS Calling SDK on the client).
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {Promise<{ communicationUserId: string, token: string, expiresOn: Date }>}
 */
async function getTokenForUser(userId) {
  const communicationUserId = await ensureCommunicationUser(userId);
  const client = getIdentityClient();
  try {
    const tokenResponse = await client.getToken({ communicationUserId }, ['voip']);
    return {
      communicationUserId,
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn,
    };
  } catch (err) {
    throw mapAcsError(err);
  }
}

module.exports = {
  ensureCommunicationUser,
  getTokenForUser,
};
