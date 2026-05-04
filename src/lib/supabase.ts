// Supabase client — will be initialized in Phase 2
// For now, all data stays in React state (mock mode)

export const MOCK_MODE = true;

export async function saveSubmission(_data: Record<string, unknown>): Promise<string> {
  // Mock: return a fake submission ID
  return 'sub_' + Math.random().toString(36).slice(2, 12);
}

export async function updateSubmission(_id: string, _data: Record<string, unknown>): Promise<void> {
  // Mock: no-op
}
