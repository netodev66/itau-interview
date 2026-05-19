// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loggerConfig } = require('./logger.config');

describe('loggerConfig', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  it('test env: level is silent, no transport', () => {
    process.env.NODE_ENV = 'test';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { loggerConfig: cfg } = require('./logger.config');
    expect(cfg.pinoHttp.level).toBe('silent');
    expect(cfg.pinoHttp.transport).toBeUndefined();
  });

  it('production env: level is info, no transport', () => {
    process.env.NODE_ENV = 'production';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { loggerConfig: cfg } = require('./logger.config');
    expect(cfg.pinoHttp.level).toBe('info');
    expect(cfg.pinoHttp.transport).toBeUndefined();
  });

  it('development env: level is debug, pino-pretty transport', () => {
    process.env.NODE_ENV = 'development';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { loggerConfig: cfg } = require('./logger.config');
    expect(cfg.pinoHttp.level).toBe('debug');
    expect(cfg.pinoHttp.transport).toBeDefined();
    expect(cfg.pinoHttp.transport.target).toBe('pino-pretty');
  });

  describe('genReqId', () => {
    it('uses x-request-id header when present', () => {
      const req = { headers: { 'x-request-id': 'my-trace-id' } } as any;
      const id = loggerConfig.pinoHttp.genReqId(req);
      expect(id).toBe('my-trace-id');
    });

    it('generates a UUID when x-request-id header is absent', () => {
      const req = { headers: {} } as any;
      const id = loggerConfig.pinoHttp.genReqId(req);
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });
  });

  describe('redact', () => {
    it('censors authorization header, password and refreshToken', () => {
      expect(loggerConfig.pinoHttp.redact.paths).toEqual(
        expect.arrayContaining([
          'req.headers.authorization',
          'req.body.password',
          'req.body.refreshToken',
        ]),
      );
      expect(loggerConfig.pinoHttp.redact.censor).toBe('[REDACTED]');
    });
  });
});
