
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

import { CartService } from "./cart.service";

@Controller("cart")
export class CartController {
  constructor(
    private readonly service: CartService,
  ) {}

  /* ================= FIND ================= */

  @Get()
  find_all() {
    return this.service.find_all();
  }

  @Get("pagination")
  find_with_pagination(
    @Query("limit") limit?: number,
    @Query("pageState") pageState?: string,
  ) {
    return this.service.find_with_pagination(
      Number(limit) || 10,
      pageState,
    );
  }

  @Get(":user_id/:product_id")
  find_one(
    @Param("user_id") user_id: string,
    @Param("product_id") product_id: string,
  ) {
    return this.service.find_one(
      user_id,
      product_id,
    );
  }

  @Get("cached/:user_id/:product_id")
  find_cached(
    @Param("user_id") user_id: string,
    @Param("product_id") product_id: string,
  ) {
    return this.service.find_cached(
      user_id,
      product_id,
    );
  }

  @Post("find_by")
  find_by(@Body() body: any) {
    return this.service.find_by(body);
  }

  /* ================= INSERT ================= */

  @Post()
  insert_one(@Body() body: any) {
    return this.service.insert_one(body);
  }

  @Post("batch")
  insert_many(@Body() body: any[]) {
    return this.service.insert_many_batch(
      body,
    );
  }

  /* ================= UPDATE ================= */

  @Put(":user_id/:product_id")
  update_one(
    @Param("user_id") user_id: string,
    @Param("product_id") product_id: string,
    @Body() body: any,
  ) {
    return this.service.update_one(
      user_id,
      product_id,
      body,
    );
  }

  @Put("update_all")
  update_all(
    @Body("rows") rows: any[],
    @Body("data") data: any,
  ) {
    return this.service.update_all(
      rows,
      data,
    );
  }

  @Put("update_by")
  update_by(
    @Body("condition") condition: any,
    @Body("data") data: any,
  ) {
    return this.service.update_by(
      condition,
      data,
    );
  }

  /* ================= SOFT DELETE ================= */

  @Put("soft_delete/:user_id/:product_id")
  soft_delete(
    @Param("user_id") user_id: string,
    @Param("product_id") product_id: string,
  ) {
    return this.service.soft_delete(
      user_id,
      product_id,
    );
  }

  /* ================= DELETE ================= */

  @Delete(":user_id/:product_id")
  delete_one(
    @Param("user_id") user_id: string,
    @Param("product_id") product_id: string,
  ) {
    return this.service.delete_one(
      user_id,
      product_id,
    );
  }

  @Post("delete_by")
  delete_by(@Body() body: any) {
    return this.service.delete_by(body);
  }

  @Delete()
  delete_all() {
    return this.service.delete_all();
  }

  /* ================= FILE ================= */

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  upload_file(
    @UploadedFile() file: any,
  ) {
    return this.service.upload_file(file);
  }

  @Post("upload/multiple")
  @UseInterceptors(
    FilesInterceptor("files"),
  )
  upload_files(
    @UploadedFiles() files: any[],
  ) {
    return this.service.upload_files(files);
  }

  @Post("upload/stream")
  @UseInterceptors(FileInterceptor("file"))
  upload_stream(
    @UploadedFile() file: any,
  ) {
    return this.service.upload_stream(file);
  }
}