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
  purchaseDate: string | null;
  purchasePrice: string | number | null;
  warrantyUntil: string | null;
  assignedTo: string | null;
  userPosition: string | null;
  location: string | null;
  notes: string | null;
  branch?: { name: string } | null;
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
  hrRequests: Array<{ id: string; employeeName: string; department: string | null; status: string; createdAt: string }>;
  movements: Array<{ id: string; type: string; assetName: string | null; toHolder: string | null; movedAt: string }>;
};

type MenuKey = "dashboard" | "assets" | "newEmployee" | "transfer" | "return" | "audit" | "users";

const menuItems: Array<{ key: MenuKey; label: string; roles: UserRole[] }> = [
  { key: "dashboard", label: "à¹à¸”à¸Šà¸šà¸­à¸£à¹Œà¸”", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF", "HR"] },
  { key: "assets", label: "Assets", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "newEmployee", label: "New Employee Request", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF", "HR"] },
  { key: "transfer", label: "Assign / Transfer", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "return", label: "Return", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF"] },
  { key: "audit", label: "Audit Log", roles: ["SUPER_ADMIN", "IT_ADMIN", "IT_STAFF", "HR"] },
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
  ["IN_STOCK", "à¸ªà¸•à¹‡à¸­à¸"],
  ["READY_TO_USE", "à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰"],
  ["IN_USE", "à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸­à¸¢à¸¹à¹ˆ"],
  ["REPAIR", "à¸žà¸±à¸‡"],
  ["WAITING_REPAIR", "à¸£à¸­à¸‹à¹ˆà¸­à¸¡"],
  ["REPAIRING", "à¸à¸³à¸¥à¸±à¸‡à¸‹à¹ˆà¸­à¸¡"],
  ["SPARE", "à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸ªà¸³à¸£à¸­à¸‡"],
  ["RETIRED", "à¹€à¸¥à¸´à¸à¹ƒà¸Šà¹‰à¸‡à¸²à¸™"],
  ["PENDING_DISPOSAL", "à¸£à¸­à¸ˆà¸³à¸«à¸™à¹ˆà¸²à¸¢"],
  ["DISPOSED", "à¸ˆà¸³à¸«à¸™à¹ˆà¸²à¸¢"],
  ["LOST", "à¸ªà¸¹à¸à¸«à¸²à¸¢"]
] as const;

function statusLabel(status: string) {
  return assetStatusOptions.find(([value]) => value === status)?.[1] ?? status;
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
      setError(body?.error ?? "à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸šà¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
      setLoading(false);
      return;
    }

    const appResponse = await fetch("/api/app");
    if (!appResponse.ok) {
      setError("à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸šà¹à¸¥à¹‰à¸§ à¹à¸•à¹ˆà¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸£à¸°à¸šà¸šà¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
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
          <h1>à¸ˆà¸±à¸”à¸à¸²à¸£à¸‡à¸²à¸™ IT à¹à¸¥à¸°à¸—à¸£à¸±à¸žà¸¢à¹Œà¸ªà¸´à¸™à¹ƒà¸™à¸—à¸µà¹ˆà¹€à¸”à¸µà¸¢à¸§</h1>
          <p>Dashboard, Assets, HR Request, Transfer, Return, Audit Log à¹à¸¥à¸° Users & Roles à¸žà¸£à¹‰à¸­à¸¡à¸•à¹ˆà¸­à¸¢à¸­à¸”à¸—à¸µà¸¥à¸°à¸£à¸°à¸šà¸š</p>
        </div>
      </section>
      <section className="loginPanel" aria-label="Login form">
        <form className="loginCard" onSubmit={submit}>
          <div>
            <p className="eyebrow">Secure Access</p>
            <h2>à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š</h2>
            <p>à¹ƒà¸Šà¹‰à¸šà¸±à¸à¸Šà¸µà¸—à¸µà¹ˆà¹„à¸”à¹‰à¸£à¸±à¸šà¸ªà¸´à¸—à¸˜à¸´à¹Œà¹€à¸žà¸·à¹ˆà¸­à¹€à¸‚à¹‰à¸²à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸£à¸°à¸šà¸š ITSM</p>
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
          <button type="submit" disabled={loading}>{loading ? "à¸à¸³à¸¥à¸±à¸‡à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š..." : "Login"}</button>
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
          <h1>à¸ à¸²à¸žà¸£à¸§à¸¡ IT Service Management</h1>
          <p>à¸”à¸¹à¸ˆà¸³à¸™à¸§à¸™à¸žà¸™à¸±à¸à¸‡à¸²à¸™ à¸­à¸¸à¸›à¸à¸£à¸“à¹Œ Warranty à¸ªà¸–à¸²à¸™à¸°à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡ à¹à¸¥à¸°à¸‡à¸šà¸›à¸£à¸°à¸¡à¸²à¸“à¹à¸¢à¸à¸•à¸²à¸¡à¸›à¸µ</p>
        </div>
        <div className="userPill">
          <span>{data.user.name}</span>
          <strong>{roleLabel(data.user.role)}</strong>
        </div>
      </div>

      <div className="statStrip">
        <div><span>à¸žà¸™à¸±à¸à¸‡à¸²à¸™</span><strong>{data.dashboard.employeeCount}</strong></div>
        <div><span>à¸­à¸¸à¸›à¸à¸£à¸“à¹Œ IT</span><strong>{data.dashboard.assetCount}</strong></div>
        <div><span>à¸«à¸¡à¸”à¸›à¸£à¸°à¸à¸±à¸™</span><strong>{data.dashboard.expiredWarranty}</strong></div>
        <div><span>à¹€à¸«à¸¥à¸·à¸­à¸›à¸£à¸°à¸à¸±à¸™</span><strong>{data.dashboard.coveredWarranty}</strong></div>
      </div>

      <div className="dashboardChartsTop">
        <section className="panel">
          <div className="panelHeader">
            <h2>à¸‡à¸šà¸›à¸£à¸°à¸¡à¸²à¸“à¸—à¸£à¸±à¸žà¸¢à¹Œà¸ªà¸´à¸™ IT à¹à¸¢à¸à¸•à¸²à¸¡à¸›à¸µ</h2>
            <p>à¸¢à¸­à¸” actual spending à¸ˆà¸²à¸à¸•à¸²à¸£à¸²à¸‡ Budget</p>
          </div>
          <div className="chartRows">
            {budgetByYear.length ? budgetByYear.map((item) => (
              <div className="chartRow" key={item.year}>
                <div className="barLabel"><strong>{item.year}</strong><span>{formatMoney(item.budget)} à¸šà¸²à¸—</span></div>
                <div className="barTrack"><span className="barFill canvaFill" style={{ width: `${Math.max(6, (item.budget / maxBudget) * 100)}%` }} /></div>
              </div>
            )) : <p className="empty">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸‡à¸šà¸›à¸£à¸°à¸¡à¸²à¸“</p>}
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <h2>à¸ªà¸–à¸²à¸™à¸°à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡</h2>
            <p>à¸ªà¸±à¸”à¸ªà¹ˆà¸§à¸™à¸ªà¸–à¸²à¸™à¸°à¸­à¸¸à¸›à¸à¸£à¸“à¹Œà¹ƒà¸™à¸£à¸°à¸šà¸š</p>
          </div>
          <div className="donutWrap">
            <div className="donut">
              <strong>{data.dashboard.assetCount}</strong>
              <span>à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡</span>
            </div>
            <div className="legendList">
              {data.dashboard.statusCounts.length ? data.dashboard.statusCounts.map((item) => (
                <div key={item.status}>
                  <span>{item.label}</span>
                  <strong>{item.count} ({Math.round((item.count / statusTotal) * 100)}%)</strong>
                </div>
              )) : <p className="empty">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸ªà¸–à¸²à¸™à¸°à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡</p>}
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panelHeader">
          <h2>Dashboard Filters</h2>
          <p>à¸à¸£à¸­à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸•à¸²à¸¡à¸›à¸µà¸‹à¸·à¹‰à¸­ à¹à¸œà¸™à¸ à¸ªà¸²à¸‚à¸² à¹à¸¥à¸°à¸ªà¸–à¸²à¸™à¸°</p>
        </div>
        <div className="filterGrid">
          <label>à¸›à¸µà¸‹à¸·à¹‰à¸­
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              <option value="all">à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”</option>
              {data.filters.years.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>à¹à¸œà¸™à¸
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”</option>
              {data.filters.departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>à¸ªà¸²à¸‚à¸²
            <select value={branch} onChange={(event) => setBranch(event.target.value)}>
              <option value="all">à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”</option>
              {data.filters.branches.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>à¸ªà¸–à¸²à¸™à¸°
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”</option>
              {data.filters.statuses.map((item) => <option key={item.status} value={item.status}>{item.label}</option>)}
            </select>
          </label>
          <button className="secondary" onClick={() => { setYear("all"); setDepartment("all"); setBranch("all"); setStatus("all"); }}>à¸¥à¹‰à¸²à¸‡ Filter</button>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2>à¸ˆà¸³à¸™à¸§à¸™à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸•à¸²à¸¡à¸›à¸µà¸—à¸µà¹ˆà¸‹à¸·à¹‰à¸­</h2>
          <p>à¹à¸¢à¸à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¹ƒà¸Šà¹‰à¸‡à¸²à¸™ à¸žà¸±à¸‡ à¹à¸¥à¸°à¸§à¹ˆà¸²à¸‡/à¸ªà¸•à¹‡à¸­à¸</p>
        </div>
        <div className="chartRows">
          {budgetByYear.length ? budgetByYear.map((item) => (
            <div className="yearBlock" key={item.year}>
              <div className="barLabel">
                <strong>{item.year}</strong>
                <span>{item.total} à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡ | à¹ƒà¸Šà¹‰ {item.inUse} | à¸žà¸±à¸‡ {item.damaged} | à¸§à¹ˆà¸²à¸‡ {item.spare}</span>
              </div>
              <div className="stackBar">
                <span className="stackUse" style={{ width: `${Math.max(0, (item.inUse / maxAssets) * 100)}%` }} />
                <span className="stackBad" style={{ width: `${Math.max(0, (item.damaged / maxAssets) * 100)}%` }} />
                <span className="stackFree" style={{ width: `${Math.max(0, (item.spare / maxAssets) * 100)}%` }} />
              </div>
            </div>
          )) : <p className="empty">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸•à¸²à¸¡à¸›à¸µà¸‹à¸·à¹‰à¸­</p>}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2>à¸£à¸²à¸¢à¸à¸²à¸£à¸•à¸²à¸¡ Filter</h2>
          <p>à¸žà¸š {filteredAssets.length} à¸£à¸²à¸¢à¸à¸²à¸£</p>
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
      <div className="moduleBody">{children ?? <p className="moduleNote">à¸«à¸™à¹‰à¸²à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸ˆà¸°à¸—à¸³à¸•à¹ˆà¸­à¹€à¸›à¹‡à¸™ feature à¹à¸¢à¸ à¹€à¸žà¸·à¹ˆà¸­à¹„à¸¡à¹ˆà¹ƒà¸«à¹‰à¸à¸£à¸°à¸—à¸šà¸£à¸°à¸šà¸šà¸«à¸¥à¸±à¸</p>}</div>
    </section>
  );
}

function AssetsPage({ data, onRefresh }: { data: AppData; onRefresh: (data: AppData) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  async function createAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetTag: form.get("assetTag") || undefined,
        name: form.get("name"),
        assetAcc: form.get("assetAcc"),
        serialNumber: form.get("serialNumber"),
        assignedTo: form.get("assignedTo"),
        userPosition: form.get("userPosition"),
        location: form.get("location"),
        purchaseDate: form.get("purchaseDate"),
        status: form.get("status"),
        manufacturer: form.get("manufacturer"),
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
          <label>Asset<input name="assetTag" placeholder="เว้นว่างเพื่อให้ระบบสร้างอัตโนมัติ" /></label>
          <label>Asset Name<input name="name" required placeholder="เช่น Lenovo ThinkPad E14" /></label>
          <label>AssetAcc<input name="assetAcc" /></label>
          <label>S/N<input name="serialNumber" /></label>
          <label>User<input name="assignedTo" /></label>
          <label>Position<input name="userPosition" /></label>
          <label>Location<input name="location" /></label>
          <label>Years<input name="purchaseDate" type="date" /></label>
          <label>Status
            <select name="status" defaultValue="IN_STOCK">
              {assetStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Brand<input name="manufacturer" /></label>
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
      <div className="tableWrap">
        <table className="assetReportTable">
          <thead>
            <tr>
              <th>No.</th>
              <th>Asset</th>
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
                <td>{asset.manufacturer ?? "-"}</td>
                <td>{asset.model ?? "-"}</td>
                <td>{asset.notes ?? "-"}</td>
                <td>{formatMoney(asset.purchasePrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
      setMessage("à¸ªà¸£à¹‰à¸²à¸‡ user à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ à¸à¸£à¸¸à¸“à¸²à¸•à¸£à¸§à¸ˆà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸‹à¹‰à¸³");
      return;
    }

    const appResponse = await fetch("/api/app");
    onRefresh(await appResponse.json());
    setMessage("à¸ªà¸£à¹‰à¸²à¸‡ user à¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
    event.currentTarget.reset();
  }

  return (
    <section className="moduleGrid">
      <form className="panel form" onSubmit={createUser}>
        <div className="panelHeader">
          <h2>à¸ªà¸£à¹‰à¸²à¸‡ User</h2>
          <p>à¹€à¸‰à¸žà¸²à¸° Admin à¸ªà¸¹à¸‡à¸ªà¸¸à¸”à¹€à¸—à¹ˆà¸²à¸™à¸±à¹‰à¸™</p>
        </div>
        <label>Username<input name="username" required minLength={3} /></label>
        <label>à¸Šà¸·à¹ˆà¸­à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰<input name="name" required /></label>
        <label>Email<input name="email" type="email" /></label>
        <label>Password<input name="password" type="password" required minLength={8} /></label>
        <label>Role
          <select name="roleId" required>
            {data.roles.map((role) => <option key={role.id} value={role.id}>{roleLabel(role.name)}</option>)}
          </select>
        </label>
        {message ? <p className="notice">{message}</p> : null}
        <button type="submit">à¸ªà¸£à¹‰à¸²à¸‡ User</button>
      </form>
      <PlaceholderPanel title="Users & Roles" description="à¸šà¸±à¸à¸Šà¸µà¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¹ƒà¸™à¸£à¸°à¸šà¸š">
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
        {activeMenu === "newEmployee" ? (
          <PlaceholderPanel title="New Employee Request" description="HR à¹à¸ˆà¹‰à¸‡à¸žà¸™à¸±à¸à¸‡à¸²à¸™à¹ƒà¸«à¸¡à¹ˆ à¹à¸¥à¸° IT à¸•à¸´à¸”à¸•à¸²à¸¡à¸à¸²à¸£à¹€à¸•à¸£à¸µà¸¢à¸¡à¸­à¸¸à¸›à¸à¸£à¸“à¹Œ">
            <div className="recordList">
              {data.hrRequests.map((request) => (
                <div className="recordItem" key={request.id}>
                  <strong>{request.employeeName}</strong>
                  <span>{request.department ?? "-"} | {request.status}</span>
                </div>
              ))}
            </div>
          </PlaceholderPanel>
        ) : null}
        {activeMenu === "transfer" ? (
          <PlaceholderPanel title="Assign / Transfer" description="à¸ªà¹ˆà¸‡à¸¡à¸­à¸šà¸«à¸£à¸·à¸­à¹‚à¸­à¸™à¸¢à¹‰à¸²à¸¢à¸­à¸¸à¸›à¸à¸£à¸“à¹Œ">
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
        {activeMenu === "return" ? <PlaceholderPanel title="Return" description="à¸£à¸±à¸šà¸„à¸·à¸™à¸­à¸¸à¸›à¸à¸£à¸“à¹Œà¸ˆà¸²à¸à¸žà¸™à¸±à¸à¸‡à¸²à¸™" /> : null}
        {activeMenu === "audit" ? (
          <PlaceholderPanel title="Audit Log" description="à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸›à¸£à¸°à¸§à¸±à¸•à¸´à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸£à¸°à¸šà¸š">
            <div className="tableWrap">
              <table>
                <thead><tr><th>à¹€à¸§à¸¥à¸²</th><th>Module</th><th>Action</th><th>Status</th></tr></thead>
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
        {activeMenu === "users" ? <UsersPage data={data} onRefresh={setData} /> : null}
      </section>
    </main>
  );
}

