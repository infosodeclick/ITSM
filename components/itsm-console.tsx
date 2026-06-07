"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER" | "IT_ADMIN" | "IT_STAFF" | "HR" | "MANAGER" | "VIEWER";

type AppUser = {
  id: string;
  username: string | null;
  name: string;
  role: UserRole;
};

type StatusCount = {
  status: string;
  label: string;
  count: number;
};

type YearSummary = {
  year: number;
  total: number;
  inUse: number;
  damaged: number;
  spare: number;
  budget: number;
};

type Asset = {
  id: string;
  assetTag: string;
  name: string;
  assetAcc: string | null;
  serialNumber: string | null;
  status: string;
  manufacturer: string | null;
  model: string | null;
  type: string;
  purchaseDate: string | null;
  purchasePrice: string | number | null;
  warrantyUntil: string | null;
  assignedTo: string | null;
  userPosition: string | null;
  location: string | null;
  notes: string | null;
  branch?: { name: string } | null;
  brand?: { name: string } | null;
  category?: { name: string } | null;
  department?: { name: string } | null;
};

type AppData = {
  user: AppUser;
  dashboard: {
    employeeCount: number;
    assetCount: number;
    expiredWarranty: number;
    coveredWarranty: number;
    statusCounts: StatusCount[];
    assetsByYear: YearSummary[];
    totalBudgetActual: number;
    totalBudgetAllocated: number;
  };
  filters: {
    years: number[];
    departments: string[];
    branches: string[];
    statuses: StatusCount[];
  };
  assets: Asset[];
  employees: Array<{ id: string; fullName: string; position: string | null; isActive: boolean }>;
  budgets: Array<{ id: string; fiscalYear: number; category: string; actual: string | number; allocated: string | number }>;
  auditLogs: Array<{ id: string; module: string; action: string; status: string; createdAt: string }>;
  users: Array<{ id: string; username: string | null; name: string; role: UserRole; isActive: boolean }>;
  roles: Array<{ id: string; name: UserRole; description: string | null }>;
  masterData: {
    branches: Array<{ id: string; code: string; name: string }>;
    brands: Array<{ id: string; code: string; name: string }>;
    assetTypes: Array<{
      id: string;
      code: string;
      name: string;
      prefix: string;
      typeBrands: Array<{ brand: { id: string; code: string; name: string } }>;
    }>;
    supportedAssetTypes: string[];
  };
  hrRequests: Array<{
    id: string;
    employeeCode: string | null;
    employeeName: string;
    employeeNameEn: string | null;
    employeeNameTh: string | null;
    nickname: string | null;
    phone: string | null;
    position: string | null;
    department: string | null;
    branch: string | null;
    managerName: string | null;
    employmentType: string | null;
    startDate: string | null;
    lastWorkingDate: string | null;
    requestedItems: string | null;
    systemsNeeded: string | null;
    shipNotebookToBranch: boolean;
    type: string;
    status: string;
    createdAt: string;
  }>;
  movements: Array<{ id: string; type: string; assetName: string | null; toHolder: string | null; movedAt: string }>;
};

type MenuKey =
  | "dashboard"
  | "map"
  | "assets"
  | "documents"
  | "category"
  | "qr"
  | "location"
  | "scan"
  | "sync"
  | "report"
  | "settings"
  | "users";

