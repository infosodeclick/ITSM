"use client";

import { useMemo, useState, useTransition } from "react";
import { Asset, AssetStatus, AssetType } from "@prisma/client";

type Stats = {
  total: number;
  inUse: number;
  inStock: number;
  repair: number;
};

type Props = {
  initialAssets: Asset[];
  stats: Stats;
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
  location: string;
  purchaseDate: string;
  warrantyUntil: string;
  notes: string;
};

const emptyForm: AssetForm = {
  assetTag: "",
  name: "",
  type: AssetType.NOTEBOOK,
  status: AssetStatus.IN_STOCK,
  serialNumber: "",
  manufacturer: "",
  model: "",
  assignedTo: "",
  location: "",
  purchaseDate: "",
  warrantyUntil: "",
  notes: ""
};

const statusText: Record<AssetStatus, string> = {
  IN_STOCK: "พร้อมใช้",
  READY_TO_USE: "Ready to Use",
  ASSIGNED: "Assigned",
  IN_USE: "ใช้งานอยู่",
  TRANSFERRED: "Transferred",
  RETURNED: "Returned",
  REPAIR: "ซ่อม",
  WAITING_REPAIR: "Waiting Repair",
  REPAIRING: "Repairing",
  SPARE: "Spare",
  RETIRED: "เลิกใช้",
  PENDING_DISPOSAL: "Pending Disposal",
  DISPOSED: "Disposed",
  LOST: "Lost"
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

const navigationItems = [
  "Dashboard",
  "Assets",
  "Assign / Transfer",
  "Return",
  "HR Onboarding",
  "HR Offboarding",
  "License",
  "Warranty",
  "Repair",
  "Reports",
  "Audit Log",
  "Users & Roles"
];

function formatDate(value: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
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

export default function InventoryClient({ initialAssets, stats }: Props) {
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<AssetForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const derivedStats = useMemo(
    () => ({
      total: assets.length,
      inUse: assets.filter((asset) => asset.status === AssetStatus.IN_USE).length,
      inStock: assets.filter((asset) => asset.status === AssetStatus.IN_STOCK).length,
      repair: assets.filter((asset) => asset.status === AssetStatus.REPAIR).length
    }),
    [assets]
  );

  const visibleStats = assets.length === initialAssets.length ? stats : derivedStats;

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return assets;

    return assets.filter((asset) =>
      [asset.assetTag, asset.name, asset.serialNumber, asset.assignedTo, asset.location, asset.manufacturer, asset.model]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery))
    );
  }, [assets, query]);

  function setField<K extends keyof AssetForm>(key: K, value: AssetForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function refreshAssets() {
    const response = await fetch("/api/assets", { cache: "no-store" });
    if (!response.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
    const data = (await response.json()) as { assets: Asset[] };
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

  return (
    <main className="appShell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brandBlock">
          <span>ITSM</span>
          <strong>Inventory</strong>
        </div>
        <nav className="navList">
          {navigationItems.map((item) => (
            <a className={item === "Assets" ? "active" : ""} href="#" key={item}>
              {item}
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

        <section className="layout">
          <aside className="panel">
          <div className="panelHeader">
            <h2>เพิ่มทรัพย์สิน</h2>
            <p>เว้น Asset Tag ว่างได้ ระบบจะสร้างรหัสตามประเภทและปีให้เอง</p>
          </div>
          <form className="form" onSubmit={createAsset}>
            {message ? <p className="notice">{message}</p> : null}
            {error ? <p className="notice error">{error}</p> : null}

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
              <label className="span2">
                หมายเหตุ
                <textarea value={form.notes} onChange={(event) => setField("notes", event.target.value)} />
              </label>
            </div>

            <button type="submit" disabled={isPending}>
              {isPending ? "กำลังบันทึก" : "บันทึกทรัพย์สิน"}
            </button>
          </form>
        </aside>

        <section className="panel">
          <div className="panelHeader">
            <h2>ทะเบียนทรัพย์สิน</h2>
            <p>ค้นหาและจัดการสถานะทรัพย์สิน IT</p>
          </div>
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
                  <th>ผู้ถือครอง/สถานที่</th>
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
                      <div>{asset.assignedTo ?? "-"}</div>
                      <div className="small">{asset.location ?? "-"}</div>
                    </td>
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
      </div>
    </main>
  );
}
