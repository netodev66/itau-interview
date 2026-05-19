import { ConfigModuleOptions } from '@nestjs/config';

export const envConfig: ConfigModuleOptions = {
  envFilePath: '.env.local',
  ignoreEnvFile: process.env.NODE_ENV === 'production',
  isGlobal: true,
};
