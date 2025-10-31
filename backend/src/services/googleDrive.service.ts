import { randomBytes } from "crypto";

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

interface UploadFileInput {
  buffer: Buffer;
  mimeType: string;
  name: string;
}

export interface GoogleDriveFile {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  visualizacaoUrl: string;
  enviadoEm: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;
let cachedFolderId: string | null = null;

const clientId =
  process.env.GOOGLE_DRIVE_CLIENT_ID ??
  "34172535407-i467kkn72q9mgfadfapf9kpi87u96gr8.apps.googleusercontent.com";
const clientSecret =
  process.env.GOOGLE_DRIVE_CLIENT_SECRET ??
  "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";
const redirectUri =
  process.env.GOOGLE_DRIVE_REDIRECT_URI ?? "http://localhost:4000";
const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN ?? "1//05Vh_ZCIrHzOFCgYIARAAGAUSNwF-L9IrXxkdOcEzO1ETgDFL5Hm-km3DfAVc8fx2CkL-SA9cGw_dGUbm5Lw3QmD8y6gzlQI1E5o";
const folderName =
  process.env.GOOGLE_DRIVE_FOLDER_NAME ?? "anexos_educacaoSass";

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  if (!refreshToken) {
    throw new Error(
      "Token de atualização do Google Drive não configurado. Defina GOOGLE_DRIVE_REFRESH_TOKEN."
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    redirect_uri: redirectUri,
  });

  console.log('🔐 Gerando novo access token...');

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Não foi possível obter um token de acesso do Google Drive: ${error}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

async function ensureFolder(accessToken: string): Promise<string> {
  if (cachedFolderId) {
    return cachedFolderId;
  }

  const query = new URLSearchParams({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    pageSize: "1",
  });

  const listResponse = await fetch(`${GOOGLE_DRIVE_FILES_URL}?${query}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!listResponse.ok) {
    const error = await listResponse.text();
    throw new Error(`Erro ao verificar pasta no Google Drive: ${error}`);
  }

  const listData = (await listResponse.json()) as {
    files?: Array<{ id: string; name: string }>;
  };

  if (listData.files && listData.files.length > 0) {
    cachedFolderId = listData.files[0].id;
    return cachedFolderId;
  }

  const createResponse = await fetch(GOOGLE_DRIVE_FILES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Erro ao criar pasta no Google Drive: ${error}`);
  }

  const createdData = (await createResponse.json()) as { id: string };
  cachedFolderId = createdData.id;
  return createdData.id;
}

async function setFilePermissions(accessToken: string, fileId: string) {
  const response = await fetch(
    `${GOOGLE_DRIVE_FILES_URL}/${fileId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao configurar permissões do arquivo: ${error}`);
  }
}

async function fetchFileMetadata(accessToken: string, fileId: string) {
  const params = new URLSearchParams({
    fields: "id,name,mimeType,size,webViewLink,webContentLink",
  });

  const response = await fetch(
    `${GOOGLE_DRIVE_FILES_URL}/${fileId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao buscar metadados do arquivo: ${error}`);
  }

  return (await response.json()) as {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    webViewLink?: string;
    webContentLink?: string;
  };
}

export async function uploadFile({
  buffer,
  mimeType,
  name,
}: UploadFileInput): Promise<GoogleDriveFile> {
  const accessToken = await getAccessToken();
  const folderId = await ensureFolder(accessToken);

  const boundary = `drive-boundary-${randomBytes(12).toString("hex")}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = Buffer.from(
    `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({
      name,
      parents: [folderId],
    })}`
  );

  const fileHeader = Buffer.from(
    `${delimiter}Content-Type: ${mimeType}\r\n\r\n`
  );

  const requestBody = Buffer.concat([
    metadataPart,
    fileHeader,
    buffer,
    Buffer.from(closeDelimiter),
  ]);

  const uploadResponse = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": requestBody.length.toString(),
    },
    body: requestBody,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Erro ao enviar arquivo para o Google Drive: ${error}`);
  }

  const uploadData = (await uploadResponse.json()) as { id: string };

  await setFilePermissions(accessToken, uploadData.id);
  const metadata = await fetchFileMetadata(accessToken, uploadData.id);

  const fileSize = metadata.size ? Number(metadata.size) : buffer.length;
  const downloadUrl =
    metadata.webContentLink ??
    `https://drive.google.com/uc?export=download&id=${metadata.id}`;
  const viewUrl =
    metadata.webViewLink ??
    `https://drive.google.com/file/d/${metadata.id}/view`;

  return {
    id: metadata.id,
    nome: metadata.name,
    tipo: metadata.mimeType,
    tamanho: fileSize,
    url: downloadUrl,
    visualizacaoUrl: viewUrl,
    enviadoEm: new Date().toISOString(),
  };
}

export const googleDriveService = {
  uploadFile,
};
