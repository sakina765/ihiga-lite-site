import { maskIpAddress, maskPhoneNumber } from "./pii.util";

describe("maskPhoneNumber", () => {
  it("masks all but the last 4 characters", () => {
    expect(maskPhoneNumber("+250788123456")).toBe("*********3456");
  });

  it("masks a shorter number entirely if it has 4 or fewer characters", () => {
    expect(maskPhoneNumber("1234")).toBe("****");
    expect(maskPhoneNumber("12")).toBe("**");
  });
});

describe("maskIpAddress", () => {
  it("zeroes the last octet of an IPv4 address", () => {
    expect(maskIpAddress("192.168.1.100")).toBe("192.168.1.0");
  });

  it("strips the ::ffff: IPv4-mapped prefix before masking", () => {
    expect(maskIpAddress("::ffff:127.0.0.1")).toBe("127.0.0.0");
  });

  it("zeroes the last group of an IPv6 address", () => {
    expect(maskIpAddress("2001:db8:85a3:0:0:8a2e:370:7334")).toBe("2001:db8:85a3:0:0:8a2e:370:0");
  });

  it("falls back to fully masking anything unrecognizable", () => {
    expect(maskIpAddress("not-an-ip")).toBe("*".repeat("not-an-ip".length));
  });
});
