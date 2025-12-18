-- CreateTable
CREATE TABLE "bill_prepaid_tokens" (
    "id" UUID NOT NULL,
    "token_no" VARCHAR(20) NOT NULL,
    "token" VARCHAR(30) NOT NULL,
    "meter_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 0,
    "payment_method" VARCHAR(50),
    "payment_reference" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3),
    "used_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_prepaid_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_service_requests" (
    "id" UUID NOT NULL,
    "request_no" VARCHAR(20) NOT NULL,
    "customer_id" UUID NOT NULL,
    "request_type" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "attachments" TEXT,
    "preferred_date" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "assigned_to" VARCHAR(100),
    "resolution" TEXT,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bill_prepaid_tokens_token_no_key" ON "bill_prepaid_tokens"("token_no");

-- CreateIndex
CREATE UNIQUE INDEX "bill_prepaid_tokens_token_key" ON "bill_prepaid_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "bill_service_requests_request_no_key" ON "bill_service_requests"("request_no");

-- AddForeignKey
ALTER TABLE "bill_prepaid_tokens" ADD CONSTRAINT "bill_prepaid_tokens_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "bill_meters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_prepaid_tokens" ADD CONSTRAINT "bill_prepaid_tokens_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_service_requests" ADD CONSTRAINT "bill_service_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bill_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
