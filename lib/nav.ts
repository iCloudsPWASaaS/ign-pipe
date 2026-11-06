import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Landmark,
  LayoutDashboard,
  Package,
  Receipt,
  Settings2,
  ShoppingCart,
  Users,
  Wrench,
  CircleDollarSign,
  Clock3,
  BarChart3,
  Building2,
  UserCog,
  Truck,
  BookOpen,
  Layers3,
  Boxes,
  Mail,
  PanelsTopLeft,
  SlidersHorizontal,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  roles?: number[];
  hidden?: boolean;
  accent?: boolean;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Property Lookup", href: "/properties", icon: Building2, roles: [1, 2] },
      { label: "Create Issue", href: "/issues/new", icon: ClipboardList, roles: [1, 2] },
      { label: "Appointment", href: "/appointments", icon: CalendarDays, roles: [1, 2] },
      { label: "Generate Quote", href: "/quotes", icon: FileText, roles: [1, 2], hidden: true },
      { label: "Timesheet", href: "/timesheets", icon: Clock3, roles: [1, 2], hidden: true },
      { label: "Float", href: "/float", icon: CircleDollarSign, roles: [1, 2], accent: true },
      { label: "Purchase", href: "/purchase", icon: ShoppingCart, roles: [1, 2], accent: true },
      { label: "Credit Purchase", href: "/purchase/credit", icon: Receipt, roles: [1, 2], hidden: true },
      { label: "Trade Purchase", href: "/purchase/trade", icon: Package, roles: [1, 2], hidden: true },
      { label: "Invoices For Review", href: "/invoices/review", icon: Receipt, roles: [1, 2], accent: true },
      { label: "Sale Invoices", href: "/invoices/sale", icon: Landmark, roles: [1, 2], accent: true },
      { label: "Create Invoice", href: "/invoices/create", icon: FileText, roles: [1, 2], accent: true },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Issues Log & Timesheets", href: "/reports/issues", icon: BarChart3, roles: [1, 2] },
      { label: "Time Sheet", href: "/reports/timesheets", icon: Clock3, roles: [1, 2] },
      { label: "Export Files", href: "/reports/export", icon: FileText, roles: [1, 2] },
      { label: "Closed Jobs To Be Invoiced", href: "/reports/closed-jobs", icon: Receipt, roles: [1, 2] },
      { label: "Contractor Daily Snapshot", href: "/reports/contractor-snapshot", icon: Wrench, roles: [1, 2] },
      { label: "SMS Scheduler", href: "/reports/sms-scheduler", icon: Mail, roles: [1, 2] },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Create Property", href: "/settings/property", icon: Building2, roles: [1, 2] },
      { label: "Create Contractor", href: "/settings/contractor", icon: UserCog, roles: [1, 2] },
      { label: "Create Clients", href: "/settings/reporter", icon: Users, roles: [1, 2] },
      { label: "Create Supplier", href: "/settings/supplier", icon: Truck, roles: [1, 2] },
      { label: "Create Nominal Account", href: "/settings/account", icon: BookOpen, roles: [1, 2] },
      { label: "Create Department", href: "/settings/department", icon: Layers3, roles: [1, 2] },
      { label: "Create Material", href: "/settings/material", icon: Boxes, roles: [1, 2] },
      { label: "Create Email Format", href: "/settings/email-format", icon: Mail, roles: [1] },
      { label: "Create Email Template", href: "/settings/email-template", icon: PanelsTopLeft, roles: [1] },
      { label: "Global Setting", href: "/settings/global", icon: SlidersHorizontal, roles: [1] },
      { label: "Users", href: "/users", icon: Users, roles: [1] },
    ],
  },
];

export const reportKeys = new Set([
  "issues",
  "timesheets",
  "export",
  "closed-jobs",
  "contractor-snapshot",
  "sms-scheduler",
]);

export const settingsEntities = {
  property: { table: "property", title: "Properties", pk: "sl_no" },
  contractor: { table: "contractor", title: "Contractors", pk: "c_id" },
  reporter: { table: "reporter", title: "Clients", pk: "r_id" },
  supplier: { table: "supplier", title: "Suppliers", pk: "s_id" },
  account: { table: "account", title: "Nominal Accounts", pk: "sl_no" },
  department: { table: "department", title: "Departments", pk: "sl_no" },
  material: { table: "material", title: "Materials", pk: "id" },
  "email-format": { table: "email_format", title: "Email Formats", pk: "id" },
  "email-template": { table: "email_templates", title: "Email Templates", pk: "email_id" },
  global: { table: "config", title: "Global Settings", pk: "id" },
} as const;

export type SettingsEntityKey = keyof typeof settingsEntities;
