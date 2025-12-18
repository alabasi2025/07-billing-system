import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Authentication Module
 * 
 * This module handles JWT validation for tokens issued by the Core System (01).
 * It does NOT issue tokens - that responsibility belongs to the Core System.
 * 
 * Integration with Core System (النظام الأم):
 * - Tokens are issued by Core System (01)
 * - This system validates tokens using the shared secret
 * - User roles and permissions are extracted from the token payload
 */
@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'shared-jwt-secret-with-core-system',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any },
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtStrategy, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
