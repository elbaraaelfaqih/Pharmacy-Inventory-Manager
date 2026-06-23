/**
 * Google Sheets API Helper
 * Real integration with Google Sheets API to sync pharmacy inventory and daily dispensation reports.
 */

export interface GoogleSyncConfig {
  spreadsheetId: string;
  accessToken: string;
}

export interface Drug {
  id: string;
  name: string;
  quantity: number;
  alertLimit: number;
  alternative: string;
  activeIngredient: string;
  notes?: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface DispenseLog {
  id: string;
  drugId: string;
  drugName: string;
  quantity: number;
  dispensedAt: string;
  notes?: string;
  createdBy?: string;
}

export interface InvoiceItem {
  drugId: string;
  drugName: string;
  quantity: number;
}

export interface Invoice {
  id: string;
  dispensedAt: string;
  recipientName: string;
  items: InvoiceItem[];
  notes?: string;
  createdBy?: string;
}

// Cache of verified sheet tabs to avoid redundant validation metadata network requests
const verifiedSheetsCache: Record<string, Set<string>> = {};

/**
 * Ensures that a specific tab/sheet title exists in the spreadsheet.
 * If it doesn't exist, it creates it dynamically to prevent "Unable to parse range" errors.
 */
async function ensureSheetExists(
  spreadsheetId: string,
  accessToken: string,
  title: string
): Promise<void> {
  // Initialize cache for this spreadsheet if it doesn't exist
  if (!verifiedSheetsCache[spreadsheetId]) {
    verifiedSheetsCache[spreadsheetId] = new Set<string>();
  }

  // If already in cache, skip validation immediately
  if (verifiedSheetsCache[spreadsheetId].has(title)) {
    return;
  }

  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
    const metaRes = await fetch(metaUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!metaRes.ok) {
      if (metaRes.status === 401) {
        throw new Error('AUTH_ERROR_EXPIRED');
      }
      if (metaRes.status === 403) {
        throw new Error('AUTH_ERROR_FORBIDDEN');
      }
      if (metaRes.status === 404) {
        throw new Error('SPREADSHEET_NOT_FOUND');
      }
      throw new Error(`خطأ قوقل شيت: ${metaRes.statusText} (${metaRes.status})`);
    }

    const data = await metaRes.json();
    const sheets = data.sheets || [];
    
    // Cache all existing titles found in the spreadsheet properties
    sheets.forEach((s: any) => {
      if (s.properties?.title) {
        verifiedSheetsCache[spreadsheetId].add(s.properties.title);
      }
    });

    // Check if the target sheet now exists in our cache
    if (verifiedSheetsCache[spreadsheetId].has(title)) {
      return;
    }

    const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: title,
              },
            },
          },
        ],
      }),
    });

    if (createRes.ok) {
      console.log(`Successfully created missing sheet tab: "${title}"`);
      // Update cache
      verifiedSheetsCache[spreadsheetId].add(title);
    } else {
      if (createRes.status === 401) {
        throw new Error('AUTH_ERROR_EXPIRED');
      }
      console.warn(`Failed to auto-create sheet tab "${title}":`, createRes.statusText);
    }
  } catch (error: any) {
    console.warn(`Error in ensureSheetExists for "${title}":`, error);
    throw error;
  }
}

/**
 * Update the full inventory in the specified Google Sheet.
 * This overwrites the sheet to stay updated in real-time.
 */
