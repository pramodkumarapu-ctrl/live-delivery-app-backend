import { Module } from "@nestjs/common";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import { ProductRepository } from "../../generated/product.repository";

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
  ],
  exports: [
    ProductService,
    ProductRepository,
  ],
})
export class ProductModule {}