import http from "./http.js";

function parseDownloadFilename(header) {
  const match = header?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || `coffeehub-backup-${new Date().toISOString().slice(0, 10)}.db`;
}

async function downloadBackup() {
  const response = await http.get("/backup/download", { responseType: "blob" });
  const filename = parseDownloadFilename(response.headers["content-disposition"]);
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return filename;
}

async function restoreBackup(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await http.post("/backup/restore", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120_000,
  });
  return data;
}

export { downloadBackup, restoreBackup };
