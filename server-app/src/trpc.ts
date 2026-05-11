import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Request, Response } from 'express';
import { getUserFromRequest } from './auth.js';
import type { User } from './schema.js';

export type Context = {
  req: Request;
  res: Response;
  user: User | null;
};

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  const user = await getUserFromRequest(req);
  return { req, res, user };
}

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول أولاً' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requireAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول أولاً' });
  if (!['superadmin', 'admin'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'ليس لديك صلاحية' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requireSuperAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول أولاً' });
  if (ctx.user.role !== 'superadmin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'هذه الصفحة للمدير العام فقط' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireAuth);
export const adminProcedure = t.procedure.use(requireAdmin);
export const superAdminProcedure = t.procedure.use(requireSuperAdmin);
