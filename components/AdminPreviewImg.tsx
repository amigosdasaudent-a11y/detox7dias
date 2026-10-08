"use client";

import { useEffect, useState } from "react";

export default function AdminPreviewImg({
  bucket,
  path,
  className,
  alt,
}: {
  bucket: string;
  path: string;
  className?: string;
  alt?: string;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    fetch(`/api/admin/preview?bucket=${bucket}&path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.url) setUrl(j.url);
      })
      .catch(() => {});
  }, [bucket, path]);
  if (!url) return <div className={className} style={{ background: "#F3F4F6" }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt || ""} className={className} />;
}
