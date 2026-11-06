export type FieldType = "text" | "number" | "date" | "email" | "password" | "textarea" | "select";

export type FieldDef = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  span?: 1 | 2 | 3;
};

export type EntityDef = {
  table: string;
  pk: string;
  title: string;
  description: string;
  searchable: string[];
  fields: FieldDef[];
};

const activeOptions = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
];

const roleOptions = [
  { value: 1, label: "Administrator" },
  { value: 2, label: "Staff" },
  { value: 3, label: "Contractor" },
];

export const entityDefs: Record<string, EntityDef> = {
  property: {
    table: "property",
    pk: "sl_no",
    title: "Properties",
    description: "Property records used by issues, schedules and invoices.",
    searchable: ["p_code", "p_name", "p_no", "p_location", "post_code", "tenant", "landlord"],
    fields: [
      { name: "p_code", label: "Property code", required: true },
      { name: "p_name", label: "Property name", required: true },
      { name: "p_no", label: "Property number", required: true },
      { name: "p_location", label: "Location" },
      { name: "post_code", label: "Postcode" },
      { name: "p_type", label: "Property type" },
      { name: "p_id", label: "Legacy P ID", placeholder: "Unique property key" },
      { name: "r_id", label: "Client ID", type: "number" },
      { name: "landlord", label: "Landlord" },
      { name: "landlord_phone", label: "Landlord phone" },
      { name: "landlord_email", label: "Landlord email", type: "email" },
      { name: "tenant", label: "Tenant" },
      { name: "tenant_phone", label: "Tenant phone" },
      { name: "tenant_email", label: "Tenant email", type: "email" },
      { name: "key_no", label: "Key number" },
      { name: "gas", label: "Gas certificate date", type: "date" },
      { name: "lra", label: "LRA date", type: "date" },
      { name: "pir", label: "PIR date", type: "date" },
      { name: "pat", label: "PAT date", type: "date" },
      { name: "reg", label: "Regulation date", type: "date" },
      { name: "n_code", label: "Nominal code" },
      { name: "d_code", label: "Department code" },
      { name: "active", label: "Status", type: "select", options: activeOptions },
      { name: "p_note", label: "Property note", type: "textarea", span: 2 },
      { name: "note", label: "Internal note", type: "textarea", span: 2 },
    ],
  },
  contractor: {
    table: "contractor",
    pk: "c_id",
    title: "Contractors",
    description: "Engineers and subcontractors available for appointments.",
    searchable: ["contractor", "email", "mobile", "tradesman", "c_username"],
    fields: [
      { name: "contractor", label: "Contractor", required: true },
      { name: "mobile", label: "Mobile" },
      { name: "email", label: "Email", type: "email" },
      { name: "tradesman", label: "Trade" },
      { name: "color", label: "Calendar colour", placeholder: "#228fc5" },
      { name: "c_username", label: "Portal username" },
      { name: "password", label: "Portal password", type: "password" },
      { name: "acc_ref", label: "Account reference" },
      { name: "d_code", label: "Department code" },
      { name: "role", label: "Role", type: "select", options: roleOptions },
      { name: "myorder", label: "Display order", type: "number" },
      { name: "active", label: "Status", type: "select", options: activeOptions },
      { name: "subcontractor_portal", label: "Subcontractor portal", type: "select", options: [{ value: 1, label: "Yes" }, { value: 0, label: "No" }] },
    ],
  },
  reporter: {
    table: "reporter",
    pk: "r_id",
    title: "Clients",
    description: "Client / reporter accounts linked to properties.",
    searchable: ["reporter", "email", "phone", "reporter_code", "address"],
    fields: [
      { name: "reporter", label: "Client name", required: true },
      { name: "reporter_code", label: "Client code" },
      { name: "phone", label: "Phone" },
      { name: "email", label: "Email", type: "email" },
      { name: "address", label: "Address", type: "textarea", span: 2 },
      { name: "account_status", label: "Account status", type: "select", options: [{ value: 0, label: "Normal" }, { value: 1, label: "On hold" }, { value: 2, label: "Good history" }] },
      { name: "active", label: "Status", type: "select", options: activeOptions },
      { name: "n_code", label: "Nominal code" },
      { name: "n_code2", label: "Secondary nominal code" },
      { name: "d_code", label: "Department code" },
      { name: "gsc", label: "GSC rate", type: "number" },
      { name: "eicr", label: "EICR rate", type: "number" },
      { name: "pat", label: "PAT rate", type: "number" },
      { name: "eicr_and_pat", label: "EICR + PAT rate", type: "number" },
      { name: "lra", label: "LRA rate", type: "number" },
      { name: "epc", label: "EPC rate", type: "number" },
    ],
  },
  supplier: {
    table: "supplier",
    pk: "s_id",
    title: "Suppliers",
    description: "Merchants and parts suppliers.",
    searchable: ["supplier", "s_code", "email", "phone"],
    fields: [
      { name: "s_code", label: "Supplier code", required: true },
      { name: "supplier", label: "Supplier", required: true },
      { name: "phone", label: "Phone" },
      { name: "email", label: "Email", type: "email" },
      { name: "n_code", label: "Nominal code" },
      { name: "d_code", label: "Department code" },
      { name: "active", label: "Status", type: "select", options: activeOptions },
    ],
  },
  account: {
    table: "account",
    pk: "sl_no",
    title: "Nominal Accounts",
    description: "Sales and expenditure nominal codes.",
    searchable: ["nominal", "n_code"],
    fields: [
      { name: "nominal", label: "Nominal name", required: true },
      { name: "n_code", label: "Nominal code", required: true },
      { name: "active", label: "Status", type: "select", options: activeOptions },
    ],
  },
  department: {
    table: "department",
    pk: "sl_no",
    title: "Departments",
    description: "Department codes used on invoices and purchases.",
    searchable: ["name", "d_code"],
    fields: [
      { name: "name", label: "Department name", required: true },
      { name: "d_code", label: "Department code", required: true },
    ],
  },
  material: {
    table: "material",
    pk: "id",
    title: "Materials",
    description: "Parts and materials catalogue.",
    searchable: ["product_detail", "product_code", "s_code", "schedule_id"],
    fields: [
      { name: "product_detail", label: "Product detail", required: true, span: 2 },
      { name: "product_code", label: "Product code" },
      { name: "s_code", label: "Supplier code" },
      { name: "schedule_id", label: "Schedule / job reference" },
      { name: "additional_comment", label: "Comment", type: "textarea", span: 2 },
      { name: "purchased", label: "Purchased", type: "select", options: [{ value: 1, label: "Yes" }, { value: 0, label: "No" }] },
      { name: "deleted", label: "Deleted", type: "select", options: [{ value: 1, label: "Yes" }, { value: 0, label: "No" }] },
    ],
  },
  "email-format": {
    table: "email_format",
    pk: "id",
    title: "Email Formats",
    description: "Merge tags available to email templates.",
    searchable: ["e_format", "e_desc"],
    fields: [
      { name: "e_format", label: "Format tag", placeholder: "%property_address%" },
      { name: "e_desc", label: "Description", type: "textarea" },
    ],
  },
  "email-template": {
    table: "email_templates",
    pk: "email_id",
    title: "Email Templates",
    description: "Reusable emails for issues, quotes and invoices.",
    searchable: ["email_name", "email_template"],
    fields: [
      { name: "email_name", label: "Template name", required: true },
      { name: "email_template", label: "Email body (HTML allowed)", type: "textarea", span: 3 },
    ],
  },
  global: {
    table: "config",
    pk: "id",
    title: "Global Settings",
    description: "Organisation branding. The 'name' row controls the CRM name, 'app_subtitle' controls the label under it, and 'organization' is the fallback name.",
    searchable: ["name", "value"],
    fields: [
      { name: "name", label: "Setting name", required: true },
      { name: "value", label: "Value", type: "textarea", span: 2 },
    ],
  },
};

export function getEntityDef(key: string): EntityDef | null {
  return entityDefs[key] ?? null;
}
