import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { readFileSync } from "fs";
import { join } from "path";

// Helper to get department abbreviation
const getDeptAbbr = (deptName: string): string => {
  if (!deptName) return "";
  const name = deptName.trim();
  if (name.includes("การจัดการสำนักงานดิจิทัล")) return "กจ.";
  if (name.includes("การตลาด")) return "กต.";
  if (name.includes("บัญชี") || name.includes("การบัญชี")) return "บช.";
  if (name.includes("คอมพิวเตอร์")) return "คพ.";
  if (name.includes("ดิจิทัลกราฟิก")) return "ดจ.";
  if (name.includes("คหกรรม")) return "คก.";
  if (name.includes("ธุรกิจค้าปลีก")) return "คป.";
  if (name.includes("โลจิสติกส์")) return "ลจ.";
  if (name.includes("เทคโนโลยีสารสนเทศ")) return "ทส.";
  if (name.includes("เทคโนโลยีธุรกิจดิจิทัล") || name.includes("ธุรกิจดิจิทัล")) return "ธด.";
  if (name.includes("แฟชั่น")) return "ฟช.";
  if (name.includes("โรงแรม")) return "รร.";
  if (name.includes("นิเทศศิลป์")) return "อบ.";
  if (name.includes("อาหาร")) return "อภ.";
  if (name.includes("ต่างประเทศ")) return "ตป.";
  return "";
};

// Helper to format class name correctly (e.g., ปวช.1/1คป.)
const formatClassName = (className: string, deptName: string): string => {
  const abbr = getDeptAbbr(deptName);
  const cleanedClass = className.replace(/\s?[ก-ฮ]{2}\.$/, "").trim();
  return abbr ? `${cleanedClass}${abbr}` : cleanedClass;
};

// Sort Key Logic: Department -> Level -> Section Number
const getClassSortKey = (className: string, deptName: string): string => {
  const parts = className.split('/');
  const level = parts[0].trim(); // ปวช.1
  const section = parts[1] ? parts[1].trim().padStart(3, '0') : "000";
  // Important: Dept first, then Level, then Section
  return `${deptName}_${level}_${section}`;
};

// Advanced Thai Shaper to handle complex overlapping in jsPDF
const thaiShaper = (text: string | any): string => {
  if (text === undefined || text === null) return "";
  if (typeof text !== 'string') return String(text);

  return text
    // 1. จัดการลำดับ: พยัญชนะ + วรรณยุกต์ + สระบน -> พยัญชนะ + สระบน + วรรณยุกต์
    .replace(/([ก-ฮ])([่้๊๋])([ัิีึื])/g, "$1$3$2")
    // 2. จัดการลำดับ: พยัญชนะ + วรรณยุกต์ + สระล่าง -> พยัญชนะ + สระล่าง + วรรณยุกต์
    .replace(/([ก-ฮ])([่้๊๋])([ุู])/g, "$1$3$2")
    // 3. จัดการกรณี สระอำ (ำ) ที่มีวรรณยุกต์ (เช่น ก่ำ -> ก + ำ + ่)
    .replace(/([่้๊๋])ำ/g, "ำ$1")
    // 4. กำจัดวรรณยุกต์ซ้ำซ้อนที่อาจหลุดมา
    .replace(/([่้๊๋ัิีึืุู])\1+/g, "$1")
    .trim();
};

