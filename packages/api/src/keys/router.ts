import express from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

interface UserKeyStore {
  updateUserKey: (params: {
    userId: string;
    name: string;
    value: string;
    expiresAt?: string;
  }) => Promise<unknown>;
  deleteUserKey: (params: { userId: string; name?: string; all?: boolean }) => Promise<unknown>;
  getUserKeyExpiry: (params: { userId: string; name?: string }) => Promise<unknown>;
}

interface AppConfig {
  interfaceConfig?: {
    userProvidedKeys?: boolean;
  };
}

interface UserKeyRouterDependencies {
  requireJwtAuth: RequestHandler;
  store: UserKeyStore;
  getAppConfig: (user: Request['user']) => Promise<AppConfig | undefined>;
}

function userKeyManagementGuard(getAppConfig: UserKeyRouterDependencies['getAppConfig']) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appConfig = await getAppConfig(req.user);
      if (appConfig?.interfaceConfig?.userProvidedKeys === false) {
        res
          .status(403)
          .send({ error: 'User-provided API keys are disabled by the administrator.' });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createUserKeyRouter({
  requireJwtAuth,
  store,
  getAppConfig,
}: UserKeyRouterDependencies): express.Router {
  const router = express.Router();
  router.use(requireJwtAuth, userKeyManagementGuard(getAppConfig));

  router.put('/', async (req, res) => {
    if (req.body == null || typeof req.body !== 'object') {
      return res.status(400).send({ error: 'Invalid request body.' });
    }
    const { name, value, expiresAt } = req.body as {
      name: string;
      value: string;
      expiresAt?: string;
    };
    await store.updateUserKey({ userId: req.user.id, name, value, expiresAt });
    return res.status(201).send();
  });

  router.delete('/:name', async (req, res) => {
    await store.deleteUserKey({ userId: req.user.id, name: req.params.name });
    return res.status(204).send();
  });

  router.delete('/', async (req, res) => {
    if (req.query.all !== 'true') {
      return res.status(400).send({ error: 'Specify either all=true to delete.' });
    }
    await store.deleteUserKey({ userId: req.user.id, all: true });
    return res.status(204).send();
  });

  router.get('/', async (req, res) => {
    const response = await store.getUserKeyExpiry({
      userId: req.user.id,
      name: req.query.name as string | undefined,
    });
    return res.status(200).send(response);
  });

  return router;
}
