
import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersRepository } from "../../generated/orders.repository";
import { OrdersService } from "./orders.service"

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
  ],
  exports: [
    OrdersService,
    OrdersRepository,
  ],
})
export class OrdersModule {}