import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useLocation } from 'wouter';


export default function LoginPage() {

  const [form, setForm] = useState({ orgCode: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطأ في تسجيل الدخول');
      } else {
        await utils.auth.me.invalidate();
        const role = data.user?.role;
        navigate(role === 'superadmin' ? '/superadmin' : '/');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      {/* خلفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <span className="text-white text-2xl font-bold">O</span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            One<span className="text-blue-400">Soft</span> ERP
          </h1>
          <p className="text-slate-400 mt-1 text-sm">نظام إدارة الأعمال المتكامل</p>
        </div>

        {/* بطاقة تسجيل الدخول */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">تسجيل الدخول</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* كود المؤسسة */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                كود المؤسسة
              </label>
              <input
                type="text"
                value={form.orgCode}
                onChange={e => setForm(f => ({ ...f, orgCode: e.target.value.toUpperCase() }))}
                placeholder="مثال: COMP01"
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1">اتركه فارغاً إذا كنت المدير العام</p>
            </div>

            {/* اسم المستخدم */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="أدخل اسم المستخدم"
                required
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
              />
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                كلمة المرور
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="أدخل كلمة المرور"
                required
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 transition-colors mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          OneSoft ERP v1.0 © 2024
        </p>
      </div>
    </div>
  );
}
