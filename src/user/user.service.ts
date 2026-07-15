

import { Injectable, BadRequestException } from "@nestjs/common";
import { UserRepository } from "../../generated/user.repository";

@Injectable()
export class UserService {

  constructor(private readonly repo: UserRepository) {}

  /* ================= COMMON VALIDATION ================= */

  private validatePK(id: string, created_at: string) {
    if (!id || !created_at) {
      throw new BadRequestException("id and created_at are required");
    }
  }

  private validateData(data: any) {
    if (!data || typeof data !== "object") {
      throw new BadRequestException("Invalid data");
    }
  }

  /* ================= FIND ================= */

  async find_one(id: string, created_at: string) {
    this.validatePK(id, created_at);

    const result = await this.repo.find_one(id, created_at);

    return {
      success: true,
      ...result
    };
  }

  async find_cached(id: string, created_at: string) {
    this.validatePK(id, created_at);
    return await this.repo.find_cached(id, created_at);
  }

  async find_all() {
    const res = await this.repo.find_all();

    return {
      success: true,
      count: res.data.length,
      ...res
    };
  }

  async find_with_pagination(limit = 10, pageState?: string) {
    if (limit > 100) {
      throw new BadRequestException("Limit too large (max 100)");
    }

    return await this.repo.find_with_pagination(limit, pageState);
  }

  async find_by(condition: any) {
    if (!condition || typeof condition !== "object") {
      throw new BadRequestException("Invalid condition");
    }

    return await this.repo.find_by(condition);
  }

  /* ================= INSERT ================= */

  async insert_one(data: any) {
    this.validateData(data);

    // ✅ FIX: id optional now (repo generates)
    if (!data.created_at) {
     data.created_at = new Date();
    }

    data.is_premium = data.is_premium ?? false;

    return await this.repo.insert_one(data);
  }

  async insert_many_batch(data: any[]) {
    if (!Array.isArray(data) || !data.length) {
      throw new BadRequestException("Invalid array data");
    }

    // ✅ FIX: limit batch size (important in production)
    if (data.length > 200) {
      throw new BadRequestException("Batch limit exceeded (max 200)");
    }

    data = data.map(d => ({
      created_at: d.created_at ?? new Date().toISOString(),
      is_premium: false,
      ...d
    }));

    return await this.repo.insert_many_batch(data);
  }

  /* ================= UPDATE ================= */

  async update_one(id: string, created_at: string, data: any) {
    this.validatePK(id, created_at);
    this.validateData(data);

    delete data.id;
    delete data.created_at;

    return await this.repo.update_one(id, created_at, data);
  }

  async update_all(rows: any[], data: any) {
    if (!Array.isArray(rows) || !rows.length) {
      throw new BadRequestException("Rows required");
    }

    if (rows.length > 100) {
      throw new BadRequestException("Too many rows (max 100)");
    }

    this.validateData(data);

    return await this.repo.update_all(rows, data);
  }

  async update_by(condition: any, data: any) {
    if (!condition) {
      throw new BadRequestException("Condition required");
    }

    this.validateData(data);

    return await this.repo.update_by(condition, data);
  }

  /* ================= SOFT DELETE ================= */

  async soft_delete(id: string, created_at: string) {
    this.validatePK(id, created_at);
    return await this.repo.soft_delete(id, created_at);
  }

  /* ================= FIND IDS ================= */

  async find_ids(condition: any) {
    if (!condition) {
      throw new BadRequestException("Condition required");
    }

    // ⚠️ still using internal method, but safer wrapper
    const rows = await (this.repo as any).find_ids(condition);

    return {
      success: true,
      message: "find_ids success",
      data: rows
    };
  }

  /* ================= DELETE ================= */

  async delete_one(id: string, created_at: string) {
    this.validatePK(id, created_at);
    return await this.repo.delete_one(id, created_at);
  }

  async delete_by(condition: any) {
    if (!condition) {
      throw new BadRequestException("Condition required");
    }

    return await this.repo.delete_by(condition);
  }

  async delete_all() {
    return await this.repo.delete_all();
  }

  /* ================= FILE ================= */

  async upload_file(file: any) {
    if (!file) {
      throw new BadRequestException("File required");
    }

    return await this.repo.upload_file(file);
  }

  // ✅ NEW: multiple upload
  async upload_files(files: any[]) {
    if (!Array.isArray(files) || !files.length) {
      throw new BadRequestException("Files required");
    }

    return await this.repo.upload_files(files);
  }

  // ✅ NEW: stream upload (videos)
  async upload_stream(file: any) {
    if (!file) {
      throw new BadRequestException("File required");
    }

    return await this.repo.upload_stream(file);
  }
}