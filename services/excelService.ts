import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import { ExcelSchema } from '../types';

export const createAndDownloadExcel = async (schema: ExcelSchema) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sinhala Excel AI';
  workbook.created = new Date();

  schema.sheets.forEach((sheetData) => {
    const worksheet = workbook.addWorksheet(sheetData.name);

    // 1. Setup Views (Hide gridlines for Dashboard for professional look)
    if (sheetData.type === 'dashboard') {
      worksheet.views = [{ showGridLines: false, zoomScale: 90 }];
    } else {
      worksheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];
    }

    // 2. Setup Columns
    worksheet.columns = sheetData.columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 20
    }));

    // 3. Process Data & Formulas
    const processedData = sheetData.data.map(row => 
      row.map(cell => {
        if (typeof cell === 'string') {
           const trimmed = cell.trim();
           // Check for Formula
           if (trimmed.startsWith('=')) {
             return { formula: trimmed.substring(1) }; // Remove '=' for ExcelJS
           }
           // Check for Number
           if (trimmed !== '') {
             const num = Number(trimmed.replace(/,/g, ''));
             return !isNaN(num) ? num : cell;
           }
        }
        return cell;
      })
    );
    worksheet.addRows(processedData);

    // 4. Handle Merged Cells
    if (sheetData.mergeCells) {
      sheetData.mergeCells.forEach(range => {
        try {
          worksheet.mergeCells(range);
        } catch (e) {
          console.warn(`Failed to merge range ${range}`, e);
        }
      });
    }

    // 5. STYLING

    // A. Common Header Styling (Only for Data sheets)
    if (sheetData.type === 'data') {
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Blue
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Zebra Striping for Data
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            if (rowNumber % 2 === 0) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                });
            }
            row.eachCell(cell => {
                 cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                 };
            });
        }
      });
    }

    // B. Dashboard Specific Styling (The "Supiri" Look)
    if (sheetData.type === 'dashboard') {
      
      // Set a nice background for the whole sheet area (conceptually)
      // ExcelJS doesn't support "sheet background color" easily, 
      // so we rely on the cells being styled.
      
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          
          // If a cell has a value (text or formula), style it like a "Card"
          if (cell.value) {
            const isTitle = row.number === 1;
            
            cell.alignment = { 
              vertical: 'middle', 
              horizontal: 'center', 
              wrapText: true 
            };

            if (isTitle) {
              // Main Dashboard Title
              cell.font = { bold: true, size: 24, color: { argb: 'FF1E293B' }, name: 'Segoe UI' };
              cell.fill = { type: 'pattern', pattern: 'none' }; 
            } else {
              // KPI Cards / Data Blocks
              cell.fill = { 
                type: 'pattern', 
                pattern: 'solid', 
                fgColor: { argb: 'FFFFFFFF' } // White Card
              };
              cell.border = {
                top: { style: 'medium', color: { argb: 'FFCBD5E1' } },
                left: { style: 'medium', color: { argb: 'FFCBD5E1' } },
                bottom: { style: 'medium', color: { argb: 'FF94A3B8' } }, // Thicker bottom for "3D" effect
                right: { style: 'medium', color: { argb: 'FFCBD5E1' } }
              };
              
              // Guessing content type for font size
              const cellValStr = cell.value?.toString() || '';
              // If it looks like a formula or number, make it big
              if (typeof cell.value === 'object' || !isNaN(Number(cellValStr))) {
                 cell.font = { bold: true, size: 20, color: { argb: 'FF0F172A' } };
                 cell.numFmt = '#,##0.00';
              } else {
                 // Label
                 cell.font = { bold: true, size: 12, color: { argb: 'FF64748B' } }; // Muted text
              }
            }
          }
        });
      });
    }
  });

  // Generate Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Create Blob and Save
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = schema.filename.endsWith('.xlsx') ? schema.filename : `${schema.filename}.xlsx`;
  
  const saveAs = (FileSaver as any).saveAs || FileSaver;
  if (typeof saveAs === 'function') {
    saveAs(blob, filename);
  } else {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};
