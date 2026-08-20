import { Global, Module } from '@nestjs/common';
import { BusinessRolesGuard } from './guards/business-roles.guard';

@Global()
@Module({
  providers: [BusinessRolesGuard],
  exports: [BusinessRolesGuard],
})
export class CommonModule {}
