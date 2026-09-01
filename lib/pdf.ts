export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdf = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>
  const data = await pdf(buffer)
  return data.text
}
