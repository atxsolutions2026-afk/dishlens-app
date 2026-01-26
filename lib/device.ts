export function deviceKey() {
  return 'dl_device_id';
}

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(deviceKey());
    if (existing && existing.length >= 8) return existing;
  } catch {}

  const created = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  try { localStorage.setItem(deviceKey(), created); } catch {}
  return created;
}
