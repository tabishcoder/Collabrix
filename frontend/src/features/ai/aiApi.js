import api from "../../services/api";

/** Default top_k is modest so Q&A stays faster; pass a higher top_k if you need broader retrieval. */
export async function queryWorkspaceAi({ projectId, query, top_k = 5 }) {
  const res = await api.post("/ai/query", {
    projectId,
    query,
    ...(typeof top_k === "number" ? { top_k } : {}),
  });
  return res.data;
}

export async function summarizeTextAi({ projectId, text, language }) {
  const res = await api.post("/ai/summarize", {
    projectId,
    text,
    ...(language ? { language } : {}),
  });
  return res.data;
}
