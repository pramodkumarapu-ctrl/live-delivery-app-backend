
import {
  Injectable,
  BadRequestException,
} from "@nestjs/common";

import { CartRepository } from "../../generated/cart.repository";

@Injectable()
export class CartService {
  constructor(
    private readonly repo: CartRepository,
  ) {}

  /* ================= COMMON ================= */

  private validatePK(user_id: string, product_id: string) {
    if (!user_id || !product_id) {
      throw new BadRequestException(
        "user_id and product_id are required",
      );
    }
  }

  private validateData(data: any) {
    if (!data || typeof data !== "object") {
      throw new BadRequestException(
        "Invalid data",
      );
    }
  }

  /* ================= FIND ================= */

  async find_one(
    user_id: string,
    product_id: string,
  ) {
    this.validatePK(user_id, product_id);

    const result = await this.repo.find_one(
      user_id,
      product_id,
    );

    return {
      success: true,
      ...result,
    };
  }

  async find_cached(
    user_id: string,
    product_id: string,
  ) {
    this.validatePK(user_id, product_id);

    return await this.repo.find_cached(
      user_id,
      product_id,
    );
  }

  async find_all() {
    const res = await this.repo.find_all();

    return {
      success: true,
      count: res.data.length,
      ...res,
    };
  }

  async find_with_pagination(
    limit = 10,
    pageState?: string,
  ) {
    return await this.repo.find_with_pagination(
      limit,
      pageState,
    );
  }

  async find_by(condition: any) {
    return await this.repo.find_by(condition);
  }

  /* ================= INSERT ================= */

  async insert_one(data: any) {
    this.validateData(data);

    data.quantity = data.quantity ?? 1;
    data.added_at =
      data.added_at ?? new Date();

    return await this.repo.insert_one(data);
  }

  async insert_many_batch(data: any[]) {
    if (!Array.isArray(data)) {
      throw new BadRequestException(
        "Invalid data",
      );
    }

    data = data.map((item) => ({
      quantity: 1,
      added_at: new Date(),
      ...item,
    }));

    return await this.repo.insert_many_batch(
      data,
    );
  }

  /* ================= UPDATE ================= */

  async update_one(
    user_id: string,
    product_id: string,
    data: any,
  ) {
    this.validatePK(user_id, product_id);

    return await this.repo.update_one(
  user_id,
  product_id,
  data,
);
  }

  async update_all(
    rows: any[],
    data: any,
  ) {
    return await this.repo.update_all(
      rows,
      data,
    );
  }

  async update_by(
    condition: any,
    data: any,
  ) {
    return await this.repo.update_by(
      condition,
      data,
    );
  }

  /* ================= SOFT DELETE ================= */

  async soft_delete(
    user_id: string,
    product_id: string,
  ) {
    return await this.repo.soft_delete({
      user_id,
      product_id,
    });
  }

  /* ================= IDS ================= */

  async find_ids(condition: any) {
    const rows = await (this.repo as any)
      .find_ids(condition);

    return {
      success: true,
      message: "find_ids success",
      data: rows,
    };
  }

  /* ================= DELETE ================= */

  async delete_one(
    user_id: string,
    product_id: string,
  ) {
   await this.repo.delete_one(
  user_id,
  product_id,
);
  }

  async delete_by(condition: any) {
    return await this.repo.delete_by(
      condition,
    );
  }

  async delete_all() {
    return await this.repo.delete_all();
  }

  /* ================= FILE ================= */

  async upload_file(file: any) {
    return await this.repo.upload_file(file);
  }

  async upload_files(files: any[]) {
    return await this.repo.upload_files(
      files,
    );
  }

  async upload_stream(file: any) {
    return await this.repo.upload_stream(file);
  }
}