export type DisplayRole = "user" | "bot" | "error";
export type DisplayInputType = "text" | "voice" | "photo";

export interface DisplayMessage {
  id: string;
  role: DisplayRole;
  text: string;
  chips?: string[];
  timestamp: number;
  inputType?: DisplayInputType;
  /** Local object URL for a photo message's thumbnail — only set for inputType "photo". */
  imageUrl?: string;
}
