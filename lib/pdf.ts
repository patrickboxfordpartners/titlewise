export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdf = (await import("pdf-parse")).default
  const data = await pdf(buffer)
  return data.text
}
