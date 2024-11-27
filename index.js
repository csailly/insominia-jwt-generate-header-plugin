const jwt = require('jsonwebtoken');

const PLUGIN_NAME = 'jwt-generate-header';
const PLUGIN_ENVIRONMENT_SETTINGS = 'jwt-generate-header';
const JWT_PAYLOAD_HEADER_NAME = 'jwt-generate-header-payload'; //@deprecated

function cleanPluginHeader(context) {
  context.request.removeHeader(JWT_PAYLOAD_HEADER_NAME);
}

function getPayload(context, jwtHeaderName) {
  return (
    context.request.getHeader(jwtHeaderName) ??
    context.request.getHeader(JWT_PAYLOAD_HEADER_NAME)
  );
}

module.exports = {
  name: PLUGIN_NAME,
  displayName: 'JwtHeaderGenerator',
  description: 'Sign your header with JWT',

  requestHooks: [
    async context => {
      console.log(`${PLUGIN_NAME} Running`);

      const jwtSettings = context.request.getEnvironmentVariable(
        PLUGIN_ENVIRONMENT_SETTINGS,
      );

      const jwtHeaderName = jwtSettings?.['jwt-header-name'];
      const jwtSecret = jwtSettings?.['jwt-secret'];
      const jwtAlgorithm = jwtSettings?.['jwt-algorithm'] ?? 'HS256';
      const jwtExpiresIn = jwtSettings?.['jwt-expiresIn'];

      if (!jwtSettings || !jwtHeaderName || !jwtSecret) {
        cleanPluginHeader(context);
        console.log(`${PLUGIN_NAME} Missing required parameters`);
        return;
      }

      const jwtPayload = getPayload(context, jwtHeaderName);
      if (!jwtPayload) {
        console.log(`${PLUGIN_NAME} No jwt-payload found`);
        return;
      }

      try {
        let sig = jwt.sign(JSON.parse(jwtPayload), jwtSecret, {
          algorithm: jwtAlgorithm,
          ...(jwtExpiresIn ? { expiresIn: jwtExpiresIn } : {}),
        });
        context.request.setHeader(jwtHeaderName, `${sig}`);
      } catch (error) {
        console.log(`${PLUGIN_NAME} Error `, error);
      } finally {
        cleanPluginHeader(context);
      }
    },
  ],
};
