// When each vault document exists for a client. A document is only offered
// (and, for clients, only generated) once the event it records has happened:
// no custody certificate before the metal is in storage, no insurance
// certificate without a policy.

export type VaultDocType = "vault-certificate" | "storage-agreement" | "assay-report" | "vault-insurance";

type DocInputs = {
  status: string;
  assayStatus: string;
  insuranceProvider: string | null;
  insurancePolicyNo: string | null;
  insuredValue: number | null;
};

const IN_CUSTODY = ["DOCUMENTED", "IN_STORAGE", "RELEASE_REQUESTED", "RELEASE_APPROVED"];
const AGREEMENT_EXISTS = [...IN_CUSTODY, "RELEASED", "LIQUIDATION_IN_PROGRESS", "LIQUIDATED"];

export const VAULT_DOCUMENTS: { type: VaultDocType; label: string; available: (d: DocInputs) => boolean }[] = [
  { type: "vault-certificate", label: "Custody certificate", available: (d) => IN_CUSTODY.includes(d.status) },
  { type: "storage-agreement", label: "Storage agreement", available: (d) => AGREEMENT_EXISTS.includes(d.status) },
  { type: "assay-report", label: "Assay report", available: (d) => d.assayStatus === "PASSED" || d.assayStatus === "FAILED" },
  {
    type: "vault-insurance",
    label: "Insurance certificate",
    available: (d) => Boolean(d.insuranceProvider && d.insurancePolicyNo && d.insuredValue),
  },
];

export function isDocumentAvailable(type: string, deposit: DocInputs) {
  return VAULT_DOCUMENTS.some((doc) => doc.type === type && doc.available(deposit));
}