export async function syncInventoryToSheets(
  config: GoogleSyncConfig,
  drugs: Drug[]
): Promise<{ success: boolean; message: string }> {
  const { spreadsheetId, accessToken } = config;
  if (!spreadsheetId || !accessToken) {
    throw new Error('بيانات الاتصال بقوقل شيت غير مكتملة (يرجى إدخال معرف الشيت ورمز الوصول).');
  }

  // Ensure "المخزون" sheet exists
  await ensureSheetExists(spreadsheetId, accessToken, 'المخزون');

  // Define headers and rows
  const headers = [
    'معرف الدواء',
    'اسم الدواء',
    'المادة الفعالة',
    'البديل المقترح',
    'الكمية الحالية',
    'حد التنبيه',
    'التحديث الأخير',
    'ملاحظات',
    'أضيف بواسطة',
    'عُدل بواسطة',
  ];

  const rows = drugs.map((drug) => [
    drug.id,
    drug.name,
    drug.activeIngredient || '-',
    drug.alternative || '-',
    drug.quantity,
    drug.alertLimit,
    drug.updatedAt,
    drug.notes || '',
    drug.createdBy || '-',
    drug.updatedBy || '-',
  ]);

  const rangeName = `المخزون!A1:J${rows.length + 1}`;
  const valueRange = {
    range: rangeName,
    majorDimension: 'ROWS',
    values: [headers, ...rows],
  };

  try {
    // Clear previous cells to prevent leftover old trailing rows
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      'المخزون!A1:J2000'
    )}:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // We send a PUT request to clear and write the values
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      rangeName
    )}?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(valueRange),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('AUTH_ERROR_EXPIRED');
      }
      const errorData = await response.json();
      throw new Error(errorData?.error?.message || `استجابة خاطئة من السيرفر: ${response.status}`);
    }

    return {
      success: true,
      message: 'تم تحديث مخزون الأدوية في قوقل شيت بنجاح!',
    };
  } catch (error: any) {
    console.error('Error syncing inventory to sheet:', error);
    let errMsg = error?.message || 'فشلت عملية المزامنة. يرجى التحقق من صحة رمز الوصول ومعرف جدول البيانات.';
    if (errMsg === 'AUTH_ERROR_EXPIRED' || errMsg.toLowerCase().includes('auth') || errMsg.toLowerCase().includes('credential') || errMsg.includes('401')) {
      errMsg = 'رمز الوصول (Access Token) الخاص بقوقل منتهي الصلاحية أو غير صحيح! يرجى تجديد رمز الوصول من حقل إعدادات قوقل شيت لتستمر العمليات بالمزامنة المباشرة.';
    } else if (errMsg === 'AUTH_ERROR_FORBIDDEN' || errMsg.includes('403')) {
      errMsg = 'صلاحية الوصول مرفوضة! يرجى التأكد من تفعيل صلاحية التعديل (Editor) لحسابك وتفويض التطبيق بكتابة البيانات للشيت.';
    } else if (errMsg === 'SPREADSHEET_NOT_FOUND' || errMsg.includes('404')) {
      errMsg = 'لم يعثر قوقل شيت على هذا المستند. يرجى التأكد من صحة معرف الشيت (Spreadsheet ID) تماماً.';
    }
    return {
      success: false,
      message: errMsg,
    };
  }
}

/**
 * Append or overwrite a list of dispense logs to the Google Sheet log sheet named "سجل الصرف اليومي"
 */
