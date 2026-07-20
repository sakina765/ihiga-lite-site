import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { FarmersService } from "./farmers.service";
import { RegisterFarmerDto } from "./dto/register-farmer.dto";
import { UpdatePreferredLanguageDto } from "./dto/update-preferred-language.dto";

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
      preferredLanguage: body.preferredLanguage,
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
      preferredLanguage: farmer.preferredLanguage,
    };
  }

  // The persistent language switcher calls this directly (by farmerId) once a
  // farmer is registered — separate from register() above, which only ever
  // backfills a missing preference and never overwrites an explicit choice.
  //
  // A nonexistent farmerId is a silent no-op (see FarmersService.updatePreferredLanguage)
  // rather than a 404 — this is a bare id lookup with no companion credential
  // to check ownership against (unlike the chat module's conversationId+
  // farmerId pair), so a distinguishable 404-vs-200 here would let a caller
  // enumerate which farmerIds are real just by probing this endpoint.
  @Patch(":id/language")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async updateLanguage(@Param("id") id: string, @Body() body: UpdatePreferredLanguageDto) {
    await this.farmersService.updatePreferredLanguage(id, body.preferredLanguage);
    return { farmerId: id, preferredLanguage: body.preferredLanguage };
  }

  // LanguageProvider reads this on mount for a returning registered farmer —
  // deliberately minimal (just the language, not the full farmer record) since
  // that's all the UI needs, unlike register()'s full profile response.
  //
  // Same anti-enumeration treatment as updateLanguage above: a nonexistent
  // farmerId returns 200 with preferredLanguage: null, identical to a real
  // farmer who simply hasn't set one — never a distinguishable 404.
  @Get(":id/language")
  async getLanguage(@Param("id") id: string) {
    const preferredLanguage = await this.farmersService.getPreferredLanguage(id);
    return { farmerId: id, preferredLanguage };
  }
}
