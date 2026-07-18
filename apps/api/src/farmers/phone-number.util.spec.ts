import { BadRequestException } from "@nestjs/common";
import { normalizePhoneNumber } from "./phone-number.util";

describe("normalizePhoneNumber", () => {
  it.each([
    ["0788123456", "+250788123456"],
    ["+250788123456", "+250788123456"],
    ["250788123456", "+250788123456"],
    ["788123456", "+250788123456"],
    ["078 812 3456", "+250788123456"],
    ["+250 788 123 456", "+250788123456"],
    ["078-812-3456", "+250788123456"],
    ["(078) 812-3456", "+250788123456"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizePhoneNumber(input)).toBe(expected);
  });

  it("throws BadRequestException for a number that's too short", () => {
    expect(() => normalizePhoneNumber("12345")).toThrow(BadRequestException);
  });

  it("throws BadRequestException for a non-Rwandan country code", () => {
    expect(() => normalizePhoneNumber("+15551234567")).toThrow(BadRequestException);
  });

  it("throws BadRequestException for garbage input", () => {
    expect(() => normalizePhoneNumber("not a phone number")).toThrow(BadRequestException);
  });
});