export async function logDispensationToSheets(
  config: GoogleSyncConfig,
  logs: DispenseLog[],
  overwrite: boolean = false
): Promise<{ success: boolean; message: string }> {
  const { spreadsheetId, accessToken } = config;
  if (!spreadsheetId || !accessToken) {
    throw new Error('بيانات الاتصال بقوقل شيت غير مكتملة.');
  }

  if (logs.length === 0) {
    return { success: true, message: 'لا يوجد عمليات صرف جديدة للمزامنة.' };
  }

  // Ensure "سجل الصرف اليومي" sheet exists
  await ensureSheetExists(spreadsheetId, accessToken, 'سجل الصرف اليومي');

  // Headers for dispensation log
  const headers = ['معرف العملية', 'اسم الدواء', 'الكمية المصروفة', 'وقت الصرف', 'السعر', 'ملاحظات', 'بواسطة'];
  const rows = logs.map((log) => [
    log.id,
    log.drugName,
    log.quantity,
    log.dispensedAt,
    'مجاني (0)',
    log.notes || '',
    log.createdBy || '-',
  ]);

  try {
    if (overwrite) {
      // Clear old rows to prevent stale data
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        'سجل الصرف اليومي!A1:G5000'
      )}:clear`;
      await fetch(clearUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Overwrite fully with headers
      const rangeName = `سجل الصرف اليومي!A1:G${rows.length + 1}`;
      const valueRange = {
        range: rangeName,
        majorDimension: 'ROWS',
        values: [headers, ...rows],
      };

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        rangeName
      )}?valueInputOption=USER_ENTERED`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(valueRange),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('AUTH_ERROR_EXPIRED');
        }
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `استجابة خاطئة من السيرفر: ${response.status}`);
      }
    } else {
      // Standard append
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        'سجل الصرف اليومي!A:G'
      )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('AUTH_ERROR_EXPIRED');
        }
        const errorData = await response.json();
        if (errorData?.error?.message?.includes('Unable to parse range')) {
          // Fallback retry with Sheet1 names
          const retryUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:G:append?valueInputOption=USER_ENTERED`;
          const retryResponse = await fetch(retryUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: rows,
            }),
          });
          if (!retryResponse.ok) {
            if (retryResponse.status === 401) {
              throw new Error('AUTH_ERROR_EXPIRED');
            }
            throw new Error('فشل المزامنة. يرجى إنشاء ورقة عمل (Tab) باسم "سجل الصرف اليومي" أو "Sheet1".');
          }
          return {
            success: true,
            message: 'تم تصدير تقرير الصرف بنجاح إلى Sheet1!',
          };
        }
        throw new Error(errorData?.error?.message || `استجابة خاطئة من السيرفر: ${response.status}`);
      }
    }

    return {
      success: true,
      message: 'تمت مزامنة تقرير الصرف اليومي وتصديره بنجاح!',
    };
  } catch (error: any) {
    console.error('Error logging to sheet:', error);
    let errMsg = error?.message || 'فشل تصدير سجل الصرف. يرجى التأكد من صلاحية رمز الوصول والاتصال بالإنترنت.';
    if (errMsg === 'AUTH_ERROR_EXPIRED' || errMsg.toLowerCase().includes('auth') || errMsg.toLowerCase().includes('credential') || errMsg.includes('401')) {
      errMsg = 'رمز الوصول (Access Token) الخاص بقوقل منتهي الصلاحية أو غير صحيح! يرجى تجديد رمز الوصول من حقل إعدادات قوقل شيت لتستمر العمليات بالمزامنة المباشرة.';
    } else if (errMsg === 'AUTH_ERROR_FORBIDDEN' || errMsg.includes('403')) {
      errMsg = 'تم رفض الوصول! يرجى السيرفر أن يتحقق من تفعيل صلاحيات الكتابة للشيت.';
    }
    return {
      success: false,
      message: errMsg,
    };
  }
}

/**
 * Update the full list of invoices in a dedicated Google Sheet tab named "الفواتير".
 */
export async function syncInvoicesToSheets(
  config: GoogleSyncConfig,
  invoices: Invoice[]
): Promise<{ success: boolean; message: string }> {
  const { spreadsheetId, accessToken } = config;
  if (!spreadsheetId || !accessToken) {
    throw new Error('بيانات الاتصال بقوقل شيت غير مكتملة (يرجى إدخال معرف الشيت ورمز الوصول).');
  }

  // Ensure "الفواتير" sheet exists
  await ensureSheetExists(spreadsheetId, accessToken, 'الفواتير');

  // Headers for the invoices sheet
  const headers = [
    'رقم الفاتورة',
    'تاريخ ووقت الصرف',
    'المستلم / المريض',
    'اسم الدواء',
    'الكمية المصروفة',
    'معرّف الدواء',
    'ملاحظات',
    'صُربت بواسطة',
  ];

  // Map each invoice item to a flat row
  const rows: any[][] = [];
  invoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      rows.push([
        invoice.id,
        invoice.dispensedAt,
        invoice.recipientName || 'غير محدد',
        item.drugName,
        item.quantity,
        item.drugId,
        invoice.notes || '',
        invoice.createdBy || '-',
      ]);
    });
  });

  const rangeName = `الفواتير!A1:H${rows.length + 1}`;
  const valueRange = {
    range: rangeName,
    majorDimension: 'ROWS',
    values: [headers, ...rows],
  };

  try {
    // Clear previous cells to prevent leftover old trailing rows
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      'الفواتير!A1:H5000'
    )}:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      rangeName
    )}?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(valueRange),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('AUTH_ERROR_EXPIRED');
      }
      const errorData = await response.json();
      throw new Error(errorData?.error?.message || `استجابة خاطئة من السيرفر: ${response.status}`);
    }

    return {
      success: true,
      message: 'تمت مزامنة فواتير الصرف (الفواتير) في قوقل شيت بنجاح!',
    };
  } catch (error: any) {
    console.error('Error syncing invoices to sheet:', error);
    let errMsg = error?.message || 'فشلت عملية مزامنة الفواتير. يرجى التحقق من إنشاء ورقة عمل باسم "الفواتير" أو صلاحية رمز الوصول.';
    if (errMsg === 'AUTH_ERROR_EXPIRED' || errMsg.toLowerCase().includes('auth') || errMsg.toLowerCase().includes('credential') || errMsg.includes('401')) {
      errMsg = 'رمز الوصول (Access Token) الخاص بقوقل منتهي الصلاحية أو غير صحيح! يرجى تجديد رمز الوصول من حقل إعدادات قوقل شيت لتستمر العمليات بالمزامنة المباشرة.';
    } else if (errMsg === 'AUTH_ERROR_FORBIDDEN' || errMsg.includes('403')) {
      errMsg = 'تم رفض كتابة الفواتير لمجرد انتهاء أو حجب صلاحية التعديل على قوقل شيت الخاص بك.';
    }
    return {
      success: false,
      message: errMsg,
    };
  }
}
