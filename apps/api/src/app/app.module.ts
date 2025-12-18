import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
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

@Module({
  imports: [
    DatabaseModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
