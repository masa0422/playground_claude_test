import * as path from 'path';
import { app } from 'electron';

export const isDev = process.env.NODE_ENV === 'development';

export const getResourcePath = (relativePath: string): string => {
  if (isDev) {
    return path.join(process.cwd(), relativePath);
  }
  return path.join(process.resourcesPath, relativePath);
};

export const getAppDataPath = (): string => {
  return app.getPath('userData');
};

export const getDatabasePath = (): string => {
  return path.join(getAppDataPath(), 'wiki.db');
};

export const getConfigPath = (): string => {
  return path.join(getAppDataPath(), 'config');
};

export const getLogsPath = (): string => {
  return path.join(getAppDataPath(), 'logs');
};