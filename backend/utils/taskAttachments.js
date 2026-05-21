const normalizeReferenceAttachment = (item) => {
  if (!item) return null;
  if (typeof item === "string") {
    const url = item.trim();
    if (!url) return null;
    const isFile =
      url.startsWith("/uploads/") || url.startsWith("blob:") === false && /\.(pdf|doc|docx|xls|xlsx|txt|zip|png|jpe?g|gif|webp)$/i.test(url);
    const name = url.split("/").pop()?.split("?")[0] || "Attachment";
    return {
      url,
      name,
      kind: url.includes("/uploads/tasks/") || url.includes("/uploads/") ? "file" : "link",
    };
  }
  if (typeof item === "object" && item.url) {
    return {
      url: String(item.url).trim(),
      name: String(item.name || "").trim() || "Attachment",
      kind: item.kind === "file" ? "file" : "link",
    };
  }
  return null;
};

const normalizeReferenceAttachments = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeReferenceAttachment).filter(Boolean);
};

const normalizeCompletionAttachment = (item, uploadedBy) => {
  if (!item || !item.url) return null;
  const entry = {
    url: String(item.url).trim(),
    name: String(item.name || "").trim() || "Delivery file",
    kind: item.kind === "file" ? "file" : "link",
  };
  if (uploadedBy) {
    entry.uploadedBy = uploadedBy;
  } else if (item.uploadedBy) {
    entry.uploadedBy = item.uploadedBy;
  }
  return entry;
};

const normalizeCompletionAttachments = (items = [], uploadedBy) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeCompletionAttachment(item, uploadedBy)).filter(Boolean);
};

const serializeTaskAttachments = (task) => {
  const doc = task?.toObject ? task.toObject() : { ...task };
  doc.attachments = normalizeReferenceAttachments(doc.attachments);
  doc.completionAttachments = Array.isArray(doc.completionAttachments)
    ? doc.completionAttachments.map((a) => ({
        _id: a._id,
        url: a.url,
        name: a.name || "Delivery file",
        kind: a.kind || "link",
        uploadedBy: a.uploadedBy,
        createdAt: a.createdAt,
      }))
    : [];
  return doc;
};

module.exports = {
  normalizeReferenceAttachment,
  normalizeReferenceAttachments,
  normalizeCompletionAttachment,
  normalizeCompletionAttachments,
  serializeTaskAttachments,
};
