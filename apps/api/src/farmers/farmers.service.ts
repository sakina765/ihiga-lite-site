import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Not, Repository } from "typeorm";
import { Farmer } from "./entities/farmer.entity";
import { normalizePhoneNumber } from "./phone-number.util";
import { SectorsService } from "../location/sectors.service";
import { GeocodingService } from "../location/geocoding.service";
import { ChatLanguage } from "../ai/types";
import { Conversation } from "../chat/entities/conversation.entity";
import { Message } from "../chat/entities/message.entity";
import { Crop } from "../crops/entities/crop.entity";
import { Sector } from "../location/entities/sector.entity";

// Marker used to permanently sever a deleted farmer's row from
// normalizePhoneNumber-based lookups (see FarmersService.deactivate) while
// still letting the admin UI show the original number for historical
// reference — stripped back off by displayPhoneNumber below, never sent to
// registerOrFind or normalizePhoneNumber again.
const DELETED_PHONE_MARKER = "#deleted#";

function displayPhoneNumber(phoneNumber: string): string {
  const markerIndex = phoneNumber.indexOf(DELETED_PHONE_MARKER);
  return markerIndex === -1 ? phoneNumber : phoneNumber.slice(0, markerIndex);
}

export interface AdminFarmerListItem {
  id: string;
  phoneNumber: string;
  district: string | null;
  preferredLanguage: ChatLanguage | null;
  createdAt: Date;
  deactivatedAt: Date | null;
  trackedCropName: string | null;
}

export interface AdminFarmerConversationSummary {
  id: string;
  createdAt: Date;
  language: ChatLanguage | null;
  cropName: string | null;
  messageCount: number;
}

/** Farmer's own fields minus passwordHash — a credential hash must never leave the server, even to an authenticated admin. */
export type AdminFarmerProfile = Omit<Farmer, "passwordHash">;

export interface AdminFarmerDetail {
  farmer: AdminFarmerProfile;
  sector: Sector | null;
  conversations: AdminFarmerConversationSummary[];
}

export interface RegisterOrFindParams {
  phoneNumber: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  /** Sector chosen via the cascading location picker (manually or GPS-auto-filled-then-reviewed). */
  sectorId?: string;
  villageText?: string;
  /** UI language chosen at onboarding (Phase 9). */
  preferredLanguage?: ChatLanguage;
}

