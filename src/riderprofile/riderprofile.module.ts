
import { Module } from "@nestjs/common";
import { RiderProfileController } from "./riderprofile.controller";
import { RiderProfileService } from "./riderprofile.service";
import { RiderProfileRepository } from "../../generated/riderprofile.repository";

@Module({
  controllers: [RiderProfileController],
  providers: [
    RiderProfileService,
    RiderProfileRepository,
  ],
  exports: [
    RiderProfileService,
    RiderProfileRepository,
  ],
})
export class RiderProfileModule {}