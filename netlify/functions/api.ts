import serverless from 'serverless-http';
import { createExpressApp } from '../../server';

let cachedHandler: any;

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    const app = await createExpressApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(event, context);
};
