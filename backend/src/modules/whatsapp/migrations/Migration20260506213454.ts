import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260506213454 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "whatsapp_session" ("id" text not null, "phone" text not null, "language" text not null default 'en', "source" text not null default 'organic', "current_intent" text null, "selected_category" text null, "selected_product_id" text null, "cart_items" jsonb null, "status" text not null default 'browsing', "order_id" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "whatsapp_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_whatsapp_session_deleted_at" ON "whatsapp_session" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "whatsapp_session" cascade;`);
  }

}
