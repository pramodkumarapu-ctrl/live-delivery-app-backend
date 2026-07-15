
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";

import {
  FileInterceptor,
  FilesInterceptor,
} from "@nestjs/platform-express";

import { StoreService } from "./store.service";

@Controller("stores")
export class StoreController {
  constructor(private readonly service: StoreService) {}

  /* ================= FIND ================= */

  @Get()
  async find_all() {
    return this.service.find_all();
  }

  @Get("pagination")
  async find_with_pagination(
    @Query("limit") limit?: number,
    @Query("pageState") pageState?: string
  ) {
    return this.service.find_with_pagination(
      Number(limit) || 10,
      pageState
    );
  }

  @Get(":id")
  async find_one(
    @Param("id") id: string
  ) {
    return this.service.find_one(id);
  }

  @Get("cached/:id")
  async find_cached(
    @Param("id") id: string
  ) {
    return this.service.find_cached(id);
  }

  @Post("find_by")
  async find_by(
    @Body() body: any
  ) {
    return this.service.find_by(body);
  }

  /* ================= INSERT ================= */

  @Post()
  async insert_one(
    @Body() body: any
  ) {
    return this.service.insert_one(body);
  }

  @Post("batch")
  async insert_many(
    @Body() body: any[]
  ) {
    return this.service.insert_many_batch(body);
  }

  /* ================= UPDATE ================= */

  @Put(":id")
  async update_one(
    @Param("id") id: string,
    @Body() body: any
  ) {
    return this.service.update_one(id, body);
  }

  @Put("update_all")
  async update_all(
    @Body("rows") rows: any[],
    @Body("data") data: any
  ) {
    return this.service.update_all(rows, data);
  }

  @Put("update_by")
  async update_by(
    @Body("condition") condition: any,
    @Body("data") data: any
  ) {
    return this.service.update_by(condition, data);
  }

  /* ================= SOFT DELETE ================= */

  @Put("soft_delete/:id")
  async soft_delete(
    @Param("id") id: string
  ) {
    return this.service.soft_delete(id);
  }

  /* ================= DELETE ================= */

  @Delete(":id")
  async delete_one(
    @Param("id") id: string
  ) {
    return this.service.delete_one(id);
  }

  @Post("delete_by")
  async delete_by(
    @Body() condition: any
  ) {
    return this.service.delete_by(condition);
  }

  @Delete()
  async delete_all() {
    return this.service.delete_all();
  }

  /* ================= FILE ================= */

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload_file(
    @UploadedFile() file: any
  ) {
    return this.service.upload_file(file);
  }

  @Post("upload/multiple")
  @UseInterceptors(FilesInterceptor("files"))
  async upload_files(
    @UploadedFiles() files: any[]
  ) {
    return this.service.upload_files(files);
  }

  @Post("upload/stream")
  @UseInterceptors(FileInterceptor("file"))
  async upload_stream(
    @UploadedFile() file: any
  ) {
    return this.service.upload_stream(file);
  }
}