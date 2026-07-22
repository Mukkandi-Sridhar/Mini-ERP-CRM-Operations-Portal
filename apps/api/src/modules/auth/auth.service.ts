import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from '../../shared-types';

@Injectable()
export class AuthService {
  private get accessSecret(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      process.env.JWT_ACCESS_SECRET ||
      'super-secret-access-key-for-mini-erp-crm-2026'
    );
  }

  private get refreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      process.env.JWT_REFRESH_SECRET ||
      'super-secret-refresh-key-for-mini-erp-crm-2026'
    );
  }

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new HttpException('Account has been deactivated', 423); // 423 Locked
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.generateAndSaveRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async refresh(refreshTokenRaw: string) {
    if (!refreshTokenRaw) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Find token by payload or scan active tokens for user
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshTokenRaw, {
        secret: this.refreshSecret,
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenId = payload.tokenId;
    const userId = payload.sub;

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });

    // Reuse detection: if token is not found or already revoked -> REVOKE ENTIRE FAMILY
    if (!tokenRecord || tokenRecord.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Security Alert: Reused or invalid refresh token detected. All sessions revoked.');
    }

    // Hash verification against stored tokenHash
    if (tokenRecord.tokenHash) {
      const isMatch = await bcrypt.compare(refreshTokenRaw, tokenRecord.tokenHash);
      if (!isMatch) {
        await this.prisma.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Security Alert: Invalid refresh token signature. All sessions revoked.');
      }
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account inactive or missing');
    }

    const newAccessToken = this.generateAccessToken(user.id, user.email, user.role);
    const newRefreshToken = await this.generateAndSaveRefreshToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(refreshTokenRaw: string) {
    if (!refreshTokenRaw) return;

    try {
      const payload = this.jwtService.verify(refreshTokenRaw, {
        secret: this.refreshSecret,
      });
      if (payload?.tokenId) {
        await this.prisma.refreshToken.updateMany({
          where: { id: payload.tokenId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    } catch {
      // Ignore errors on logout
    }
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign(
      { sub: userId, email, role },
      {
        secret: this.accessSecret,
        expiresIn: '15m',
      },
    );
  }

  private async generateAndSaveRefreshToken(userId: string): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const tokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: '', // populated below
        expiresAt,
      },
    });

    const token = this.jwtService.sign(
      { sub: userId, tokenId: tokenRecord.id },
      {
        secret: this.refreshSecret,
        expiresIn: '7d',
      },
    );

    const tokenHash = await bcrypt.hash(token, 10);
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { tokenHash },
    });

    return token;
  }
}
