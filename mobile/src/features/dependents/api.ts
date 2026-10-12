import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { DependentProfile, DependentProfileInput } from "./types";

export function getMyDependents(accessToken: string) {
  return apiGet<DependentProfile[]>("/dependents", undefined, accessToken, {
    fresh: true,
  });
}

export function getMyDependent(dependentId: string, accessToken: string) {
  return apiGet<DependentProfile>(
    `/dependents/${encodeURIComponent(dependentId)}`,
    undefined,
    accessToken,
    { fresh: true },
  );
}

export function createDependent(
  input: DependentProfileInput,
  accessToken: string,
) {
  return apiPost<DependentProfile>(
    "/dependents",
    toDependentPayload(input),
    accessToken,
  );
}

export function updateDependent(
  dependentId: string,
  input: DependentProfileInput,
  accessToken: string,
) {
  return apiPatch<DependentProfile>(
    `/dependents/${encodeURIComponent(dependentId)}`,
    toDependentPayload(input),
    accessToken,
  );
}

function toDependentPayload(
  input: DependentProfileInput,
): DependentProfileInput {
  return {
    ...input,
    relationshipLabel:
      input.relationship === "DEPENDENT"
        ? input.relationshipLabel?.trim()
        : undefined,
  };
}

export function deleteDependent(dependentId: string, accessToken: string) {
  return apiDelete<{ deleted: true }>(
    `/dependents/${encodeURIComponent(dependentId)}`,
    accessToken,
  );
}
