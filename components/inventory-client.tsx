"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Approval,
  ApprovalStatus,
  Asset,
  AssetCategory,
  AssetMovement,
  AssetMovementType,
  AssetStatus,
  AssetType,
  AuditLog,
  Branch,
  Budget,
  Department,
  Employee,
  HrRequest,
  HrRequestStatus,
  HrRequestType,
  LicenseStatus,
  MaintenanceRecord,
  MaintenanceStatus,
  Notification,
  Role,
  SoftwareLicense,
  User
} from "@prisma/client";

type Stats = {
  total: number;
  inUse: number;
  inStock: number;
  repair: number;
};

type AssetWithLookups = Asset & {
  branch?: Branch | null;
  category?: AssetCategory | null;
  currentEmployee?: Employee | null;
  department?: Department | null;
};

type UserWithRole = User & { role: Role | null };

type ModuleData = {
  movements: AssetMovement[];
  hrRequests: HrRequest[];
  licenses: SoftwareLicense[];
  maintenanceRecords: MaintenanceRecord[];
  budgets: Budget[];
  approvals: Approval[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  users: UserWithRole[];
  roles: Role[];
};

type Props = {
  initialAssets: AssetWithLookups[];
  stats: Stats;
  initialModules: ModuleData;
};

type DashboardFilters = {
  branch: string;
  department: string;
  status: string;
  type: string;
  year: string;
};

type AssetForm = {
  assetTag: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  serialNumber: string;
  manufacturer: string;
  model: string;
  assignedTo: string;
  userPosition: string;
  location: string;
  purchaseDate: string;
  purchasePrice: string;
  warrantyUntil: string;
  notes: string;
};

type ModuleForm = {
  employeeName: string;
  employeeCode: string;
  position: string;
  department: string;
  branch: string;
  startDate: string;
  lastWorkingDate: string;
  requestedItems: string;
  systemsNeeded: string;
  assetId: string;
  assetTag: string;
  fromHolder: string;
  toHolder: string;
  reason: string;
  conditionAfter: string;
  licenseName: string;
  vendorName: string;
  totalSeats: string;
  usedSeats: string;
  expiryDate: string;
  cost: string;
  issue: string;
  reportedBy: string;
  fiscalYear: string;
  category: string;
  allocated: string;
  actual: string;
  title: string;
  notes: string;
};

type ModulePostBody = Record<string, string | number>;

const emptyForm: AssetForm = {
  assetTag: "",
  name: "",
  type: AssetType.NOTEBOOK,
  status: AssetStatus.IN_STOCK,
  serialNumber: "",
  manufacturer: "",
  model: "",
  assignedTo: "",
  userPosition: "",
  location: "",
  purchaseDate: "",
  purchasePrice: "",
  warrantyUntil: "",
  notes: ""
};

const emptyModuleForm: ModuleForm = {
  employeeName: "",
  employeeCode: "",
  position: "",
  department: "",
  branch: "",
  startDate: "",
  lastWorkingDate: "",
  requestedItems: "",
  systemsNeeded: "",
  assetId: "",
  assetTag: "",
  fromHolder: "",
  toHolder: "",
  reason: "",
  conditionAfter: "",
  licenseName: "",
  vendorName: "",
  totalSeats: "1",
  usedSeats: "0",
  expiryDate: "",
  cost: "0",
  issue: "",
  reportedBy: "",
  fiscalYear: "2026",
  category: "",
  allocated: "0",
  actual: "0",
  title: "",
  notes: ""
};

const defaultDashboardFilters: DashboardFilters = {
  branch: "ALL",
  department: "ALL",
  status: "ALL",
  type: "ALL",
  year: "ALL"
};

const statusText: Record<AssetStatus, string> = {
  IN_STOCK: "สต็อก",
  READY_TO_USE: "พร้อมใช้",
  ASSIGNED: "ส่งมอบแล้ว",
  IN_USE: "ใช้งาน",
  TRANSFERRED: "โอนย้าย",
  RETURNED: "รับคืน",
  REPAIR: "พัง",
  WAITING_REPAIR: "รอซ่อม",
  REPAIRING: "กำลังซ่อม",
  SPARE: "เครื่องสำรอง",
  RETIRED: "เลิกใช้",
  PENDING_DISPOSAL: "รอจำหน่าย",
  DISPOSED: "จำหน่าย",
  LOST: "สูญหาย"
};

const typeText: Record<AssetType, string> = {
  NOTEBOOK: "Notebook",
  DESKTOP: "Desktop",
  MONITOR: "Monitor",
  PRINTER: "Printer",
  SCANNER: "Scanner",
  MOBILE_PHONE: "Mobile Phone",
  TABLET: "Tablet",
  NETWORK: "Network",
  SERVER: "Server",
  FIREWALL: "Firewall",
  SWITCH: "Switch",
  ROUTER: "Router",
  ACCESS_POINT: "Access Point",
  CCTV: "CCTV",
  UPS: "UPS",
  SOFTWARE: "Software",
  MICROSOFT_365: "Microsoft 365",
  ADOBE_LICENSE: "Adobe License",
  ANTIVIRUS_EDR: "Antivirus / EDR",
  SAP_B1: "SAP B1",
  CRM: "CRM",
  EMAIL_ACCOUNT: "Email Account",
  OTHER: "Other"
};

type NavigationItem = {
  label: string;
  slug: string;
  title: string;
  description: string;
};

const navigationItems = [
  {
    label: "Dashboard",
    slug: "dashboard",
    title: "Dashboard",
    description: "ภาพรวมทรัพย์สิน สถานะ และรายการที่ต้องติดตาม"
  },
  {
    label: "Assets",
    slug: "assets",
    title: "Assets",
    description: "ค้นหา เพิ่ม และจัดการทะเบียนทรัพย์สิน IT"
  },
  {
    label: "Assign / Transfer",
    slug: "assign-transfer",
    title: "Assign / Transfer",
    description: "ส่งมอบหรือโอนอุปกรณ์ระหว่างผู้ถือครอง"
  },
  {
    label: "Return",
    slug: "return",
    title: "Return",
    description: "รับคืนอุปกรณ์และอัปเดตสถานะหลังตรวจสอบ"
  },
  {
    label: "HR Onboarding",
    slug: "hr-onboarding",
    title: "HR Onboarding",
    description: "คำขอพนักงานใหม่เพื่อให้ IT เตรียมอุปกรณ์และบัญชี"
  },
  {
    label: "HR Offboarding",
    slug: "hr-offboarding",
    title: "HR Offboarding",
    description: "ติดตามการคืนอุปกรณ์และปิดบัญชีเมื่อพนักงานออก"
  },
  {
    label: "License",
    slug: "license",
    title: "License",
    description: "จัดการซอฟต์แวร์ไลเซนส์ จำนวนใช้งาน และวันหมดอายุ"
  },
  {
    label: "Warranty",
    slug: "warranty",
    title: "Warranty",
    description: "ดูอุปกรณ์ที่ใกล้หมดประกันหรือหมดประกันแล้ว"
  },
  {
    label: "Repair",
    slug: "repair",
    title: "Repair",
    description: "บันทึกและติดตามงานซ่อมอุปกรณ์"
  },
  {
    label: "Reports",
    slug: "reports",
    title: "Reports",
    description: "เตรียมรายงานสำหรับ export และตรวจสอบย้อนหลัง"
  },
  {
    label: "Audit Log",
    slug: "audit-log",
    title: "Audit Log",
    description: "ตรวจสอบประวัติการทำรายการสำคัญในระบบ"
  },
  {
    label: "Users & Roles",
    slug: "users-roles",
    title: "Users & Roles",
    description: "จัดการผู้ใช้งาน บทบาท และสิทธิ์การเข้าถึง"
  }
] satisfies NavigationItem[];

const defaultNavigationItem = navigationItems[0];

function formatDate(value: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
}

function formatMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(amount);
}

