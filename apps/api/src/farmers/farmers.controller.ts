import { Body, Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { FarmersService } from "./farmers.service";
import { RegisterFarmerDto } from "./dto/register-farmer.dto";

@Controller("farmers")
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  // Stricter than the chat endpoints — registration has no legitimate reason
  // to be called many times in a minute by the same client, and is the
  // cheapest target for spam/enumeration.
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() body: RegisterFarmerDto) {
    const farmer = await this.farmersService.registerOrFind({
      phoneNumber: body.phoneNumber,
      district: body.district?.trim() || undefined,
      latitude: body.latitude,
      longitude: body.longitude,
      sectorId: body.sectorId,
      villageText: body.villageText?.trim() || undefined,
    });
    return {
      farmerId: farmer.id,
      phoneNumber: farmer.phoneNumber,
      district: farmer.district,
      latitude: farmer.farmLatitude,
      longitude: farmer.farmLongitude,
      sectorId: farmer.sectorId,
      villageText: farmer.villageText,
      resolvedLatitude: farmer.resolvedLatitude,
      resolvedLongitude: farmer.resolvedLongitude,
    };
  }
}
