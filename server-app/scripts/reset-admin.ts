/**
 * يُحدّث أو يُنشئ حساب المدير العام بالبيانات الافتراضية
 * username: 1  |  password: 111
 */
import { db, pool } from '../src/db.js';
import { organizations, users } from '../src/schema.js';
import { hashPassword } from '../src/auth.js';
import { eq, and } from 'drizzle-orm';

async function resetAdmin() {
  console.log('🔄 جاري تحديث حساب المدير العام...');
  try {
    // البحث عن مؤسسة SYSTEM
    let sysOrg = await db.query.organizations.findFirst({
      where: eq(organizations.code, 'SYSTEM'),
    });

    if (!sysOrg) {
      const [created] = await db.insert(organizations).values({
        code: 'SYSTEM',
        name: 'النظام - OneSoft',
        currency: 'SAR',
        status: 'active',
        maxUsers: 999,
      }).returning();
      sysOrg = created;
      console.log('✅ تم إنشاء مؤسسة النظام');
    }

    const newHash = await hashPassword('111');

    // البحث عن أي مستخدم superadmin في مؤسسة SYSTEM
    const existing = await db.query.users.findFirst({
      where: and(eq(users.orgId, sysOrg.id), eq(users.role, 'superadmin')),
    });

    if (existing) {
      // تحديث البيانات
      await db.update(users)
        .set({ username: '1', passwordHash: newHash, isActive: true })
        .where(eq(users.id, existing.id));
      console.log('✅ تم تحديث حساب المدير العام');
    } else {
      // إنشاء جديد
      await db.insert(users).values({
        orgId: sysOrg.id,
        username: '1',
        passwordHash: newHash,
        name: 'المدير العام',
        role: 'superadmin',
        isActive: true,
      });
      console.log('✅ تم إنشاء حساب المدير العام');
    }

    console.log('');
    console.log('   اسم المستخدم : 1');
    console.log('   كلمة المرور  : 111');
    console.log('');
  } catch (err) {
    console.error('❌ خطأ:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

resetAdmin().catch(console.error);
