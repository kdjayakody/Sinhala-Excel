export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelSheet {
  name: string;
  type: 'data' | 'dashboard'; // New field to identify dashboard sheets
  columns: ExcelColumn[];
  data: string[][];
  mergeCells?: string[]; // Array of ranges like ["A1:C1", "A3:B4"]
}

export interface ExcelSchema {
  filename: string;
  sheets: ExcelSheet[];
  summary: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
}