function statusClass(status: AssetStatus) {
  if (
    status === AssetStatus.REPAIR ||
    status === AssetStatus.WAITING_REPAIR ||
    status === AssetStatus.REPAIRING
  ) {
    return "badge repair";
  }

  if (
    status === AssetStatus.RETIRED ||
    status === AssetStatus.PENDING_DISPOSAL ||
    status === AssetStatus.DISPOSED ||
    status === AssetStatus.LOST
  ) {
    return "badge retired";
  }

  return "badge";
}

function isInUseStatus(status: AssetStatus) {
  return status === AssetStatus.IN_USE || status === AssetStatus.ASSIGNED || status === AssetStatus.TRANSFERRED;
}

function isBrokenStatus(status: AssetStatus) {
  return status === AssetStatus.REPAIR || status === AssetStatus.WAITING_REPAIR || status === AssetStatus.REPAIRING;
}

function isAvailableStatus(status: AssetStatus) {
  return (
    status === AssetStatus.IN_STOCK ||
    status === AssetStatus.READY_TO_USE ||
    status === AssetStatus.RETURNED ||
    status === AssetStatus.SPARE
  );
}

function statusGroupLabel(status: AssetStatus) {
  if (isInUseStatus(status)) return "ใช้งาน";
  if (isBrokenStatus(status)) return "พัง/ซ่อม";
  if (isAvailableStatus(status)) return "ว่าง/พร้อมใช้";
  return "อื่น ๆ";
}

function purchaseYearLabel(value: Date | string | null) {
  if (!value) return "ไม่ระบุปี";
  const year = new Date(value).getFullYear();
  if (Number.isNaN(year)) return "ไม่ระบุปี";
  return `ปี ${String(year + 543).slice(-2)}`;
}

function purchaseYearValue(value: Date | string | null) {
  if (!value) return "UNSPECIFIED";
  const year = new Date(value).getFullYear();
  return Number.isNaN(year) ? "UNSPECIFIED" : String(year);
}

function purchaseYearOptionLabel(value: string) {
  if (value === "UNSPECIFIED") return "ไม่ระบุปี";
  const year = Number(value);
  return Number.isNaN(year) ? "ไม่ระบุปี" : `ปี ${String(year + 543).slice(-2)}`;
}

function getAssetDepartment(asset: AssetWithLookups) {
  return asset.department?.name ?? asset.departmentId ?? "ไม่ระบุแผนก";
}

