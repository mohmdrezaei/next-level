CREATE TABLE "store_settings" (
	"id" text PRIMARY KEY DEFAULT 'store' NOT NULL,
	"name" text DEFAULT 'Next Level' NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"free_shipping" integer DEFAULT 5000000 NOT NULL,
	"tax_rate" real DEFAULT 9 NOT NULL,
	"standard_shipping" integer DEFAULT 149000 NOT NULL,
	"express_shipping" integer DEFAULT 349000 NOT NULL,
	"enable_wallet" boolean DEFAULT true NOT NULL,
	"enable_cod" boolean DEFAULT false NOT NULL,
	"enable_reviews" boolean DEFAULT true NOT NULL,
	"default_order" text DEFAULT 'featured' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "set_items" DROP CONSTRAINT "set_items_set_slug_sets_slug_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birthday" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" text DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE "set_items" ADD CONSTRAINT "set_items_set_slug_sets_slug_fk" FOREIGN KEY ("set_slug") REFERENCES "public"."sets"("slug") ON DELETE cascade ON UPDATE cascade;