const menuItems: Array<{ key: MenuKey; label: string; roles: UserRole[]; icon: string; group?: string; accent?: "orange" }> = [
  { key: "dashboard", label: "Dashboard", icon: "◔", roles: ["SUPER_ADMIN", "ADMIN", "USER", "IT_ADMIN", "IT_STAFF", "HR"] },
  { key: "map", label: "Map View (แผนที่)", icon: "◇", roles: ["SUPER_ADMIN", "ADMIN", "USER", "IT_ADMIN", "IT_STAFF", "HR"] },
  { key: "documents", label: "Document (ตรวจนับ)", icon: "▣", group: "Asset Management", roles: ["SUPER_ADMIN", "ADMIN", "USER", "IT_ADMIN", "IT_STAFF"] },
  { key: "assets", label: "Asset (ทรัพย์สิน)", icon: "▦", group: "Asset Management", roles: ["SUPER_ADMIN", "ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "category", label: "Category (หมวดหมู่)", icon: "▤", group: "Asset Management", roles: ["SUPER_ADMIN", "ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "qr", label: "Print QR Code", icon: "▥", group: "Asset Management", roles: ["SUPER_ADMIN", "ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "location", label: "Location (สถานที่)", icon: "⌖", group: "Asset Management", roles: ["SUPER_ADMIN", "ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "scan", label: "Scan Office (Offline)", icon: "▧", group: "Tools & System", accent: "orange", roles: ["SUPER_ADMIN", "ADMIN", "USER", "IT_ADMIN", "IT_STAFF"] },
  { key: "sync", label: "Sync Data (รับ/ส่ง)", icon: "⇅", group: "Tools & System", roles: ["SUPER_ADMIN", "ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "report", label: "Report (รายงาน)", icon: "▨", group: "Tools & System", roles: ["SUPER_ADMIN", "ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "settings", label: "Settings (ตั้งค่า)", icon: "⚙", group: "Admin Zone", roles: ["SUPER_ADMIN", "ADMIN"] },
  { key: "users", label: "Users (ผู้ใช้งาน)", icon: "◉", group: "Admin Zone", roles: ["SUPER_ADMIN"] }
];

function canView(role: UserRole, roles: UserRole[]) {
  return roles.includes(role);
}

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function purchaseYear(value: string | null) {
  if (!value) return "";
  const year = new Date(value).getFullYear();
  return Number.isNaN(year) ? "" : String(year);
}

function roleLabel(role?: UserRole) {
  const labels: Partial<Record<UserRole, string>> = {
    SUPER_ADMIN: "Admin",
    ADMIN: "Admin",
    USER: "User",
    IT_ADMIN: "IT",
    IT_STAFF: "IT",
    HR: "HR",
    MANAGER: "Manager",
    VIEWER: "Viewer"
  };
  return role ? labels[role] ?? role : "-";
}

const assetStatusOptions = [
  ["IN_STOCK", "สต็อก"],
  ["READY_TO_USE", "พร้อมใช้"],
  ["IN_USE", "ใช้งานอยู่"],
  ["REPAIR", "พัง"],
  ["WAITING_REPAIR", "รอซ่อม"],
  ["REPAIRING", "กำลังซ่อม"],
  ["SPARE", "เครื่องสำรอง"],
  ["RETIRED", "เลิกใช้งาน"],
  ["PENDING_DISPOSAL", "รอจำหน่าย"],
  ["DISPOSED", "จำหน่าย"],
  ["LOST", "สูญหาย"]
] as const;

const assetTypeOptions = [
  ["DESKTOP", "PC"],
  ["NOTEBOOK", "Notebook"],
  ["MINI_PC", "Mini PC"],
  ["SERVER", "Server"],
  ["MONITOR", "Monitor"],
  ["PRINTER", "Printer"],
  ["NETWORK", "Network"],
  ["CCTV", "CCTV"],
  ["SOFTWARE", "Software"],
  ["OTHER", "Other"]
] as const;

const assetTypePrefixes: Record<string, string> = {
  DESKTOP: "PC",
  NOTEBOOK: "NB",
  MINI_PC: "MINI",
  SERVER: "SRV",
  MONITOR: "MON",
  PRINTER: "PRN",
  NETWORK: "NET",
  CCTV: "CCTV",
  SOFTWARE: "SW",
  OTHER: "OTH"
};

function statusLabel(status: string) {
  return assetStatusOptions.find(([value]) => value === status)?.[1] ?? status;
}

function assetTypeLabel(type: string) {
  return assetTypeOptions.find(([value]) => value === type)?.[1] ?? type;
}

function fallbackTypeName(type: string) {
  return assetTypeLabel(type);
}

function summarizeBy<T>(items: T[], getLabel: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = getLabel(item) || "ไม่ระบุ";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function LoginPanel({ onLogin }: { onLogin: (data: AppData) => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "เข้าสู่ระบบไม่สำเร็จ");
      setLoading(false);
      return;
    }

    const appResponse = await fetch("/api/app");
    if (!appResponse.ok) {
      setError("เข้าสู่ระบบแล้ว แต่โหลดข้อมูลระบบไม่สำเร็จ");
      setLoading(false);
      return;
    }

    onLogin(await appResponse.json());
    setLoading(false);
  }

  return (
    <main className="loginPage">
      <div className="loginBlob blue" />
      <div className="loginBlob purple" />
      <section className="loginPanel" aria-label="Login form">
        <form className="loginCard glassCard" onSubmit={submit}>
          <div className="loginLogo">
            <div className="smartCube">▦</div>
            <h1>Smart Track Asset Management</h1>
            <p>ระบบบริหารจัดการทรัพย์สินองค์กร</p>
          </div>
          <label>
            Username
            <div className="inputIcon">
              <span>👤</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="ชื่อผู้ใช้งาน" />
            </div>
          </label>
          <label>
            Password
            <div className="inputIcon">
              <span>🔒</span>
              <input
                value={password}
                type="password"
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="รหัสผ่าน"
              />
            </div>
          </label>
          {error ? <p className="notice error">{error}</p> : null}
          <button type="submit" disabled={loading}>{loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}</button>
          <div className="loginVersion">Smart Track Asset Management System v2.0</div>
        </form>
      </section>
    </main>
  );
}

function TodayLabel() {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date());
}

function Notifications({ data }: { data: AppData }) {
  const urgentAssets = data.assets.filter((asset) => ["LOST", "DISPOSED", "PENDING_DISPOSAL", "REPAIR", "WAITING_REPAIR"].includes(asset.status)).slice(0, 5);
  return (
    <div className="notifyBox">
      <button className="notifyButton" type="button" aria-label="การแจ้งเตือน">
        <span>●</span>
        🔔
      </button>
      <div className="notifyDropdown">
        <div className="notifyHeader">
          <strong>การแจ้งเตือน</strong>
          <span>{urgentAssets.length}</span>
        </div>
        {urgentAssets.length ? urgentAssets.map((asset) => (
          <div className="notifyItem" key={asset.id}>
            <strong>{asset.name}</strong>
            <span>สถานะ: {statusLabel(asset.status)}</span>
          </div>
        )) : <div className="notifyItem"><strong>ไม่มีรายการเร่งด่วน</strong><span>ระบบพร้อมใช้งาน</span></div>}
      </div>
    </div>
  );
}

function Dashboard({ data }: { data: AppData }) {
  const [year, setYear] = useState("all");
  const [department, setDepartment] = useState("all");
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("all");

  const filteredAssets = useMemo(() => {
    return data.assets.filter((asset) => {
      const assetYear = purchaseYear(asset.purchaseDate);
      const assetDepartment = asset.department?.name ?? "";
      const assetBranch = asset.branch?.name ?? asset.location ?? "";
      return (
        (year === "all" || assetYear === year) &&
        (department === "all" || assetDepartment === department) &&
        (branch === "all" || assetBranch === branch) &&
        (status === "all" || asset.status === status)
      );
    });
  }, [branch, data.assets, department, status, year]);

  const budgetByYear = data.dashboard.assetsByYear;
  const maxAssets = Math.max(...budgetByYear.map((item) => item.total), 1);
  const maxBudget = Math.max(...budgetByYear.map((item) => item.budget), 1);
  const statusTotal = data.dashboard.statusCounts.reduce((sum, item) => sum + item.count, 0) || 1;
  const totalValue = data.assets.reduce((sum, asset) => sum + Number(asset.purchasePrice ?? 0), 0);
  const categorySummary = summarizeBy(data.assets, (asset) => asset.category?.name ?? assetTypeLabel(asset.type)).slice(0, 5);
  const locationSummary = summarizeBy(data.assets, (asset) => asset.branch?.name ?? asset.location ?? "ไม่ระบุสถานที่").slice(0, 5);
  const highValueAssets = [...data.assets].sort((left, right) => Number(right.purchasePrice ?? 0) - Number(left.purchasePrice ?? 0)).slice(0, 5);

  return (
    <section className="dashboardPage">
      <div className="dashboardHero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Smart Track Asset Management</h1>
          <p>ภาพรวมทรัพย์สินองค์กร สถานะ มูลค่า สถานที่ และรายการที่ต้องตรวจสอบ</p>
        </div>
        <div className="userPill">
          <span>{data.user.name}</span>
          <strong>{roleLabel(data.user.role)}</strong>
        </div>
      </div>

      <div className="statStrip">
        <div><span>ทรัพย์สินทั้งหมด</span><strong>{data.dashboard.assetCount}</strong></div>
        <div><span>มูลค่ารวม</span><strong>{formatMoney(totalValue)}</strong></div>
        <div><span>ส่งซ่อม / พัง</span><strong>{data.assets.filter((asset) => ["REPAIR", "WAITING_REPAIR", "REPAIRING"].includes(asset.status)).length}</strong></div>
        <div><span>สูญหาย / จำหน่าย</span><strong>{data.assets.filter((asset) => ["LOST", "DISPOSED", "PENDING_DISPOSAL"].includes(asset.status)).length}</strong></div>
      </div>

      <div className="dashboardChartsTop">
        <section className="panel">
          <div className="panelHeader">
            <h2>มูลค่าทรัพย์สินแยกตามปี</h2>
            <p>ยอดใช้จ่ายจริงจากข้อมูลงบประมาณ/ทรัพย์สิน</p>
          </div>
          <div className="chartRows">
            {budgetByYear.length ? budgetByYear.map((item) => (
              <div className="chartRow" key={item.year}>
                <div className="barLabel"><strong>{item.year}</strong><span>{formatMoney(item.budget)} บาท</span></div>
                <div className="barTrack"><span className="barFill canvaFill" style={{ width: `${Math.max(6, (item.budget / maxBudget) * 100)}%` }} /></div>
              </div>
            )) : <p className="empty">ยังไม่มีข้อมูลงบประมาณ</p>}
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <h2>สถานะทรัพย์สินรวม</h2>
            <p>สัดส่วนสถานะรายการทรัพย์สินในระบบ</p>
          </div>
          <div className="donutWrap">
            <div className="donut">
              <strong>{data.dashboard.assetCount}</strong>
              <span>รายการ</span>
            </div>
            <div className="legendList">
              {data.dashboard.statusCounts.length ? data.dashboard.statusCounts.map((item) => (
                <div key={item.status}>
                  <span>{item.label}</span>
                  <strong>{item.count} ({Math.round((item.count / statusTotal) * 100)}%)</strong>
                </div>
              )) : <p className="empty">ยังไม่มีสถานะเครื่อง</p>}
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panelHeader">
          <h2>Dashboard Filters</h2>
          <p>กรองข้อมูลตามปีซื้อ แผนก สาขา และสถานะ</p>
        </div>
        <div className="filterGrid">
          <label>ปีซื้อ
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              <option value="all">ทั้งหมด</option>
              {data.filters.years.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>แผนก
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">ทั้งหมด</option>
              {data.filters.departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>สาขา
            <select value={branch} onChange={(event) => setBranch(event.target.value)}>
              <option value="all">ทั้งหมด</option>
              {data.filters.branches.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>สถานะ
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">ทั้งหมด</option>
              {data.filters.statuses.map((item) => <option key={item.status} value={item.status}>{item.label}</option>)}
            </select>
          </label>
          <button className="secondary" onClick={() => { setYear("all"); setDepartment("all"); setBranch("all"); setStatus("all"); }}>ล้าง Filter</button>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2>จำนวนเครื่องตามปีที่ซื้อ</h2>
          <p>แยกเครื่องใช้งาน พัง และว่าง/สต็อก</p>
        </div>
        <div className="chartRows">
          {budgetByYear.length ? budgetByYear.map((item) => (
            <div className="yearBlock" key={item.year}>
              <div className="barLabel">
                <strong>{item.year}</strong>
                <span>{item.total} เครื่อง | ใช้ {item.inUse} | พัง {item.damaged} | ว่าง {item.spare}</span>
              </div>
              <div className="stackBar">
                <span className="stackUse" style={{ width: `${Math.max(0, (item.inUse / maxAssets) * 100)}%` }} />
                <span className="stackBad" style={{ width: `${Math.max(0, (item.damaged / maxAssets) * 100)}%` }} />
                <span className="stackFree" style={{ width: `${Math.max(0, (item.spare / maxAssets) * 100)}%` }} />
              </div>
            </div>
          )) : <p className="empty">ยังไม่มีข้อมูลตามปีซื้อ</p>}
        </div>
      </section>

      <div className="moduleGrid wideModuleGrid">
        <PlaceholderPanel title="จำนวนแยกตามหมวดหมู่ (Top 5)" description="กลุ่มทรัพย์สินที่มีจำนวนสูงสุด">
          <div className="recordList">
            {categorySummary.length ? categorySummary.map((item) => (
              <div className="recordItem" key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.count} รายการ</span>
              </div>
            )) : <p className="empty">ยังไม่มีข้อมูลหมวดหมู่</p>}
          </div>
        </PlaceholderPanel>
        <PlaceholderPanel title="ทรัพย์สินมูลค่าสูง (Top 5)" description="เรียงตามราคาซื้อจากมากไปน้อย">
          <div className="recordList">
            {highValueAssets.length ? highValueAssets.map((asset) => (
              <div className="recordItem" key={asset.id}>
                <strong>{asset.assetTag} {asset.name}</strong>
                <span>{formatMoney(asset.purchasePrice)} บาท</span>
              </div>
            )) : <p className="empty">ยังไม่มีข้อมูลราคา</p>}
          </div>
        </PlaceholderPanel>
      </div>

      <PlaceholderPanel title="ทรัพย์สินแยกตามสถานที่" description="สรุปจำนวนทรัพย์สินตาม Location">
        <div className="chartRows">
          {locationSummary.length ? locationSummary.map((item) => (
            <div className="chartRow" key={item.label}>
              <div className="barLabel"><strong>{item.label}</strong><span>{item.count} รายการ</span></div>
              <div className="barTrack"><span className="barFill" style={{ width: `${Math.max(6, (item.count / Math.max(data.dashboard.assetCount, 1)) * 100)}%` }} /></div>
            </div>
          )) : <p className="empty">ยังไม่มีข้อมูลสถานที่</p>}
        </div>
      </PlaceholderPanel>

      <section className="panel">
        <div className="panelHeader">
          <h2>รายการตาม Filter</h2>
          <p>พบ {filteredAssets.length} รายการ</p>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>Asset</th><th>User</th><th>Location</th><th>Years</th><th>Status</th><th>Brand / Model</th></tr>
            </thead>
            <tbody>
              {filteredAssets.slice(0, 12).map((asset) => (
                <tr key={asset.id}>
                  <td><strong>{asset.assetTag}</strong><br /><span className="small">{asset.name}</span></td>
                  <td>{asset.assignedTo ?? "-"}</td>
                  <td>{asset.branch?.name ?? asset.location ?? "-"}</td>
                  <td>{purchaseYear(asset.purchaseDate) || "-"}</td>
                  <td><span className="badge">{asset.status}</span></td>
                  <td>{asset.manufacturer ?? "-"} {asset.model ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function PlaceholderPanel({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="moduleBody">{children ?? <p className="moduleNote">หน้ารายละเอียดจะทำต่อเป็น feature แยก เพื่อไม่ให้กระทบระบบหลัก</p>}</div>
    </section>
  );
}

function MapViewPage({ data }: { data: AppData }) {
  const locationSummary = summarizeBy(data.assets, (asset) => asset.branch?.name ?? asset.location ?? "ไม่ระบุสถานที่");
  return (
    <section className="dashboardPage">
      <div className="dashboardHero">
        <div>
          <p className="eyebrow">Map View</p>
          <h1>แผนที่ทรัพย์สิน</h1>
          <p>แสดงจำนวนทรัพย์สินตามสถานที่ เพื่อเตรียมต่อยอดเป็นแผนที่จริงและพิกัด GPS</p>
        </div>
      </div>
      <PlaceholderPanel title={`ทรัพย์สินบนแผนที่ ${data.assets.length} รายการ`} description={`${locationSummary.length} สถานที่`}>
        <div className="locationGrid">
          {locationSummary.length ? locationSummary.map((item) => (
            <div className="locationCard" key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.count} Assets</span>
            </div>
          )) : <p className="empty">ยังไม่มีข้อมูลทรัพย์สินตามสถานที่</p>}
        </div>
      </PlaceholderPanel>
    </section>
  );
}

function DocumentsPage({ data }: { data: AppData }) {
  return (
    <PlaceholderPanel title="เอกสารตรวจนับ" description="จัดการรอบการตรวจนับทรัพย์สิน">
      <div className="recordList">
        <div className="recordItem">
          <strong>DOC-{new Date().getFullYear()}-0001</strong>
          <span>เอกสารตรวจนับเริ่มต้น | Assets {data.assets.length} รายการ | สถานะ Draft</span>
        </div>
      </div>
    </PlaceholderPanel>
  );
}

function CategoryPage({ data }: { data: AppData }) {
  const categorySummary = summarizeBy(data.assets, (asset) => asset.category?.name ?? assetTypeLabel(asset.type));
  const fallbackCategories = data.masterData.assetTypes.map((type) => ({ label: type.name, count: 0 }));
  const rows = categorySummary.length ? categorySummary : fallbackCategories;
  return (
    <PlaceholderPanel title="หมวดหมู่ทรัพย์สิน (Category)" description={`Total Category: ${rows.length}`}>
      <div className="tableWrap">
        <table>
          <thead><tr><th>หมวดหมู่</th><th>จำนวนทรัพย์สิน</th><th>จัดการ</th></tr></thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.label}>
                <td>{item.label}</td>
                <td>{item.count} Assets</td>
                <td><span className="badge">ดูรายการทรัพย์สิน</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlaceholderPanel>
  );
}

function LocationPage({ data }: { data: AppData }) {
  const assetCountByLocation = new Map(summarizeBy(data.assets, (asset) => asset.branch?.name ?? asset.location ?? "ไม่ระบุ").map((item) => [item.label, item.count]));
  return (
    <PlaceholderPanel title="ข้อมูลสถานที่ (Location)" description="กำหนดสถานที่และดูจำนวนทรัพย์สินในแต่ละจุด">
      <div className="tableWrap">
        <table>
          <thead><tr><th>Code</th><th>Location</th><th>พิกัด</th><th>Assets</th></tr></thead>
          <tbody>
            {data.masterData.branches.map((branch) => (
              <tr key={branch.id}>
                <td>{branch.code}</td>
                <td>{branch.name}</td>
                <td>ยังไม่ระบุพิกัด</td>
                <td>{assetCountByLocation.get(branch.name) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlaceholderPanel>
  );
}

function QrCodePage({ data }: { data: AppData }) {
  return (
    <PlaceholderPanel title="พิมพ์สติ๊กเกอร์ QR Code" description="เลือกรายการทรัพย์สินเพื่อพิมพ์ QR Code">
      <div className="tableWrap">
        <table>
          <thead><tr><th>เลือก</th><th>รหัส</th><th>Asset</th><th>Location</th><th>Status</th></tr></thead>
          <tbody>
            {data.assets.slice(0, 50).map((asset) => (
              <tr key={asset.id}>
                <td><input type="checkbox" aria-label={`เลือก ${asset.assetTag}`} /></td>
                <td>{asset.assetTag}</td>
                <td>{asset.name}</td>
                <td>{asset.branch?.name ?? asset.location ?? "-"}</td>
                <td>{statusLabel(asset.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlaceholderPanel>
  );
}

function ScanPage() {
  return (
    <PlaceholderPanel title="ตรวจสอบข้อมูลทรัพย์สิน" description="สแกน QR Code เพื่อดูรายละเอียดสถานะและตำแหน่ง">
      <div className="scanBox">
        <strong>กำลังเตรียมระบบสแกน...</strong>
        <span>ขั้นถัดไปจะเชื่อมกล้องมือถือและ QR lookup ตามรหัสทรัพย์สิน</span>
      </div>
    </PlaceholderPanel>
  );
}

function SyncPage() {
  return (
    <PlaceholderPanel title="รับ/ส่ง ข้อมูล (Sync Offline)" description="จัดการข้อมูลเพื่อใช้งานตรวจนับผ่าน Mobile App">
      <div className="moduleGrid">
        <div className="recordItem">
          <strong>ดาวน์โหลด Master Data</strong>
          <span>ส่งออกข้อมูลทรัพย์สิน สถานที่ และหมวดหมู่เป็น JSON</span>
        </div>
        <div className="recordItem">
          <strong>อัปโหลดผลการตรวจนับ</strong>
          <span>นำผลสแกนจากมือถือกลับเข้าสู่ระบบ</span>
        </div>
      </div>
    </PlaceholderPanel>
  );
}

function ReportPage({ data }: { data: AppData }) {
  return (
    <PlaceholderPanel title="ระบบรายงานทรัพย์สิน" description="รายงานผลตรวจนับ ทรัพย์สินรายสถานที่ และประวัติการโอนย้าย">
      <div className="statStrip">
        <div><span>Assets</span><strong>{data.assets.length}</strong></div>
        <div><span>Locations</span><strong>{data.masterData.branches.length}</strong></div>
        <div><span>Movements</span><strong>{data.movements.length}</strong></div>
        <div><span>Users</span><strong>{data.users.length}</strong></div>
      </div>
      <div className="tableWrap">
        <table>
          <thead><tr><th>รายงาน</th><th>รายละเอียด</th><th>สถานะ</th></tr></thead>
          <tbody>
            <tr><td>รายงานผลตรวจนับ</td><td>ตรวจนับตาม Location / Document</td><td><span className="badge">พร้อมต่อยอด</span></td></tr>
            <tr><td>ทรัพย์สินรายสถานที่</td><td>สรุปจำนวนและมูลค่าตาม Location</td><td><span className="badge">พร้อมต่อยอด</span></td></tr>
            <tr><td>ประวัติการโอนย้าย</td><td>รายการ Assign / Transfer / Return</td><td><span className="badge">พร้อมต่อยอด</span></td></tr>
            <tr><td>ทรัพย์สินหาย/จำหน่าย</td><td>Lost, Write-off, Disposed</td><td><span className="badge">พร้อมต่อยอด</span></td></tr>
          </tbody>
        </table>
      </div>
    </PlaceholderPanel>
  );
}

function AssetsPage({ data, onRefresh }: { data: AppData; onRefresh: (data: AppData) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedType, setSelectedType] = useState("DESKTOP");
  const selectedTypeMaster = data.masterData.assetTypes.find((type) => type.code === selectedType);
  const visibleAssetTypes = data.masterData.assetTypes.length
    ? data.masterData.assetTypes
    : assetTypeOptions.map(([code, name]) => ({ id: code, code, name, prefix: assetTypePrefixes[code] ?? code, typeBrands: [] }));

  const brandOptionsForType = useMemo(() => {
    return selectedTypeMaster?.typeBrands.map((item) => item.brand).sort((a, b) => a.name.localeCompare(b.name)) ?? [];
  }, [selectedTypeMaster]);

  const nextAssetNo = useMemo(() => {
    const prefix = selectedTypeMaster?.prefix ?? assetTypePrefixes[selectedType] ?? "OTH";
    const lastNumber = data.assets
      .filter((asset) => asset.type === selectedType || asset.assetTag.startsWith(`${prefix}-`))
      .reduce((max, asset) => {
        const runningText = asset.assetTag.split("-").at(-1) ?? "";
        const runningNumber = Number.parseInt(runningText, 10);
        return Number.isNaN(runningNumber) ? max : Math.max(max, runningNumber);
      }, 0);

    return `${prefix}-${String(lastNumber + 1).padStart(3, "0")}`;
  }, [data.assets, selectedType, selectedTypeMaster]);

  async function createAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        type: selectedType,
        branchId: form.get("branchId"),
        brandId: form.get("brandId"),
        assetAcc: form.get("assetAcc"),
        serialNumber: form.get("serialNumber"),
        purchaseDate: form.get("purchaseDate"),
        status: form.get("status"),
        model: form.get("model"),
        notes: form.get("notes"),
        purchasePrice: form.get("purchasePrice")
      })
    });

    if (!response.ok) {
      setMessage("เพิ่ม Asset ไม่สำเร็จ กรุณาตรวจข้อมูลอีกครั้ง");
      return;
    }

    const appResponse = await fetch("/api/app");
    onRefresh(await appResponse.json());
    setMessage("เพิ่ม Asset สำเร็จ");
    event.currentTarget.reset();
    setShowForm(false);
  }

  return (
    <section className="panel">
      <div className="panelHeader assetListHeader">
        <div>
          <h2>ทะเบียนทรัพย์สิน</h2>
          <p>รายการทรัพย์สินทั้งหมด ค้นหา เพิ่มใหม่ และเตรียมต่อยอด Import/QR</p>
        </div>
        <button type="button" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "ปิดฟอร์ม" : "เพิ่มใหม่"}
        </button>
      </div>
      {showForm ? (
        <form className="assetCreateForm" onSubmit={createAsset}>
          <label>ประเภท
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
              {visibleAssetTypes.map((type) => <option key={type.id} value={type.code}>{type.name}</option>)}
            </select>
          </label>
          <label>NO<input value={nextAssetNo} readOnly aria-readonly="true" /></label>
          <label>Asset<input name="name" required placeholder="เช่น Lenovo ThinkPad E14" /></label>
          <label>AssetAcc<input name="assetAcc" /></label>
          <label>S/N<input name="serialNumber" /></label>
          <label>Location
            <select name="branchId" defaultValue="">
              <option value="">เลือก Location</option>
              {data.masterData.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
          <label>Years<input name="purchaseDate" type="date" /></label>
          <label>Status
            <select name="status" defaultValue="IN_STOCK">
              {assetStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Brand
            <select name="brandId" defaultValue="">
              <option value="">เลือก Brand</option>
              {brandOptionsForType.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
          </label>
          <label>Model<input name="model" /></label>
          <label>Notation<textarea name="notes" /></label>
          <label>Price<input name="purchasePrice" inputMode="decimal" /></label>
          <div className="formActions">
            <button type="submit">บันทึก Asset</button>
            <button className="secondary" type="button" onClick={() => setShowForm(false)}>ยกเลิก</button>
          </div>
        </form>
      ) : null}
      {message ? <p className="notice assetInlineNotice">{message}</p> : null}
      {data.assets.length > 0 ? (
      <div className="tableWrap">
        <table className="assetReportTable">
          <thead>
            <tr>
              <th>No.</th>
              <th>NO</th>
              <th>AssetAcc</th>
              <th>S/N</th>
              <th>User</th>
              <th>Position</th>
              <th>Location</th>
              <th>Years</th>
              <th>Status</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Notation</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {data.assets.map((asset, index) => (
              <tr key={asset.id}>
                <td>{index + 1}</td>
                <td><strong>{asset.assetTag}</strong><br /><span className="small">{asset.name}</span></td>
                <td>{asset.assetAcc ?? "-"}</td>
                <td>{asset.serialNumber ?? "-"}</td>
                <td>{asset.assignedTo ?? "-"}</td>
                <td>{asset.userPosition ?? "-"}</td>
                <td>{asset.branch?.name ?? asset.location ?? "-"}</td>
                <td>{purchaseYear(asset.purchaseDate) || "-"}</td>
                <td><span className="badge">{statusLabel(asset.status)}</span></td>
                <td>{asset.brand?.name ?? asset.manufacturer ?? "-"}</td>
                <td>{asset.model ?? "-"}</td>
                <td>{asset.notes ?? "-"}</td>
                <td>{formatMoney(asset.purchasePrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : showForm ? (
        <p className="empty">ยังไม่มีรายการ Asset หลังบันทึกข้อมูลแรก ตารางจะแสดงที่นี่</p>
      ) : null}
    </section>
  );
}

function MasterDataPage({ data, onRefresh }: { data: AppData; onRefresh: (data: AppData) => void }) {
  const [message, setMessage] = useState("");

  async function submitMasterData(event: FormEvent<HTMLFormElement>, kind: "location" | "brand" | "assetType" | "typeBrand") {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/master-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        code: form.get("code"),
        name: form.get("name"),
        prefix: form.get("prefix"),
        description: form.get("description")
      })
    });

    if (!response.ok) {
      setMessage("บันทึกข้อมูลหลักไม่สำเร็จ กรุณาตรวจรหัสซ้ำหรือข้อมูลที่กรอก");
      return;
    }

    const appResponse = await fetch("/api/app");
    onRefresh(await appResponse.json());
    event.currentTarget.reset();
    setMessage("บันทึกข้อมูลหลักสำเร็จ");
  }

  return (
    <section className="dashboardPage">
      <div className="dashboardHero">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>ตั้งค่าองค์กรและระบบ</h1>
          <p>จัดการ Location, Category, Brand และข้อมูลหลักสำหรับระบบ Smart Track</p>
        </div>
      </div>
      {message ? <p className="notice">{message}</p> : null}
      <div className="masterDataGrid">
        <form className="panel form" onSubmit={(event) => submitMasterData(event, "location")}>
          <div className="panelHeader">
            <h2>Location</h2>
            <p>สาขา / จุดติดตั้ง / สถานที่เก็บอุปกรณ์</p>
          </div>
          <label>Code<input name="code" required placeholder="HQ" /></label>
          <label>Name<input name="name" required placeholder="Head Office" /></label>
          <label>Description<textarea name="description" /></label>
          <button type="submit">บันทึก Location</button>
        </form>

        <form className="panel form" onSubmit={(event) => submitMasterData(event, "assetType")}>
          <div className="panelHeader">
            <h2>ประเภท</h2>
            <p>ประเภทเดียวกับที่เลือกในหน้า Assets เช่น PC / Notebook / Mini PC</p>
          </div>
          <label>Code
            <select name="code" required defaultValue="DESKTOP">
              {data.masterData.supportedAssetTypes.map((code) => <option key={code} value={code}>{fallbackTypeName(code)}</option>)}
            </select>
          </label>
          <label>Name<input name="name" required placeholder="PC" /></label>
          <label>Prefix<input name="prefix" required placeholder="PC" /></label>
          <label>Description<textarea name="description" /></label>
          <button type="submit">บันทึกประเภท</button>
        </form>

        <form className="panel form" onSubmit={(event) => submitMasterData(event, "brand")}>
          <div className="panelHeader">
            <h2>Brand</h2>
            <p>ยี่ห้ออุปกรณ์ที่ใช้ใน dropdown</p>
          </div>
          <label>Code<input name="code" required placeholder="LENOVO" /></label>
          <label>Name<input name="name" required placeholder="Lenovo" /></label>
          <label>Description<textarea name="description" /></label>
          <button type="submit">บันทึก Brand</button>
        </form>

        <form className="panel form" onSubmit={(event) => submitMasterData(event, "typeBrand")}>
          <div className="panelHeader">
            <h2>Brand ในประเภท</h2>
            <p>กำหนดว่าแต่ละประเภทมี Brand อะไรให้เลือกได้</p>
          </div>
          <label>ประเภท
            <select name="assetTypeId" required defaultValue="">
              <option value="">เลือกประเภท</option>
              {data.masterData.assetTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
          <label>Brand
            <select name="brandId" required defaultValue="">
              <option value="">เลือก Brand</option>
              {data.masterData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
          </label>
          <button type="submit">ผูก Brand กับประเภท</button>
        </form>
      </div>

      <div className="dashboardChartsTop">
        <PlaceholderPanel title="ประเภทและ Brand" description="ใช้กำหนด dropdown Brand ในหน้า Assets">
          <div className="recordList">
            {data.masterData.assetTypes.map((type) => (
              <div className="recordItem" key={type.id}>
                <strong>{type.name} ({type.prefix})</strong>
                <span>{type.typeBrands.length ? type.typeBrands.map((item) => item.brand.name).join(", ") : "ยังไม่ได้กำหนด Brand"}</span>
              </div>
            ))}
          </div>
        </PlaceholderPanel>
        <PlaceholderPanel title="Location ที่มีในระบบ" description="ใช้ใน dropdown ตอนเพิ่มอุปกรณ์">
          <div className="recordList">
            {data.masterData.branches.map((item) => <div className="recordItem" key={item.id}><strong>{item.name}</strong><span>{item.code}</span></div>)}
          </div>
        </PlaceholderPanel>
        <PlaceholderPanel title="Brand ที่มีในระบบ" description="ใช้ผูกกับประเภท">
          <div className="recordList">
            {data.masterData.brands.map((item) => <div className="recordItem" key={item.id}><strong>{item.name}</strong><span>{item.code}</span></div>)}
          </div>
        </PlaceholderPanel>
      </div>
    </section>
  );
}

const departmentOptions = ["IT", "HR", "Accounting", "Sales", "Marketing", "Warehouse", "Management", "Operation"];
const requestedDeviceOptions = ["Notebook", "PC", "Mobile Phone"];
const systemAccessOptions = ["AD", "E-Mail", "E-memo/smartflow", "Ai CRM", "SAP B1"];
const offboardingChecklist = ["เก็บโน๊ตบุ๊ค", "สำรองข้อมูล", "ปิด AD", "ปิด E-Mail", "ปิด E-memo/smartflow", "ปิด Ai CRM", "ปิด SAP B1"];

const hrStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "ส่งคำขอแล้ว",
  RECEIVED_BY_IT: "IT รับเรื่องแล้ว",
  PREPARING: "กำลังเตรียม",
  WAITING_APPROVAL: "รออนุมัติ",
  READY_TO_DELIVER: "พร้อมส่งมอบ",
  DELIVERED: "ส่งมอบแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก"
};

function selectedCheckboxValues(form: FormData, name: string) {
  return form.getAll(name).map(String).filter(Boolean).join(", ");
}

type HrViewKey = "current" | "onboarding" | "offboarding";

const hrViews: Array<{ key: HrViewKey; label: string; description: string }> = [
  {
    key: "current",
    label: "ทะเบียนพนักงานปัจจุบัน",
    description: "พนักงานที่ HR แจ้งเริ่มงานแล้ว และยังไม่มีคำขอพ้นสภาพ"
  },
  {
    key: "onboarding",
    label: "คำขอรับพนักงานใหม่",
    description: "คำขอเริ่มงานที่รอ IT เตรียมอุปกรณ์และสิทธิ์ระบบ"
  },
  {
    key: "offboarding",
    label: "คำขอพ้นสภาพพนักงาน",
    description: "รายการที่ IT ต้องรับคืนอุปกรณ์ สำรองข้อมูล และปิดสิทธิ์ระบบ"
  }
];

function NewEmployeeRequestPage({ data, onRefresh }: { data: AppData; onRefresh: (data: AppData) => void }) {
  const [message, setMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [offboardingFor, setOffboardingFor] = useState<string | null>(null);
  const [activeHrView, setActiveHrView] = useState<HrViewKey>("current");

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "hrRequest",
        type: "ONBOARDING",
        employeeCode: form.get("employeeCode"),
        employeeName: form.get("employeeNameTh") || form.get("employeeNameEn"),
        employeeNameEn: form.get("employeeNameEn"),
        employeeNameTh: form.get("employeeNameTh"),
        nickname: form.get("nickname"),
        phone: form.get("phone"),
        position: form.get("position"),
        department: form.get("department"),
        branch: form.get("branch"),
        managerName: form.get("managerName"),
        employmentType: form.get("employmentType"),
        startDate: form.get("startDate"),
        requestedItems: selectedCheckboxValues(form, "requestedItems"),
        systemsNeeded: selectedCheckboxValues(form, "systemsNeeded"),
        shipNotebookToBranch: form.get("shipNotebookToBranch") === "on",
        status: "SUBMITTED",
        owner: form.get("owner"),
        notes: form.get("notes")
      })
    });

    if (!response.ok) {
      setMessage("สร้างคำขอไม่สำเร็จ กรุณาตรวจข้อมูลอีกครั้ง");
      return;
    }

    const appResponse = await fetch("/api/app");
    onRefresh(await appResponse.json());
    event.currentTarget.reset();
    setShowCreateForm(false);
    setMessage("ส่งคำขอพนักงานใหม่สำเร็จ");
  }

  async function createOffboardingRequest(event: FormEvent<HTMLFormElement>, request: AppData["hrRequests"][number]) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "hrRequest",
        type: "OFFBOARDING",
        employeeCode: request.employeeCode,
        employeeName: request.employeeName,
        employeeNameEn: request.employeeNameEn,
        employeeNameTh: request.employeeNameTh,
        nickname: request.nickname,
        phone: request.phone,
        position: request.position,
        department: request.department,
        branch: request.branch,
        lastWorkingDate: form.get("lastWorkingDate"),
        requestedItems: request.requestedItems,
        systemsNeeded: offboardingChecklist.join(", "),
        status: "SUBMITTED",
        owner: form.get("owner"),
        notes: form.get("notes")
      })
    });

    if (!response.ok) {
      setMessage("แจ้งลาออกไม่สำเร็จ กรุณาตรวจข้อมูลอีกครั้ง");
      return;
    }

    const appResponse = await fetch("/api/app");
    onRefresh(await appResponse.json());
    setOffboardingFor(null);
    setMessage("ส่งรายการลาออกให้ IT สำเร็จ");
  }

  const onboardingRequests = data.hrRequests.filter((request) => request.type === "ONBOARDING" && request.status !== "CANCELLED");
  const offboardingRequests = data.hrRequests.filter((request) => request.type === "OFFBOARDING" && request.status !== "CANCELLED");
  const offboardingEmployeeKeys = new Set(offboardingRequests.map((request) => request.employeeCode || request.employeeName));
  const currentEmployees = onboardingRequests.filter((request) => !offboardingEmployeeKeys.has(request.employeeCode || request.employeeName));
  const activeView = hrViews.find((view) => view.key === activeHrView) ?? hrViews[0];
  const activeRows =
    activeHrView === "current" ? currentEmployees : activeHrView === "onboarding" ? onboardingRequests : offboardingRequests;
  const selectedOffboardingRequest = onboardingRequests.find((request) => request.id === offboardingFor);

  return (
    <section className="dashboardPage">
      <div className="dashboardHero">
        <div>
          <p className="eyebrow">HR Workflow</p>
          <h1>New Employee Request</h1>
          <p>HR แจ้งพนักงานใหม่ และแจ้งลาออกเพื่อให้ IT เตรียม/รับคืนอุปกรณ์และปิดระบบ</p>
        </div>
        <button type="button" onClick={() => setShowCreateForm((value) => !value)}>
          {showCreateForm ? "ปิดฟอร์ม" : "New Employee Request"}
        </button>
      </div>
      {message ? <p className="notice">{message}</p> : null}

      {showCreateForm ? (
      <form className="panel form onboardingForm" onSubmit={createRequest}>
        <div className="panelHeader">
          <h2>New Employee Request</h2>
          <p>HR แจ้งพนักงานใหม่ เพื่อให้ IT เตรียมอุปกรณ์และสิทธิ์ระบบล่วงหน้า</p>
        </div>
        <div className="formGrid">
          <label>Start Date<input name="startDate" type="date" /></label>
          <label>Position<input name="position" placeholder="IT Support" /></label>
          <label>Department
            <select name="department" defaultValue="">
              <option value="">เลือกแผนก</option>
              {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </label>
          <label>Staff ID<input name="employeeCode" placeholder="EMP001" /></label>
          <label>ชื่อ-สกุล (Eng)<input name="employeeNameEn" required placeholder="Firstname Lastname" /></label>
          <label>ชื่อ- นามสกุล(ไทย)<input name="employeeNameTh" required placeholder="ชื่อ - นามสกุล" /></label>
          <label>ชื่อเล่น<input name="nickname" placeholder="ชื่อเล่น" /></label>
          <label>เบอร์โทรศัพท์<input name="phone" inputMode="tel" placeholder="08x-xxx-xxxx" /></label>
          <label>Location
            <select name="branch" defaultValue="">
              <option value="">เลือก Location</option>
              {data.masterData.branches.map((branch) => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
            </select>
          </label>
          <label>ผู้รับผิดชอบ IT<input name="owner" placeholder="เช่น IT Support" /></label>
        </div>

        <div className="checkGroup">
          <strong>อุปกรณ์ที่ต้องใช้</strong>
          <div>
            {requestedDeviceOptions.map((item) => (
              <label key={item} className="checkItem"><input name="requestedItems" type="checkbox" value={item} /> {item}</label>
            ))}
          </div>
        </div>

        <label className="checkItem inlineCheck">
          <input name="shipNotebookToBranch" type="checkbox" /> ต้องการให้ส่งโน๊ตบุ๊คไปที่สาขา
        </label>

        <div className="checkGroup">
          <strong>ระบบ / สิทธิ์ที่ต้องเปิด</strong>
          <div>
            {systemAccessOptions.map((item) => (
              <label key={item} className="checkItem"><input name="systemsNeeded" type="checkbox" value={item} /> {item}</label>
            ))}
          </div>
        </div>

        <label>หมายเหตุ<textarea name="notes" placeholder="รายละเอียดเพิ่มเติม เช่น โปรแกรมเฉพาะ แผนก หรือวันที่ต้องส่งมอบ" /></label>
        <button type="submit">ส่งคำขอให้ IT</button>
      </form>
      ) : null}

      <section className="panel hrWorkflowPanel">
        <div className="panelHeader hrWorkflowHeader">
          <div>
            <h2>{activeView.label}</h2>
            <p>{activeView.description}</p>
          </div>
          <span className="badge">{activeRows.length} รายการ</span>
        </div>
        <div className="hrViewSwitch" aria-label="เลือกมุมมองข้อมูล HR">
          {hrViews.map((view) => {
            const count =
              view.key === "current" ? currentEmployees.length : view.key === "onboarding" ? onboardingRequests.length : offboardingRequests.length;
            return (
              <button
                key={view.key}
                type="button"
                className={activeHrView === view.key ? "active" : ""}
                onClick={() => {
                  setActiveHrView(view.key);
                  setOffboardingFor(null);
                }}
              >
                <strong>{view.label}</strong>
                <span>{count} รายการ</span>
              </button>
            );
          })}
        </div>

        <div className="tableWrap">
          <table className="hrWorkflowTable">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>ชื่อพนักงาน</th>
                <th>ตำแหน่ง / แผนก</th>
                <th>Location</th>
                <th>{activeHrView === "offboarding" ? "วันทำงานสุดท้าย" : "Start Date"}</th>
                <th>อุปกรณ์</th>
                <th>ระบบ / สิทธิ์</th>
                <th>สถานะ</th>
                {activeHrView !== "offboarding" ? <th>จัดการ</th> : null}
              </tr>
            </thead>
            <tbody>
              {activeRows.length ? (
                activeRows.map((request) => (
                  <tr key={request.id}>
                    <td>{request.employeeCode ?? "-"}</td>
                    <td>
                      <div className="assetName">
                        <strong>{request.employeeNameTh ?? request.employeeName}</strong>
                        <span>{request.employeeNameEn ?? "-"}</span>
                        <span>ชื่อเล่น: {request.nickname ?? "-"} | โทร: {request.phone ?? "-"}</span>
                      </div>
                    </td>
                    <td>{request.position ?? "-"}<br /><span className="small">{request.department ?? "-"}</span></td>
                    <td>{request.branch ?? "-"}</td>
                    <td>
                      {activeHrView === "offboarding"
                        ? request.lastWorkingDate
                          ? new Date(request.lastWorkingDate).toLocaleDateString("th-TH")
                          : "-"
                        : request.startDate
                          ? new Date(request.startDate).toLocaleDateString("th-TH")
                          : "-"}
                    </td>
                    <td>
                      {request.requestedItems || "-"}
                      {request.shipNotebookToBranch ? <span className="small">ส่ง Notebook ไปสาขา</span> : null}
                    </td>
                    <td>{request.systemsNeeded || "-"}</td>
                    <td><span className="badge">{hrStatusLabels[request.status] ?? request.status}</span></td>
                    {activeHrView !== "offboarding" ? (
                      <td>
                        <button className="secondary" type="button" onClick={() => setOffboardingFor(offboardingFor === request.id ? null : request.id)}>
                          แจ้งพ้นสภาพ
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeHrView === "offboarding" ? 8 : 9} className="emptyCell">
                    ยังไม่มีข้อมูลในมุมมองนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedOffboardingRequest ? (
          <form className="offboardingInlineForm" onSubmit={(event) => createOffboardingRequest(event, selectedOffboardingRequest)}>
            <div>
              <strong>แจ้งพ้นสภาพ: {selectedOffboardingRequest.employeeNameTh ?? selectedOffboardingRequest.employeeName}</strong>
              <p>สร้างคำขอให้ IT รับคืนอุปกรณ์ สำรองข้อมูล และปิดสิทธิ์ระบบ</p>
            </div>
            <label>วันทำงานวันสุดท้าย<input name="lastWorkingDate" type="date" /></label>
            <label>ผู้รับผิดชอบ IT<input name="owner" placeholder="เช่น IT Support" /></label>
            <label>หมายเหตุ<textarea name="notes" placeholder="รายละเอียดการลาออก / นัดรับคืนอุปกรณ์" /></label>
            <button type="submit">ส่งคำขอพ้นสภาพให้ IT</button>
          </form>
        ) : null}
      </section>
    </section>
  );
}
function UsersPage({ data, onRefresh }: { data: AppData; onRefresh: (data: AppData) => void }) {
  const [message, setMessage] = useState("");

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        name: form.get("name"),
        password: form.get("password"),
        roleId: form.get("roleId"),
        email: form.get("email")
      })
    });

    if (!response.ok) {
      setMessage("สร้าง user ไม่สำเร็จ กรุณาตรวจข้อมูลซ้ำ");
      return;
    }

    const appResponse = await fetch("/api/app");
    onRefresh(await appResponse.json());
    setMessage("สร้าง user สำเร็จ");
    event.currentTarget.reset();
  }

  return (
    <section className="moduleGrid">
      <form className="panel form" onSubmit={createUser}>
        <div className="panelHeader">
          <h2>สร้าง User</h2>
          <p>เฉพาะ Admin สูงสุดเท่านั้น</p>
        </div>
        <label>Username<input name="username" required minLength={3} /></label>
        <label>ชื่อผู้ใช้<input name="name" required /></label>
        <label>Email<input name="email" type="email" /></label>
        <label>Password<input name="password" type="password" required minLength={8} /></label>
        <label>Role
          <select name="roleId" required>
            {data.roles.map((role) => <option key={role.id} value={role.id}>{roleLabel(role.name)}</option>)}
          </select>
        </label>
        {message ? <p className="notice">{message}</p> : null}
        <button type="submit">สร้าง User</button>
      </form>
      <PlaceholderPanel title="Users & Roles" description="บัญชีผู้ใช้ในระบบ">
        <div className="tableWrap">
          <table>
            <thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.name}</td>
                  <td>{roleLabel(user.role)}</td>
                  <td>{user.isActive ? "Active" : "Disabled"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PlaceholderPanel>
    </section>
  );
}

export default function ItsmConsole() {
  const [data, setData] = useState<AppData | null>(null);
  const [active, setActive] = useState<MenuKey>("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setData(body))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setData(null);
    setActive("dashboard");
  }

  if (loading) {
    return <main className="blankPage"><section><p>Loading Smart Track...</p></section></main>;
  }

  if (!data) {
    return <LoginPanel onLogin={setData} />;
  }

  const visibleMenu = menuItems.filter((item) => canView(data.user.role, item.roles));
  const activeMenu = visibleMenu.some((item) => item.key === active) ? active : visibleMenu[0]?.key ?? "dashboard";
  const renderedGroups = new Set<string>();

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brandBlock">
          <div className="brandIcon">▦</div>
          <div>
            <strong>U Smart <span>Track</span></strong>
            <small>Asset Manager</small>
          </div>
        </div>
        <nav className="navList" aria-label="Main menu">
          {visibleMenu.map((item) => {
            const shouldRenderGroup = item.group && !renderedGroups.has(item.group);
            if (item.group) renderedGroups.add(item.group);
            return (
              <div className="navChunk" key={item.key}>
                {shouldRenderGroup ? <p className="navGroup">{item.group}</p> : null}
                <button
                  className={`${activeMenu === item.key ? "active navButton" : "navButton"} ${item.accent === "orange" ? "orangeNav" : ""}`}
                  onClick={() => setActive(item.key)}
                >
                  <span className="navIcon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </div>
            );
          })}
          <button className="installButton" type="button">⇩ ติดตั้งแอป</button>
        </nav>
        <div className="sidebarFooter">
          <div className="profileLink">
            <div className="avatar">{(data.user.name || data.user.username || "A").slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{data.user.name}</strong>
              <span>{roleLabel(data.user.role)}</span>
            </div>
          </div>
          <button className="logoutButton" onClick={logout} title="ออกจากระบบ">ออกจากระบบ</button>
        </div>
      </aside>
      <section className="page">
        <header className="smartTopbar">
          <div className="mobileBrand">
            <span className="miniCube">▦</span>
            <strong>U Smart Track</strong>
          </div>
          <div className="topbarActions">
            <span className="dateLabel">📅 {TodayLabel()}</span>
            <Notifications data={data} />
            <button className="scanButton" type="button" onClick={() => setActive("scan")}>📷 Scan</button>
          </div>
        </header>
        {activeMenu === "dashboard" ? <Dashboard data={data} /> : null}
        {activeMenu === "map" ? <MapViewPage data={data} /> : null}
        {activeMenu === "assets" ? <AssetsPage data={data} onRefresh={setData} /> : null}
        {activeMenu === "documents" ? <DocumentsPage data={data} /> : null}
        {activeMenu === "category" ? <CategoryPage data={data} /> : null}
        {activeMenu === "qr" ? <QrCodePage data={data} /> : null}
        {activeMenu === "location" ? <LocationPage data={data} /> : null}
        {activeMenu === "scan" ? <ScanPage /> : null}
        {activeMenu === "sync" ? <SyncPage /> : null}
        {activeMenu === "report" ? <ReportPage data={data} /> : null}
        {activeMenu === "settings" ? <MasterDataPage data={data} onRefresh={setData} /> : null}
        {activeMenu === "users" ? <UsersPage data={data} onRefresh={setData} /> : null}
      </section>
    </main>
  );
}

