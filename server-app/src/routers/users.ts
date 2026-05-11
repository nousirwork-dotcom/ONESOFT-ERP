import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { router, adminProcedure, protectedProcedure, superAdminProcedure } from '../trpc.js';
import { db } from '../db.js';
import { users } from '../schema.js';
import { hashPassword } from '../auth.js';

export const usersRouter = router({
  // قائمة مستخدمي المؤسسة
  list: adminProcedure.query(async ({ ctx }) => {
    return db.query.users.findMany({
      where: eq(users.orgId, ctx.user.orgId),
      columns: { passwordHash: false },
      orderBy: (u, { asc }) => [asc(u.name)],
    });
  }),

  // إضافة مستخدم جديد
  create: adminProcedure
    .input(z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      name: z.string().min(2),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      role: z.enum(['admin', 'cashier', 'accountant', 'warehouse_manager', 'viewer']),
    }))
    .mutation(async ({ input, ctx }) => {
      // التحقق من عدم تكرار اسم المستخدم في نفس المؤسسة
      const existing = await db.query.users.findFirst({
        where: and(eq(users.username, input.username), eq(users.orgId, ctx.user.orgId)),
      });
      if (existing) throw new Error('اسم المستخدم مستخدم بالفعل');

      const passwordHash = await hashPassword(input.password);
      const [user] = await db.insert(users).values({
        orgId: ctx.user.orgId,
        username: input.username,
        passwordHash,
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        isActive: true,
      }).returning({ id: users.id, name: users.name, username: users.username, role: users.role });

      return user;
    }),

  // تعديل مستخدم
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      role: z.enum(['admin', 'cashier', 'accountant', 'warehouse_manager', 'viewer']).optional(),
      isActive: z.boolean().optional(),
      newPassword: z.string().min(6).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, newPassword, ...rest } = input;
      
      // التأكد أن المستخدم تابع لنفس المؤسسة
      const user = await db.query.users.findFirst({
        where: and(eq(users.id, id), eq(users.orgId, ctx.user.orgId)),
      });
      if (!user) throw new Error('المستخدم غير موجود');

      await db.update(users).set({
        ...rest,
        ...(newPassword ? { passwordHash: await hashPassword(newPassword) } : {}),
        updatedAt: new Date(),
      }).where(eq(users.id, id));

      return { success: true };
    }),

  // حذف مستخدم
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // لا يمكن حذف نفسك
      if (input.id === ctx.user.id) throw new Error('لا يمكنك حذف حسابك الخاص');
      
      await db.update(users).set({ isActive: false }).where(
        and(eq(users.id, input.id), eq(users.orgId, ctx.user.orgId))
      );
      return { success: true };
    }),

  // تغيير كلمة المرور الخاصة
  changeMyPassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.query.users.findFirst({ where: eq(users.id, ctx.user.id) });
      if (!user) throw new Error('المستخدم غير موجود');

      const { verifyPassword } = await import('../auth.js');
      const valid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) throw new Error('كلمة المرور الحالية غير صحيحة');

      await db.update(users).set({
        passwordHash: await hashPassword(input.newPassword),
        updatedAt: new Date(),
      }).where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});
