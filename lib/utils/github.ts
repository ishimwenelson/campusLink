

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

export async function uploadToGithub(
  fileName: string,
  fileBuffer: Buffer | ArrayBuffer,
  folder: string = "documents"
) {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error("GitHub configuration missing in environment variables");
  }

  const path = `${folder}/${Date.now()}-${fileName}`;
  const content = Buffer.from(fileBuffer instanceof ArrayBuffer ? new Uint8Array(fileBuffer) : fileBuffer).toString("base64");

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Upload ${fileName}`,
        content,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to upload to GitHub");
    }

    
    return {
      success: true,
      url: data.content.download_url,
      path: data.content.path,
      sha: data.content.sha,
    };
  } catch (error: any) {
    console.error("GitHub Upload Error:", error);
    throw error;
  }
}

export async function deleteFromGithub(path: string, sha: string) {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error("GitHub configuration missing");
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Delete ${path}`,
        sha,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("GitHub Delete Error:", error);
    return false;
  }
}
