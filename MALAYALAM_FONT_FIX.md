# Malayalam Font Integration - PDF Export Fix

## ✅ Implementation Complete

### What Was Done:

1. **Added Malayalam Font Loading**
   - Font file location: `/fonts/NotoSansMalayalam-Regular.ttf`
   - Loaded asynchronously using fetch API
   - Converted to base64 and embedded in PDF
   - Registered as 'NotoSansMalayalam' font in jsPDF

2. **Applied Font to Naal Column Only**
   - Used `didParseCell` callback in autoTable
   - Targets column index 3 (Naal column)
   - Only applies to body rows (not headers)
   - Maintains all other design elements unchanged

3. **Maintained All Existing Features**
   - Grouped bookings by person (no filter)
   - Individual ritual entities (with filter)
   - Correct cost calculations
   - All table layouts and designs preserved
   - Column widths unchanged (Naal: 28mm)

### How It Works:

```javascript
// Font loading
const response = await fetch('/fonts/NotoSansMalayalam-Regular.ttf');
const fontArrayBuffer = await response.arrayBuffer();
const fontBase64 = btoa(
    new Uint8Array(fontArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
);
doc.addFileToVFS('NotoSansMalayalam-Regular.ttf', fontBase64);
doc.addFont('NotoSansMalayalam-Regular.ttf', 'NotoSansMalayalam', 'normal');

// Apply to Naal column
didParseCell: function(data: any) {
    if (malayalamFontAvailable && data.section === 'body' && data.column.index === 3) {
        data.cell.styles.font = 'NotoSansMalayalam';
    }
}
```

### Result:

Malayalam text in the Naal column (പുണർത്ഥം, തൃക്കേട്ട, റോഹിണി, etc.) will now display correctly in the exported PDF with proper Unicode rendering.

### Font File:
- Location: `frontend/public/fonts/NotoSansMalayalam-Regular.ttf`
- Source: Google Fonts - Noto Sans Malayalam
- Format: TrueType Font (.ttf)

### Error Handling:
- If font fails to load, falls back to default font
- Warning logged to console
- PDF generation continues without Malayalam font
- No impact on other functionality

## Testing:
1. Export PDF without filter - Malayalam should display in Naal column
2. Export PDF with ritual filter - Malayalam should display in filtered results
3. All other text remains in default font (Helvetica)
4. Table alignment and design unchanged
