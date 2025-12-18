-- CreateTable
CREATE TABLE "bill_customer_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_customer_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_customers" (
    "id" UUID NOT NULL,
    "account_no" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_en" VARCHAR(200),
    "category_id" UUID NOT NULL,
    "id_type" VARCHAR(50) NOT NULL,
    "id_number" VARCHAR(50) NOT NULL,
    "id_card_image" VARCHAR(500),
    "tax_number" VARCHAR(50),
    "phone" VARCHAR(20) NOT NULL,
    "mobile" VARCHAR(20),
    "email" VARCHAR(100),
    "address" TEXT NOT NULL,
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "building" VARCHAR(100),
    "floor" VARCHAR(20),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "station_id" UUID,
    "transformer_id" UUID,
    "credit_limit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_terms" VARCHAR(20) NOT NULL DEFAULT 'postpaid',
    "billing_cycle" VARCHAR(20) NOT NULL DEFAULT 'monthly',
    "account_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "suspension_reason" TEXT,
    "disconnection_date" TIMESTAMP(3),
    "connection_date" TIMESTAMP(3),
    "is_subsidized" BOOLEAN NOT NULL DEFAULT false,
    "subsidy_program_id" UUID,
    "subsidy_reference_no" VARCHAR(50),
    "subsidy_start_date" TIMESTAMP(3),
    "subsidy_end_date" TIMESTAMP(3),
    "contact_person" VARCHAR(100),
    "contact_phone" VARCHAR(20),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_customer_addresses" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "address_type" VARCHAR(50) NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_customer_contacts" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "position" VARCHAR(100),
    "phone" VARCHAR(20),
    "mobile" VARCHAR(20),
    "email" VARCHAR(100),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_contracts" (
    "id" UUID NOT NULL,
    "contract_no" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "contract_type" VARCHAR(50) NOT NULL DEFAULT 'permanent',
    "load_kw" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deposit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "guarantee_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "terms" TEXT,
    "notes" TEXT,
    "terminated_at" TIMESTAMP(3),
    "termination_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_meter_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "description" TEXT,
    "phases" INTEGER NOT NULL DEFAULT 1,
    "is_smart_meter" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_meter_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_meters" (
    "id" UUID NOT NULL,
    "meter_no" VARCHAR(50) NOT NULL,
    "customer_id" UUID,
    "meter_type_id" UUID NOT NULL,
    "manufacturer" VARCHAR(100),
    "model" VARCHAR(100),
    "serial_number" VARCHAR(100),
    "install_date" TIMESTAMP(3),
    "last_read_date" TIMESTAMP(3),
    "last_reading" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "multiplier" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_meters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_meter_readings" (
    "id" UUID NOT NULL,
    "meter_id" UUID NOT NULL,
    "reading_date" TIMESTAMP(3) NOT NULL,
    "reading" DECIMAL(15,2) NOT NULL,
    "previous_reading" DECIMAL(15,2) NOT NULL,
    "consumption" DECIMAL(15,2) NOT NULL,
    "reading_type" VARCHAR(30) NOT NULL,
    "reader_id" UUID,
    "image_url" VARCHAR(500),
    "notes" TEXT,
    "billing_period" VARCHAR(7) NOT NULL,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_meter_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_tariffs" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "slice_order" INTEGER NOT NULL,
    "from_kwh" DECIMAL(15,2) NOT NULL,
    "to_kwh" DECIMAL(15,2),
    "rate_per_kwh" DECIMAL(10,4) NOT NULL,
    "fixed_charge" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_invoices" (
    "id" UUID NOT NULL,
    "invoice_no" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "billing_period" VARCHAR(7) NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "previous_reading" DECIMAL(15,2) NOT NULL,
    "current_reading" DECIMAL(15,2) NOT NULL,
    "consumption" DECIMAL(15,2) NOT NULL,
    "consumption_amount" DECIMAL(15,2) NOT NULL,
    "fixed_charges" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "other_charges" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "vat_amount" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'issued',
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_invoice_items" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "item_type" VARCHAR(50) NOT NULL,
    "from_kwh" DECIMAL(15,2),
    "to_kwh" DECIMAL(15,2),
    "quantity" DECIMAL(15,2) NOT NULL,
    "rate" DECIMAL(10,4) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_payments" (
    "id" UUID NOT NULL,
    "payment_no" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "invoice_id" UUID,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" VARCHAR(30) NOT NULL,
    "reference_no" VARCHAR(100),
    "bank_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    "received_by" UUID,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_complaints" (
    "id" UUID NOT NULL,
    "complaint_no" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "related_invoice_id" UUID,
    "related_meter_id" UUID,
    "assigned_to" UUID,
    "response" TEXT,
    "resolution" TEXT,
    "internal_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_subscription_requests" (
    "id" UUID NOT NULL,
    "request_no" VARCHAR(30) NOT NULL,
    "customer_name" VARCHAR(200) NOT NULL,
    "customer_type" VARCHAR(50) NOT NULL,
    "id_type" VARCHAR(50),
    "id_number" VARCHAR(50),
    "phone" VARCHAR(20),
    "mobile" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100),
    "address" TEXT,
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "subscription_fee" DECIMAL(15,2),
    "connection_fee" DECIMAL(15,2),
    "deposit_amount" DECIMAL(15,2),
    "total_amount" DECIMAL(15,2),
    "payment_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_date" TIMESTAMP(3),
    "payment_reference" VARCHAR(100),
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending_review',
    "customer_id" UUID,
    "assigned_technician" UUID,
    "meter_serial_number" VARCHAR(100),
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approval_date" TIMESTAMP(3),
    "installation_date" TIMESTAMP(3),
    "completion_date" TIMESTAMP(3),
    "approved_by" UUID,
    "rejection_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_subscription_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_audit_logs" (
    "id" UUID NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "record_id" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "user_id" UUID,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_system_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "data_type" VARCHAR(20) NOT NULL,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_sequences" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "prefix" VARCHAR(10) NOT NULL,
    "current_no" INTEGER NOT NULL DEFAULT 0,
    "pad_length" INTEGER NOT NULL DEFAULT 6,
    "reset_period" VARCHAR(20),
    "last_reset" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_customer_components" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "meter_serial_number" VARCHAR(100),
    "meter_type" VARCHAR(50),
    "meter_model" VARCHAR(100),
    "meter_installation_date" TIMESTAMP(3),
    "meter_warranty_end" TIMESTAMP(3),
    "breaker_serial_number" VARCHAR(100),
    "breaker_type" VARCHAR(50),
    "breaker_capacity" VARCHAR(20),
    "breaker_brand" VARCHAR(50),
    "breaker_installation_date" TIMESTAMP(3),
    "breaker_warranty_end" TIMESTAMP(3),
    "seal_number" VARCHAR(50),
    "seal_color" VARCHAR(30),
    "seal_type" VARCHAR(50),
    "seal_installation_date" TIMESTAMP(3),
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_customer_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_component_history" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "component_type" VARCHAR(50) NOT NULL,
    "serial_number" VARCHAR(100),
    "model" VARCHAR(100),
    "brand" VARCHAR(100),
    "specifications" JSON,
    "action_type" VARCHAR(50) NOT NULL,
    "action_date" TIMESTAMP(3) NOT NULL,
    "action_time" TIME,
    "reason" VARCHAR(200),
    "notes" TEXT,
    "warranty_status" VARCHAR(50),
    "warranty_end_date" TIMESTAMP(3),
    "work_order_id" UUID,
    "replacement_id" UUID,
    "technician_id" UUID,
    "cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "invoice_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_component_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_subsidy_programs" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "description" TEXT,
    "monthly_quota_kwh" DECIMAL(10,2) NOT NULL,
    "rate_per_kwh" DECIMAL(10,4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_subsidy_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_subsidy_quotas" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "allocated_kwh" DECIMAL(10,2) NOT NULL,
    "consumed_kwh" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remaining_kwh" DECIMAL(10,2),
    "subsidy_value" DECIMAL(15,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "exhausted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_subsidy_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bill_customer_categories_code_key" ON "bill_customer_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bill_customers_account_no_key" ON "bill_customers"("account_no");

-- CreateIndex
CREATE INDEX "bill_customers_category_id_idx" ON "bill_customers"("category_id");

-- CreateIndex
CREATE INDEX "bill_customers_status_idx" ON "bill_customers"("status");

-- CreateIndex
CREATE INDEX "bill_customers_is_subsidized_idx" ON "bill_customers"("is_subsidized");

-- CreateIndex
CREATE INDEX "bill_customer_addresses_customer_id_idx" ON "bill_customer_addresses"("customer_id");

-- CreateIndex
CREATE INDEX "bill_customer_contacts_customer_id_idx" ON "bill_customer_contacts"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "bill_contracts_contract_no_key" ON "bill_contracts"("contract_no");

-- CreateIndex
CREATE INDEX "bill_contracts_customer_id_idx" ON "bill_contracts"("customer_id");

-- CreateIndex
CREATE INDEX "bill_contracts_status_idx" ON "bill_contracts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bill_meter_types_code_key" ON "bill_meter_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bill_meters_meter_no_key" ON "bill_meters"("meter_no");

-- CreateIndex
CREATE INDEX "bill_meters_customer_id_idx" ON "bill_meters"("customer_id");

-- CreateIndex
CREATE INDEX "bill_meters_meter_type_id_idx" ON "bill_meters"("meter_type_id");

-- CreateIndex
CREATE INDEX "bill_meters_status_idx" ON "bill_meters"("status");

-- CreateIndex
CREATE INDEX "bill_meter_readings_meter_id_idx" ON "bill_meter_readings"("meter_id");

-- CreateIndex
CREATE INDEX "bill_meter_readings_billing_period_idx" ON "bill_meter_readings"("billing_period");

-- CreateIndex
CREATE INDEX "bill_meter_readings_reading_date_idx" ON "bill_meter_readings"("reading_date");

-- CreateIndex
CREATE INDEX "bill_tariffs_category_id_idx" ON "bill_tariffs"("category_id");

-- CreateIndex
CREATE INDEX "bill_tariffs_is_active_idx" ON "bill_tariffs"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "bill_invoices_invoice_no_key" ON "bill_invoices"("invoice_no");

-- CreateIndex
CREATE INDEX "bill_invoices_customer_id_idx" ON "bill_invoices"("customer_id");

-- CreateIndex
CREATE INDEX "bill_invoices_billing_period_idx" ON "bill_invoices"("billing_period");

-- CreateIndex
CREATE INDEX "bill_invoices_status_idx" ON "bill_invoices"("status");

-- CreateIndex
CREATE INDEX "bill_invoices_due_date_idx" ON "bill_invoices"("due_date");

-- CreateIndex
CREATE INDEX "bill_invoice_items_invoice_id_idx" ON "bill_invoice_items"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "bill_payments_payment_no_key" ON "bill_payments"("payment_no");

-- CreateIndex
CREATE INDEX "bill_payments_customer_id_idx" ON "bill_payments"("customer_id");

-- CreateIndex
CREATE INDEX "bill_payments_invoice_id_idx" ON "bill_payments"("invoice_id");

-- CreateIndex
CREATE INDEX "bill_payments_payment_date_idx" ON "bill_payments"("payment_date");

-- CreateIndex
CREATE INDEX "bill_payments_status_idx" ON "bill_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bill_complaints_complaint_no_key" ON "bill_complaints"("complaint_no");

-- CreateIndex
CREATE INDEX "bill_complaints_customer_id_idx" ON "bill_complaints"("customer_id");

-- CreateIndex
CREATE INDEX "bill_complaints_status_idx" ON "bill_complaints"("status");

-- CreateIndex
CREATE INDEX "bill_complaints_type_idx" ON "bill_complaints"("type");

-- CreateIndex
CREATE INDEX "bill_complaints_priority_idx" ON "bill_complaints"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "bill_subscription_requests_request_no_key" ON "bill_subscription_requests"("request_no");

-- CreateIndex
CREATE INDEX "bill_subscription_requests_status_idx" ON "bill_subscription_requests"("status");

-- CreateIndex
CREATE INDEX "bill_subscription_requests_payment_status_idx" ON "bill_subscription_requests"("payment_status");

-- CreateIndex
CREATE INDEX "bill_audit_logs_table_name_idx" ON "bill_audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "bill_audit_logs_record_id_idx" ON "bill_audit_logs"("record_id");

-- CreateIndex
CREATE INDEX "bill_audit_logs_user_id_idx" ON "bill_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "bill_audit_logs_created_at_idx" ON "bill_audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bill_system_settings_key_key" ON "bill_system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "bill_sequences_name_key" ON "bill_sequences"("name");

-- CreateIndex
CREATE INDEX "bill_customer_components_customer_id_idx" ON "bill_customer_components"("customer_id");

-- CreateIndex
CREATE INDEX "bill_customer_components_meter_serial_number_idx" ON "bill_customer_components"("meter_serial_number");

-- CreateIndex
CREATE INDEX "bill_component_history_customer_id_idx" ON "bill_component_history"("customer_id");

-- CreateIndex
CREATE INDEX "bill_component_history_serial_number_idx" ON "bill_component_history"("serial_number");

-- CreateIndex
CREATE INDEX "bill_component_history_component_type_idx" ON "bill_component_history"("component_type");

-- CreateIndex
CREATE INDEX "bill_component_history_action_date_idx" ON "bill_component_history"("action_date");

-- CreateIndex
CREATE UNIQUE INDEX "bill_subsidy_programs_code_key" ON "bill_subsidy_programs"("code");

-- CreateIndex
CREATE INDEX "bill_subsidy_quotas_customer_id_idx" ON "bill_subsidy_quotas"("customer_id");

-- CreateIndex
CREATE INDEX "bill_subsidy_quotas_program_id_idx" ON "bill_subsidy_quotas"("program_id");

-- CreateIndex
CREATE INDEX "bill_subsidy_quotas_year_month_idx" ON "bill_subsidy_quotas"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "bill_subsidy_quotas_customer_id_year_month_key" ON "bill_subsidy_quotas"("customer_id", "year", "month");

-- AddForeignKey
ALTER TABLE "bill_customers" ADD CONSTRAINT "bill_customers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "bill_customer_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_customer_addresses" ADD CONSTRAINT "bill_customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_customer_contacts" ADD CONSTRAINT "bill_customer_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_contracts" ADD CONSTRAINT "bill_contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_meters" ADD CONSTRAINT "bill_meters_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_meters" ADD CONSTRAINT "bill_meters_meter_type_id_fkey" FOREIGN KEY ("meter_type_id") REFERENCES "bill_meter_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_meter_readings" ADD CONSTRAINT "bill_meter_readings_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "bill_meters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_tariffs" ADD CONSTRAINT "bill_tariffs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "bill_customer_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_invoices" ADD CONSTRAINT "bill_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_invoice_items" ADD CONSTRAINT "bill_invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "bill_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "bill_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_complaints" ADD CONSTRAINT "bill_complaints_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_complaints" ADD CONSTRAINT "bill_complaints_related_invoice_id_fkey" FOREIGN KEY ("related_invoice_id") REFERENCES "bill_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_complaints" ADD CONSTRAINT "bill_complaints_related_meter_id_fkey" FOREIGN KEY ("related_meter_id") REFERENCES "bill_meters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_customer_components" ADD CONSTRAINT "bill_customer_components_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_component_history" ADD CONSTRAINT "bill_component_history_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_subsidy_quotas" ADD CONSTRAINT "bill_subsidy_quotas_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "bill_subsidy_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
