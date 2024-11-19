const jwt = require('jsonwebtoken');

const PLUGIN_NAME = 'jwt-generate-header';

function cleanHeaders(context) {
  context.request.removeHeader('jwt-generate-header-payload');
}

module.exports.requestHooks = [
  async context => {
    console.log(`${PLUGIN_NAME} Running`);

    const jwtPayload = context.request.getHeader('jwt-generate-header-payload');
    if (!jwtPayload) {
      console.log(`${PLUGIN_NAME} No jwt-payload found`);
      return;
    }

    const jwtSettings = context.request.getEnvironmentVariable(
      'jwt-generate-header',
    );

    const jwtHeaderName = jwtSettings?.['jwt-header-name'];
    const jwtSecret = jwtSettings?.['jwt-secret'];
    const jwtAlgorithm = jwtSettings?.['jwt-algorithm'] ?? 'HS256';
    const jwtExpiresIn = jwtSettings?.['jwt-expiresIn'];

    if (!jwtSettings || !jwtHeaderName || !jwtSecret) {
      cleanHeaders(context);
      console.log(`${PLUGIN_NAME} Missing required parameters`);
      return;
    }

    try {
      let sig = jwt.sign(JSON.parse(jwtPayload), jwtSecret, {
        algorithm: jwtAlgorithm,
        ...(jwtExpiresIn ? { expiresIn: jwtExpiresIn } : {}),
      });
      context.request.addHeader(jwtHeaderName, `${sig}`);
    } catch (error) {
      console.log(`${PLUGIN_NAME} Error `, error);
    } finally {
      cleanHeaders(context);
    }
  },
];