function getAssetBranch(asset: AssetWithLookups) {
  return asset.branch?.name ?? asset.location ?? asset.branchId ?? "ไม่ระบุสาขา";
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((summary, item) => {
    const key = getKey(item);
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {});
}

function chartRowsFromCounts(counts: Record<string, number>) {
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export default function InventoryClient({ initialAssets, stats, initialModules }: Props) {
  const [activeSlug, setActiveSlug] = useState(defaultNavigationItem.slug);
  const [assets, setAssets] = useState(initialAssets);
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>(defaultDashboardFilters);
  const [modules, setModules] = useState(initialModules);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<AssetForm>(emptyForm);
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModuleForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const derivedStats = useMemo(
    () => ({
      total: assets.length,
      inUse: assets.filter((asset) => isInUseStatus(asset.status)).length,
      inStock: assets.filter((asset) => isAvailableStatus(asset.status)).length,
      repair: assets.filter((asset) => isBrokenStatus(asset.status)).length
    }),
    [assets]
  );

  const visibleStats = assets.length === initialAssets.length ? stats : derivedStats;
  const activeItem = navigationItems.find((item) => item.slug === activeSlug) ?? defaultNavigationItem;

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      if (navigationItems.some((item) => item.slug === hash)) {
        setActiveSlug(hash);
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return assets;

    return assets.filter((asset) =>
      [
        asset.assetTag,
        asset.name,
        asset.serialNumber,
        asset.assignedTo,
        asset.userPosition,
        asset.location,
        asset.manufacturer,
        asset.model
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery))
    );
  }, [assets, query]);

  function setField<K extends keyof AssetForm>(key: K, value: AssetForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setModuleField<K extends keyof ModuleForm>(key: K, value: ModuleForm[K]) {
    setModuleForm((current) => ({ ...current, [key]: value }));
  }

  function setDashboardFilter<K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) {
    setDashboardFilters((current) => ({ ...current, [key]: value }));
  }

  async function refreshModules() {
    const response = await fetch("/api/modules", { cache: "no-store" });
    if (!response.ok) throw new Error("โหลดข้อมูล module ไม่สำเร็จ");
    setModules((await response.json()) as ModuleData);
  }

  async function refreshAssets() {
    const response = await fetch("/api/assets", { cache: "no-store" });
    if (!response.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
    const data = (await response.json()) as { assets: AssetWithLookups[] };
    setAssets(data.assets);
  }

  async function createAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "บันทึกข้อมูลไม่สำเร็จ");
        }

        setForm(emptyForm);
        setIsAssetFormOpen(false);
        setMessage("เพิ่มรายการทรัพย์สินแล้ว");
        await refreshAssets();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function patchAsset(id: string, data: Partial<Asset>) {
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/assets/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("อัปเดตข้อมูลไม่สำเร็จ");

        setMessage("อัปเดตรายการแล้ว");
        await refreshAssets();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function deleteAsset(id: string) {
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/assets/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("ลบข้อมูลไม่สำเร็จ");

        setMessage("ลบรายการแล้ว");
        await refreshAssets();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function createModuleRecord(event: React.FormEvent<HTMLFormElement>, body: ModulePostBody) {
    event.preventDefault();
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "บันทึกข้อมูล module ไม่สำเร็จ");
        }

        const data = (await response.json()) as { modules: ModuleData };
        setModules(data.modules);
        setModuleForm(emptyModuleForm);
        setMessage("บันทึกข้อมูลเรียบร้อยแล้ว");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function openModule(slug: string) {
    setActiveSlug(slug);
    window.history.replaceState(null, "", `#${slug}`);
    if (slug !== "dashboard" && slug !== "assets") {
      void refreshModules();
    }
  }

  function renderBarChart(rows: { label: string; value: number }[], maxValue: number) {
    return (
      <div className="barChart">
        {rows.length === 0 ? <div className="empty">ยังไม่มีข้อมูลสำหรับกราฟ</div> : null}
        {rows.slice(0, 8).map((row) => (
          <div className="barRow" key={row.label}>
            <div className="barLabel">
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
            <div className="barTrack" aria-hidden="true">
              <div className="barFill" style={{ width: `${Math.max(6, (row.value / maxValue) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderDashboard() {
    const yearOptions = Array.from(new Set(assets.map((asset) => purchaseYearValue(asset.purchaseDate)))).sort((a, b) => {
      if (a === "UNSPECIFIED") return 1;
      if (b === "UNSPECIFIED") return -1;
      return Number(b) - Number(a);
    });
    const typeOptions = Object.values(AssetType).filter((type) => assets.some((asset) => asset.type === type));
    const departmentOptions = Array.from(new Set(assets.map(getAssetDepartment))).sort();
    const branchOptions = Array.from(new Set(assets.map(getAssetBranch))).sort();
    const statusOptions = Object.values(AssetStatus).filter((status) => assets.some((asset) => asset.status === status));
    const dashboardAssets = assets.filter((asset) => {
      if (dashboardFilters.year !== "ALL" && purchaseYearValue(asset.purchaseDate) !== dashboardFilters.year) return false;
      if (dashboardFilters.type !== "ALL" && asset.type !== dashboardFilters.type) return false;
      if (dashboardFilters.department !== "ALL" && getAssetDepartment(asset) !== dashboardFilters.department) return false;
      if (dashboardFilters.branch !== "ALL" && getAssetBranch(asset) !== dashboardFilters.branch) return false;
      if (dashboardFilters.status !== "ALL" && asset.status !== dashboardFilters.status) return false;
      return true;
    });
    const dashboardStats = {
      total: dashboardAssets.length,
      inUse: dashboardAssets.filter((asset) => isInUseStatus(asset.status)).length,
      inStock: dashboardAssets.filter((asset) => isAvailableStatus(asset.status)).length,
      repair: dashboardAssets.filter((asset) => isBrokenStatus(asset.status)).length
    };
    const statusChartRows = chartRowsFromCounts(countBy(dashboardAssets, (asset) => statusGroupLabel(asset.status)));
    const typeChartRows = chartRowsFromCounts(countBy(dashboardAssets, (asset) => typeText[asset.type]));
    const yearChartRows = chartRowsFromCounts(countBy(dashboardAssets, (asset) => purchaseYearLabel(asset.purchaseDate)));
    const departmentChartRows = chartRowsFromCounts(countBy(dashboardAssets, getAssetDepartment));
    const branchChartRows = chartRowsFromCounts(countBy(dashboardAssets, getAssetBranch));
    const chartMax = Math.max(
      1,
      ...statusChartRows.map((row) => row.value),
      ...typeChartRows.map((row) => row.value),
      ...yearChartRows.map((row) => row.value),
      ...departmentChartRows.map((row) => row.value),
      ...branchChartRows.map((row) => row.value)
    );
    const warrantySoon = dashboardAssets.filter((asset) => {
      if (!asset.warrantyUntil) return false;
      const daysLeft = Math.ceil((new Date(asset.warrantyUntil).getTime() - Date.now()) / 86_400_000);
      return daysLeft >= 0 && daysLeft <= 90;
    }).length;

    const unassigned = dashboardAssets.filter((asset) => !asset.assignedTo).length;
    const retired = dashboardAssets.filter(
      (asset) =>
        asset.status === AssetStatus.RETIRED ||
        asset.status === AssetStatus.PENDING_DISPOSAL ||
        asset.status === AssetStatus.DISPOSED ||
        asset.status === AssetStatus.LOST
    ).length;
    const purchaseYearRows = Object.values(
      dashboardAssets.reduce<
        Record<
          string,
          {
            label: string;
            sortYear: number;
            total: number;
            inUse: number;
            broken: number;
            available: number;
            other: number;
          }
        >
      >((summary, asset) => {
        const label = purchaseYearLabel(asset.purchaseDate);
        const purchaseYear = asset.purchaseDate ? new Date(asset.purchaseDate).getFullYear() : 0;
        const row = summary[label] ?? {
          label,
          sortYear: Number.isNaN(purchaseYear) ? 0 : purchaseYear,
          total: 0,
          inUse: 0,
          broken: 0,
          available: 0,
          other: 0
        };

        row.total += 1;
        if (isInUseStatus(asset.status)) row.inUse += 1;
        else if (isBrokenStatus(asset.status)) row.broken += 1;
        else if (isAvailableStatus(asset.status)) row.available += 1;
        else row.other += 1;

        summary[label] = row;
        return summary;
      }, {})
    ).sort((a, b) => {
      if (a.sortYear === 0) return 1;
      if (b.sortYear === 0) return -1;
      return b.sortYear - a.sortYear;
    });
    const purchaseTypeRows = Object.values(
      dashboardAssets.reduce<
        Record<
          string,
          {
            key: string;
            yearLabel: string;
            typeLabel: string;
            sortYear: number;
            total: number;
            inUse: number;
            broken: number;
            available: number;
            other: number;
          }
        >
      >((summary, asset) => {
        const yearLabel = purchaseYearLabel(asset.purchaseDate);
        const typeLabel = typeText[asset.type];
        const key = `${yearLabel}-${asset.type}`;
        const purchaseYear = asset.purchaseDate ? new Date(asset.purchaseDate).getFullYear() : 0;
        const row = summary[key] ?? {
          key,
          yearLabel,
          typeLabel,
          sortYear: Number.isNaN(purchaseYear) ? 0 : purchaseYear,
          total: 0,
          inUse: 0,
          broken: 0,
          available: 0,
          other: 0
        };

        row.total += 1;
        if (isInUseStatus(asset.status)) row.inUse += 1;
        else if (isBrokenStatus(asset.status)) row.broken += 1;
        else if (isAvailableStatus(asset.status)) row.available += 1;
        else row.other += 1;

        summary[key] = row;
        return summary;
      }, {})
    ).sort((a, b) => {
      if (a.sortYear !== b.sortYear) {
        if (a.sortYear === 0) return 1;
        if (b.sortYear === 0) return -1;
        return b.sortYear - a.sortYear;
      }
      return a.typeLabel.localeCompare(b.typeLabel);
    });

    return (
      <section className="dashboardStack" aria-label="Dashboard overview">
        <section className="panel modulePanel">
          <div className="panelHeader">
            <h2>Dashboard Filters</h2>
            <p>กรองภาพรวมตามปีที่ซื้อ ประเภท แผนก สาขา และสถานะ</p>
          </div>
          <div className="filterGrid">
            <label>
              ปีที่ซื้อ
              <select value={dashboardFilters.year} onChange={(event) => setDashboardFilter("year", event.target.value)}>
                <option value="ALL">ทุกปี</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {purchaseYearOptionLabel(year)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              ประเภท
              <select value={dashboardFilters.type} onChange={(event) => setDashboardFilter("type", event.target.value)}>
                <option value="ALL">ทุกประเภท</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {typeText[type]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              แผนก
              <select value={dashboardFilters.department} onChange={(event) => setDashboardFilter("department", event.target.value)}>
                <option value="ALL">ทุกแผนก</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
            <label>
              สาขา
              <select value={dashboardFilters.branch} onChange={(event) => setDashboardFilter("branch", event.target.value)}>
                <option value="ALL">ทุกสาขา</option>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </label>
            <label>
              สถานะ
              <select value={dashboardFilters.status} onChange={(event) => setDashboardFilter("status", event.target.value)}>
                <option value="ALL">ทุกสถานะ</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusText[status]}
                  </option>
                ))}
              </select>
            </label>
            <button className="secondary filterReset" type="button" onClick={() => setDashboardFilters(defaultDashboardFilters)}>
              ล้าง Filter
            </button>
          </div>
        </section>
        <div className="dashboardGrid">
        <div className="panel modulePanel">
          <div className="panelHeader">
            <h2>Inventory Snapshot</h2>
            <p>ข้อมูลรวมจาก asset ที่บันทึกในระบบตอนนี้</p>
          </div>
          <div className="metricGrid">
            <div className="metric">
              <span>Total Assets</span>
              <strong>{dashboardStats.total}</strong>
            </div>
            <div className="metric">
              <span>In Use</span>
              <strong>{dashboardStats.inUse}</strong>
            </div>
            <div className="metric">
              <span>Ready / Stock</span>
              <strong>{dashboardStats.inStock}</strong>
            </div>
            <div className="metric">
              <span>Repair</span>
              <strong>{dashboardStats.repair}</strong>
            </div>
          </div>
        </div>

        <div className="panel modulePanel">
          <div className="panelHeader">
            <h2>Attention</h2>
            <p>รายการที่ควรตรวจสอบก่อนเริ่มทำ module ถัดไป</p>
          </div>
          <div className="summaryList">
            <div>
              <strong>{warrantySoon}</strong>
              <span>Warranty ใกล้หมดอายุใน 90 วัน</span>
            </div>
            <div>
              <strong>{unassigned}</strong>
              <span>Asset ที่ยังไม่มีผู้ถือครอง</span>
            </div>
            <div>
              <strong>{retired}</strong>
              <span>Asset ที่เลิกใช้/รอจำหน่าย/สูญหาย</span>
            </div>
          </div>
        </div>
        </div>

        <section className="dashboardCharts">
          <div className="panel modulePanel">
            <div className="panelHeader">
              <h2>สถานะการใช้งาน</h2>
              <p>ใช้งาน พัง/ซ่อม ว่าง และสถานะอื่น ๆ ตาม filter</p>
            </div>
            {renderBarChart(statusChartRows, chartMax)}
          </div>
          <div className="panel modulePanel">
            <div className="panelHeader">
              <h2>ประเภทอุปกรณ์</h2>
              <p>จำนวนอุปกรณ์แยกตามประเภท</p>
            </div>
            {renderBarChart(typeChartRows, chartMax)}
          </div>
          <div className="panel modulePanel">
            <div className="panelHeader">
              <h2>ปีที่ซื้อ</h2>
              <p>จำนวนอุปกรณ์แยกตามปีที่ซื้อ</p>
            </div>
            {renderBarChart(yearChartRows, chartMax)}
          </div>
          <div className="panel modulePanel">
            <div className="panelHeader">
              <h2>แผนก</h2>
              <p>จำนวนอุปกรณ์แยกตามแผนก</p>
            </div>
            {renderBarChart(departmentChartRows, chartMax)}
          </div>
          <div className="panel modulePanel">
            <div className="panelHeader">
              <h2>สาขา</h2>
              <p>จำนวนอุปกรณ์แยกตามสาขา</p>
            </div>
            {renderBarChart(branchChartRows, chartMax)}
          </div>
        </section>

        <div className="panel modulePanel">
          <div className="panelHeader">
            <h2>Purchase Year Summary</h2>
            <p>สรุปจำนวนเครื่องตามปีที่ซื้อและสถานะการใช้งาน</p>
          </div>
          <div className="tableWrap">
            <table className="compactTable">
              <thead>
                <tr>
                  <th>ปีที่ซื้อ</th>
                  <th>ทั้งหมด</th>
                  <th>ใช้งาน</th>
                  <th>พัง/ซ่อม</th>
                  <th>ว่าง/พร้อมใช้</th>
                  <th>อื่น ๆ</th>
                </tr>
              </thead>
              <tbody>
                {purchaseYearRows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.total}</td>
                    <td>{row.inUse}</td>
                    <td>{row.broken}</td>
                    <td>{row.available}</td>
                    <td>{row.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {purchaseYearRows.length === 0 ? <div className="empty">ยังไม่มีข้อมูลปีที่ซื้อ</div> : null}
          </div>
        </div>

        <div className="panel modulePanel">
          <div className="panelHeader">
            <h2>Purchase Year by Type</h2>
            <p>แยกประเภทอุปกรณ์ในแต่ละปี เช่น Notebook ปี 64 ใช้งานกี่เครื่อง พังกี่เครื่อง และว่างกี่เครื่อง</p>
          </div>
          <div className="tableWrap">
            <table className="compactTable">
              <thead>
                <tr>
                  <th>ปีที่ซื้อ</th>
                  <th>ประเภท</th>
                  <th>ทั้งหมด</th>
                  <th>ใช้งาน</th>
                  <th>พัง/ซ่อม</th>
                  <th>ว่าง/พร้อมใช้</th>
                  <th>อื่น ๆ</th>
                </tr>
              </thead>
              <tbody>
                {purchaseTypeRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.yearLabel}</td>
                    <td>{row.typeLabel}</td>
                    <td>{row.total}</td>
                    <td>{row.inUse}</td>
                    <td>{row.broken}</td>
                    <td>{row.available}</td>
                    <td>{row.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {purchaseTypeRows.length === 0 ? <div className="empty">ยังไม่มีข้อมูลแยกตามประเภท</div> : null}
          </div>
        </div>
      </section>
    );
  }

  function renderModulePlaceholder(item: NavigationItem) {
    const nextSteps: Record<string, string[]> = {
      "assign-transfer": ["เลือก asset และผู้รับ", "บันทึกผู้โอน ผู้รับ เหตุผล และวันที่", "เก็บ audit log ทุกครั้ง"],
      return: ["เลือกพนักงานหรือ asset ที่รับคืน", "ตรวจสภาพและอุปกรณ์ประกอบ", "เปลี่ยนสถานะเป็น Ready, Repair หรือ Retired"],
      "hr-onboarding": ["HR สร้างคำขอพนักงานใหม่", "IT เห็นรายการรอเตรียมอุปกรณ์", "อัปเดตสถานะจนส่งมอบสำเร็จ"],
      "hr-offboarding": ["HR แจ้งพนักงานลาออก", "IT ตรวจอุปกรณ์ที่ถือครอง", "รับคืนอุปกรณ์และปิดบัญชีที่เกี่ยวข้อง"],
      license: ["บันทึกจำนวน license", "ติดตามวันหมดอายุ", "แจ้งเตือน 90/60/30 วัน"],
      warranty: ["กรองรายการใกล้หมดประกัน", "ดู vendor และ serial number", "เตรียมแจ้งเตือน IT"],
      repair: ["บันทึกอาการเสีย", "ติดตาม vendor และค่าใช้จ่าย", "เก็บผลซ่อมและวันที่รับคืน"],
      reports: ["รายงาน asset ทั้งหมด", "รายงาน warranty/license", "export Excel/PDF ใน phase ถัดไป"],
      "audit-log": ["ดูผู้ทำรายการ", "ดูข้อมูลก่อน/หลังแก้ไข", "ค้นหาตาม module และ action"],
      "users-roles": ["สร้าง user", "กำหนด role", "ผูก permission ตาม module"]
    };

    return (
      <section className="panel modulePanel">
        <div className="panelHeader">
          <h2>{item.title}</h2>
          <p>{item.description}</p>
        </div>
        <div className="moduleBody">
          <p className="moduleNote">เมนูนี้เปิดได้แล้ว และถูกเตรียมเป็นพื้นที่สำหรับพัฒนา feature แบบแยกส่วนต่อไป</p>
          <div className="summaryList">
            {(nextSteps[item.slug] ?? ["วาง data model", "เพิ่ม API ที่เกี่ยวข้อง", "เพิ่มหน้าใช้งานจริง"]).map((step) => (
              <div key={step}>
                <strong>Next</strong>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderRecords(records: { id: string; primary: string; secondary: string; meta?: string }[]) {
    return (
      <div className="recordList">
        {records.length === 0 ? <div className="empty">ยังไม่มีข้อมูล</div> : null}
        {records.map((record) => (
          <div className="recordItem" key={record.id}>
            <strong>{record.primary}</strong>
            <span>{record.secondary}</span>
            {record.meta ? <small>{record.meta}</small> : null}
          </div>
        ))}
      </div>
    );
  }

  function renderOperationalModule(item: NavigationItem) {
    if (item.slug === "assign-transfer" || item.slug === "return") {
      const isReturn = item.slug === "return";
      return (
        <section className="moduleGrid">
          <form
            className="panel form"
            onSubmit={(event) =>
              createModuleRecord(event, {
                module: "movement",
                type: isReturn ? AssetMovementType.RETURN : AssetMovementType.TRANSFER,
                assetId: moduleForm.assetId,
                assetTag: moduleForm.assetTag,
                fromHolder: moduleForm.fromHolder,
                toHolder: isReturn ? "IT Stock" : moduleForm.toHolder,
                reason: moduleForm.reason,
                conditionAfter: moduleForm.conditionAfter
              })
            }
          >
            <div className="panelHeader">
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
            <label>
              Asset
              <select value={moduleForm.assetId} onChange={(event) => setModuleField("assetId", event.target.value)}>
                <option value="">เลือกจากรายการ หรือกรอก Asset Tag เอง</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetTag} - {asset.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Asset Tag
              <input value={moduleForm.assetTag} onChange={(event) => setModuleField("assetTag", event.target.value)} />
            </label>
            <label>
              From
              <input value={moduleForm.fromHolder} onChange={(event) => setModuleField("fromHolder", event.target.value)} />
            </label>
            {!isReturn ? (
              <label>
                To
                <input value={moduleForm.toHolder} onChange={(event) => setModuleField("toHolder", event.target.value)} required />
              </label>
            ) : null}
            <label>
              Reason
              <input value={moduleForm.reason} onChange={(event) => setModuleField("reason", event.target.value)} />
            </label>
            <label>
              Condition
              <input value={moduleForm.conditionAfter} onChange={(event) => setModuleField("conditionAfter", event.target.value)} />
            </label>
            <button disabled={isPending} type="submit">
              บันทึก
            </button>
          </form>
          <section className="panel">
            <div className="panelHeader">
              <h2>ประวัติล่าสุด</h2>
              <p>รายการ Assign / Transfer / Return</p>
            </div>
            {renderRecords(
              modules.movements.map((movement) => ({
                id: movement.id,
                primary: `${movement.type} ${movement.assetTag ?? movement.assetId ?? "-"}`,
                secondary: `${movement.fromHolder ?? "-"} -> ${movement.toHolder ?? "-"}`,
                meta: formatDate(movement.movedAt)
              }))
            )}
          </section>
        </section>
      );
    }

    if (item.slug === "hr-onboarding" || item.slug === "hr-offboarding") {
      const isOffboarding = item.slug === "hr-offboarding";
      const requestType = isOffboarding ? HrRequestType.OFFBOARDING : HrRequestType.ONBOARDING;
      const records = modules.hrRequests.filter((request) => request.type === requestType);
      return (
        <section className="moduleGrid">
          <form
            className="panel form"
            onSubmit={(event) =>
              createModuleRecord(event, {
                module: "hrRequest",
                type: requestType,
                employeeName: moduleForm.employeeName,
                employeeCode: moduleForm.employeeCode,
                position: moduleForm.position,
                department: moduleForm.department,
                branch: moduleForm.branch,
                startDate: isOffboarding ? "" : moduleForm.startDate,
                lastWorkingDate: isOffboarding ? moduleForm.lastWorkingDate : "",
                requestedItems: moduleForm.requestedItems,
                systemsNeeded: moduleForm.systemsNeeded,
                status: HrRequestStatus.SUBMITTED,
                notes: moduleForm.notes
              })
            }
          >
            <div className="panelHeader">
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
            <div className="formGrid">
              <label>
                Employee Name
                <input value={moduleForm.employeeName} onChange={(event) => setModuleField("employeeName", event.target.value)} required />
              </label>
              <label>
                Employee Code
                <input value={moduleForm.employeeCode} onChange={(event) => setModuleField("employeeCode", event.target.value)} />
              </label>
              <label>
                Department
                <input value={moduleForm.department} onChange={(event) => setModuleField("department", event.target.value)} />
              </label>
              <label>
                Branch
                <input value={moduleForm.branch} onChange={(event) => setModuleField("branch", event.target.value)} />
              </label>
              <label>
                {isOffboarding ? "Last Working Date" : "Start Date"}
                <input
                  type="date"
                  value={isOffboarding ? moduleForm.lastWorkingDate : moduleForm.startDate}
                  onChange={(event) => setModuleField(isOffboarding ? "lastWorkingDate" : "startDate", event.target.value)}
                />
              </label>
              <label>
                Position
                <input value={moduleForm.position} onChange={(event) => setModuleField("position", event.target.value)} />
              </label>
              <label className="span2">
                Items / Systems
                <textarea value={moduleForm.requestedItems} onChange={(event) => setModuleField("requestedItems", event.target.value)} />
              </label>
            </div>
            <button disabled={isPending} type="submit">
              บันทึกคำขอ HR
            </button>
          </form>
          <section className="panel">
            <div className="panelHeader">
              <h2>รายการล่าสุด</h2>
              <p>{item.title}</p>
            </div>
            {renderRecords(
              records.map((request) => ({
                id: request.id,
                primary: request.employeeName,
                secondary: `${request.department ?? "-"} / ${request.branch ?? "-"} / ${request.status}`,
                meta: formatDate(isOffboarding ? request.lastWorkingDate : request.startDate)
              }))
            )}
          </section>
        </section>
      );
    }

    if (item.slug === "license") {
      return (
        <section className="moduleGrid">
          <form
            className="panel form"
            onSubmit={(event) =>
              createModuleRecord(event, {
                module: "license",
                name: moduleForm.licenseName,
                vendorName: moduleForm.vendorName,
                totalSeats: moduleForm.totalSeats,
                usedSeats: moduleForm.usedSeats,
                expiryDate: moduleForm.expiryDate,
                costPerSeat: moduleForm.cost,
                status: LicenseStatus.ACTIVE,
                notes: moduleForm.notes
              })
            }
          >
            <div className="panelHeader">
              <h2>License</h2>
              <p>จัดการจำนวน license และวันหมดอายุ</p>
            </div>
            <div className="formGrid">
              <label>
                License Name
                <input value={moduleForm.licenseName} onChange={(event) => setModuleField("licenseName", event.target.value)} required />
              </label>
              <label>
                Vendor
                <input value={moduleForm.vendorName} onChange={(event) => setModuleField("vendorName", event.target.value)} />
              </label>
              <label>
                Total Seats
                <input type="number" value={moduleForm.totalSeats} onChange={(event) => setModuleField("totalSeats", event.target.value)} />
              </label>
              <label>
                Used Seats
                <input type="number" value={moduleForm.usedSeats} onChange={(event) => setModuleField("usedSeats", event.target.value)} />
              </label>
              <label>
                Expiry Date
                <input type="date" value={moduleForm.expiryDate} onChange={(event) => setModuleField("expiryDate", event.target.value)} />
              </label>
              <label>
                Cost / Seat
                <input type="number" value={moduleForm.cost} onChange={(event) => setModuleField("cost", event.target.value)} />
              </label>
            </div>
            <button disabled={isPending} type="submit">
              บันทึก License
            </button>
          </form>
          <section className="panel">
            <div className="panelHeader">
              <h2>License List</h2>
              <p>รายการ License ทั้งหมด</p>
            </div>
            {renderRecords(
              modules.licenses.map((license) => ({
                id: license.id,
                primary: license.name,
                secondary: `${license.usedSeats}/${license.totalSeats} used / ${license.status}`,
                meta: `Expires ${formatDate(license.expiryDate)}`
              }))
            )}
          </section>
        </section>
      );
    }

    if (item.slug === "warranty") {
      const warrantyAssets = assets
        .filter((asset) => asset.warrantyUntil)
        .sort((a, b) => new Date(a.warrantyUntil!).getTime() - new Date(b.warrantyUntil!).getTime());
      return (
        <section className="panel modulePanel">
          <div className="panelHeader">
            <h2>Warranty</h2>
            <p>อุปกรณ์ที่มีวันหมดประกัน เรียงจากใกล้หมดก่อน</p>
          </div>
          {renderRecords(
            warrantyAssets.map((asset) => ({
              id: asset.id,
              primary: `${asset.assetTag} - ${asset.name}`,
              secondary: `${asset.assignedTo ?? "-"} / ${asset.location ?? "-"}`,
              meta: formatDate(asset.warrantyUntil)
            }))
          )}
        </section>
      );
    }

    if (item.slug === "repair") {
      return (
        <section className="moduleGrid">
          <form
            className="panel form"
            onSubmit={(event) =>
              createModuleRecord(event, {
                module: "maintenance",
                assetId: moduleForm.assetId,
                assetTag: moduleForm.assetTag,
                issue: moduleForm.issue,
                reportedBy: moduleForm.reportedBy,
                vendorName: moduleForm.vendorName,
                cost: moduleForm.cost,
                status: MaintenanceStatus.REPORTED,
                notes: moduleForm.notes
              })
            }
          >
            <div className="panelHeader">
              <h2>Repair</h2>
              <p>บันทึกงานซ่อมและค่าใช้จ่าย</p>
            </div>
            <label>
              Asset
              <select value={moduleForm.assetId} onChange={(event) => setModuleField("assetId", event.target.value)}>
                <option value="">เลือก Asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetTag} - {asset.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Issue
              <textarea value={moduleForm.issue} onChange={(event) => setModuleField("issue", event.target.value)} required />
            </label>
            <label>
              Reported By
              <input value={moduleForm.reportedBy} onChange={(event) => setModuleField("reportedBy", event.target.value)} />
            </label>
            <label>
              Vendor
              <input value={moduleForm.vendorName} onChange={(event) => setModuleField("vendorName", event.target.value)} />
            </label>
            <button disabled={isPending} type="submit">
              บันทึกงานซ่อม
            </button>
          </form>
          <section className="panel">
            <div className="panelHeader">
              <h2>Repair Records</h2>
              <p>รายการซ่อมล่าสุด</p>
            </div>
            {renderRecords(
              modules.maintenanceRecords.map((record) => ({
                id: record.id,
                primary: record.assetTag ?? record.assetId ?? "Asset",
                secondary: `${record.issue} / ${record.status}`,
                meta: formatDate(record.reportedAt)
              }))
            )}
          </section>
        </section>
      );
    }

    if (item.slug === "reports") {
      return (
        <section className="panel modulePanel">
          <div className="panelHeader">
            <h2>Reports</h2>
            <p>Export รายงาน asset เป็น CSV สำหรับเปิดใน Excel ได้ทันที</p>
          </div>
          <div className="moduleBody">
            <a className="buttonLink" href="/api/reports">
              Export Assets CSV
            </a>
            {renderRecords(
              modules.budgets.map((budget) => ({
                id: budget.id,
                primary: `${budget.fiscalYear} - ${budget.category}`,
                secondary: `${budget.department ?? "-"} / ${budget.branch ?? "-"}`,
                meta: `Allocated ${budget.allocated.toString()} / Actual ${budget.actual.toString()}`
              }))
            )}
          </div>
        </section>
      );
    }

    if (item.slug === "audit-log") {
      return (
        <section className="panel modulePanel">
          <div className="panelHeader">
            <h2>Audit Log</h2>
            <p>ประวัติการทำรายการล่าสุดในระบบ</p>
          </div>
          {renderRecords(
            modules.auditLogs.map((log) => ({
              id: log.id,
              primary: `${log.module} / ${log.action}`,
              secondary: `${log.entityType ?? "-"} ${log.entityId ?? ""}`,
              meta: formatDate(log.createdAt)
            }))
          )}
        </section>
      );
    }

    if (item.slug === "users-roles") {
      return (
        <section className="moduleGrid">
          <section className="panel">
            <div className="panelHeader">
              <h2>Users</h2>
              <p>ผู้ใช้งานที่มีในระบบ</p>
            </div>
            {renderRecords(
              modules.users.map((user) => ({
                id: user.id,
                primary: user.name,
                secondary: `${user.email} / ${user.role?.name ?? "No Role"}`,
                meta: user.isActive ? "Active" : "Disabled"
              }))
            )}
          </section>
          <section className="panel">
            <div className="panelHeader">
              <h2>Roles</h2>
              <p>บทบาทที่ตั้งค่าไว้</p>
            </div>
            {renderRecords(
              modules.roles.map((role) => ({
                id: role.id,
                primary: role.name,
                secondary: role.description ?? "-",
                meta: formatDate(role.createdAt)
              }))
            )}
          </section>
        </section>
      );
    }

    return renderModulePlaceholder(item);
  }

  return (
    <main className="appShell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brandBlock">
          <span>ITSM</span>
          <strong>Inventory</strong>
        </div>
        <nav className="navList">
          {navigationItems.map((item) => (
            <a
              aria-current={activeItem.slug === item.slug ? "page" : undefined}
              className={activeItem.slug === item.slug ? "active" : ""}
              href={`#${item.slug}`}
              key={item.slug}
              onClick={(event) => {
                event.preventDefault();
                openModule(item.slug);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="page">
        <section className="topbar">
          <div>
            <p className="eyebrow">Internal IT Operations</p>
            <h1>ITSM Inventory</h1>
            <p className="subtitle">
              ระบบทะเบียนทรัพย์สิน IT สำหรับเก็บอุปกรณ์ ผู้ถือครอง สถานที่ สถานะซ่อม และข้อมูลรับประกัน
              โดยใช้ฐานข้อมูล PostgreSQL ที่ย้ายไป Railway, cloud อื่น หรือ server องค์กรได้
            </p>
          </div>
          <div className="health">
            <span>Database</span>
            <strong>PostgreSQL via DATABASE_URL</strong>
          </div>
        </section>

        <section className="stats" aria-label="Inventory summary">
          <div className="stat">
            <span>ทั้งหมด</span>
            <strong>{visibleStats.total}</strong>
          </div>
          <div className="stat">
            <span>ใช้งานอยู่</span>
            <strong>{visibleStats.inUse}</strong>
          </div>
          <div className="stat">
            <span>พร้อมใช้</span>
            <strong>{visibleStats.inStock}</strong>
          </div>
          <div className="stat">
            <span>ซ่อม</span>
            <strong>{visibleStats.repair}</strong>
          </div>
        </section>

        {activeItem.slug === "dashboard" ? renderDashboard() : null}

        {activeItem.slug !== "dashboard" && activeItem.slug !== "assets" ? renderOperationalModule(activeItem) : null}

        {activeItem.slug === "assets" ? (
        <section className="assetStack">
          <section className="panel">
          <div className="panelHeader assetPanelHeader">
            <div>
              <h2>ทะเบียนทรัพย์สิน</h2>
              <p>ค้นหา จัดการสถานะ และเพิ่มอุปกรณ์ IT ให้ข้อมูลพร้อมสำหรับรายงาน</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAssetFormOpen((current) => !current)}
              aria-expanded={isAssetFormOpen}
            >
              {isAssetFormOpen ? "ปิดฟอร์ม" : "เพิ่มทรัพย์สิน"}
            </button>
          </div>
          {message || error ? (
            <div className="assetNoticeStack">
              {message ? <p className="notice">{message}</p> : null}
              {error ? <p className="notice error">{error}</p> : null}
            </div>
          ) : null}
          {isAssetFormOpen ? (
          <form className="form" onSubmit={createAsset}>
            <div className="formGrid">
              <label>
                Asset Tag
                <input
                  value={form.assetTag}
                  onChange={(event) => setField("assetTag", event.target.value)}
                  placeholder="Auto เช่น NB-2026-0001"
                />
              </label>
              <label>
                ชื่อ
                <input value={form.name} onChange={(event) => setField("name", event.target.value)} required />
              </label>
              <label>
                ประเภท
                <select value={form.type} onChange={(event) => setField("type", event.target.value as AssetType)}>
                  {Object.values(AssetType).map((type) => (
                    <option key={type} value={type}>
                      {typeText[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                สถานะ
                <select value={form.status} onChange={(event) => setField("status", event.target.value as AssetStatus)}>
                  {Object.values(AssetStatus).map((status) => (
                    <option key={status} value={status}>
                      {statusText[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Serial Number
                <input value={form.serialNumber} onChange={(event) => setField("serialNumber", event.target.value)} />
              </label>
              <label>
                ผู้ผลิต
                <input value={form.manufacturer} onChange={(event) => setField("manufacturer", event.target.value)} />
              </label>
              <label>
                รุ่น
                <input value={form.model} onChange={(event) => setField("model", event.target.value)} />
              </label>
              <label>
                ผู้ถือครอง
                <input value={form.assignedTo} onChange={(event) => setField("assignedTo", event.target.value)} />
              </label>
              <label>
                Position
                <input value={form.userPosition} onChange={(event) => setField("userPosition", event.target.value)} />
              </label>
              <label>
                สถานที่
                <input value={form.location} onChange={(event) => setField("location", event.target.value)} />
              </label>
              <label>
                วันที่ซื้อ
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(event) => setField("purchaseDate", event.target.value)}
                />
              </label>
              <label>
                Price
                <input
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.purchasePrice}
                  onChange={(event) => setField("purchasePrice", event.target.value)}
                />
              </label>
              <label className="span2">
                หมายเหตุ
                <textarea value={form.notes} onChange={(event) => setField("notes", event.target.value)} />
              </label>
            </div>

            <button type="submit" disabled={isPending}>
              {isPending ? "กำลังบันทึก" : "บันทึกทรัพย์สิน"}
            </button>
          </form>
          ) : null}
          <div className="toolbar">
            <input
              aria-label="ค้นหาทรัพย์สิน"
              placeholder="ค้นหา asset tag, serial, ผู้ถือครอง, สถานที่"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="secondary" type="button" onClick={refreshAssets} disabled={isPending}>
              รีเฟรช
            </button>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>ทรัพย์สิน</th>
                  <th>ประเภท</th>
                  <th>สถานะ</th>
                  <th>User / Position / Location</th>
                  <th>Price</th>
                  <th>รับประกัน</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <span className="assetName">
                        <strong>{asset.name}</strong>
                        <span>
                          {asset.assetTag}
                          {asset.serialNumber ? ` · SN ${asset.serialNumber}` : ""}
                        </span>
                        <span>
                          {[asset.manufacturer, asset.model].filter(Boolean).join(" ") || "-"}
                        </span>
                      </span>
                    </td>
                    <td>{typeText[asset.type]}</td>
                    <td>
                      <span className={statusClass(asset.status)}>{statusText[asset.status]}</span>
                    </td>
                    <td>
                      <div>{asset.assignedTo ?? asset.currentEmployee?.fullName ?? "-"}</div>
                      <div className="small">{asset.userPosition ?? asset.currentEmployee?.position ?? "-"}</div>
                      <div className="small">{asset.branch?.name ?? asset.location ?? "-"}</div>
                    </td>
                    <td>{formatMoney(asset.purchasePrice)}</td>
                    <td>{formatDate(asset.warrantyUntil)}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="secondary"
                          type="button"
                          onClick={() =>
                            patchAsset(asset.id, {
                              status: asset.status === AssetStatus.IN_USE ? AssetStatus.IN_STOCK : AssetStatus.IN_USE
                            })
                          }
                        >
                          สลับสถานะ
                        </button>
                        <button className="danger" type="button" onClick={() => deleteAsset(asset.id)}>
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAssets.length === 0 ? <div className="empty">ยังไม่มีรายการที่ตรงกับเงื่อนไข</div> : null}
          </div>
          </section>
        </section>
        ) : null}
      </div>
    </main>
  );
}
