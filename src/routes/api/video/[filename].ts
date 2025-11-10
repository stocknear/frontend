import { promises as fsPromises } from "fs";
import fs from "fs";
import fetch from "node-fetch";
import type { RequestHandler } from "@sveltejs/kit";

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB in bytes

const parseRange = (range: string) => {
  const [start, end] = range
    .replace(/bytes=/, "")
    .split("-")
    .map(Number);
  return { start, end: end || undefined };
};

const createResponse = (
  body: ReadableStream | Buffer,
  headers: Record<string, string>,
  status = 206,
) => new Response(body, { status, headers });

const streamRemoteFile = async (url: string, range: string) => {
  const { start, end } = parseRange(range);
  const response = await fetch(url, {
    headers: { Range: `bytes=${start}-${end || ""}` },
  });

  return createResponse(response.body, {
    "Content-Range": response.headers.get("Content-Range") || "",
    "Accept-Ranges": "bytes",
    "Content-Length": response.headers.get("Content-Length") || "",
    "Content-Type": response.headers.get("Content-Type") || "",
  });
};

const streamLocalFile = async (filePath: string, range: string) => {
  const fileSize = (await fsPromises.stat(filePath)).size;
  const { start, end } = parseRange(range);
  const chunkEnd = end || Math.min(start + CHUNK_SIZE - 1, fileSize - 1);

  if (start >= fileSize) {
    return new Response(
      `Requested range not satisfiable\n${start} >= ${fileSize}`,
      {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      },
    );
  }

  const stream = fs.createReadStream(filePath, { start, end: chunkEnd });

  return createResponse(stream, {
    "Content-Range": `bytes ${start}-${chunkEnd}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": (chunkEnd - start + 1).toString(),
    "Content-Type": "video/mp4",
  });
};

export const GET: RequestHandler = async ({ params, request }) => {
  const { filename } = params;
  const range = request.headers.get("range");

  if (!range) {
    return new Response("Requires Range header", { status: 400 });
  }

  try {
    const videoPath = filename.startsWith("http")
      ? filename
      : `static/${filename}`;
    return filename.startsWith("http")
      ? await streamRemoteFile(videoPath, range)
      : await streamLocalFile(videoPath, range);
  } catch (error) {
    console.error("Error streaming video:", error);
    return new Response("File not found or error streaming video", {
      status: 404,
    });
  }
};
