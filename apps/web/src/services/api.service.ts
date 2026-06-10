import type { DashboardDto, PublicUser } from "@duraki/shared";
import { serverUrl } from "./config";
import { getToken } from "./token";

const authedGet = async <T>(path: string): Promise<T> => {
  const token = await getToken();
  const res = await fetch(`${serverUrl}${path}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  if (!res.ok) throw new Error(`Anfrage fehlgeschlagen (${res.status})`);
  return res.json() as Promise<T>;
};

export const fetchMe = (): Promise<PublicUser> => authedGet<PublicUser>("/api/me");

export const fetchDashboard = (): Promise<DashboardDto> =>
  authedGet<DashboardDto>("/api/dashboard");
