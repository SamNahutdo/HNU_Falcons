// =============================================================================
// Equipment Service — Prisma Data Access Layer
// All queries use Prisma's parameterized query builders (SQL injection safe).
// Direct SQL is only used for raw EXPLAIN ANALYZE (performance reporting only).
// =============================================================================

import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

export interface CreateEquipmentDto {
  sport_id: string;
  equipment_code: string;
  name: string;
  category: string;
  total_quantity: number;
  available_quantity: number;
  condition?: string;
  status?: string;
}

export interface UpdateEquipmentDto {
  name?: string;
  category?: string;
  total_quantity?: number;
  available_quantity?: number;
  condition?: string;
  status?: string;
}

export const equipmentService = {
  // ── GET ALL ── (paginated, with sport join)
  async findAll(filters: { sport_id?: string; status?: string; page: number; limit: number }) {
    const { sport_id, status, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(sport_id ? { sport_id } : {}),
      ...(status ? { status } : {})
    };

    const [data, total] = await prisma.$transaction([
      prisma.equipment.findMany({
        where,
        include: { sport: true },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.equipment.count({ where })
    ]);

    return { data, total, page, limit };
  },

  // ── GET ONE ──
  async findById(id: string) {
    const item = await prisma.equipment.findUnique({
      where: { id },
      include: {
        sport: true,
        maintenance_records: { orderBy: { created_at: 'desc' }, take: 5 }
      }
    });
    if (!item) throw new AppError(`Equipment with ID ${id} not found.`, 404);
    return item;
  },

  // ── CREATE ── (audit trigger fires automatically at DB layer)
  async create(dto: CreateEquipmentDto) {
    if (dto.available_quantity > dto.total_quantity) {
      throw new AppError('available_quantity cannot exceed total_quantity.', 400);
    }
    return prisma.equipment.create({ data: dto, include: { sport: true } });
  },

  // ── UPDATE ──
  async update(id: string, dto: UpdateEquipmentDto) {
    await this.findById(id); // throws 404 if not found

    // Validate quantity consistency
    if (dto.available_quantity !== undefined || dto.total_quantity !== undefined) {
      const current = await prisma.equipment.findUnique({ where: { id } });
      const newTotal = dto.total_quantity ?? current!.total_quantity;
      const newAvailable = dto.available_quantity ?? current!.available_quantity;
      if (newAvailable > newTotal) {
        throw new AppError('available_quantity cannot exceed total_quantity.', 400);
      }
    }

    return prisma.equipment.update({
      where: { id },
      data: { ...dto, updated_at: new Date() },
      include: { sport: true }
    });
  },

  // ── DELETE ── (ON DELETE RESTRICT means equipment with active loans will fail)
  async delete(id: string) {
    await this.findById(id);
    // Prisma will throw P2003 if there are borrowing_items referencing this equipment
    await prisma.equipment.delete({ where: { id } });
  },

  // ── INVENTORY VIEW ── (uses stored DB view)
  async getInventoryView() {
    return prisma.$queryRaw`SELECT * FROM vw_equipment_inventory_status ORDER BY utilization_rate_pct DESC`;
  }
};
