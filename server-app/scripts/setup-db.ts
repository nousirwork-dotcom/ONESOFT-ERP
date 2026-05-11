import { db, pool } from '../src/db.js';
import { organizations, users, chartOfAccounts, warehouses, branches, units } from '../src/schema.js';
import { hashPassword } from '../src/auth.js';
import { eq } from 'drizzle-orm';

async function setupDatabase() {
  console.log('🚀 جاري إعداد قاعدة البيانات...');

  try {
    // إنشاء الجداول
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'cashier', 'accountant', 'warehouse_manager', 'viewer');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      
      DO $$ BEGIN
        CREATE TYPE org_status AS ENUM ('active', 'suspended', 'trial', 'expired');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE invoice_type AS ENUM ('sale', 'return', 'quote');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE invoice_status AS ENUM ('draft', 'confirmed', 'cancelled', 'paid');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE payment_method AS ENUM ('cash', 'bank', 'credit', 'check', 'other');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE voucher_type AS ENUM ('receipt', 'payment');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE journal_status AS ENUM ('draft', 'posted', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      -- Organizations
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255),
        logo TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        tax_number VARCHAR(50),
        commercial_reg VARCHAR(50),
        currency VARCHAR(10) NOT NULL DEFAULT 'SAR',
        status org_status NOT NULL DEFAULT 'trial',
        subscription_expiry TIMESTAMP,
        max_users INTEGER NOT NULL DEFAULT 5,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Users
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        username VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        role user_role NOT NULL DEFAULT 'cashier',
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(org_id, username)
      );

      -- Branches
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Warehouses
      CREATE TABLE IF NOT EXISTS warehouses (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        branch_id INTEGER REFERENCES branches(id),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Units
      CREATE TABLE IF NOT EXISTS units (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        name VARCHAR(100) NOT NULL,
        symbol VARCHAR(20)
      );

      -- Product Groups
      CREATE TABLE IF NOT EXISTS product_groups (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER
      );

      -- Products
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        code VARCHAR(100),
        barcode VARCHAR(100),
        name VARCHAR(500) NOT NULL,
        name_en VARCHAR(500),
        group_id INTEGER REFERENCES product_groups(id),
        unit_id INTEGER REFERENCES units(id),
        sale_price DECIMAL(18,4) DEFAULT 0,
        purchase_price DECIMAL(18,4) DEFAULT 0,
        tax_rate DECIMAL(5,2) DEFAULT 0,
        min_stock DECIMAL(18,4) DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Customers
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        code VARCHAR(50),
        name VARCHAR(500) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        tax_number VARCHAR(50),
        credit_limit DECIMAL(18,4) DEFAULT 0,
        balance DECIMAL(18,4) DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Suppliers
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        code VARCHAR(50),
        name VARCHAR(500) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        tax_number VARCHAR(50),
        balance DECIMAL(18,4) DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Chart of Accounts
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        code VARCHAR(50) NOT NULL,
        name VARCHAR(500) NOT NULL,
        name_en VARCHAR(500),
        parent_id INTEGER,
        level INTEGER NOT NULL DEFAULT 1,
        account_type VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        balance DECIMAL(18,4) DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(org_id, code)
      );

      -- Sales Invoices
      CREATE TABLE IF NOT EXISTS sales_invoices (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        invoice_number VARCHAR(50) NOT NULL,
        invoice_type invoice_type NOT NULL DEFAULT 'sale',
        invoice_date TIMESTAMP NOT NULL DEFAULT NOW(),
        customer_id INTEGER REFERENCES customers(id),
        customer_name VARCHAR(500),
        warehouse_id INTEGER REFERENCES warehouses(id),
        branch_id INTEGER REFERENCES branches(id),
        user_id INTEGER REFERENCES users(id),
        currency VARCHAR(10) DEFAULT 'SAR',
        exchange_rate DECIMAL(10,4) DEFAULT 1,
        subtotal DECIMAL(18,4) DEFAULT 0,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(18,4) DEFAULT 0,
        tax_amount DECIMAL(18,4) DEFAULT 0,
        total DECIMAL(18,4) DEFAULT 0,
        paid_amount DECIMAL(18,4) DEFAULT 0,
        remaining_amount DECIMAL(18,4) DEFAULT 0,
        payment_method payment_method DEFAULT 'cash',
        status invoice_status NOT NULL DEFAULT 'draft',
        notes TEXT,
        ref_invoice_id INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(org_id, invoice_number)
      );

      -- Sales Invoice Items
      CREATE TABLE IF NOT EXISTS sales_invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        product_id INTEGER REFERENCES products(id),
        product_code VARCHAR(100),
        product_name VARCHAR(500) NOT NULL,
        unit VARCHAR(100),
        quantity DECIMAL(18,4) NOT NULL,
        unit_price DECIMAL(18,4) NOT NULL,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(18,4) DEFAULT 0,
        tax_percent DECIMAL(5,2) DEFAULT 0,
        tax_amount DECIMAL(18,4) DEFAULT 0,
        total DECIMAL(18,4) NOT NULL,
        warehouse_id INTEGER REFERENCES warehouses(id),
        notes TEXT,
        sort_order INTEGER DEFAULT 0
      );

      -- Purchase Invoices
      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        invoice_number VARCHAR(50) NOT NULL,
        supplier_invoice_number VARCHAR(100),
        invoice_date TIMESTAMP NOT NULL DEFAULT NOW(),
        supplier_id INTEGER REFERENCES suppliers(id),
        supplier_name VARCHAR(500),
        warehouse_id INTEGER REFERENCES warehouses(id),
        subtotal DECIMAL(18,4) DEFAULT 0,
        discount_amount DECIMAL(18,4) DEFAULT 0,
        tax_amount DECIMAL(18,4) DEFAULT 0,
        total DECIMAL(18,4) DEFAULT 0,
        paid_amount DECIMAL(18,4) DEFAULT 0,
        status invoice_status NOT NULL DEFAULT 'draft',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Journal Entries
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        entry_number VARCHAR(50) NOT NULL,
        entry_date TIMESTAMP NOT NULL DEFAULT NOW(),
        description TEXT,
        reference VARCHAR(100),
        total_debit DECIMAL(18,4) DEFAULT 0,
        total_credit DECIMAL(18,4) DEFAULT 0,
        status journal_status NOT NULL DEFAULT 'draft',
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(org_id, entry_number)
      );

      -- Journal Entry Lines
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id SERIAL PRIMARY KEY,
        entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        account_id INTEGER REFERENCES chart_of_accounts(id),
        account_code VARCHAR(50),
        account_name VARCHAR(500),
        description TEXT,
        debit DECIMAL(18,4) DEFAULT 0,
        credit DECIMAL(18,4) DEFAULT 0,
        cost_center VARCHAR(100),
        sort_order INTEGER DEFAULT 0
      );

      -- Vouchers
      CREATE TABLE IF NOT EXISTS vouchers (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        voucher_number VARCHAR(50) NOT NULL,
        voucher_type voucher_type NOT NULL,
        voucher_date TIMESTAMP NOT NULL DEFAULT NOW(),
        amount DECIMAL(18,4) NOT NULL,
        payment_method payment_method DEFAULT 'cash',
        account_id INTEGER REFERENCES chart_of_accounts(id),
        account_code VARCHAR(50),
        account_name VARCHAR(500),
        party_type VARCHAR(20),
        party_id INTEGER,
        party_name VARCHAR(500),
        description TEXT,
        reference VARCHAR(100),
        status journal_status NOT NULL DEFAULT 'draft',
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Inventory
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
        quantity DECIMAL(18,4) NOT NULL DEFAULT 0,
        avg_cost DECIMAL(18,4) DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(org_id, product_id, warehouse_id)
      );
    `);

    console.log('✅ تم إنشاء الجداول بنجاح');

    // إنشاء المدير العام (superadmin)
    const existingSuperAdmin = await db.query.organizations.findFirst({
      where: eq(organizations.code, 'SYSTEM'),
    });

    if (!existingSuperAdmin) {
      // مؤسسة النظام
      const [sysOrg] = await db.insert(organizations).values({
        code: 'SYSTEM',
        name: 'النظام - OneSoft',
        currency: 'SAR',
        status: 'active',
        maxUsers: 999,
      }).returning();

      // المدير العام
      const superAdminHash = await hashPassword('111');
      await db.insert(users).values({
        orgId: sysOrg.id,
        username: '1',
        passwordHash: superAdminHash,
        name: 'المدير العام',
        role: 'superadmin',
        isActive: true,
      });

      console.log('✅ تم إنشاء حساب المدير العام:');
      console.log('   اسم المستخدم: 1');
      console.log('   كلمة المرور: 111');
    } else {
      console.log('ℹ️  المدير العام موجود بالفعل');
    }

    console.log('\n🎉 اكتمل إعداد قاعدة البيانات بنجاح!');
  } catch (err) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error);
