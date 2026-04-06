import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        oabNumber: true,
        phone: true,
        active: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        oabNumber: true,
        phone: true,
        active: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    return user;
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    role: 'ADMIN' | 'ADVOGADO' | 'ASSISTENTE';
    oabNumber?: string;
    phone?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('Email ja cadastrado');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        oabNumber: data.oabNumber,
        phone: data.phone,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async update(
    id: string,
    data: {
      name?: string;
      role?: 'ADMIN' | 'ADVOGADO' | 'ASSISTENTE';
      oabNumber?: string;
      phone?: string;
      active?: boolean;
    },
  ) {
    await this.findById(id);

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        oabNumber: true,
        phone: true,
        active: true,
      },
    });

    return user;
  }
}
