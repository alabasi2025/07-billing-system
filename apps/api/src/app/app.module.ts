import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../modules/auth/auth.module';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/roles.guard';
import { HealthModule } from '../modules/health/health.module';
import { CustomerCategoriesModule } from '../modules/customer-categories/customer-categories.module';
import { TariffsModule } from '../modules/tariffs/tariffs.module';
import { MeterTypesModule } from '../modules/meter-types/meter-types.module';
import { CustomersModule } from '../modules/customers/customers.module';
import { ContractsModule } from '../modules/contracts/contracts.module';
import { MetersModule } from '../modules/meters/meters.module';
import { MeterReadingsModule } from '../modules/meter-readings/meter-readings.module';
import { InvoicesModule } from '../modules/invoices/invoices.module';
import { PaymentsModule } from '../modules/payments/payments.module';
import { ComplaintsModule } from '../modules/complaints/complaints.module';
import { ReportsModule } from '../modules/reports/reports.module';
import { SubscriptionRequestsModule } from '../modules/subscription-requests/subscription-requests.module';
import { InstallmentsModule } from '../modules/installments/installments.module';
import { DisconnectionsModule } from '../modules/disconnections/disconnections.module';
import { PrepaidModule } from '../modules/prepaid/prepaid.module';
import { CustomerPortalModule } from '../modules/customer-portal/customer-portal.module';
import { POSModule } from '../modules/pos/pos.module';
import { EventsModule } from '../modules/events/events.module';
import { AccountingModule } from '../modules/accounting/accounting.module';

@Module({
  imports: [
    // Rate Limiting - 100 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    // Authentication - JWT validation from Core System (01)
    AuthModule,
    // Event Publishing for cross-system integration
    EventsModule,
    // Double-Entry Bookkeeping (القيد المزدوج)
    AccountingModule,
    DatabaseModule,
    CommonModule,
    HealthModule,
    CustomerCategoriesModule,
    TariffsModule,
    MeterTypesModule,
    CustomersModule,
    ContractsModule,
    MetersModule,
    MeterReadingsModule,
    InvoicesModule,
    PaymentsModule,
    ComplaintsModule,
    ReportsModule,
    SubscriptionRequestsModule,
    InstallmentsModule,
    DisconnectionsModule,
    PrepaidModule,
    CustomerPortalModule,
    POSModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT Authentication Guard (RBAC)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Roles Guard (RBAC)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
