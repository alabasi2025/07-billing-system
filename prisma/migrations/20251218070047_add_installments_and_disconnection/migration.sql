-- AlterTable
ALTER TABLE "bill_invoices" ADD COLUMN     "installment_plan_id" UUID;

-- CreateTable
CREATE TABLE "bill_installment_plans" (
    "id" UUID NOT NULL,
    "plan_no" VARCHAR(20) NOT NULL,
    "customer_id" UUID NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "down_payment" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remaining_amount" DECIMAL(15,2) NOT NULL,
    "number_of_installments" INTEGER NOT NULL,
    "installment_amount" DECIMAL(15,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_installment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_installments" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "installment_no" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_date" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payment_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_disconnection_orders" (
    "id" UUID NOT NULL,
    "order_no" VARCHAR(20) NOT NULL,
    "customer_id" UUID NOT NULL,
    "meter_id" UUID,
    "order_type" VARCHAR(20) NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "reason_details" TEXT,
    "outstanding_amount" DECIMAL(15,2),
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "executed_date" TIMESTAMP(3),
    "executed_by" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "cancel_reason" TEXT,
    "reconnection_fee" DECIMAL(15,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_disconnection_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bill_installment_plans_plan_no_key" ON "bill_installment_plans"("plan_no");

-- CreateIndex
CREATE INDEX "bill_installment_plans_customer_id_idx" ON "bill_installment_plans"("customer_id");

-- CreateIndex
CREATE INDEX "bill_installment_plans_status_idx" ON "bill_installment_plans"("status");

-- CreateIndex
CREATE INDEX "bill_installments_status_idx" ON "bill_installments"("status");

-- CreateIndex
CREATE INDEX "bill_installments_due_date_idx" ON "bill_installments"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "bill_installments_plan_id_installment_no_key" ON "bill_installments"("plan_id", "installment_no");

-- CreateIndex
CREATE UNIQUE INDEX "bill_disconnection_orders_order_no_key" ON "bill_disconnection_orders"("order_no");

-- CreateIndex
CREATE INDEX "bill_disconnection_orders_customer_id_idx" ON "bill_disconnection_orders"("customer_id");

-- CreateIndex
CREATE INDEX "bill_disconnection_orders_status_idx" ON "bill_disconnection_orders"("status");

-- CreateIndex
CREATE INDEX "bill_disconnection_orders_order_type_idx" ON "bill_disconnection_orders"("order_type");

-- CreateIndex
CREATE INDEX "bill_invoices_installment_plan_id_idx" ON "bill_invoices"("installment_plan_id");

-- AddForeignKey
ALTER TABLE "bill_invoices" ADD CONSTRAINT "bill_invoices_installment_plan_id_fkey" FOREIGN KEY ("installment_plan_id") REFERENCES "bill_installment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_installment_plans" ADD CONSTRAINT "bill_installment_plans_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_installments" ADD CONSTRAINT "bill_installments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "bill_installment_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_disconnection_orders" ADD CONSTRAINT "bill_disconnection_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_disconnection_orders" ADD CONSTRAINT "bill_disconnection_orders_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "bill_meters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