export const generateSchedulePDF = async (schedule: any[], semesterParam?: string, yearParam?: string) => {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const fontPath = join(process.cwd(), "src/assets/fonts/Sarabun-Regular.ttf");
    const fontBase64 = readFileSync(fontPath).toString("base64");
    
    // Register font with both the filename and the nickname
    doc.addFileToVFS("Sarabun.ttf", fontBase64);
    doc.addFont("Sarabun.ttf", "Sarabun", "normal");
    doc.setFont("Sarabun");

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
    };

    const formatTime = (dateStr: string) => {
      const date = new Date(dateStr);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    doc.setFont("Sarabun", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(thaiShaper(`พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`), 287, 22, { align: "right" });

    // 1. เรียงลำดับข้อมูลตามสาขาและระดับชั้น
    const sorted = [...schedule].sort((a, b) => {
      const aKey = getClassSortKey(a.className, a.departmentName);
      const bKey = getClassSortKey(b.className, b.departmentName);
      if (aKey !== bKey) return aKey.localeCompare(bKey, 'th');
      return new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime();
    });

    // 2. จัดกลุ่มข้อมูล
    const groupedData: any[] = [];
    sorted.forEach(item => {
      const displayClassName = formatClassName(item.className, item.departmentName);
      const dateKey = formatDate(item.timeStart);
      
      let classObj = groupedData.find((c: any) => c.displayName === displayClassName);
      if (!classObj) {
        classObj = { 
          displayName: displayClassName,
          deptName: item.departmentName,
          dates: [], 
          totalRows: 0 
        };
        groupedData.push(classObj);
      }
      
      let dateObj = classObj.dates.find((d: any) => d.key === dateKey);
      if (!dateObj) {
        dateObj = { key: dateKey, rows: [] };
        classObj.dates.push(dateObj);
      }
      dateObj.rows.push(item);
      classObj.totalRows++;
    });

    const tableBody: any[] = [];
    groupedData.forEach((classGroup) => {
      classGroup.dates.forEach((dateGroup: any, dateIdx: number) => {
        dateGroup.rows.forEach((row: any, rowIdx: number) => {
          const tableRow: any[] = [];

          if (dateIdx === 0 && rowIdx === 0) {
            tableRow.push({ content: thaiShaper(classGroup.displayName), rowSpan: classGroup.totalRows, styles: { halign: 'center', font: "Sarabun" } });
            tableRow.push({ content: thaiShaper(classGroup.deptName), rowSpan: classGroup.totalRows, styles: { halign: 'center', font: "Sarabun" } });
          }

          if (rowIdx === 0) {
            tableRow.push({ content: thaiShaper(dateGroup.key), rowSpan: dateGroup.rows.length, styles: { halign: 'center', font: "Sarabun" } });
          }

          tableRow.push(thaiShaper(`${formatTime(row.timeStart)} - ${formatTime(row.timeEnd)}`));
          tableRow.push(row.duration);
          tableRow.push(thaiShaper(row.courseCode));
          tableRow.push(thaiShaper(row.courseName));
          tableRow.push({ content: thaiShaper(row.roomNumber), styles: { halign: 'center', font: "Sarabun" } });

          tableBody.push(tableRow);
        });
      });
    });

    const tableColumn = ["ชั้น", "สาขาวิชา", "วันสอบ", "เวลา", "นาที", "รหัสวิชา", "รายวิชา", "ห้อง"].map(thaiShaper);

    autoTable(doc, {
      head: [tableColumn],
      body: tableBody,
      startY: 28,
      margin: { left: 10, right: 10, bottom: 15 },
      styles: {
        font: "Sarabun",
        fontStyle: "normal",
        fontSize: 9,
        cellPadding: 2.5,
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
      },
      headStyles: {
        font: "Sarabun",
        fontStyle: "normal",
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        halign: 'center',
        lineWidth: 0.2,
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 25, noWrap: true }, // ชั้น
        1: { cellWidth: 45 }, // สาขาวิชา
        2: { cellWidth: 35, noWrap: true }, // วันสอบ
        3: { halign: 'center', cellWidth: 35, noWrap: true }, // เวลา
        4: { halign: 'center', cellWidth: 12, noWrap: true }, // นาที
        5: { halign: 'center', cellWidth: 28, noWrap: true }, // รหัสวิชา
        6: { noWrap: true }, // รายวิชา
        7: { halign: 'center', cellWidth: 15, noWrap: true }, // ห้อง
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        const str = thaiShaper("หน้า " + doc.internal.getNumberOfPages());
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 8);
      }
    });

    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  } catch (error) {
    console.error("Error in generateSchedulePDF:", error);
    throw error;
  }
};