interface ResolvedSectorFields {
  sectorId: string;
  /** Derived from the sector row itself — authoritative regardless of whether the caller also passed a district string. */
  district: string | null;
  villageText: string | null;
  resolvedLatitude: number | null;
  resolvedLongitude: number | null;
}

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer) private readonly farmerRepository: Repository<Farmer>,
    @InjectRepository(Conversation) private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
    @InjectRepository(Crop) private readonly cropRepository: Repository<Crop>,
    private readonly sectorsService: SectorsService,
    private readonly geocodingService: GeocodingService,
  ) {}

  /** Idempotent by phone number — registering the same number twice returns the same Farmer. */
  async registerOrFind(params: RegisterOrFindParams): Promise<Farmer> {
    const normalized = normalizePhoneNumber(params.phoneNumber);
    const existing = await this.farmerRepository.findOne({ where: { phoneNumber: normalized } });

    if (existing) {
      let changed = false;
      // Sector resolution (and any Nominatim call it triggers) only ever runs
      // once per farmer — backfill-only, same as district/GPS below — so a
      // farmer who already completed the picker never re-triggers geocoding.
      // Resolved first so its authoritative sector.district (see below) can
      // still apply even if the plain `district` backfill just below it
      // doesn't fire (e.g. a caller that sends sectorId without district).
      if (params.sectorId && !existing.sectorId) {
        const resolved = await this.resolveSectorFields(params.sectorId, params.villageText);
        Object.assign(existing, resolved);
        changed = true;
      }
      if ((params.district || existing.district) && !existing.district) {
        existing.district = params.district ?? existing.district;
        changed = true;
      }
      // Same backfill-only pattern as district: never overwrite GPS a farmer already shared.
      if (params.latitude !== undefined && params.longitude !== undefined && existing.farmLatitude === null) {
        existing.farmLatitude = params.latitude;
        existing.farmLongitude = params.longitude;
        changed = true;
      }
      // Same backfill-only pattern — a returning farmer who already set a
      // preference keeps it; changing it later goes through
      // updatePreferredLanguage() (the persistent switcher), not re-registration.
      if (params.preferredLanguage && !existing.preferredLanguage) {
        existing.preferredLanguage = params.preferredLanguage;
        changed = true;
      }
      return changed ? this.farmerRepository.save(existing) : existing;
    }

    const resolved = params.sectorId ? await this.resolveSectorFields(params.sectorId, params.villageText) : null;

    const farmer = this.farmerRepository.create({
      phoneNumber: normalized,
      // The sector is the authoritative source of its own district (see
      // Sector entity) once one is chosen — takes precedence over a plain
      // `district` param so /weather/today and crop suggestions (both keyed
      // off farmer.district) work regardless of what the caller also sent.
      district: resolved?.district ?? params.district ?? null,
      farmLatitude: params.latitude ?? null,
      farmLongitude: params.longitude ?? null,
      preferredLanguage: params.preferredLanguage ?? null,
      lastNotifiedStageId: null,
      lastNotifiedWeatherAlertDate: null,
      sectorId: resolved?.sectorId ?? null,
      villageText: resolved?.villageText ?? null,
      resolvedLatitude: resolved?.resolvedLatitude ?? null,
      resolvedLongitude: resolved?.resolvedLongitude ?? null,
    });
    return this.farmerRepository.save(farmer);
  }

  /**
   * Resolves a chosen sector (+ optional free-text village) to a district and
   * final farm coordinate, in precedence order: geocoded village > sector
   * centroid. Raw GPS (farmLatitude/farmLongitude) is a separate,
   * lower-precedence fallback applied by the weather layer when
   * resolvedLatitude/resolvedLongitude are null — see WeatherController.today().
   */
  private async resolveSectorFields(sectorId: string, villageText?: string): Promise<ResolvedSectorFields> {
    const trimmedVillage = villageText?.trim() || undefined;
    const [sector, geocoded] = await Promise.all([
      this.sectorsService.getById(sectorId),
      trimmedVillage ? this.geocodingService.resolveVillage(sectorId, trimmedVillage) : Promise.resolve(null),
    ]);

    return {
      sectorId,
      district: sector?.district ?? null,
      villageText: trimmedVillage ?? null,
      resolvedLatitude: geocoded?.lat ?? sector?.lat ?? null,
      resolvedLongitude: geocoded?.lng ?? sector?.lng ?? null,
    };
  }

  getById(id: string): Promise<Farmer | null> {
    return this.farmerRepository.findOne({ where: { id } });
  }

  /**
   * Deliberately indistinguishable from "farmer exists but hasn't set a
   * preference yet" — both return null. Unlike the chat module's
   * conversationId+farmerId pair, this is a bare id lookup with no companion
   * credential to check ownership against, so the only way to avoid a
   * distinguishable exists-vs-doesn't-exist oracle here is to never
   * surface the difference at all (see the same reasoning applied to
   * updatePreferredLanguage below).
   */
  async getPreferredLanguage(id: string): Promise<ChatLanguage | null> {
    const farmer = await this.farmerRepository.findOne({ where: { id } });
    return farmer?.preferredLanguage ?? null;
  }

  /**
   * Lets ChatGate (the farmer-facing client) find out its own account is
   * deactivated BEFORE rendering the chat widget, rather than only ever
   * finding out after sending a message and getting
   * ChatOrchestratorService's canned reply back. Same anti-enumeration
   * treatment as getPreferredLanguage above: a nonexistent id returns
   * `false`, identical to a real, active farmer — never a distinguishable
   * signal that the id doesn't exist.
   */
  async isDeactivated(id: string): Promise<boolean> {
    const farmer = await this.farmerRepository.findOne({ where: { id } });
    return !!farmer?.deactivatedAt;
  }

  /**
   * Explicit update path for the persistent language switcher — unlike
   * registration's backfill-only pattern, this always overwrites, since the
   * farmer is deliberately changing their preference right now. A
   * nonexistent id is a silent no-op rather than a distinguishable
   * NotFoundException — probing this endpoint with candidate farmerIds
   * learns nothing about which ones are real.
   */
  async updatePreferredLanguage(id: string, preferredLanguage: ChatLanguage): Promise<void> {
    const farmer = await this.farmerRepository.findOne({ where: { id } });
    if (!farmer) {
      return;
    }
    farmer.preferredLanguage = preferredLanguage;
    await this.farmerRepository.save(farmer);
  }

  getAll(): Promise<Farmer[]> {
    return this.farmerRepository.find();
  }

  save(farmer: Farmer): Promise<Farmer> {
    return this.farmerRepository.save(farmer);
  }

  private async getByIdOrThrow(id: string): Promise<Farmer> {
    const farmer = await this.farmerRepository.findOne({ where: { id } });
    if (!farmer) {
      throw new NotFoundException(`No farmer found with id "${id}"`);
    }
    return farmer;
  }

  /**
   * Same lookup, but 404s for an admin account too — every admin-panel
   * farmer-oversight method (detail view, deactivate) uses this, not
   * getByIdOrThrow, so this surface can never be pointed at an admin's own
   * Farmer row (matches adminList's role='farmer' filter).
   */
  private async getFarmerRecordOrThrow(id: string): Promise<Farmer> {
    const farmer = await this.getByIdOrThrow(id);
    if (farmer.role !== "farmer") {
      throw new NotFoundException(`No farmer found with id "${id}"`);
    }
    return farmer;
  }

  /** Strips passwordHash (never sent to the client, even hashed, even to an authenticated admin) and un-mangles a deleted farmer's phoneNumber back to its original, readable form for display. */
  private toAdminProfile(farmer: Farmer): AdminFarmerProfile {
    const { passwordHash: _passwordHash, ...profile } = farmer;
    return { ...profile, phoneNumber: displayPhoneNumber(profile.phoneNumber) };
  }

  /**
   * Paginated, searchable read-only list for the admin panel — role='farmer'
   * only, so admin accounts (also Farmer rows, see FarmerRole) never show up
   * as something to manage/deactivate here. Search matches phone number OR
   * district (loosely called "region" in the admin UI) with a single ILIKE,
   * since this is an authenticated-admin-only lookup, not farmer-facing (the
   * anti-enumeration masking elsewhere in this codebase doesn't apply here —
   * the whole point of this endpoint is letting an admin find a real farmer).
   */
  async adminList(params: { search?: string; page: number; pageSize: number }): Promise<{ items: AdminFarmerListItem[]; total: number }> {
    const qb = this.farmerRepository.createQueryBuilder("farmer").where("farmer.role = :role", { role: "farmer" });

    if (params.search) {
      qb.andWhere("(farmer.phoneNumber ILIKE :search OR farmer.district ILIKE :search)", { search: `%${params.search}%` });
    }

    const total = await qb.getCount();
    const farmers = await qb
      .orderBy("farmer.createdAt", "DESC")
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getMany();

    const trackedCropByFarmerId = await this.resolveTrackedCropNames(farmers.map((f) => f.id));

    const items: AdminFarmerListItem[] = farmers.map((farmer) => ({
      id: farmer.id,
      phoneNumber: displayPhoneNumber(farmer.phoneNumber),
      district: farmer.district,
      preferredLanguage: farmer.preferredLanguage,
      createdAt: farmer.createdAt,
      deactivatedAt: farmer.deactivatedAt,
      trackedCropName: trackedCropByFarmerId.get(farmer.id) ?? null,
    }));

    return { items, total };
  }

  /**
   * Batched (not N+1) — one conversations query and one crops query for the
   * whole page, then joined in memory. Picks each farmer's MOST RECENT
   * tracked crop, same "latest conversation with cropId+plantingDate set"
   * rule as CurrentCropService.getForFarmer uses for a single farmer.
   */
  private async resolveTrackedCropNames(farmerIds: string[]): Promise<Map<string, string>> {
    if (farmerIds.length === 0) {
      return new Map();
    }

    const conversations = await this.conversationRepository.find({
      where: { farmerId: In(farmerIds), cropId: Not(IsNull()), plantingDate: Not(IsNull()) },
      order: { createdAt: "DESC" },
    });

    const latestCropIdByFarmerId = new Map<string, string>();
    for (const conversation of conversations) {
      if (conversation.farmerId && !latestCropIdByFarmerId.has(conversation.farmerId)) {
        latestCropIdByFarmerId.set(conversation.farmerId, conversation.cropId!);
      }
    }

    const cropIds = [...new Set(latestCropIdByFarmerId.values())];
    const crops = cropIds.length > 0 ? await this.cropRepository.find({ where: { id: In(cropIds) } }) : [];
    const cropNameById = new Map(crops.map((crop) => [crop.id, crop.name]));

    const result = new Map<string, string>();
    for (const [farmerId, cropId] of latestCropIdByFarmerId) {
      const name = cropNameById.get(cropId);
      if (name) {
        result.set(farmerId, name);
      }
    }
    return result;
  }

  /**
   * Single-farmer detail view — includes the farmer's conversation list
   * (id/date/language/crop/message count) but deliberately NOT message
   * content, which is Phase 5's conversation viewer, not farmer oversight.
   */
  async adminGetDetail(id: string): Promise<AdminFarmerDetail> {
    const farmer = await this.getFarmerRecordOrThrow(id);
    const sector = farmer.sectorId ? await this.sectorsService.getById(farmer.sectorId) : null;

    const conversations = await this.conversationRepository.find({ where: { farmerId: id }, order: { createdAt: "DESC" } });

    const cropIds = [...new Set(conversations.filter((c) => c.cropId).map((c) => c.cropId as string))];
    const crops = cropIds.length > 0 ? await this.cropRepository.find({ where: { id: In(cropIds) } }) : [];
    const cropNameById = new Map(crops.map((crop) => [crop.id, crop.name]));

    const messageCountByConversationId = new Map<string, number>();
    if (conversations.length > 0) {
      const rawCounts = await this.messageRepository
        .createQueryBuilder("message")
        .select("message.conversationId", "conversationId")
        .addSelect("COUNT(*)", "count")
        .where("message.conversationId IN (:...ids)", { ids: conversations.map((c) => c.id) })
        .groupBy("message.conversationId")
        .getRawMany<{ conversationId: string; count: string }>();
      for (const row of rawCounts) {
        messageCountByConversationId.set(row.conversationId, Number(row.count));
      }
    }

    const conversationSummaries: AdminFarmerConversationSummary[] = conversations.map((conversation) => ({
      id: conversation.id,
      createdAt: conversation.createdAt,
      language: conversation.language,
      cropName: conversation.cropId ? cropNameById.get(conversation.cropId) ?? null : null,
      messageCount: messageCountByConversationId.get(conversation.id) ?? 0,
    }));

    return { farmer: this.toAdminProfile(farmer), sector, conversations: conversationSummaries };
  }

  /**
   * Irreversible by design — there is no un-delete. The row itself, and its
   * conversations/messages/notification history, are kept (never actually
   * erased, so admin-panel history and any audit trail survive), but
   * `phoneNumber` is permanently mangled with this farmer's own id as a
   * unique, deterministic suffix. That's the part that makes this
   * irreversible in practice: it both permanently fails
   * normalizePhoneNumber's `^\+2507\d{8}$`-shaped regex (so this row can
   * never again be matched by phone number) AND frees the real number for
   * registerOrFind to treat as brand new — the same phone number can be used
   * to create a genuinely fresh, active account afterward. Idempotent: a
   * second call on an already-deleted farmer is a no-op rather than
   * mangling an already-mangled number further.
   */
  async deactivate(id: string): Promise<AdminFarmerProfile> {
    const farmer = await this.getFarmerRecordOrThrow(id);
    if (!farmer.deactivatedAt) {
      farmer.deactivatedAt = new Date();
      farmer.phoneNumber = `${farmer.phoneNumber}${DELETED_PHONE_MARKER}${farmer.id}`;
    }
    return this.toAdminProfile(await this.farmerRepository.save(farmer));
  }
}
