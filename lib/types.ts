export type StaffRow = {
  id: number;
  user: string;
  pass: string;
  name: string;
  photo: string | null;
  email: string;
  phone: string;
  salary: number;
  joindate: string | null;
  label: string;
  role: number;
  status: number;
};

export type PropertyRow = {
  p_code: string;
  p_name: string | null;
  p_no: string | null;
  p_location: string | null;
  sl_no: number;
  landlord: string | null;
  landlord_phone: string | null;
  landlord_email: string | null;
  tenant: string | null;
  tenant_phone: string | null;
  tenant_email: string | null;
  f_name: string | null;
  f_tel: string | null;
  f_email: string | null;
  f_fax: string | null;
  gas: string | null;
  pir: string | null;
  lra: string | null;
  reg: string | null;
  pat: string | null;
  p_id: string;
  rent_due: number | null;
  post_code: string | null;
  p_type: string | null;
  r_id: number;
  key_no: string | null;
  p_note: string | null;
  note: string | null;
  active: number;
  n_code: string | null;
  d_code: string | null;
};

export type ReporterRow = {
  reporter: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  r_id: number;
  n_code: string | null;
  d_code: string | null;
  active: number;
  account_status: number;
  reporter_code: string | null;
  gsc: string | null;
  eicr: string | null;
  pat: string | null;
  eicr_and_pat: string | null;
  lra: string | null;
  epc: string | null;
};

export type IssueRow = {
  job_no: number;
  maintenance_date: string | null;
  p_id: string | null;
  user_name: string | null;
  updater: string | null;
  company: string | null;
  issue_type: number;
  gsc_boiler_service: string | null;
};

export type IssueDetailRow = {
  sl_no: number;
  job_no: number | null;
  reported_issue: string | null;
  r_id: number | null;
  landlord_approved: string | null;
  priority: string | null;
  update_issue: string | null;
  status: string | null;
  status_contractor: string | null;
  scheduler_id: number | null;
  c_id: number | null;
  c_id_2: number | null;
  update_no: number | null;
  user_name: string | null;
  updater: string | null;
  update_date: string | null;
  closing_date: string | null;
  issue_invoiced: number;
  issue_invoiced_date: string | null;
  issue_quoted: number;
  client_ref: string | null;
  reported_issue_option_value: string | null;
  reported_issue_option_price: number;
  noaccess: number;
  subcontractor_status: string | null;
  subcontractor_date_booked: string | null;
  subcontractor_time: string | null;
  subcontractor_key_status: number;
  subcontractor_note: string | null;
  subcontractor_jobcompletion_date: string | null;
  subcontractor_jobcompletion_note: string | null;
  follow_up_status: number;
  heater_left_status: number;
  n_code: string | null;
  d_code: string | null;
  invoice_note: string | null;
  invoice_status: number;
  invoice_no: string | null;
  invoice_created_date: string | null;
};

export type ContractorRow = {
  c_id: number;
  contractor: string | null;
  mobile: string | null;
  email: string | null;
  color: string | null;
  c_username: string;
  password: string;
  role: number;
  myorder: number;
  acc_ref: string | null;
  active: number;
  subcontractor_portal: number;
  tradesman: string | null;
  d_code: string | null;
};

export type ScheduleRow = {
  id: number;
  job_no: number;
  eventDetail: string;
  scheduler_date: string;
  sTime: string;
  eTime: string;
  eventArea: number;
  p_id: string | null;
  c_id: number | null;
  c_id2: number;
  contact_type: number | null;
  duration: number;
  note: string | null;
  reported_issue_no: string;
  access_keys: number;
  e_id: number;
  status_contractor: string;
  decline_reason: string;
};

export type InvoiceDetailRow = {
  sl_no: number;
  reported_issue_no: string;
  description: string;
  description_type: string;
  quantity: number;
  unit_price: number;
};

export type InvoiceFreeRow = {
  sl_no: number;
  invoice_no: string;
  invoice_note: string;
  p_id: string;
  r_id: number;
  c_id: number;
  n_code: string;
  d_code: string;
  invoice_date: string;
  invoice_created_date: string;
  invoice_status: number;
};

export type QuoteRow = {
  quote_no: number;
  quote_date: string | null;
  s_id: number | null;
  r_id: number;
  p_id: string | null;
  issue_no: number | null;
  reported_issue_no: number | null;
  quote_info: string;
};

export type PurchaseRow = {
  sl_no: number;
  inv_no: string | null;
  rec_date: string | null;
  inv_date: string | null;
  s_code: string | null;
  n_code: string;
  description: string | null;
  cost: number | null;
  vat: number | null;
  vat_code: string | null;
  total: number | null;
  in_amount: number | null;
  ref_no: string | null;
  acc_ref: string | null;
  d_code: string | null;
  p_id: string | null;
  status: string | null;
  product_sku: string | null;
  product_qty: number;
};

export type CashfloatRow = {
  sl_no: number;
  inv_date: string | null;
  c_id: number | null;
  s_code: string | null;
  n_code: string;
  description: string | null;
  cost: number | null;
  vat: number | null;
  vat_code: string | null;
  total: number | null;
  in_amount: number | null;
  split: string | null;
  account: string | null;
  status: string | null;
  acc_ref: string | null;
  p_id: string | null;
  d_code: string | null;
};

export type TimesheetRow = {
  sl_no: number;
  c_id: number | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  checked: number | null;
  completion: string | null;
  status: string | null;
  p_id: string | null;
  target: number;
  material_used: string | null;
  material_note: string | null;
  works_carried: string | null;
  payment_received: number;
  file_names: string | null;
};

export type AccountRow = {
  sl_no: number;
  nominal: string | null;
  n_code: string;
  active: number;
};

export type DepartmentRow = {
  sl_no: number;
  name: string | null;
  d_code: string;
};

export type SupplierRow = {
  s_id: number;
  s_code: string;
  supplier: string | null;
  phone: string | null;
  email: string | null;
  n_code: string | null;
  d_code: string | null;
  active: number;
};

export type MaterialRow = {
  id: number;
  s_code: string;
  product_detail: string;
  product_code: string;
  schedule_id: string;
  deleted: number;
  purchased: number;
  additional_comment: string;
};
