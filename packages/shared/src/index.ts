export interface HealthCheckResponse {
  status: "ok" | "error";
  db: boolean;
}
