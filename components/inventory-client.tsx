"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
  const [activeSlug, setActiveSlug] = useState(defaultNavigationItem.slug);
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

  function openModule(slug: string) {
    setActiveSlug(slug);
    window.history.replaceState(null, "", `#${slug}`);
  }

  function renderDashboard() {
    const warrantySoon = assets.filter((asset) => {
      if (!asset.warrantyUntil) return false;
      const daysLeft = Math.ceil((new Date(asset.warrantyUntil).getTime() - Date.now()) / 86_400_000);
      return daysLeft >= 0 && daysLeft <= 90;
    }).length;

    const unassigned = assets.filter((asset) => !asset.assignedTo).length;
    const retired = assets.filter(
      (asset) =>
        asset.status === AssetStatus.RETIRED ||
        asset.status === AssetStatus.PENDING_DISPOSAL ||
        asset.status === AssetStatus.DISPOSED ||
        asset.status === AssetStatus.LOST
    ).length;

    return (
      <section className="dashboardGrid" aria-label="Dashboard overview">
        <div className="panel modulePanel">
          <div className="panelHeader">
            <h2>Inventory Snapshot</h2>
            <p>ข้อมูลรวมจาก asset ที่บันทึกในระบบตอนนี้</p>
          </div>
          <div className="metricGrid">
            <div className="metric">
              <span>Total Assets</span>
              <strong>{visibleStats.total}</strong>
            </div>
            <div className="metric">
              <span>In Use</span>
              <strong>{visibleStats.inUse}</strong>
            </div>
            <div className="metric">
              <span>Ready / Stock</span>
              <strong>{visibleStats.inStock}</strong>
            </div>
            <div className="metric">
              <span>Repair</span>
              <strong>{visibleStats.repair}</strong>
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

        {activeItem.slug !== "dashboard" && activeItem.slug !== "assets" ? renderModulePlaceholder(activeItem) : null}

        {activeItem.slug === "assets" ? (
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
        ) : null}
      </div>
    </main>
  );
}
