import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT Strategy for validating tokens from the Core System (01)
 * This system only validates tokens, it does not issue them
 * Token issuance is handled by the Core System (النظام الأم)
 */

export interface JwtPayload {
  sub: string;        // User ID
  email: string;      // User email
  roles: string[];    // User roles
  permissions: string[]; // User permissions
  systemId?: string;  // Source system ID
  iat?: number;       // Issued at
  exp?: number;       // Expiration
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract JWT from Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Do not ignore expiration - tokens must be valid
      ignoreExpiration: false,
      
      // Use the same secret as the Core System (01)
      // In production, this should be fetched from a shared secret store
      // or use public key verification with RS256
      secretOrKey: process.env.JWT_SECRET || 'shared-jwt-secret-with-core-system',
      
      // Optionally verify the issuer
      // issuer: process.env.JWT_ISSUER || 'core-system-01',
    });
  }

  /**
   * Validate the JWT payload
   * This method is called after the token signature is verified
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verify the token has required fields
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Verify the token was issued by the Core System (optional)
    // if (payload.systemId && payload.systemId !== 'core-system-01') {
    //   throw new UnauthorizedException('Token not issued by Core System');
    // }

    // Return the validated payload - this will be attached to the request
    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      systemId: payload.systemId,
    };
  }
}
