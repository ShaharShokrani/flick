export const API_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: API_HEADERS });
}
