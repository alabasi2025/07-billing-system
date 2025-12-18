import { SetMetadata } from '@nestjs/common';

/**
 * Key for marking routes as public (no authentication required)
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as public
 * Routes marked with @Public() do not require JWT authentication
 * 
 * @example
 * @Public()
 * @Get('health')
 * getHealth() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
