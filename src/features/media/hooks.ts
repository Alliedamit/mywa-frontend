import { useEffect, useState } from "react";
import { createSignedUrl } from "./queries";

export function useSignedUrl(path: string | null | undefined, expiresIn = 300) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(null);
      return;
    }
    createSignedUrl(path, expiresIn)
      .then((u) => alive && setUrl(u))
      .catch((e) => alive && setError(e instanceof Error ? e : new Error(String(e))));
    return () => {
      alive = false;
    };
  }, [path, expiresIn]);
  return { url, error };
}
