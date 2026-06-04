"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type UserRole = "SUPER_ADMIN" | "IT_ADMIN" | "IT_STAFF" | "HR" | "MANAGER" | "VIEWER";

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
    position: string | null;
    department: string | null;
    branch: string | null;
    managerName: string | null;
    employmentType: string | null;
    startDate: string | null;
    requestedItems: string | null;
    systemsNeeded: string | null;
    status: string;
    createdAt: string;
  }>;
  movements: Array<{ id: string; type: string; assetName: string | null; toHolder: string | null; movedAt: string }>;
};

type MenuKey = "dashboard" | "assets" | "newEmployee" | "transfer" | "return" | "audit" | "masterData" | "users";

const menuItems: Array<{ key: MenuKey; label: string; roles: UserRole[] }> = [
  { key: "dashboard", label: "แดชบอร์ด", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF", "HR"] },
  { key: "assets", label: "Assets", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "newEmployee", label: "New Employee Request", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF", "HR"] },
  { key: "transfer", label: "Assign / Transfer", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "return", label: "Return", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "audit", label: "Audit Log", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF", "HR"] },
  { key: "masterData", label: "Master Data", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "users", label: "Users & Roles", roles: ["SUPER_ADMIN"] }
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

function LoginPanel({ onLogin }: { onLogin: (data: AppData) => void }) {
  const [username, setUsername] = useState("administrator");
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
      <section className="loginVisual" aria-label="IT Service Management">
        <div className="loginBrand">
          <span>IT Service Management</span>
          <h1>จัดการงาน IT และทรัพย์สินในที่เดียว</h1>
          <p>Dashboard, Assets, HR Request, Transfer, Return, Audit Log และ Users & Roles พร้อมต่อยอดทีละระบบ</p>
        </div>
      </section>
      <section className="loginPanel" aria-label="Login form">
        <form className="loginCard" onSubmit={submit}>
          <div>
            <p className="eyebrow">Secure Access</p>
            <h2>เข้าสู่ระบบ</h2>
            <p>ใช้บัญชีที่ได้รับสิทธิ์เพื่อเข้าใช้งานระบบ ITSM</p>
          </div>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input
              value={password}
              type="password"
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="notice error">{error}</p> : null}
          <button type="submit" disabled={loading}>{loading ? "กำลังตรวจสอบ..." : "Login"}</button>
        </form>
      </section>
    </main>
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

  return (
    <section className="dashboardPage">
      <div className="dashboardHero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>ภาพรวม IT Service Management</h1>
          <p>ดูจำนวนพนักงาน อุปกรณ์ Warranty สถานะเครื่อง และงบประมาณแยกตามปี</p>
        </div>
        <div className="userPill">
          <span>{data.user.name}</span>
          <strong>{roleLabel(data.user.role)}</strong>
        </div>
      </div>

      <div className="statStrip">
        <div><span>พนักงาน</span><strong>{data.dashboard.employeeCount}</strong></div>
        <div><span>อุปกรณ์ IT</span><strong>{data.dashboard.assetCount}</strong></div>
        <div><span>หมดประกัน</span><strong>{data.dashboard.expiredWarranty}</strong></div>
        <div><span>เหลือประกัน</span><strong>{data.dashboard.coveredWarranty}</strong></div>
      </div>

      <div className="dashboardChartsTop">
        <section className="panel">
          <div className="panelHeader">
            <h2>งบประมาณทรัพย์สิน IT แยกตามปี</h2>
            <p>ยอด actual spending จากตาราง Budget</p>
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
            <h2>สถานะเครื่อง</h2>
            <p>สัดส่วนสถานะอุปกรณ์ในระบบ</p>
          </div>
          <div className="donutWrap">
            <div className="donut">
              <strong>{data.dashboard.assetCount}</strong>
              <span>เครื่อง</span>
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
          <h2>Assets</h2>
          <p>รายการทรัพย์สิน IT ตามรูปแบบรายงานหลัก</p>
        </div>
        <button type="button" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "ปิดฟอร์ม" : "เพิ่ม Assets"}
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
          <p className="eyebrow">Master Data</p>
          <h1>Master Data</h1>
          <p>จัดการ Location, ประเภท และ Brand ที่ใช้ในหน้า Assets</p>
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
const employmentTypeOptions = ["พนักงานประจำ", "ทดลองงาน", "สัญญาจ้าง", "พาร์ทไทม์", "Intern"];
const requestedDeviceOptions = ["Notebook", "PC", "Mini PC", "Monitor", "Mouse", "Keyboard", "Headset", "Mobile Phone"];
const systemAccessOptions = ["Email", "Microsoft 365", "VPN", "Shared Folder", "Wi-Fi", "Printer Access", "SAP B1", "CRM"];

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

function NewEmployeeRequestPage({ data, onRefresh }: { data: AppData; onRefresh: (data: AppData) => void }) {
  const [message, setMessage] = useState("");

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
        employeeName: form.get("employeeName"),
        position: form.get("position"),
        department: form.get("department"),
        branch: form.get("branch"),
        managerName: form.get("managerName"),
        employmentType: form.get("employmentType"),
        startDate: form.get("startDate"),
        requestedItems: selectedCheckboxValues(form, "requestedItems"),
        systemsNeeded: selectedCheckboxValues(form, "systemsNeeded"),
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
    setMessage("ส่งคำขอพนักงานใหม่สำเร็จ");
  }

  const onboardingRequests = data.hrRequests.filter((request) => request.status !== "CANCELLED");

  return (
    <section className="moduleGrid wideModuleGrid">
      <form className="panel form onboardingForm" onSubmit={createRequest}>
        <div className="panelHeader">
          <h2>New Employee Request</h2>
          <p>HR แจ้งพนักงานใหม่ เพื่อให้ IT เตรียมอุปกรณ์และ Account ล่วงหน้า</p>
        </div>
        <div className="formGrid">
          <label>รหัสพนักงาน<input name="employeeCode" placeholder="EMP001" /></label>
          <label>ชื่อพนักงาน<input name="employeeName" required placeholder="ชื่อ - นามสกุล" /></label>
          <label>ตำแหน่ง<input name="position" placeholder="IT Support" /></label>
          <label>แผนก
            <select name="department" defaultValue="">
              <option value="">เลือกแผนก</option>
              {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </label>
          <label>Location
            <select name="branch" defaultValue="">
              <option value="">เลือก Location</option>
              {data.masterData.branches.map((branch) => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
            </select>
          </label>
          <label>หัวหน้างาน<input name="managerName" placeholder="Manager / Approver" /></label>
          <label>ประเภทการจ้าง
            <select name="employmentType" defaultValue="">
              <option value="">เลือกประเภท</option>
              {employmentTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label>วันเริ่มงาน<input name="startDate" type="date" /></label>
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

        <div className="checkGroup">
          <strong>ระบบ / สิทธิ์ที่ต้องเปิด</strong>
          <div>
            {systemAccessOptions.map((item) => (
              <label key={item} className="checkItem"><input name="systemsNeeded" type="checkbox" value={item} /> {item}</label>
            ))}
          </div>
        </div>

        <label>หมายเหตุ<textarea name="notes" placeholder="รายละเอียดเพิ่มเติม เช่น โปรแกรมเฉพาะ แผนก หรือวันที่ต้องส่งมอบ" /></label>
        {message ? <p className="notice">{message}</p> : null}
        <button type="submit">ส่งคำขอให้ IT</button>
      </form>

      <section className="panel">
        <div className="panelHeader">
          <h2>รายการพนักงานใหม่</h2>
          <p>ติดตามสถานะคำขอที่ HR ส่งให้ IT</p>
        </div>
        <div className="recordList">
          {onboardingRequests.length ? onboardingRequests.map((request) => (
            <div className="recordItem requestCard" key={request.id}>
              <div>
                <strong>{request.employeeName}</strong>
                <span>{request.employeeCode ?? "-"} | {request.position ?? "-"} | {request.department ?? "-"}</span>
              </div>
              <span>{request.branch ?? "-"}</span>
              <span>เริ่มงาน: {request.startDate ? new Date(request.startDate).toLocaleDateString("th-TH") : "-"}</span>
              <span>อุปกรณ์: {request.requestedItems || "-"}</span>
              <span>ระบบ: {request.systemsNeeded || "-"}</span>
              <span className="badge">{hrStatusLabels[request.status] ?? request.status}</span>
            </div>
          )) : <p className="empty">ยังไม่มีคำขอพนักงานใหม่</p>}
        </div>
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
    return <main className="blankPage"><section><p>Loading ITSM...</p></section></main>;
  }

  if (!data) {
    return <LoginPanel onLogin={setData} />;
  }

  const visibleMenu = menuItems.filter((item) => canView(data.user.role, item.roles));
  const activeMenu = visibleMenu.some((item) => item.key === active) ? active : visibleMenu[0]?.key ?? "dashboard";

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brandBlock">
          <span>WDC</span>
          <strong>ITSM</strong>
        </div>
        <nav className="navList" aria-label="Main menu">
          {visibleMenu.map((item) => (
            <button className={activeMenu === item.key ? "active navButton" : "navButton"} key={item.key} onClick={() => setActive(item.key)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebarFooter">
          <span>{data.user.username}</span>
          <strong>{roleLabel(data.user.role)}</strong>
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
      </aside>
      <section className="page">
        {activeMenu === "dashboard" ? <Dashboard data={data} /> : null}
        {activeMenu === "assets" ? <AssetsPage data={data} onRefresh={setData} /> : null}
        {activeMenu === "newEmployee" ? <NewEmployeeRequestPage data={data} onRefresh={setData} /> : null}
        {activeMenu === "transfer" ? (
          <PlaceholderPanel title="Assign / Transfer" description="ส่งมอบหรือโอนย้ายอุปกรณ์">
            <div className="recordList">
              {data.movements.map((movement) => (
                <div className="recordItem" key={movement.id}>
                  <strong>{movement.assetName ?? movement.type}</strong>
                  <span>{movement.toHolder ?? "-"} | {new Date(movement.movedAt).toLocaleDateString("th-TH")}</span>
                </div>
              ))}
            </div>
          </PlaceholderPanel>
        ) : null}
        {activeMenu === "return" ? <PlaceholderPanel title="Return" description="รับคืนอุปกรณ์จากพนักงาน" /> : null}
        {activeMenu === "audit" ? (
          <PlaceholderPanel title="Audit Log" description="ตรวจสอบประวัติการใช้งานระบบ">
            <div className="tableWrap">
              <table>
                <thead><tr><th>เวลา</th><th>Module</th><th>Action</th><th>Status</th></tr></thead>
                <tbody>
                  {data.auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.createdAt).toLocaleString("th-TH")}</td>
                      <td>{log.module}</td>
                      <td>{log.action}</td>
                      <td>{log.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PlaceholderPanel>
        ) : null}
        {activeMenu === "masterData" ? <MasterDataPage data={data} onRefresh={setData} /> : null}
        {activeMenu === "users" ? <UsersPage data={data} onRefresh={setData} /> : null}
      </section>
    </main>
  );
}

