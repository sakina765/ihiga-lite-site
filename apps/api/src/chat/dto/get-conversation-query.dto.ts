import { IsUUID } from "class-validator";

export class GetConversationQueryDto {
  @IsUUID()
  farmerId: string;
}
