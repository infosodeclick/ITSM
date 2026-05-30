# UI Guideline

## Direction

ระบบนี้เป็น operational tool สำหรับทีม IT จึงต้องอ่านง่าย ทำงานเร็ว และไม่ใช้ layout แบบ landing page หรือ marketing

## Layout

- หน้าแรกควรเป็นพื้นที่ทำงานจริง เช่น dashboard, table, filter, form
- ใช้ card เฉพาะ panel, item ซ้ำ, modal หรือ form block
- ตารางต้องรองรับข้อมูลจำนวนมากและอ่านบนจอเล็กได้
- ปุ่ม action ต้องอยู่ใกล้ข้อมูลที่ action นั้นมีผล

## Visual Style

- ใช้สีอย่างประหยัด แยกสถานะด้วย badge ที่อ่านง่าย
- หลีกเลี่ยง gradient และ decoration ที่ไม่ช่วยงาน
- border radius ไม่ควรเกิน 8px ยกเว้น badge
- typography ต้องไม่ใหญ่เกินบริบทของ dashboard

## Interaction

- Form ต้อง validate ฝั่ง server ผ่าน API
- Action ที่เปลี่ยนข้อมูลต้องมี feedback ว่าสำเร็จหรือผิดพลาด
- หน้า list ต้องมี search/filter สำหรับข้อมูล asset
- ข้อความบน UI ใช้ภาษาไทยชัดเจนและเป็นคำที่ทีม IT เข้าใจ
